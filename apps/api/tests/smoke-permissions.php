<?php
/**
 * Smoke tests Permissions agents transport
 *
 * Usage:
 *   TEST_SUPER_EMAIL=... TEST_SUPER_PASSWORD=... TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=... \
 *   TEST_AGENT_EMAIL=... TEST_AGENT_PASSWORD=... \
 *   php apps/api/tests/smoke-permissions.php
 *
 * Reads test credentials from environment variables.
 * If --skip-network is passed, only config checks are run.
 */

$skipNetwork = in_array('--skip-network', $argv ?? []);
$baseUrl = getenv('API_BASE_URL') ?: 'https://alikamobility.alika-konnect.com/api';
$failed = 0;
$passed = 0;

function test(string $name, $result, string $detail = '') {
    global $passed, $failed;
    if ($result) {
        echo "  ✅ $name\n";
        $passed++;
    } else {
        echo "  ❌ $name" . ($detail ? " — $detail" : '') . "\n";
        $failed++;
    }
}

function apiGet(string $url, ?string $token = null): array {
    $opts = ['http' => ['method' => 'GET', 'header' => 'Content-Type: application/json']];
    if ($token) $opts['http']['header'] .= "\r\nAuthorization: Bearer $token";
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $status = $http_response_header ? (int)explode(' ', $http_response_header[0])[1] : 0;
    return ['status' => $status, 'body' => $body ? json_decode($body, true) : []];
}

function apiPost(string $url, array $payload, ?string $token = null): array {
    $opts = ['http' => ['method' => 'POST', 'header' => 'Content-Type: application/json', 'content' => json_encode($payload)]];
    if ($token) $opts['http']['header'] .= "\r\nAuthorization: Bearer $token";
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $status = $http_response_header ? (int)explode(' ', $http_response_header[0])[1] : 0;
    return ['status' => $status, 'body' => $body ? json_decode($body, true) : []];
}

function login(string $email, string $password, string $baseUrl): ?string {
    $res = apiPost("$baseUrl/auth/login", ['email' => $email, 'password' => $password]);
    return ($res['status'] === 200 && isset($res['body']['token'])) ? $res['body']['token'] : null;
}

echo "=== Permissions Transport Smoke Tests ===\n\n";

// Lint
$lintOk = shell_exec('php -l ' . __DIR__ . '/../crud.php 2>&1');
test('PHP lint crud.php', strpos($lintOk, 'No syntax errors') !== false);

if ($skipNetwork) {
    echo "\n⚠️  Tests réseau ignorés (--skip-network)\n";
    echo "\nRésultat: $passed passed, $failed failed\n";
    exit($failed > 0 ? 1 : 0);
}

$superEmail = getenv('TEST_SUPER_EMAIL');
$superPass = getenv('TEST_SUPER_PASSWORD');
$adminEmail = getenv('TEST_ADMIN_EMAIL');
$adminPass = getenv('TEST_ADMIN_PASSWORD');
$agentEmail = getenv('TEST_AGENT_EMAIL');
$agentPass = getenv('TEST_AGENT_PASSWORD');

$superToken = $superEmail ? login($superEmail, $superPass, $baseUrl) : null;
$adminToken = $adminEmail ? login($adminEmail, $adminPass, $baseUrl) : null;
$agentToken = $agentEmail ? login($agentEmail, $agentPass, $baseUrl) : null;

echo "\n--- Tests super-admin ---\n";
if ($superToken) {
    $res = apiGet("$baseUrl/notifications", $superToken);
    test('Super-admin: GET /notifications → 200', $res['status'] === 200);
    
    $res = apiGet("$baseUrl/notification-templates", $superToken);
    test('Super-admin: GET /notification-templates → 200', $res['status'] === 200);
    
    $res = apiGet("$baseUrl/collections/vehicles/records", $superToken);
    test('Super-admin: GET /collections/vehicles/records → 200', $res['status'] === 200);
} else {
    echo "  ⏭️  (credentials super-admin non fournis)\n";
}

echo "\n--- Tests admin ---\n";
if ($adminToken) {
    $res = apiGet("$baseUrl/collections/vehicles/records", $adminToken);
    test('Admin: GET /collections/vehicles/records → 200', $res['status'] === 200);
    
    $res = apiGet("$baseUrl/collections/drivers/records", $adminToken);
    test('Admin: GET /collections/drivers/records → 200', $res['status'] === 200);
    
    $res = apiGet("$baseUrl/notifications", $adminToken);
    test('Admin: GET /notifications → 200', $res['status'] === 200);
} else {
    echo "  ⏭️  (credentials admin non fournis)\n";
}

echo "\n--- Tests agent ---\n";
if ($agentToken) {
    $res = apiGet("$baseUrl/collections/vehicles/records", $agentToken);
    test('Agent: GET /collections/vehicles/records → 200 (lecture autorisée)', $res['status'] === 200);
    
    $res = apiPost("$baseUrl/collections/vehicles/records", ['organization_id' => 'test'], $agentToken);
    test('Agent: POST /collections/vehicles/records → 403 (lecture seule)', $res['status'] === 403);
    
    $res = apiGet("$baseUrl/collections/drivers/records", $agentToken);
    test('Agent: GET /collections/drivers/records → 200 (lecture autorisée)', $res['status'] === 200);
    
    $res = apiGet("$baseUrl/collections/documents/records", $agentToken);
    test('Agent: GET /collections/documents/records → 200 (lecture autorisée)', $res['status'] === 200);
    
    $res = apiPost("$baseUrl/notifications/send", ['channel' => 'in_app'], $agentToken);
    $forbidden = $res['status'] === 403;
    test('Agent: POST /notifications/send → 403', $forbidden, "Got {$res['status']}");
    
    $res = apiGet("$baseUrl/notification-logs", $agentToken);
    test('Agent: GET /notification-logs → 200 (son org)', $res['status'] === 200);
} else {
    echo "  ⏭️  (credentials agent non fournis)\n";
}

echo "\n=== Résultat: $passed passed, $failed failed ===\n";
exit($failed > 0 ? 1 : 0);
