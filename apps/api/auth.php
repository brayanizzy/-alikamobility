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
    $db = getDB();

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'multipart/form-data') !== false) {
        $data = $_POST;
        $files = $_FILES;
    } else {
        $data = getRequestBody();
        $files = [];
    }

    $name = trim($data['name'] ?? '');
    $city = trim($data['city'] ?? '');
    $contactPhone = trim($data['contact_phone'] ?? '');
    $managerName = trim($data['manager_name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (!$name || !$city || !$contactPhone || !$managerName || !$email || !$password) {
        jsonResponse(['error' => 'Tous les champs requis doivent être remplis.'], 400);
    }

    if (strlen($password) < 8) {
        jsonResponse(['error' => 'Le mot de passe doit faire au moins 8 caractères.'], 400);
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Cet email est déjà utilisé.'], 409);
    }

    $db->beginTransaction();
    try {
        $orgId = generateId();
        $stmt = $db->prepare(
            "INSERT INTO organizations (`id`, `name`, `city`, `contact_phone`, `manager_name`, `contact_email`, `subscription_plan`, `status`, `created`, `updated`)
             VALUES (?, ?, ?, ?, ?, ?, 'free', 'pending', NOW(), NOW())"
        );
        $stmt->execute([$orgId, $name, $city, $contactPhone, $managerName, $email]);

        if (!empty($files['logo']) && $files['logo']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = UPLOAD_BASE_DIR . '/organizations/' . $orgId;
            if (!is_dir($uploadDir)) @mkdir($uploadDir, 0755, true);
            $ext = pathinfo($files['logo']['name'], PATHINFO_EXTENSION);
            $safeExt = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
            $filename = 'logo_' . $orgId . '.' . $safeExt;
            move_uploaded_file($files['logo']['tmp_name'], $uploadDir . '/' . $filename);
            $stmt = $db->prepare("UPDATE organizations SET logo = ? WHERE id = ?");
            $stmt->execute([$filename, $orgId]);
        }

        $userId = generateId();
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare(
            "INSERT INTO users (`id`, `email`, `password_hash`, `name`, `role`, `organization_id`, `phone`, `status`, `created`, `updated`)
             VALUES (?, ?, ?, ?, 'admin', ?, ?, 'active', NOW(), NOW())"
        );
        $stmt->execute([$userId, $email, $passwordHash, $managerName, $orgId, $contactPhone]);

        $db->commit();

        $orgStmt = $db->prepare("SELECT * FROM organizations WHERE id = ?");
        $orgStmt->execute([$orgId]);
        $org = $orgStmt->fetch();

        if (getenv('BREVO_API_KEY')) {
            try {
                $html = buildWelcomeEmailHtml($managerName, $name);
                sendBrevoEmail($email, $managerName, "Bienvenue sur Alika Mobility — {$name}", $html);

                $htmlAdmin = buildNewOrgEmailHtml($managerName, $name, $city, $contactPhone);
                $superStmt = $db->prepare("SELECT email, name FROM users WHERE role = 'super-admin'");
                $superStmt->execute();
                $superAdmins = $superStmt->fetchAll();
                foreach ($superAdmins as $sa) {
                    sendBrevoEmail($sa['email'], $sa['name'] ?? 'Super Admin', "Nouvelle association : {$name}", $htmlAdmin);
                }
            } catch (Throwable $e) {
                error_log('Signup email error: ' . $e->getMessage());
            }
        }

        jsonResponse([
            'success' => true,
            'organization_id' => $orgId,
            'user_id' => $userId,
            'message' => 'Association créée avec succès. En attente d\'approbation.'
        ], 201);

    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Signup error: ' . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de l\'inscription. Réessayez.'], 500);
    }
}
