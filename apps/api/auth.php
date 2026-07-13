<?php

function checkRateLimit($key, $maxAttempts = 5, $windowSeconds = 300) {
    $file = sys_get_temp_dir() . '/alika_ratelimit_' . md5($key) . '.lock';
    $now = time();
    $attempts = [];
    if (file_exists($file)) {
        $attempts = array_filter(unserialize(file_get_contents($file)), function($t) use ($now, $windowSeconds) {
            return $t > ($now - $windowSeconds);
        });
    }
    $attempts[] = $now;
    file_put_contents($file, serialize($attempts), LOCK_EX);
    return count($attempts) <= $maxAttempts;
}

function handleLogin() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit('login_' . $ip, 5, 300)) {
        jsonResponse(['error' => 'Trop de tentatives. Réessayez dans 5 minutes.'], 429);
    }

    $data = getRequestBody();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (!$email || !$password) {
        jsonResponse(['error' => 'Email and password are required'], 400);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonResponse(['error' => 'Invalid email or password'], 401);
    }

    // Block login for non-active accounts (REV-03.1)
    $status = $user['status'] ?? 'active';
    if ($status === 'pending_approval') {
        jsonResponse(['error' => 'Votre compte est en attente de validation par l\'équipe ALIKA MOBILITY.'], 403);
    }
    if ($status === 'suspended') {
        jsonResponse(['error' => 'Votre compte a été suspendu. Contactez votre administrateur.'], 403);
    }
    if ($status === 'disabled') {
        jsonResponse(['error' => 'Ce compte est désactivé.'], 403);
    }
    if ($status === 'pending_invite') {
        jsonResponse(['error' => 'Votre compte n\'est pas encore activé. Veuillez définir votre mot de passe via le lien d\'invitation reçu par email.'], 403);
    }

    $token = generateToken();
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

    // Generate UUID for session id
    $sessionId = sprintf('%s-%s-%s-%s-%s',
        bin2hex(random_bytes(4)),
        bin2hex(random_bytes(2)),
        bin2hex(random_bytes(2)),
        bin2hex(random_bytes(2)),
        bin2hex(random_bytes(6))
    );

    $stmt = $db->prepare("INSERT INTO sessions (id, token, user_id, expires_at, created) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$sessionId, $token, $user['id'], $expiresAt]);

    removePassword($user);

    jsonResponse([
        'token' => $token,
        'user' => $user
    ]);
}

function handleMe() {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    removePassword($user);
    jsonResponse(['user' => $user]);
}

function handleLogout() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = '';
    if (preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m)) {
        $token = $m[1];
    }

    if ($token) {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM sessions WHERE token = ?");
        $stmt->execute([$token]);
    }

    jsonResponse(['message' => 'Logged out successfully']);
}

function handleValidateToken() {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(['valid' => false], 401);
    }
    removePassword($user);
    jsonResponse(['valid' => true, 'user' => $user]);
}

function handleSignup() {
    jsonResponse(['error' => 'L\'inscription directe est désactivée. Utilisez le formulaire d\'inscription association (/register-association).'], 410);
}
