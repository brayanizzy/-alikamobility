<?php
/**
 * REV-03.1 — Public association registration flow
 *
 * POST /public/association-registrations   (public) submit a registration request
 * GET  /association-registration-requests   (super-admin) list requests
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
