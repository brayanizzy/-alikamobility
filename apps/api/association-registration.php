<?php
/**
 * REV-03.1 & REV-03.2 — Association registration flow
 *
 * REV-03.1 — Public registration
 *   POST /public/association-registrations            (public) submit
 *   GET  /association-registration-requests            (super-admin) list
 *
 * REV-03.2 — Super-admin decision
 *   GET  /association-registration-requests/{id}       (super-admin) detail
 *   POST /association-registration-requests/{id}/approve   (super-admin)
 *   POST /association-registration-requests/{id}/reject    (super-admin)
 *   POST /association-registration-requests/{id}/request-correction (super-admin)
 *
 * Creates: organization (pending), admin user (pending_approval),
 * subscription (pending_validation), registration request (pending_approval).
 * Tries to send emails but never blocks on provider failure (Brevo 401 etc.).
 * Never returns tokens/passwords. Never auto-logs-in the user.
 */

define('REV03_ACTIVITY_TYPES', ['taxi-moto', 'taxi-voiture', 'bus', 'parking', 'transport-mixte', 'autre']);
define('REV03_PLAN_CODES', ['starter', 'pro', 'premium', 'enterprise']);

function validPlanCode($code) {
    return in_array($code, REV03_PLAN_CODES, true);
}

function handleAssociationRegistration() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    // Rate limit public registrations (5 per IP per hour)
    if (!checkRateLimit('reg_' . $ip, 5, 3600)) {
        jsonResponse(['error' => 'Trop de demandes. Réessayez plus tard.'], 429);
    }

    $data = getRequestBody();
    $a = $data['association'] ?? [];
    $m = $data['manager'] ?? [];
    $c = $data['account'] ?? [];
    $planCode = trim($data['plan_code'] ?? '');

    // --- Validation ---
    $errors = [];

    $assocName = trim($a['name'] ?? '');
    $activityType = trim($a['activity_type'] ?? '');
    $province = trim($a['province'] ?? '');
    $city = trim($a['city'] ?? '');
    $address = trim($a['address'] ?? '');
    $assocPhone = trim($a['phone'] ?? '');
    $assocEmail = trim($a['email'] ?? '');

    $mgrName = trim($m['name'] ?? '');
    $mgrPhone = trim($m['phone'] ?? '');
    $mgrEmail = trim($m['email'] ?? '');
    $mgrFunction = trim($m['function'] ?? '');

    $acctEmail = trim($c['email'] ?? '');
    $password = $c['password'] ?? '';
    $passwordConfirm = $c['password_confirmation'] ?? '';

    if (!$assocName) $errors[] = 'Le nom de l\'association est requis.';
    if (!$activityType) $errors[] = 'Le type d\'activité est requis.';
    elseif (!in_array($activityType, REV03_ACTIVITY_TYPES, true)) $errors[] = 'Type d\'activité invalide.';
    if (!$province) $errors[] = 'La province est requise.';
    if (!$city) $errors[] = 'La ville est requise.';
    if (!$mgrName) $errors[] = 'Le nom du responsable est requis.';
    if (!$mgrPhone) $errors[] = 'Le téléphone du responsable est requis.';
    if (!$mgrEmail || !filter_var($mgrEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'L\'email du responsable est invalide.';
    if (!$acctEmail || !filter_var($acctEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'L\'email de connexion est invalide.';
    if (!validPlanCode($planCode)) $errors[] = 'Forfait invalide.';
    if ($password !== $passwordConfirm) $errors[] = 'Les mots de passe ne correspondent pas.';
    $pwdErrors = validatePasswordStrength($password);
    if (!empty($pwdErrors)) $errors[] = 'Le mot de passe doit contenir ' . implode(', ', $pwdErrors) . '.';

    if (!empty($errors)) {
        jsonResponse(['error' => implode(' ', $errors)], 400);
    }

    $db = getDB();

    // Check email uniqueness (admin login email)
    $existing = findUserByEmail($db, $acctEmail);
    if ($existing) {
        jsonResponse(['error' => 'Cet email de connexion est déjà utilisé.'], 409);
    }

    // Check association name not already pending/active (avoid duplicates)
    $chk = $db->prepare("SELECT id FROM organizations WHERE name = ? AND status IN ('pending','active') LIMIT 1");
    $chk->execute([$assocName]);
    if ($chk->fetch()) {
        jsonResponse(['error' => 'Une association avec ce nom existe déjà ou est en cours d\'examen.'], 409);
    }

    // --- Create everything in a transaction ---
    $now = date('Y-m-d H:i:s');
    $orgId = generateId();
    $userId = generateId();
    $subId = generateId();
    $reqId = generateId();
    $hash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $db->beginTransaction();

        // Organization (pending)
        $db->prepare("INSERT INTO organizations (id, name, contact_email, contact_phone, city, manager_name, subscription_plan, status, plan_code, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)")
            ->execute([$orgId, $assocName, $assocEmail ?: $mgrEmail, $assocPhone ?: $mgrPhone, $city, $mgrName, $planCode, $planCode, $now, $now]);

        // Admin user (pending_approval)
        $db->prepare("INSERT INTO users (id, email, password_hash, name, role, organization_id, phone, status, email_verified_at, created, updated) VALUES (?, ?, ?, ?, 'admin', ?, ?, 'pending_approval', NULL, ?, ?)")
            ->execute([$userId, $acctEmail, $hash, $mgrName, $orgId, $mgrPhone, $now, $now]);

        // Subscription (pending_validation)
        $db->prepare("INSERT INTO organization_subscriptions (id, organization_id, plan_code, status, created_at, updated_at) VALUES (?, ?, ?, 'pending_validation', ?, ?)")
            ->execute([$subId, $orgId, $planCode, $now, $now]);

        // Registration request (pending_approval)
        $db->prepare("INSERT INTO association_registration_requests (id, organization_id, admin_user_id, plan_code, association_name, activity_type, province, city, address, manager_name, manager_phone, manager_email, status, submitted_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, ?)")
            ->execute([$reqId, $orgId, $userId, $planCode, $assocName, $activityType, $province, $city, $address, $mgrName, $mgrPhone, $mgrEmail, $now, $now, $now]);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Association registration error: ' . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la création de la demande. Réessayez.'], 500);
    }

    // --- Emails (best-effort, never block) ---
    // To the manager
    $mgrHtml = buildRegistrationReceivedHtml($assocName, $planCode);
    $r1 = sendEmail($mgrEmail, $mgrName, 'Votre demande d\'inscription ALIKA MOBILITY a été reçue', $mgrHtml);
    error_log('Registration email to manager ' . $mgrEmail . ' | success=' . ($r1['success'] ? '1' : '0'));

    // To all super-admins
    try {
        $saStmt = $db->prepare("SELECT email, name FROM users WHERE role = 'super-admin' AND status = 'active'");
        $saStmt->execute();
        foreach ($saStmt->fetchAll(PDO::FETCH_ASSOC) as $sa) {
            $saHtml = buildNewRegistrationHtml($assocName, $mgrName, $mgrPhone, $mgrEmail, $city, $planCode);
            $r2 = sendEmail($sa['email'], $sa['name'] ?: 'Super Admin', 'Nouvelle demande d\'association à valider', $saHtml);
            error_log('Registration email to super-admin ' . $sa['email'] . ' | success=' . ($r2['success'] ? '1' : '0'));
        }
    } catch (Throwable $e) {
        error_log('Super-admin registration email error: ' . $e->getMessage());
    }

    jsonResponse([
        'success' => true,
        'message' => 'Votre demande a été reçue. Elle sera examinée par l\'équipe ALIKA MOBILITY.',
        'request_id' => $reqId,
    ], 201);
}

function handleAssociationRegistrationRequestsList() {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    if (($user['role'] ?? '') !== 'super-admin') {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $db = getDB();
    $where = [];
    $params = [];

    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;
    $planCode = $_GET['plan_code'] ?? null;
    $cityFilter = $_GET['city'] ?? null;

    if ($status) { $where[] = 'r.status = ?'; $params[] = $status; }
    if ($planCode) { $where[] = 'r.plan_code = ?'; $params[] = $planCode; }
    if ($cityFilter) { $where[] = 'r.city LIKE ?'; $params[] = '%' . $cityFilter . '%'; }
    if ($search) {
        $where[] = '(r.association_name LIKE ? OR r.manager_name LIKE ? OR r.manager_email LIKE ?)';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
        $params[] = '%' . $search . '%';
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $page = max(1, intval($_GET['page'] ?? 1));
    $perPage = min(100, max(1, intval($_GET['perPage'] ?? 20)));
    $offset = ($page - 1) * $perPage;

    $countStmt = $db->prepare("SELECT COUNT(*) FROM association_registration_requests r $whereClause");
    $countStmt->execute($params);
    $totalItems = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare("SELECT r.*, o.contact_email as org_contact_email FROM association_registration_requests r LEFT JOIN organizations o ON r.organization_id = o.id $whereClause ORDER BY r.submitted_at DESC LIMIT $perPage OFFSET $offset");
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Count by status for quick stats
    $statsStmt = $db->query("SELECT status, COUNT(*) as cnt FROM association_registration_requests GROUP BY status");
    $stats = [];
    foreach ($statsStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $stats[$row['status']] = (int)$row['cnt'];
    }

    jsonResponse([
        'page' => $page,
        'perPage' => $perPage,
        'totalItems' => $totalItems,
        'totalPages' => $perPage > 0 ? (int)ceil($totalItems / $perPage) : 0,
        'items' => $items,
        'stats' => $stats,
    ]);
}

// =============================================================
// REV-03.2 — Super-admin decision handlers
// =============================================================

function requireSuperAdmin() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }
    if (($user['role'] ?? '') !== 'super-admin') { jsonResponse(['error' => 'Forbidden'], 403); }
    return $user;
}

function loadRegistrationRequest($db, $id) {
    $stmt = $db->prepare("SELECT * FROM association_registration_requests WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $req = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$req) { jsonResponse(['error' => 'Demande introuvable.'], 404); }
    return $req;
}

/**
 * GET /association-registration-requests/{id}
 * Returns full detail: request + organization + admin user + subscription + plan.
 */
function handleAssociationRegistrationRequestDetail($id) {
    $user = requireSuperAdmin();
    $db = getDB();

    $req = loadRegistrationRequest($db, $id);
    $orgId = $req['organization_id'];
    $userId = $req['admin_user_id'];

    $orgStmt = $db->prepare("SELECT * FROM organizations WHERE id = ? LIMIT 1");
    $orgStmt->execute([$orgId]);
    $org = $orgStmt->fetch(PDO::FETCH_ASSOC);

    $userStmt = $db->prepare("SELECT id, email, name, role, phone, status, created, updated FROM users WHERE id = ? LIMIT 1");
    $userStmt->execute([$userId]);
    $adminUser = $userStmt->fetch(PDO::FETCH_ASSOC);

    $subStmt = $db->prepare("SELECT * FROM organization_subscriptions WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1");
    $subStmt->execute([$orgId]);
    $subscription = $subStmt->fetch(PDO::FETCH_ASSOC);

    $plan = null;
    if ($req['plan_code']) {
        $planStmt = $db->prepare("SELECT * FROM subscription_plans WHERE code = ? LIMIT 1");
        $planStmt->execute([$req['plan_code']]);
        $plan = $planStmt->fetch(PDO::FETCH_ASSOC);
    }

    jsonResponse([
        'request' => $req,
        'organization' => $org,
        'admin_user' => $adminUser,
        'subscription' => $subscription,
        'plan' => $plan,
    ]);
}

/**
 * POST /association-registration-requests/{id}/approve
 * Body: { plan_code?, subscription_status?, trial_days?, note? }
 * Transitions: request->approved, org->active, user->active, sub->trial/active.
 */
function handleAssociationRegistrationApprove($id) {
    $superAdmin = requireSuperAdmin();
    $db = getDB();

    $req = loadRegistrationRequest($db, $id);

    // Prevent double-approve
    if ($req['status'] === 'approved') {
        jsonResponse(['error' => 'Cette demande a déjà été approuvée.'], 409);
    }
    if ($req['status'] !== 'pending_approval' && $req['status'] !== 'needs_correction') {
        jsonResponse(['error' => 'Seules les demandes en attente ou en correction peuvent être approuvées.'], 400);
    }

    $body = getRequestBody();
    $planCode = trim($body['plan_code'] ?? $req['plan_code'] ?? '');
    $subStatus = trim($body['subscription_status'] ?? 'trial');
    $trialDays = max(0, intval($body['trial_days'] ?? 14));
    $note = trim($body['note'] ?? $req['review_note'] ?? '');

    if (!validPlanCode($planCode)) {
        jsonResponse(['error' => 'Code de forfait invalide.'], 400);
    }
    if (!in_array($subStatus, ['trial', 'active'], true)) {
        jsonResponse(['error' => 'Le statut d\'abonnement doit être trial ou active.'], 400);
    }

    $orgId = $req['organization_id'];
    $userId = $req['admin_user_id'];
    $now = date('Y-m-d H:i:s');

    try {
        $db->beginTransaction();

        // 1. Update organization → active
        $db->prepare("UPDATE organizations SET status = 'active', plan_code = ?, approved_at = ?, approved_by = ?, updated = ? WHERE id = ?")
            ->execute([$planCode, $now, $superAdmin['id'], $now, $orgId]);

        // 2. Update admin user → active (keep their password)
        $db->prepare("UPDATE users SET status = 'active', updated = ? WHERE id = ?")
            ->execute([$now, $userId]);

        // 3. Update subscription → trial or active with dates
        $trialStart = $now;
        $trialEnd = $trialDays > 0 ? date('Y-m-d H:i:s', strtotime("+$trialDays days")) : null;
        $subStart = ($subStatus === 'active') ? $now : null;
        $subEnd = null;

        $db->prepare("UPDATE organization_subscriptions SET status = ?, plan_code = ?, trial_starts_at = ?, trial_ends_at = ?, starts_at = ?, ends_at = ?, updated_at = ? WHERE organization_id = ?")
            ->execute([$subStatus, $planCode, $trialStart, $trialEnd, $subStart, $subEnd, $now, $orgId]);

        // 4. Update request → approved
        $db->prepare("UPDATE association_registration_requests SET status = 'approved', review_note = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?")
            ->execute([$note, $now, $superAdmin['id'], $now, $id]);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Approve registration error: ' . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de l\'approbation.'], 500);
    }

    // --- Emails (best-effort, never block) ---
    // Get org + admin info for email
    $orgStmt = $db->prepare("SELECT name, contact_email FROM organizations WHERE id = ? LIMIT 1");
    $orgStmt->execute([$orgId]);
    $org = $orgStmt->fetch(PDO::FETCH_ASSOC);

    $adminStmt = $db->prepare("SELECT email, name FROM users WHERE id = ? LIMIT 1");
    $adminStmt->execute([$userId]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

    try {
        $html = buildAccountApprovedHtml($org['name'] ?? '', $planCode, $subStatus, $admin['email'] ?? '', $trialDays);
        $r = sendEmail($admin['email'] ?: $req['manager_email'], $admin['name'] ?? 'Admin', 'Votre compte ALIKA MOBILITY est validé', $html);
        error_log('Approve email to ' . ($admin['email'] ?? '?') . ' | success=' . ($r['success'] ? '1' : '0'));
    } catch (Throwable $e) {
        error_log('Approve email error: ' . $e->getMessage());
    }

    jsonResponse([
        'success' => true,
        'message' => 'Demande approuvée avec succès.',
        'organization_status' => 'active',
        'user_status' => 'active',
        'subscription_status' => $subStatus,
    ]);
}

/**
 * POST /association-registration-requests/{id}/reject
 * Body: { reason (required), note? }
 */
function handleAssociationRegistrationReject($id) {
    $superAdmin = requireSuperAdmin();
    $db = getDB();

    $req = loadRegistrationRequest($db, $id);

    if ($req['status'] === 'rejected') {
        jsonResponse(['error' => 'Cette demande a déjà été refusée.'], 409);
    }
    if ($req['status'] !== 'pending_approval' && $req['status'] !== 'needs_correction') {
        jsonResponse(['error' => 'Seules les demandes en attente ou en correction peuvent être refusées.'], 400);
    }

    $body = getRequestBody();
    $reason = trim($body['reason'] ?? '');
    $note = trim($body['note'] ?? $req['review_note'] ?? '');

    if (!$reason) {
        jsonResponse(['error' => 'La raison du refus est obligatoire.'], 400);
    }

    $orgId = $req['organization_id'];
    $userId = $req['admin_user_id'];
    $now = date('Y-m-d H:i:s');

    try {
        $db->beginTransaction();

        // 1. Organization → rejected
        $db->prepare("UPDATE organizations SET status = 'rejected', rejected_at = ?, rejection_reason = ?, updated = ? WHERE id = ?")
            ->execute([$now, $reason, $now, $orgId]);

        // 2. Admin user → disabled (login blocked)
        $db->prepare("UPDATE users SET status = 'disabled', updated = ? WHERE id = ?")
            ->execute([$now, $userId]);

        // 3. Subscription → cancelled
        $db->prepare("UPDATE organization_subscriptions SET status = 'cancelled', updated_at = ? WHERE organization_id = ?")
            ->execute([$now, $orgId]);

        // 4. Request → rejected
        $fullNote = $reason;
        if ($note && $note !== $reason) {
            $fullNote = $reason . ' | ' . $note;
        }
        $db->prepare("UPDATE association_registration_requests SET status = 'rejected', review_note = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?")
            ->execute([$fullNote, $now, $superAdmin['id'], $now, $id]);

        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Reject registration error: ' . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors du refus.'], 500);
    }

    // --- Emails (best-effort) ---
    $orgStmt = $db->prepare("SELECT name FROM organizations WHERE id = ? LIMIT 1");
    $orgStmt->execute([$orgId]);
    $org = $orgStmt->fetch(PDO::FETCH_ASSOC);

    $adminStmt = $db->prepare("SELECT email, name FROM users WHERE id = ? LIMIT 1");
    $adminStmt->execute([$userId]);
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);

    try {
        $html = buildAccountRejectedHtml($org['name'] ?? '', $reason);
        $r = sendEmail($admin['email'] ?: $req['manager_email'], $admin['name'] ?? 'Responsable', 'Votre demande ALIKA MOBILITY n\'a pas été approuvée', $html);
        error_log('Reject email to ' . ($admin['email'] ?? '?') . ' | success=' . ($r['success'] ? '1' : '0'));
    } catch (Throwable $e) {
        error_log('Reject email error: ' . $e->getMessage());
    }

    jsonResponse([
        'success' => true,
        'message' => 'Demande refusée.',
    ]);
}

/**
 * POST /association-registration-requests/{id}/request-correction
 * Body: { note (required) }
 */
function handleAssociationRegistrationRequestCorrection($id) {
    $superAdmin = requireSuperAdmin();
    $db = getDB();

    $req = loadRegistrationRequest($db, $id);

    if ($req['status'] !== 'pending_approval') {
        jsonResponse(['error' => 'Seules les demandes en attente peuvent être marquées comme nécessitant une correction.'], 400);
    }

    $body = getRequestBody();
    $note = trim($body['note'] ?? '');

    if (!$note) {
        jsonResponse(['error' => 'La note de correction est obligatoire.'], 400);
    }

    $now = date('Y-m-d H:i:s');

    try {
        $db->beginTransaction();
        $db->prepare("UPDATE association_registration_requests SET status = 'needs_correction', review_note = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ?")
            ->execute([$note, $now, $superAdmin['id'], $now, $id]);
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Request correction error: ' . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la demande de correction.'], 500);
    }

    // Email (best-effort)
    try {
        $html = buildCorrectionRequestedHtml($req['association_name'], $note);
        $r = sendEmail($req['manager_email'], $req['manager_name'] ?: 'Responsable', 'Complément d\'information demandé — ALIKA MOBILITY', $html);
        error_log('Correction email to ' . $req['manager_email'] . ' | success=' . ($r['success'] ? '1' : '0'));
    } catch (Throwable $e) {
        error_log('Correction email error: ' . $e->getMessage());
    }

    jsonResponse([
        'success' => true,
        'message' => 'Correction demandée.',
        'status' => 'needs_correction',
    ]);
}
