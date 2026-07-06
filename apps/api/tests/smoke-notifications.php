<?php
/**
 * Smoke tests Notifications
 *
 * Usage:
 *   TEST_SUPER_EMAIL=... TEST_SUPER_PASSWORD=... \
 *   CRON_SECRET=... \
 *   php apps/api/tests/smoke-notifications.php
 *
 * If --skip-network is passed, only lint checks are run.
 * NEVER hardcode secrets in this file.
 */

$skipNetwork = in_array('--skip-network', $argv ?? []);
$baseUrl = getenv('API_BASE_URL') ?: 'https://alikamobility.alika-konnect.com/api';
$cronSecret = getenv('CRON_SECRET');
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

echo "=== Notifications Smoke Tests ===\n\n";

// PHP lint
$files = ['notifications.php', 'notification-providers.php', 'notification-templates.php', 'router.php'];
foreach ($files as $f) {
    $lintOk = shell_exec("php -l " . __DIR__ . "/../$f 2>&1");
    test("PHP lint $f", strpos($lintOk, 'No syntax errors') !== false);
}

if ($skipNetwork) {
    echo "\n⚠️  Tests réseau ignorés (--skip-network)\n";
    echo "\nRésultat: $passed passed, $failed failed\n";
    exit($failed > 0 ? 1 : 0);
}

echo "\n--- Tests sécurité cron ---\n";

// Cron without secret → 401
$res = apiPost("$baseUrl/notifications/cron-daily-reminders", [], null);
test('Cron sans secret → 401', $res['status'] === 401, "Got {$res['status']}");

// Cron with bad secret → 401
$res = apiPost("$baseUrl/notifications/cron-daily-reminders", [], 'bad-secret-123');
test('Cron mauvais secret → 401', $res['status'] === 401, "Got {$res['status']}");

// Cron with valid secret
if ($cronSecret) {
    $res = apiPost("$baseUrl/notifications/cron-daily-reminders", [], $cronSecret);
    test('Cron bon secret → 200', $res['status'] === 200, "Got {$res['status']}");
    if ($res['status'] === 200) {
        test('Cron retourne dry_run=true', $res['body']['dry_run'] ?? false === true, 'dry_run non présent');
    }
} else {
    echo "  ⏭️  Test cron ignoré (CRON_SECRET non définie)\n";
}

echo "\n--- Tests templates ---\n";
$superEmail = getenv('TEST_SUPER_EMAIL');
$superPass = getenv('TEST_SUPER_PASSWORD');
if ($superEmail && $superPass) {
    $res = apiPost("$baseUrl/auth/login", ['email' => $superEmail, 'password' => $superPass]);
    if ($res['status'] === 200 && isset($res['body']['token'])) {
        $token = $res['body']['token'];
        
        $res = apiGet("$baseUrl/notification-templates", $token);
        test('GET /notification-templates → 200', $res['status'] === 200);
        
        if ($res['status'] === 200) {
            $count = count($res['body']['items'] ?? []);
            test("Templates chargés: $count items", $count >= 11, "Seulement $count trouvés");
        }
        
        // Send in_app dry-run
        $res = apiPost("$baseUrl/notifications/send", [
            'channel' => 'in_app',
            'custom_message' => 'Test smoke',
            'dry_run' => true,
            'recipient_type' => 'user',
            'recipient_id' => '1daa82ae5dd4391',
        ], $token);
        test('POST /notifications/send in_app dry-run → 200', $res['status'] === 200, "Got {$res['status']}");
        
        if ($res['status'] === 200) {
            test('Send retourne success=true', $res['body']['success'] ?? false === true);
        }
        
        // Send email dry-run
        $res = apiPost("$baseUrl/notifications/send", [
            'channel' => 'email',
            'custom_message' => 'Test email smoke',
            'dry_run' => true,
            'recipient_type' => 'user',
            'recipient_id' => '1daa82ae5dd4391',
        ], $token);
        test('POST /notifications/send email dry-run → 200', $res['status'] === 200, "Got {$res['status']}");
        
        // GET notification-logs
        $res = apiGet("$baseUrl/notification-logs", $token);
        test('GET /notification-logs → 200', $res['status'] === 200);
        
        // GET notifications
        $res = apiGet("$baseUrl/notifications", $token);
        test('GET /notifications → 200', $res['status'] === 200);
        
        // GET unread-count
        $res = apiGet("$baseUrl/notifications/unread-count", $token);
        test('GET /notifications/unread-count → 200', $res['status'] === 200);
    }
} else {
    echo "  ⏭️  Tests templates/logs ignorés (credentials non fournis)\n";
}

echo "\n=== Résultat: $passed passed, $failed failed ===\n";
exit($failed > 0 ? 1 : 0);
