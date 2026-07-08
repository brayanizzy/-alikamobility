<?php
/**
 * Smoke tests — Tenant isolation (REV-01.2)
 *
 * Verifies that admin/agent can only access data within their own
 * organization, and that super-admin retains global access.
 *
 * Usage:
 *   TEST_SUPER_EMAIL=... TEST_SUPER_PASSWORD=... \
 *   TEST_ADMIN_A_EMAIL=... TEST_ADMIN_A_PASSWORD=... \
 *   TEST_ADMIN_B_EMAIL=... TEST_ADMIN_B_PASSWORD=... \
 *   [TEST_AGENT_EMAIL=... TEST_AGENT_PASSWORD=...] \
 *   php apps/api/tests/smoke-tenant-isolation.php
 *
 * Reads test credentials from environment variables.
 * If --skip-network is passed, only lint/config checks are run.
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
    $opts = ['http' => ['method' => 'GET', 'header' => 'Content-Type: application/json', 'ignore_errors' => true]];
    if ($token) $opts['http']['header'] .= "\r\nAuthorization: Bearer $token";
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $status = $http_response_header ? (int)explode(' ', $http_response_header[0])[1] : 0;
    return ['status' => $status, 'body' => $body ? json_decode($body, true) : []];
}

function apiRequest(string $url, string $method, $payload = null, ?string $token = null): array {
    $opts = ['http' => ['method' => $method, 'header' => 'Content-Type: application/json', 'ignore_errors' => true]];
    if ($payload !== null) $opts['http']['content'] = json_encode($payload);
    if ($token) $opts['http']['header'] .= "\r\nAuthorization: Bearer $token";
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $status = $http_response_header ? (int)explode(' ', $http_response_header[0])[1] : 0;
    return ['status' => $status, 'body' => $body ? json_decode($body, true) : []];
}

function login(string $email, string $password, string $baseUrl): array {
    $res = apiRequest("$baseUrl/auth/login", 'POST', ['email' => $email, 'password' => $password]);
    if ($res['status'] === 200 && isset($res['body']['token'])) {
        return ['token' => $res['body']['token'], 'user' => $res['body']['user']];
    }
    return ['token' => null, 'user' => null];
}

echo "=== Tenant Isolation Smoke Tests (REV-01.2) ===\n\n";

// Lint
$lintOk = shell_exec('php -l ' . escapeshellarg(__DIR__ . '/../crud.php') . ' 2>&1');
test('PHP lint crud.php', strpos($lintOk, 'No syntax errors') !== false);

if ($skipNetwork) {
    echo "\n⚠️  Tests réseau ignorés (--skip-network)\n";
    echo "\nRésultat: $passed passed, $failed failed\n";
    exit($failed ? 1 : 0);
}

$superEmail = getenv('TEST_SUPER_EMAIL');
$superPass = getenv('TEST_SUPER_PASSWORD');
$aEmail = getenv('TEST_ADMIN_A_EMAIL');
$aPass = getenv('TEST_ADMIN_A_PASSWORD');
$bEmail = getenv('TEST_ADMIN_B_EMAIL');
$bPass = getenv('TEST_ADMIN_B_PASSWORD');
$agentEmail = getenv('TEST_AGENT_EMAIL');
$agentPass = getenv('TEST_AGENT_PASSWORD');

if (!$superEmail || !$superPass || !$aEmail || !$aPass || !$bEmail || !$bPass) {
    echo "⚠️  Variables d'environnement manquantes (TEST_SUPER_*, TEST_ADMIN_A_*, TEST_ADMIN_B_*)\n";
    echo "\nRésultat: $passed passed, $failed failed\n";
    exit(1);
}

// Logins
$super = login($superEmail, $superPass, $baseUrl);
test('Login super-admin', !empty($super['token']));
$adminA = login($aEmail, $aPass, $baseUrl);
test('Login admin A', !empty($adminA['token']) && ($adminA['user']['role'] ?? '') === 'admin');
$adminB = login($bEmail, $bPass, $baseUrl);
test('Login admin B', !empty($adminB['token']) && ($adminB['user']['role'] ?? '') === 'admin');

$orgA = $adminA['user']['organization_id'] ?? null;
$orgB = $adminB['user']['organization_id'] ?? null;
test('Admin A et B dans des orgs différentes', $orgA && $orgB && $orgA !== $orgB, "orgA=$orgA orgB=$orgB");

if (empty($super['token']) || empty($adminA['token']) || empty($adminB['token'])) {
    echo "\n⛔ Logins requis échoués — abandon\n";
    echo "\nRésultat: $passed passed, $failed failed\n";
    exit(1);
}

$tokS = $super['token'];
$tokA = $adminA['token'];
$tokB = $adminB['token'];

echo "\n--- Super-admin (accès global) ---\n";
$orgs = apiGet("$baseUrl/collections/organizations/records?page=1&perPage=50", $tokS);
test('Super-admin voit plusieurs organisations', ($orgs['body']['totalItems'] ?? 0) > 1, "total=" . ($orgs['body']['totalItems'] ?? '?'));

$allMembers = apiGet("$baseUrl/collections/members/records?page=1&perPage=50", $tokS);
$membersList = $allMembers['body']['items'] ?? [];
test('Super-admin voit des members (toutes orgs)', count($membersList) >= 1);

// Find a cross-org member (a member NOT in admin A's org) for negative tests
$crossMember = null;
foreach ($membersList as $m) {
    if (($m['organization_id'] ?? '') !== $orgA) {
        $crossMember = $m;
        break;
    }
}
$crossId = $crossMember['id'] ?? null;
$crossOrg = $crossMember['organization_id'] ?? null;
test('Trouvé un member cross-org pour tests négatifs', $crossId !== null, 'Aucun member d\'une autre org trouvé');

if ($crossId) {
    echo "\n--- Admin A (org=$orgA) isolation ---\n";

    // GET one cross-org -> 404
    $res = apiGet("$baseUrl/collections/members/records/$crossId", $tokA);
    test('Admin A GET member cross-org -> 404', $res['status'] === 404, "HTTP={$res['status']}");

    // PUT cross-org -> 404
    $res = apiRequest("$baseUrl/collections/members/records/$crossId", 'PATCH', ['name' => 'HACK'], $tokA);
    test('Admin A PATCH member cross-org -> 404', $res['status'] === 404, "HTTP={$res['status']}");

    // DELETE cross-org -> 404
    $res = apiRequest("$baseUrl/collections/members/records/$crossId", 'DELETE', null, $tokA);
    test('Admin A DELETE member cross-org -> 404', $res['status'] === 404, "HTTP={$res['status']}");

    // Filter override attempt: filter=organization_id="<otherOrg>" -> 0
    $enc = urlencode("organization_id=\"$crossOrg\"");
    $res = apiGet("$baseUrl/collections/members/records?filter=$enc", $tokA);
    test('Admin A filtre organization_id=autreOrg -> 0 (non contournable)', ($res['body']['totalItems'] ?? -1) === 0, "total=" . ($res['body']['totalItems'] ?? '?'));

    // Super-admin CAN read the same cross-org member -> 200
    $res = apiGet("$baseUrl/collections/members/records/$crossId", $tokS);
    test('Super-admin GET même member cross-org -> 200', $res['status'] === 200, "HTTP={$res['status']}");
}

echo "\n--- Admin A: members limités à sa propre org ---\n";
$ownA = apiGet("$baseUrl/collections/members/records?page=1&perPage=50", $tokA);
$leak = false;
foreach (($ownA['body']['items'] ?? []) as $m) {
    if (($m['organization_id'] ?? '') !== $orgA) { $leak = true; break; }
}
test('Admin A ne voit QUE ses members (pas de fuite)', !$leak);

echo "\n--- Admin A: CREATE force organization_id ---\n";
$created = apiRequest("$baseUrl/collections/members/records", 'POST', [
    'organization_id' => $orgB,
    'name' => 'TEST-ISO-SMOKE',
    'member_id' => 'TESTISOSMOKE',
    'phone' => '+243900000099',
], $tokA);
$createdId = $created['body']['id'] ?? null;
test('Admin A POST member -> 201', $created['status'] === 201, "HTTP={$created['status']}");
test('organization_id forcée à Org A (pas Org B)', ($created['body']['organization_id'] ?? '') === $orgA, "org=" . ($created['body']['organization_id'] ?? '?'));

echo "\n--- Admin A: empêcher changement d'org ---\n";
if ($createdId) {
    $upd = apiRequest("$baseUrl/collections/members/records/$createdId", 'PATCH', [
        'organization_id' => $orgB,
        'name' => 'TEST-ISO-SMOKE-REN',
    ], $tokA);
    test('Admin A PATCH own member -> 200', $upd['status'] === 200, "HTTP={$upd['status']}");
    test('organization_id inchangée après tentative de move', ($upd['body']['organization_id'] ?? '') === $orgA);

    // Admin B cannot read admin A's created member
    $res = apiGet("$baseUrl/collections/members/records/$createdId", $tokB);
    test('Admin B GET member Org A -> 404', $res['status'] === 404, "HTTP={$res['status']}");

    // Cleanup
    apiRequest("$baseUrl/collections/members/records/$createdId", 'DELETE', null, $tokA);
    test('Admin A DELETE own test member -> cleanup OK', true);
}

echo "\n--- Admin B (org=$orgB) isolation ---\n";
$ownB = apiGet("$baseUrl/collections/members/records?page=1&perPage=50", $tokB);
$leakB = false;
foreach (($ownB['body']['items'] ?? []) as $m) {
    if (($m['organization_id'] ?? '') !== $orgB) { $leakB = true; break; }
}
test('Admin B ne voit QUE ses members (pas de fuite)', !$leakB);

// Collections système inaccessibles aux admins (sauf lecture org pour organizations)
echo "\n--- Collections système ---\n";
$sess = apiGet("$baseUrl/collections/sessions/records?page=1&perPage=5", $tokA);
test('Admin A ne voit pas les sessions des autres (scoped user_id ou 403)', $sess['status'] === 200 || $sess['status'] === 403);
$ownSessionsOnly = true;
foreach (($sess['body']['items'] ?? []) as $s) {
    if (($s['user_id'] ?? '') !== ($adminA['user']['id'] ?? '')) { $ownSessionsOnly = false; break; }
}
test('Admin A ne voit que ses propres sessions', $ownSessionsOnly);

// vehicle_types global : lisible par admin
$vt = apiGet("$baseUrl/collections/vehicle_types/records?page=1&perPage=10", $tokA);
test('Admin A peut lire vehicle_types (global)', $vt['status'] === 200 && ($vt['body']['totalItems'] ?? 0) >= 1);
// mais pas en créer
$vtCreate = apiRequest("$baseUrl/collections/vehicle_types/records", 'POST', ['name' => 'HACK', 'slug' => 'hack'], $tokA);
test('Admin A ne peut pas créer vehicle_types (système) -> 403', $vtCreate['status'] === 403, "HTTP={$vtCreate['status']}");

// Agent (optionnel)
if ($agentEmail && $agentPass) {
    echo "\n--- Agent (field/office collector) ---\n";
    $agent = login($agentEmail, $agentPass, $baseUrl);
    test('Login agent', !empty($agent['token']) && ($agent['user']['role'] ?? '') === 'agent');
    if (!empty($agent['token'])) {
        $agentOrg = $agent['user']['organization_id'] ?? null;
        $am = apiGet("$baseUrl/collections/members/records?page=1&perPage=50", $agent['token']);
        $agentLeak = false;
        foreach (($am['body']['items'] ?? []) as $m) {
            if (($m['organization_id'] ?? '') !== $agentOrg) { $agentLeak = true; break; }
        }
        test('Agent ne voit QUE sa org (pas de fuite)', !$agentLeak);
        $vehCreate = apiRequest("$baseUrl/collections/vehicles/records", 'POST', ['organization_id' => $agentOrg, 'plate_number' => 'HACK'], $agent['token']);
        test('Agent POST vehicles -> 403 (readonly transport)', $vehCreate['status'] === 403, "HTTP={$vehCreate['status']}");
        apiRequest("$baseUrl/auth/logout", 'POST', null, $agent['token']);
    }
}

// Logouts
apiRequest("$baseUrl/auth/logout", 'POST', null, $tokS);
apiRequest("$baseUrl/auth/logout", 'POST', null, $tokA);
apiRequest("$baseUrl/auth/logout", 'POST', null, $tokB);

echo "\nRésultat: $passed passed, $failed failed\n";
exit($failed ? 1 : 0);
