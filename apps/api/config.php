<?php

// Disable display_errors in production
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Load .env.local if it exists
$envFile = __DIR__ . '/.env.local';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: '';
$db_user = getenv('DB_USER') ?: '';
$db_pass = getenv('DB_PASS') ?: '';

define('UPLOAD_BASE_DIR', __DIR__ . '/../assets/uploads');
define('PUBLIC_URL_PREFIX', '/api/files');
define('CARD_VERIFY_BASE_URL', 'https://alikamobility.alika-konnect.com/verify/card');

function getAllowedOrigin() {
    $allowedOrigins = getenv('ALLOWED_ORIGINS') ?: 'https://alikamobility.alika-konnect.com,http://localhost:3000,http://localhost:5173';
    $origins = array_map('trim', explode(',', $allowedOrigins));
    $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($requestOrigin, $origins)) {
        return $requestOrigin;
    }
    // For same-origin requests (no Origin header), allow the first origin
    return in_array('*', $origins) ? '*' : $origins[0];
}

// Polyfill for getallheaders() on FastCGI
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (strpos($name, 'HTTP_') === 0) {
                $name = str_replace('_', ' ', substr($name, 5));
                $name = str_replace(' ', '-', ucwords(strtolower($name)));
                $headers[$name] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        if (isset($_SERVER['CONTENT_LENGTH'])) $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH'];
        return $headers;
    }
}

function getDB() {
    global $db_host, $db_name, $db_user, $db_pass;
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $pdo;
}

function getAuthUser() {
    $headers = getallheaders();
    $token = null;
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m)) {
        $token = $m[1];
    }
    if (!$token) return null;
    $db = getDB();
    $stmt = $db->prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > NOW()");
    $stmt->execute([$token]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function generateId() {
    $chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    $id = '';
    for ($i = 0; $i < 15; $i++) {
        $id .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $id;
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

function removePassword(&$record) {
    if (is_array($record)) {
        unset($record['password_hash']);
        unset($record['token_key']);
        unset($record['last_reset_sent_at']);
        unset($record['last_verification_sent_at']);
    }
    return $record;
}

function getRequestBody() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        return json_decode(file_get_contents('php://input'), true) ?: [];
    }
    return $_POST;
}

function getFileUrl($collection, $recordId, $filename) {
    if (!$filename) return null;
    return PUBLIC_URL_PREFIX . '/' . $collection . '/' . $recordId . '/' . $filename;
}

function getNotificationConfig($key, $default = null) {
    return getenv($key) ?: $default;
}
