<?php
/**
 * REV-02 — Account lifecycle & auth email flows
 *
 * Public:  forgot-password, reset-password (verify+reset), invitation (verify+accept)
 * Protected: users invite / resend-invitation / suspend / reactivate / force-password-reset / list
 *
 * Security:
 *   - Tokens are 256-bit random (bin2hex(random_bytes(32))).
 *   - Only SHA-256 hashes are stored (token_hash). Raw token never persisted nor logged.
 *   - Invitation tokens expire in 48h, reset tokens in 60min.
 *   - Tokens are single-use (used_at set on accept/reset).
 *   - Reset: a new request invalidates previous active tokens for that user.
 *   - Emails are sent directly to the user's email (no organization_id filter),
 *     so super-admin accounts with organization_id = NULL can receive auth emails.
 */

define('REV02_APP_URL', 'https://alikamobility.alika-konnect.com');
define('REV02_INVITATION_TTL_HOURS', 48);
define('REV02_RESET_TTL_MINUTES', 60);

// =============================================================
// Helpers
// =============================================================

function validatePasswordStrength($password) {
    $errors = [];
    if (!is_string($password) || strlen($password) < 10) $errors[] = 'au moins 10 caractères';
    if (!preg_match('/[A-Z]/', $password)) $errors[] = 'une majuscule';
    if (!preg_match('/[a-z]/', $password)) $errors[] = 'une minuscule';
    if (!preg_match('/[0-9]/', $password)) $errors[] = 'un chiffre';
    if (!preg_match('/[^A-Za-z0-9]/', $password)) $errors[] = 'un caractère spécial';
    return $errors;
}

function generateLifecycleToken() {
    return bin2hex(random_bytes(32)); // 64 hex chars = 256 bits
}

function hashLifecycleToken($token) {
    return hash('sha256', $token);
}

function roleLabel($role, $agentType) {
    $map = [
        'super-admin' => 'Super Admin',
        'admin' => 'Admin Association',
        'agent' => 'Agent',
        'field_collector' => 'Agent Terrain',
        'office_collector' => 'Agent Caissier',
    ];
    if ($role === 'agent' && $agentType) {
        return $map[$agentType] ?? 'Agent';
    }
    return $map[$role] ?? $role;
}

/**
 * Resolve the effective role for an invited user. 'agent' role carries an
 * agent_type (field_collector / office_collector) which is stored separately.
 */
function resolveInviteRole($requestedRole) {
    $allowed = ['admin', 'agent', 'field_collector', 'office_collector'];
    return in_array($requestedRole, $allowed, true) ? $requestedRole : null;
}

/**
 * Can $actor invite/manage $targetRole within the given org context?
 * Returns the effective role to assign, or null if forbidden.
 */
function canActorInviteRole($actor, $requestedRole) {
    $actorRole = $actor['role'] ?? '';
    $r = resolveInviteRole($requestedRole);
    if ($r === null) return null;

    if ($actorRole === 'super-admin') {
        // Super-admin can invite admin + agents, never super-admin
        return in_array($r, ['admin', 'agent', 'field_collector', 'office_collector'], true) ? $r : null;
    }
    if ($actorRole === 'admin') {
        // Admin can only invite agents (not admin, not super-admin)
        return in_array($r, ['agent', 'field_collector', 'office_collector'], true) ? $r : null;
    }
    return null; // agents cannot invite
}

/**
 * Can $actor manage (suspend/reactivate/force-reset) $target user?
 */
function canActorManageUser($actor, $target) {
    $actorRole = $actor['role'] ?? '';
    $targetRole = $target['role'] ?? '';

    if ($actorRole === 'super-admin') return true;
    if ($actorRole === 'admin') {
        // Admin can only manage agents within their own org
        if ($targetRole === 'agent' && ($target['organization_id'] ?? '') === ($actor['organization_id'] ?? '')) {
            return true;
        }
        return false;
    }
    return false;
}

function findUserByEmail($db, $email) {
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function countActiveSuperAdmins($db) {
    $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE role = 'super-admin' AND status = 'active'");
    $stmt->execute();
    return (int)$stmt->fetchColumn();
}

// =============================================================
// Public endpoints
// =============================================================

function handleForgotPassword() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit('forgot_' . $ip, 5, 300)) {
        jsonResponse(['error' => 'Trop de tentatives. Réessayez dans 5 minutes.'], 429);
    }

    $data = getRequestBody();
    $email = trim($data['email'] ?? '');

    // Always generic — never reveal whether the email exists
    $generic = ['success' => true, 'message' => 'Si ce compte existe, un email de réinitialisation a été envoyé.'];

    if (!$email) {
        jsonResponse($generic);
    }

    // Per-email rate limit (prevent enumeration spam)
    if (!checkRateLimit('forgot_email_' . md5(strtolower($email)), 3, 3600)) {
        jsonResponse($generic);
    }

    $db = getDB();
    $user = findUserByEmail($db, $email);

    if (!$user || $user['status'] === 'suspended') {
        // No leak — respond identically
        jsonResponse($generic);
    }

    // Invalidate previous active reset tokens for this user (single active token)
    $stmt = $db->prepare("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL");
    $stmt->execute([$user['id']]);

    // Create new token
    $token = generateLifecycleToken();
    $tokenHash = hashLifecycleToken($token);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+' . REV02_RESET_TTL_MINUTES . ' minutes'));
    $id = generateId();
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

    $stmt = $db->prepare("INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$id, $user['id'], $user['email'], $tokenHash, $expiresAt, $ip, $ua]);

    // Update last_reset_sent_at for additional audit
    $db->prepare("UPDATE users SET last_reset_sent_at = NOW() WHERE id = ?")->execute([$user['id']]);

    // Send email (direct, no org filter — works for super-admin org NULL)
    $resetUrl = REV02_APP_URL . '/reset-password?token=' . $token;
    $html = buildForgotPasswordHtml($user['name'] ?: $user['email'], $resetUrl, $expiresAt);
    $result = sendEmail($user['email'], $user['name'] ?: 'Utilisateur', 'Réinitialisation de votre mot de passe — ALIKA MOBILITY', $html);

    error_log('Forgot-password email to ' . $user['email'] . ' | success=' . ($result['success'] ? '1' : '0'));

    jsonResponse($generic);
}

function handleResetPasswordVerify() {
    $token = $_GET['token'] ?? '';
    if (!$token) {
        jsonResponse(['valid' => false, 'status' => 'invalid', 'message' => 'Token manquant.']);
    }

    $db = getDB();
    $tokenHash = hashLifecycleToken($token);
    $stmt = $db->prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ? LIMIT 1");
    $stmt->execute([$tokenHash]);
    $rec = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$rec) {
        jsonResponse(['valid' => false, 'status' => 'invalid', 'message' => 'Lien invalide.']);
    }
    if ($rec['used_at']) {
        jsonResponse(['valid' => false, 'status' => 'used', 'message' => 'Ce lien a déjà été utilisé.']);
    }
    if (strtotime($rec['expires_at']) < time()) {
        jsonResponse(['valid' => false, 'status' => 'expired', 'message' => 'Ce lien a expiré.']);
    }

    jsonResponse(['valid' => true, 'status' => 'valid', 'email' => $rec['email']]);
}

function handleResetPassword() {
    $data = getRequestBody();
    $token = $data['token'] ?? '';
    $password = $data['password'] ?? '';
    $confirmation = $data['password_confirmation'] ?? '';

    if (!$token) {
        jsonResponse(['error' => 'Token manquant.'], 400);
    }
    if ($password !== $confirmation) {
        jsonResponse(['error' => 'Les mots de passe ne correspondent pas.'], 400);
    }
    $errors = validatePasswordStrength($password);
    if (!empty($errors)) {
        jsonResponse(['error' => 'Le mot de passe doit contenir ' . implode(', ', $errors) . '.'], 400);
    }

    $db = getDB();
    $tokenHash = hashLifecycleToken($token);
    $stmt = $db->prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ? LIMIT 1");
    $stmt->execute([$tokenHash]);
    $rec = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$rec) {
        jsonResponse(['error' => 'Lien invalide.'], 400);
    }
    if ($rec['used_at']) {
        jsonResponse(['error' => 'Ce lien a déjà été utilisé.'], 400);
    }
    if (strtotime($rec['expires_at']) < time()) {
        jsonResponse(['error' => 'Ce lien a expiré.'], 400);
    }

    // Fetch user
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$rec['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        jsonResponse(['error' => 'Compte introuvable.'], 400);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $now = date('Y-m-d H:i:s');

    $db->beginTransaction();
    try {
        $db->prepare("UPDATE users SET password_hash = ?, last_password_change_at = ?, must_change_password = 0, updated = NOW() WHERE id = ?")
            ->execute([$hash, $now, $user['id']]);
        $db->prepare("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?")->execute([$rec['id']]);
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Reset password error: ' . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la réinitialisation.'], 500);
    }

    // Notify password changed (best-effort, no failure if email unavailable)
    $html = buildPasswordChangedHtml($user['name'] ?: $user['email']);
    $result = sendEmail($user['email'], $user['name'] ?: 'Utilisateur', 'Votre mot de passe ALIKA MOBILITY a été modifié', $html);
    error_log('Password-changed email to ' . $user['email'] . ' | success=' . ($result['success'] ? '1' : '0'));

    jsonResponse(['success' => true, 'message' => 'Mot de passe modifié avec succès. Vous pouvez vous connecter.']);
}

function handleInvitationVerify() {
    $token = $_GET['token'] ?? '';
    if (!$token) {
        jsonResponse(['valid' => false, 'status' => 'invalid', 'message' => 'Token manquant.']);
    }

    $db = getDB();
    $tokenHash = hashLifecycleToken($token);
    $stmt = $db->prepare("SELECT * FROM user_invitations WHERE token_hash = ? LIMIT 1");
    $stmt->execute([$tokenHash]);
    $inv = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$inv) {
        jsonResponse(['valid' => false, 'status' => 'invalid', 'message' => 'Invitation invalide.']);
    }
    if ($inv['used_at']) {
        jsonResponse(['valid' => false, 'status' => 'used', 'message' => 'Cette invitation a déjà été utilisée.']);
    }
    if (strtotime($inv['expires_at']) < time()) {
        jsonResponse(['valid' => false, 'status' => 'expired', 'message' => 'Cette invitation a expiré.']);
    }

    // Resolve org name
    $orgName = null;
    if (!empty($inv['organization_id'])) {
        $os = $db->prepare("SELECT name FROM organizations WHERE id = ? LIMIT 1");
        $os->execute([$inv['organization_id']]);
        $o = $os->fetch();
        $orgName = $o ? $o['name'] : null;
    }

    jsonResponse([
        'valid' => true,
        'status' => 'valid',
        'email' => $inv['email'],
        'name' => null, // resolved from user below
        'role' => $inv['role'],
        'role_label' => roleLabel($inv['role'], $inv['agent_type']),
        'organization' => $orgName,
        'expires_at' => $inv['expires_at'],
    ]);
}

function handleInvitationAccept() {
    $data = getRequestBody();
    $token = $data['token'] ?? '';
    $password = $data['password'] ?? '';
    $confirmation = $data['password_confirmation'] ?? '';

    if (!$token) {
        jsonResponse(['error' => 'Token manquant.'], 400);
    }
    if ($password !== $confirmation) {
        jsonResponse(['error' => 'Les mots de passe ne correspondent pas.'], 400);
    }
    $errors = validatePasswordStrength($password);
    if (!empty($errors)) {
        jsonResponse(['error' => 'Le mot de passe doit contenir ' . implode(', ', $errors) . '.'], 400);
    }

    $db = getDB();
    $tokenHash = hashLifecycleToken($token);
    $stmt = $db->prepare("SELECT * FROM user_invitations WHERE token_hash = ? LIMIT 1");
    $stmt->execute([$tokenHash]);
    $inv = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$inv) {
        jsonResponse(['error' => 'Invitation invalide.'], 400);
    }
    if ($inv['used_at']) {
        jsonResponse(['error' => 'Cette invitation a déjà été utilisée.'], 400);
    }
    if (strtotime($inv['expires_at']) < time()) {
        jsonResponse(['error' => 'Cette invitation a expiré.'], 400);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $now = date('Y-m-d H:i:s');

    $db->beginTransaction();
    try {
        $db->prepare("UPDATE users SET password_hash = ?, status = 'active', email_verified_at = ?, must_change_password = 0, last_password_change_at = ?, updated = NOW() WHERE id = ?")
            ->execute([$hash, $now, $now, $inv['user_id']]);
        $db->prepare("UPDATE user_invitations SET used_at = NOW(), updated_at = NOW() WHERE id = ?")->execute([$inv['id']]);
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Invitation accept error: ' . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de l\'activation du compte.'], 500);
    }

    jsonResponse(['success' => true, 'message' => 'Compte activé avec succès. Vous pouvez vous connecter.']);
}

// =============================================================
// Protected endpoints
// =============================================================

function handleUserInvite() {
    $actor = getAuthUser();
    if (!$actor) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $requestedRole = trim($data['role'] ?? '');
    $agentType = !empty($data['agent_type']) ? trim($data['agent_type']) : null;
    $parkingId = !empty($data['parking_id']) ? trim($data['parking_id']) : null;
    $orgId = trim($data['organization_id'] ?? '');

    if (!$name || !$email || !$requestedRole) {
        jsonResponse(['error' => 'Nom, email et rôle sont requis.'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Email invalide.'], 400);
    }

    $role = canActorInviteRole($actor, $requestedRole);
    if ($role === null) {
        jsonResponse(['error' => 'Vous n\'avez pas la permission d\'inviter ce rôle.'], 403);
    }

    // Organization scoping
    if (($actor['role'] ?? '') === 'super-admin') {
        // Super-admin must specify an org for admin/agent roles
        if (!$orgId && $role !== 'super-admin') {
            jsonResponse(['error' => 'organisation_id est requis.'], 400);
        }
    } else {
        // Admin: force to their own org
        $orgId = $actor['organization_id'] ?? '';
        if (!$orgId) {
            jsonResponse(['error' => 'Votre compte n\'est rattaché à aucune organisation.'], 400);
        }
    }

    // Normalize agent role: if field_collector/office_collector, store role='agent' + agent_type
    $storeRole = $role;
    $storeAgentType = $agentType;
    if ($role === 'field_collector' || $role === 'office_collector') {
        $storeRole = 'agent';
        $storeAgentType = $role;
    }

    $db = getDB();

    // Check duplicate email
    $existing = findUserByEmail($db, $email);
    if ($existing) {
        jsonResponse(['error' => 'Cet email est déjà utilisé.'], 409);
    }

    // Verify org exists
    $os = $db->prepare("SELECT id, name FROM organizations WHERE id = ? LIMIT 1");
    $os->execute([$orgId]);
    $org = $os->fetch();
    if (!$org) {
        jsonResponse(['error' => 'Organisation introuvable.'], 400);
    }

    // Create user in pending_invite (no password yet)
    $userId = generateId();
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare("INSERT INTO users (id, email, password_hash, name, role, agent_type, organization_id, parking_id, status, invited_at, created_by, created, updated) VALUES (?, ?, '', ?, ?, ?, ?, ?, 'pending_invite', ?, ?, NOW(), NOW())");
    $stmt->execute([$userId, $email, $name, $storeRole, $storeAgentType, $orgId, $parkingId, $now, $actor['id']]);

    // Generate invitation token
    $token = generateLifecycleToken();
    $tokenHash = hashLifecycleToken($token);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+' . REV02_INVITATION_TTL_HOURS . ' hours'));
    $invId = generateId();
    $stmt = $db->prepare("INSERT INTO user_invitations (id, user_id, organization_id, email, role, agent_type, token_hash, expires_at, sent_at, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())");
    $stmt->execute([$invId, $userId, $orgId, $email, $role, $storeAgentType, $tokenHash, $expiresAt, $actor['id']]);

    // Send email (direct, no org filter)
    $acceptUrl = REV02_APP_URL . '/accept-invitation?token=' . $token;
    $html = buildInvitationHtml($name, $org['name'], roleLabel($role, $storeAgentType), $acceptUrl, $expiresAt);
    $result = sendEmail($email, $name, 'Invitation à rejoindre ALIKA MOBILITY', $html);
    error_log('Invitation email to ' . $email . ' | success=' . ($result['success'] ? '1' : '0'));

    jsonResponse([
        'success' => true,
        'message' => 'Invitation envoyée à ' . $email . '.',
        'user_id' => $userId,
        'email_sent' => $result['success'],
        'expires_at' => $expiresAt,
    ], 201);
}

function handleUsersList() {
    $actor = getAuthUser();
    if (!$actor) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    $actorRole = $actor['role'] ?? '';
    if (!in_array($actorRole, ['super-admin', 'admin'], true)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $db = getDB();
    $where = [];
    $params = [];

    // Tenant scoping: admin sees only their org
    if ($actorRole !== 'super-admin') {
        $where[] = 'organization_id = ?';
        $params[] = $actor['organization_id'] ?? '';
    }

    // Filters
    $role = $_GET['role'] ?? null;
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    $orgFilter = $_GET['organization_id'] ?? null;

    if ($role) { $where[] = 'role = ?'; $params[] = $role; }
    if ($status) { $where[] = 'status = ?'; $params[] = $status; }
    if ($orgFilter && $actorRole === 'super-admin') { $where[] = 'organization_id = ?'; $params[] = $orgFilter; }
    if ($search) {
        $where[] = '(name LIKE ? OR email LIKE ?)';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $page = max(1, intval($_GET['page'] ?? 1));
    $perPage = min(500, max(1, intval($_GET['perPage'] ?? 50)));
    $offset = ($page - 1) * $perPage;

    $countStmt = $db->prepare("SELECT COUNT(*) FROM users $whereClause");
    $countStmt->execute($params);
    $totalItems = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare("SELECT id, email, name, role, agent_type, organization_id, phone, parking_id, status, invited_at, email_verified_at, last_password_change_at, must_change_password, created, updated FROM users $whereClause ORDER BY created DESC LIMIT $perPage OFFSET $offset");
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Enrich with invitation status (latest invitation per user)
    if (!empty($items)) {
        $userIds = array_column($items, 'id');
        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $invStmt = $db->prepare("SELECT user_id, expires_at, used_at, sent_at FROM user_invitations WHERE user_id IN ($placeholders) ORDER BY created_at DESC");
        $invStmt->execute($userIds);
        $invMap = [];
        foreach ($invStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            if (!isset($invMap[$row['user_id']])) $invMap[$row['user_id']] = $row;
        }
        foreach ($items as &$item) {
            $inv = $invMap[$item['id']] ?? null;
            $item['invitation'] = $inv ? [
                'expires_at' => $inv['expires_at'],
                'used_at' => $inv['used_at'],
                'sent_at' => $inv['sent_at'],
                'status' => $inv['used_at'] ? 'used' : (strtotime($inv['expires_at']) < time() ? 'expired' : 'pending'),
            ] : null;
        }
    }

    jsonResponse([
        'page' => $page,
        'perPage' => $perPage,
        'totalItems' => $totalItems,
        'totalPages' => $perPage > 0 ? (int)ceil($totalItems / $perPage) : 0,
        'items' => $items,
    ]);
}

function handleUserResendInvitation($id) {
    $actor = getAuthUser();
    if (!$actor) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $target = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$target) {
        jsonResponse(['error' => 'Utilisateur introuvable.'], 404);
    }
    if (!canActorManageUser($actor, $target)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    // Invalidate previous active invitations
    $db->prepare("UPDATE user_invitations SET used_at = COALESCE(used_at, NOW()), updated_at = NOW() WHERE user_id = ? AND used_at IS NULL")
        ->execute([$id]);

    // Create new invitation
    $token = generateLifecycleToken();
    $tokenHash = hashLifecycleToken($token);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+' . REV02_INVITATION_TTL_HOURS . ' hours'));
    $invId = generateId();
    $stmt = $db->prepare("INSERT INTO user_invitations (id, user_id, organization_id, email, role, agent_type, token_hash, expires_at, sent_at, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())");
    $stmt->execute([$invId, $id, $target['organization_id'], $target['email'], $target['role'], $target['agent_type'], $tokenHash, $expiresAt, $actor['id']]);

    // Org name
    $orgName = null;
    if (!empty($target['organization_id'])) {
        $os = $db->prepare("SELECT name FROM organizations WHERE id = ? LIMIT 1");
        $os->execute([$target['organization_id']]);
        $o = $os->fetch();
        $orgName = $o ? $o['name'] : null;
    }

    $acceptUrl = REV02_APP_URL . '/accept-invitation?token=' . $token;
    $html = buildInvitationHtml($target['name'] ?: $target['email'], $orgName, roleLabel($target['role'], $target['agent_type']), $acceptUrl, $expiresAt);
    $result = sendEmail($target['email'], $target['name'] ?: 'Utilisateur', 'Invitation à rejoindre ALIKA MOBILITY', $html);
    error_log('Resend invitation to ' . $target['email'] . ' | success=' . ($result['success'] ? '1' : '0'));

    $db->prepare("UPDATE users SET invited_at = NOW(), updated = NOW() WHERE id = ?")->execute([$id]);

    jsonResponse(['success' => true, 'message' => 'Invitation renvoyée.', 'email_sent' => $result['success'], 'expires_at' => $expiresAt]);
}

function handleUserSuspend($id) {
    $actor = getAuthUser();
    if (!$actor) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $target = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$target) {
        jsonResponse(['error' => 'Utilisateur introuvable.'], 404);
    }
    if (!canActorManageUser($actor, $target)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    if ($target['status'] === 'suspended') {
        jsonResponse(['error' => 'Ce compte est déjà suspendu.'], 400);
    }

    // Prevent suspending the last active super-admin
    if ($target['role'] === 'super-admin' && countActiveSuperAdmins($db) <= 1) {
        jsonResponse(['error' => 'Impossible de suspendre le dernier super-admin actif.'], 400);
    }

    // Revoke active sessions for the suspended user
    $db->prepare("DELETE FROM sessions WHERE user_id = ?")->execute([$id]);
    $db->prepare("UPDATE users SET status = 'suspended', updated = NOW() WHERE id = ?")->execute([$id]);

    jsonResponse(['success' => true, 'message' => 'Compte suspendu.']);
}

function handleUserReactivate($id) {
    $actor = getAuthUser();
    if (!$actor) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $target = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$target) {
        jsonResponse(['error' => 'Utilisateur introuvable.'], 404);
    }
    if (!canActorManageUser($actor, $target)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
    if ($target['status'] === 'active') {
        jsonResponse(['error' => 'Ce compte est déjà actif.'], 400);
    }

    // For pending_invite users without a password, they still need to accept an invitation
    $newStatus = ($target['status'] === 'pending_invite' && empty($target['password_hash'])) ? 'pending_invite' : 'active';
    $db->prepare("UPDATE users SET status = ?, updated = NOW() WHERE id = ?")->execute([$newStatus, $id]);

    jsonResponse(['success' => true, 'message' => 'Compte réactivé.', 'status' => $newStatus]);
}

function handleUserForcePasswordReset($id) {
    $actor = getAuthUser();
    if (!$actor) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $target = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$target) {
        jsonResponse(['error' => 'Utilisateur introuvable.'], 404);
    }
    if (!canActorManageUser($actor, $target)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    // Invalidate previous reset tokens
    $db->prepare("UPDATE password_reset_tokens SET used_at = COALESCE(used_at, NOW()) WHERE user_id = ? AND used_at IS NULL")
        ->execute([$id]);

    $token = generateLifecycleToken();
    $tokenHash = hashLifecycleToken($token);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+' . REV02_RESET_TTL_MINUTES . ' minutes'));
    $rid = generateId();
    $stmt = $db->prepare("INSERT INTO password_reset_tokens (id, user_id, email, token_hash, expires_at, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$rid, $id, $target['email'], $tokenHash, $expiresAt, null, null]);

    $db->prepare("UPDATE users SET must_change_password = 1, updated = NOW() WHERE id = ?")->execute([$id]);

    $resetUrl = REV02_APP_URL . '/reset-password?token=' . $token;
    $html = buildForgotPasswordHtml($target['name'] ?: $target['email'], $resetUrl, $expiresAt);
    $result = sendEmail($target['email'], $target['name'] ?: 'Utilisateur', 'Réinitialisation de votre mot de passe — ALIKA MOBILITY', $html);
    error_log('Force-reset email to ' . $target['email'] . ' | success=' . ($result['success'] ? '1' : '0'));

    jsonResponse(['success' => true, 'message' => 'Email de réinitialisation envoyé.', 'email_sent' => $result['success'], 'expires_at' => $expiresAt]);
}
