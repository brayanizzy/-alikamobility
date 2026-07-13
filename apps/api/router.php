<?php

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/crud.php';
require_once __DIR__ . '/files.php';
require_once __DIR__ . '/email.php';
require_once __DIR__ . '/notifications.php';
require_once __DIR__ . '/card-security.php';
require_once __DIR__ . '/reports.php';
require_once __DIR__ . '/account-lifecycle.php';
require_once __DIR__ . '/association-registration.php';
require_once __DIR__ . '/health.php';
require_once __DIR__ . '/subscriptions.php';
require_once __DIR__ . '/deploy.php';

$allowedOrigin = getAllowedOrigin();
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $uri);
$path = rtrim($path, '/');

try {
    $routes = [
        'POST /auth/login' => 'handleLogin',
        'GET /auth/me' => 'handleMe',
        'POST /auth/logout' => 'handleLogout',
        'POST /auth/validate' => 'handleValidateToken',
        'POST /auth/signup' => 'handleSignup',
        'GET /cron/daily-collection-check' => 'handleDailyCollectionCheck',
        'POST /finance/pay-debt' => 'handlePayDebt',
        'GET /cards/verify' => 'handleCardVerify',
        'GET /cards/secure-url' => 'handleCardSecureUrl',
        'GET /reports/overview' => 'handleReportsOverview',
        'GET /reports/payments' => 'handleReportsPayments',
        'GET /reports/debts' => 'handleReportsDebts',
        'GET /reports/transport' => 'handleReportsTransport',
        'GET /reports/members' => 'handleReportsMembers',
        'GET /reports/agent-performance' => 'handleReportsAgentPerformance',
        'GET /reports/cashier' => 'handleReportsCashier',
        // Module 10 — Notifications
        'GET /notifications' => 'handleNotificationsGet',
        'POST /notifications/send' => 'handleNotificationsSend',
        'POST /notifications/read' => 'handleNotificationMarkRead',
        'POST /notifications/mark-all-read' => 'handleNotificationMarkAllRead',
        'GET /notifications/unread-count' => 'handleNotificationsUnreadCount',
        'GET /notification-templates' => 'handleNotificationTemplatesGet',
        'POST /notification-templates' => 'handleNotificationTemplatesCreate',
        'PUT /notification-templates' => 'handleNotificationTemplatesUpdate',
        'DELETE /notification-templates' => 'handleNotificationTemplatesDelete',
        'POST /notification-templates/seed' => 'handleNotificationTemplatesSeed',
        'GET /notification-logs' => 'handleNotificationsLogsGet',
        'POST /notification-logs/retry' => 'handleNotificationLogsRetry',
        'POST /notifications/cron-daily-reminders' => 'handleCronDailyReminders',
        // REV-02 — Account lifecycle & auth emails
        'POST /auth/forgot-password' => 'handleForgotPassword',
        'GET /auth/reset-password/verify' => 'handleResetPasswordVerify',
        'POST /auth/reset-password' => 'handleResetPassword',
        'GET /auth/invitation/verify' => 'handleInvitationVerify',
        'POST /auth/invitation/accept' => 'handleInvitationAccept',
        'POST /users/invite' => 'handleUserInvite',
        'GET /users' => 'handleUsersList',
        // REV-03.1 — Public association registration
        'POST /public/association-registrations' => 'handleAssociationRegistration',
        'GET /association-registration-requests' => 'handleAssociationRegistrationRequestsList',
        // REV-03.2 — Approve/reject/request-correction (dynamic ID in block below)
        // REV-03.3 — Subscription management
        'GET /subscriptions' => 'handleSubscriptionsList',
        'GET /my-subscription' => 'handleMySubscription',
        'GET /health' => 'handleHealth',
        // Deploy webhook
        'POST /deploy/trigger' => 'handleDeployTrigger',
    ];

    $key = "$method $path";
    if (isset($routes[$key])) {
        $routes[$key]();
        exit;
    }

    // Module 10 — Notification action routes (POST with ?action= param)
    if ($method === 'POST' && $path === '/notifications/send-action' && isset($_GET['action'])) {
        handleNotificationsActionSend();
        exit;
    }

    // REV-02 — User lifecycle action routes (dynamic id segment)
    if ($method === 'POST' && preg_match('#^/users/([a-zA-Z0-9=_-]+)/(resend-invitation|suspend|reactivate|force-password-reset)$#', $path, $m)) {
        $action = $m[2];
        if ($action === 'resend-invitation') handleUserResendInvitation($m[1]);
        elseif ($action === 'suspend') handleUserSuspend($m[1]);
        elseif ($action === 'reactivate') handleUserReactivate($m[1]);
        elseif ($action === 'force-password-reset') handleUserForcePasswordReset($m[1]);
        exit;
    }

    // REV-03.2 — Association registration detail & decisions
    if (preg_match('#^/association-registration-requests/([a-zA-Z0-9=_+-]+)$#', $path, $m)) {
        if ($method === 'GET') handleAssociationRegistrationRequestDetail($m[1]);
        else jsonResponse(['error' => 'Method not allowed'], 405);
        exit;
    }
    if (preg_match('#^/association-registration-requests/([a-zA-Z0-9=_+-]+)/(approve|reject|request-correction)$#', $path, $m)) {
        if ($method !== 'POST') { jsonResponse(['error' => 'Method not allowed'], 405); exit; }
        $action = $m[2];
        if ($action === 'approve') handleAssociationRegistrationApprove($m[1]);
        elseif ($action === 'reject') handleAssociationRegistrationReject($m[1]);
        elseif ($action === 'request-correction') handleAssociationRegistrationRequestCorrection($m[1]);
        exit;
    }

    // REV-03.3 — Subscription management by org_id
    if (preg_match('#^/subscriptions/([a-zA-Z0-9=_+-]+)$#', $path, $m)) {
        if ($method === 'GET') handleSubscriptionDetail($m[1]);
        else jsonResponse(['error' => 'Method not allowed'], 405);
        exit;
    }
    if (preg_match('#^/subscriptions/([a-zA-Z0-9=_+-]+)/(change-plan|activate|extend-trial|expire|suspend|reactivate)$#', $path, $m)) {
        if ($method !== 'POST') { jsonResponse(['error' => 'Method not allowed'], 405); exit; }
        $action = $m[2];
        if ($action === 'change-plan') handleChangePlan($m[1]);
        elseif ($action === 'activate') handleActivateSubscription($m[1]);
        elseif ($action === 'extend-trial') handleExtendTrial($m[1]);
        elseif ($action === 'expire') handleExpireSubscription($m[1]);
        elseif ($action === 'suspend') handleSuspendOrganization($m[1]);
        elseif ($action === 'reactivate') handleReactivateOrganization($m[1]);
        exit;
    }

    if (preg_match('#^/collections/([a-zA-Z_]+)/records(?:/([a-zA-Z0-9]+))?$#', $path, $m)) {
        $collection = $m[1];
        $id = $m[2] ?? null;
        handleCrud($method, $collection, $id);
        exit;
    }

    if (preg_match('#^/files/([a-zA-Z_]+)/([a-zA-Z0-9]+)/([a-zA-Z0-9_.-]+)$#', $path, $m)) {
        serveFile($m[1], $m[2], $m[3]);
        exit;
    }

    jsonResponse(['error' => 'Not found'], 404);
} catch (Throwable $e) {
    $errorMsg = $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
    error_log('Alika API Error: ' . $errorMsg);
    jsonResponse(['error' => 'Internal server error'], 500);
}

function handleCardVerify() {
    $cardNumber = $_GET['card_number'] ?? null;
    $token = $_GET['token'] ?? null;

    if (!$cardNumber) {
        jsonResponse(['error' => 'card_number is required'], 400);
    }

    // If token is present, verify HMAC. If absent, still accept for backward compat
    // but enforce token verification for cards that have qr_secret
    if ($token) {
        if (!verifyCardToken($cardNumber, $token)) {
            jsonResponse(['success' => false, 'status' => 'invalid_token', 'message' => 'QR code invalide ou non sécurisé.'], 403);
        }
    }

    $db = getDB();

    // Find the card
    $stmt = $db->prepare("SELECT * FROM member_cards WHERE card_number = ? LIMIT 1");
    $stmt->execute([$cardNumber]);
    $card = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$card) {
        jsonResponse(['error' => 'Carte introuvable'], 404);
    }

    // If token was not provided but card has qr_secret, require token
    if (!$token && !empty($card['qr_secret'])) {
        jsonResponse(['success' => false, 'status' => 'token_required', 'message' => 'Cette carte nécessite un QR code sécurisé. Utilisez le QR code officiel.'], 403);
    }

    // Check card status
    if ($card['status'] !== 'active') {
        $statusLabels = ['expired' => 'expirée', 'lost' => 'perdue', 'replaced' => 'remplacée', 'cancelled' => 'annulée'];
        $label = $statusLabels[$card['status']] ?? $card['status'];
        jsonResponse(['error' => "Carte {$label}. Vérification refusée."], 403);
    }

    // Check expiry
    if ($card['expiry_date'] && $card['expiry_date'] < date('Y-m-d')) {
        jsonResponse(['error' => 'Carte expirée depuis le ' . $card['expiry_date'] . '. Veuillez renouveler.'], 403);
    }

    // Find the member (limited public data — no phone, email, address)
    $member = null;
    if ($card['member_id']) {
        $stmt = $db->prepare("SELECT id, name, member_code, status FROM members WHERE id = ? LIMIT 1");
        $stmt->execute([$card['member_id']]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Check for open debt on this member
    $openDebt = null;
    if ($card['member_id']) {
        $stmt = $db->prepare("SELECT id, amount_original, amount_remaining, status, currency FROM debts WHERE member_id = ? AND organization_id = ? AND status IN ('pending', 'partially_paid') LIMIT 1");
        $stmt->execute([$card['member_id'], $card['organization_id']]);
        $openDebt = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $response = [
        'success' => true,
        'valid' => $card['status'] === 'active',
        'card' => [
            'card_number' => $card['card_number'],
            'card_type' => $card['card_type'],
            'issued_date' => $card['issued_date'],
            'expiry_date' => $card['expiry_date'],
            'status' => $card['status'],
        ],
        'member' => $member ? [
            'id' => $member['id'],
            'name' => $member['name'],
            'member_code' => $member['member_code'],
            'status' => $member['status'],
        ] : null,
        'openDebt' => $openDebt ? [
            'id' => $openDebt['id'],
            'amount_original' => $openDebt['amount_original'],
            'amount_remaining' => $openDebt['amount_remaining'],
            'status' => $openDebt['status'],
            'currency' => $openDebt['currency'] ?? 'CDF',
        ] : null,
    ];

    jsonResponse($response);
}

function handleCardSecureUrl() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $cardId = $_GET['id'] ?? null;
    if (!$cardId) { jsonResponse(['error' => 'Card ID is required'], 400); }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM member_cards WHERE id = ? AND organization_id = ? LIMIT 1");
    $stmt->execute([$cardId, $user['organization_id']]);
    $card = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$card) { jsonResponse(['error' => 'Card not found'], 404); }

    $verifyUrl = generateSecureVerifyUrl($card);

    if ($verifyUrl === null) {
        jsonResponse(['error' => 'Configuration serveur incomplète : secret HMAC non configuré.', 'success' => false], 500);
    }

    jsonResponse([
        'success' => true,
        'verify_url' => $verifyUrl,
        'card_number' => $card['card_number'],
    ]);
}

function handlePayDebt() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $body = getRequestBody();
    $debtId = $body['debt_id'] ?? null;
    $amount = $body['amount'] ?? null;
    $method = $body['payment_method'] ?? null;
    $clientPaymentId = $body['client_payment_id'] ?? ('debt_' . $debtId . '_' . time() . '_' . bin2hex(random_bytes(4)));

    if (!$debtId) { jsonResponse(['error' => 'debt_id is required'], 400); }
    if (!$amount || !is_numeric($amount) || $amount <= 0) { jsonResponse(['error' => 'Invalid amount'], 400); }
    if (!$method) { jsonResponse(['error' => 'payment_method is required'], 400); }

    $db = getDB();

    // Fetch the debt
    $stmt = $db->prepare("SELECT * FROM debts WHERE id = ? AND organization_id = ?");
    $stmt->execute([$debtId, $user['organization_id']]);
    $debt = $stmt->fetch();

    if (!$debt) { jsonResponse(['error' => 'Debt not found'], 404); }
    if ($debt['status'] === 'paid' || $debt['status'] === 'written_off') {
        jsonResponse(['error' => 'Debt is already ' . $debt['status']], 400);
    }

    $remaining = (float)$debt['amount_remaining'];
    $paid = (float)$amount;
    if ($paid > $remaining) { jsonResponse(['error' => 'Amount exceeds remaining balance'], 400); }

    try {
        $db->beginTransaction();

        $newRemaining = round($remaining - $paid, 2);
        $newStatus = $newRemaining <= 0 ? 'paid' : 'partially_paid';
        $now = date('Y-m-d H:i:s');

        // Create payment
        $paymentId = generateId();
        $paymentDate = date('Y-m-d');
        $notes = json_encode(['debt_id' => $debtId, 'type' => 'debt_payment']);

        $stmt = $db->prepare("INSERT INTO payments (id, organization_id, member_id, amount, payment_method, payment_date, recorded_by, collector_id, client_payment_id, notes, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $paymentId,
            $debt['organization_id'],
            $debt['member_id'] ?? '',
            $paid,
            $method,
            $paymentDate,
            $user['name'] ?? $user['email'] ?? 'system',
            $user['id'] ?? '',
            $clientPaymentId,
            $notes,
            $now,
            $now
        ]);

        // Update debt
        $stmt = $db->prepare("UPDATE debts SET amount_remaining = ?, status = ?, updated = ? WHERE id = ?");
        $stmt->execute([$newRemaining, $newStatus, $now, $debtId]);

        // Create receipt
        $receiptId = generateId();
        $stmt = $db->prepare("INSERT INTO receipts (id, organization_id, payment_id, member_id, amount, currency, created_by, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $receiptId,
            $debt['organization_id'],
            $paymentId,
            $debt['member_id'] ?? '',
            $paid,
            $debt['currency'] ?? 'CDF',
            $user['id'] ?? '',
            $now,
            $now
        ]);

        $db->commit();

        jsonResponse([
            'success' => true,
            'payment' => ['id' => $paymentId, 'amount' => $paid, 'method' => $method],
            'debt' => ['id' => $debtId, 'amount_remaining' => (string)$newRemaining, 'status' => $newStatus],
            'receipt' => ['id' => $receiptId],
        ]);
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('PayDebt error: ' . $e->getMessage());
        jsonResponse(['error' => 'Payment failed: ' . $e->getMessage()], 500);
    }
}
