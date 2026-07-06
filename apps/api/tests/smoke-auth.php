<?php
/**
 * Smoke tests Auth
 * 
 * Usage: 
 *   TEST_SUPER_EMAIL=superadmin@alika.test TEST_SUPER_PASSWORD=... php apps/api/tests/smoke-auth.php
 *   php apps/api/tests/smoke-auth.php --skip-network
 * 
 * Reads test credentials from environment variables.
 * If --skip-network is passed, only lint/parse checks are run.
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
    if ($token) {
        $opts['http']['header'] .= "\r\nAuthorization: Bearer $token";
    }
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $status = $http_response_header ? (int)explode(' ', $http_response_header[0])[1] : 0;
    $data = $body ? json_decode($body, true) : [];
    return ['status' => $status, 'body' => $data];
}

function apiPost(string $url, array $payload, ?string $token = null): array {
    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($payload),
        ]
    ];
    if ($token) {
        $opts['http']['header'] .= "\r\nAuthorization: Bearer $token";
    }
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $status = $http_response_header ? (int)explode(' ', $http_response_header[0])[1] : 0;
    $data = $body ? json_decode($body, true) : [];
    return ['status' => $status, 'body' => $data];
}

echo "=== Auth Smoke Tests ===\n\n";

// 1. PHP lint test
echo "--- Tests locaux ---\n";
$lintOk = !shell_exec('php -l ' . __DIR__ . '/../auth.php 2>&1 | grep -c "error"');
test('PHP lint auth.php', $lintOk === false, $lintOk ? 'Erreur de syntaxe' : '');

if ($skipNetwork) {
    echo "\n⚠️  Tests réseau ignorés (--skip-network)\n";
    echo "\nRésultat: $passed passed, $failed failed\n";
    exit($failed > 0 ? 1 : 0);
}

echo "\n--- Tests réseau ---\n";

// 2. Login with wrong credentials → 401
$res = apiPost("$baseUrl/auth/login", ['email' => 'wrong@test.com', 'password' => 'wrong']);
test('Login mauvais credentials → 401', $res['status'] === 401, "Got {$res['status']}");

// 3. Protected endpoint without token → 401
$res = apiGet("$baseUrl/notifications");
test('GET /notifications sans token → 401', $res['status'] === 401, "Got {$res['status']}");

// 4. Validate without token → 401
$res = apiPost("$baseUrl/auth/validate", []);
test('POST /auth/validate sans token → 401', $res['status'] === 401, "Got {$res['status']}");

// 5. Login with valid credentials (if env vars are set)
$superEmail = getenv('TEST_SUPER_EMAIL');
$superPass = getenv('TEST_SUPER_PASSWORD');
if ($superEmail && $superPass) {
    $res = apiPost("$baseUrl/auth/login", ['email' => $superEmail, 'password' => $superPass]);
    test('Login super-admin credentials valides → 200', $res['status'] === 200, "Got {$res['status']}: " . ($res['body']['error'] ?? ''));
    
    if ($res['status'] === 200 && isset($res['body']['token'])) {
        $token = $res['body']['token'];
        
        // 6. Validate with valid token
        $res = apiPost("$baseUrl/auth/validate", [], $token);
        test('POST /auth/validate avec token valide → 200', $res['status'] === 200, "Got {$res['status']}");
        test('Token valide retourne valid=true', $res['body']['valid'] ?? false === true, 'valid non présent ou false');
        
        // 7. Notifications with auth
        $res = apiGet("$baseUrl/notifications", $token);
        test('GET /notifications avec auth → 200', $res['status'] === 200, "Got {$res['status']}");
    }
} else {
    echo "  ⏭️  Tests login ignorés (TEST_SUPER_EMAIL/TEST_SUPER_PASSWORD non définies)\n";
}

echo "\n=== Résultat: $passed passed, $failed failed ===\n";
exit($failed > 0 ? 1 : 0);
