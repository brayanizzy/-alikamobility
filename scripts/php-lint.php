<?php
/**
 * PHP Lint Checker for ALIKA MOBILITY
 * 
 * Usage: php scripts/php-lint.php
 * Exit code: 0 if all pass, 1 if any fail
 */

$files = [
    __DIR__ . '/../apps/api/config.php',
    __DIR__ . '/../apps/api/auth.php',
    __DIR__ . '/../apps/api/router.php',
    __DIR__ . '/../apps/api/crud.php',
    __DIR__ . '/../apps/api/reports.php',
    __DIR__ . '/../apps/api/notifications.php',
    __DIR__ . '/../apps/api/notification-providers.php',
    __DIR__ . '/../apps/api/notification-templates.php',
    __DIR__ . '/../apps/api/email.php',
    __DIR__ . '/../apps/api/files.php',
    __DIR__ . '/../apps/api/card-security.php',
    __DIR__ . '/../apps/api/account-lifecycle.php',
    __DIR__ . '/../apps/api/association-registration.php',
];

$failed = 0;
$passed = 0;

foreach ($files as $file) {
    if (!file_exists($file)) {
        echo "⚠️  Fichier introuvable: $file\n";
        continue;
    }
    $output = shell_exec("php -l \"$file\" 2>&1");
    if (strpos($output, 'No syntax errors') !== false) {
        echo "  ✅ $file\n";
        $passed++;
    } else {
        echo "  ❌ $file\n";
        echo "     $output";
        $failed++;
    }
}

echo "\nRésultat: $passed passed, $failed failed\n";
exit($failed > 0 ? 1 : 0);
