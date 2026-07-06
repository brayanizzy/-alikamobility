<?php
/**
 * Health check endpoint for ALIKA MOBILITY
 *
 * Returns:
 *   - status (ok/degraded/error)
 *   - app version
 *   - environment
 *   - database status (no credentials exposed)
 *   - server time
 *
 * No authentication required (public health check).
 * No sensitive data exposed.
 */

function handleHealth() {
    $status = 'ok';
    $dbStatus = 'ok';
    $dbDetail = null;

    try {
        $db = getDB();
        $stmt = $db->query("SELECT 1");
        if (!$stmt) {
            $dbStatus = 'error';
            $status = 'error';
            $dbDetail = 'connection_failed';
        }
    } catch (Throwable $e) {
        $dbStatus = 'error';
        $status = 'degraded';
        $dbDetail = 'unreachable';
        error_log('Health check DB error: ' . $e->getMessage());
    }

    $version = getenv('APP_VERSION') ?: '1.0.0';
    $environment = getenv('APP_ENV') ?: 'production';

    jsonResponse([
        'status' => $status,
        'app' => 'ALIKA MOBILITY',
        'version' => $version,
        'environment' => $environment,
        'database' => $dbStatus,
        'time' => date('c'),
    ]);
}
