<?php

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/crud.php';
require_once __DIR__ . '/files.php';
require_once __DIR__ . '/email.php';
require_once __DIR__ . '/notifications.php';

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
    ];

    $key = "$method $path";
    if (isset($routes[$key])) {
        $routes[$key]();
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
