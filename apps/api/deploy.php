<?php

function handleDeployTrigger() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $expectedToken = getenv('DEPLOY_TOKEN');
    if (!$expectedToken) {
        jsonResponse(['error' => 'DEPLOY_TOKEN not configured on server'], 500);
    }
    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m) || $m[1] !== $expectedToken) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $output = [];
    $exitCode = 0;

    $projectDir = __DIR__ . '/../..';

    $output[] = '=== ALIKA DEPLOY ===';
    $output[] = 'Time: ' . date('Y-m-d H:i:s T');
    $output[] = 'Project: ' . $projectDir;
    $output[] = '';

    $gitAvailable = false;
    $gitOutput = null;
    $gitExitCode = -1;
    exec('git --version 2>&1', $gitOutput, $gitExitCode);
    $gitAvailable = $gitExitCode === 0;
    $output[] = 'Git: ' . ($gitAvailable ? trim(implode("\n", $gitOutput)) : 'NOT AVAILABLE');

    $execAvailable = function_exists('exec');
    $shellAvailable = function_exists('shell_exec');
    $output[] = 'PHP exec(): ' . ($execAvailable ? 'yes' : 'no');
    $output[] = 'PHP shell_exec(): ' . ($shellAvailable ? 'yes' : 'no');
    $output[] = '';

    if ($gitAvailable) {
        $output[] = '--- git fetch origin ---';
        $fetchOut = null;
        $fetchCode = -1;
        exec("cd " . escapeshellarg($projectDir) . " && git fetch origin 2>&1", $fetchOut, $fetchCode);
        $output = array_merge($output, $fetchOut);
        $output[] = 'Exit code: ' . $fetchCode;

        $output[] = '';
        $output[] = '--- git status ---';
        $statusOut = null;
        $statusCode = -1;
        exec("cd " . escapeshellarg($projectDir) . " && git status 2>&1", $statusOut, $statusCode);
        $output = array_merge($output, $statusOut);

        $output[] = '';
        $output[] = '--- git log --oneline -5 ---';
        $logOut = null;
        $logCode = -1;
        exec("cd " . escapeshellarg($projectDir) . " && git log --oneline -5 2>&1", $logOut, $logCode);
        $output = array_merge($output, $logOut);

        $output[] = '';
        $output[] = '--- git reset --hard origin/master ---';
        $resetOut = null;
        $resetCode = -1;
        exec("cd " . escapeshellarg($projectDir) . " && git reset --hard origin/master 2>&1", $resetOut, $resetCode);
        $output = array_merge($output, $resetOut);
        $output[] = 'Exit code: ' . $resetCode;
        $exitCode = $resetCode;

        $output[] = '';
        $output[] = '--- git log --oneline -3 (after reset) ---';
        $logOut2 = null;
        $logCode2 = -1;
        exec("cd " . escapeshellarg($projectDir) . " && git log --oneline -3 2>&1", $logOut2, $logCode2);
        $output = array_merge($output, $logOut2);
    } else {
        $output[] = 'ERROR: Git is not available on this server.';
        $output[] = 'Deploy requires git to pull latest code.';
        $exitCode = 1;
    }

    jsonResponse([
        'success' => $exitCode === 0,
        'exit_code' => $exitCode,
        'output' => implode("\n", $output),
    ]);
}
