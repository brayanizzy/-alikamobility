<?php

function getCardHmacSecret() {
    $secret = getenv('CARD_QR_HMAC_SECRET');
    if ($secret) return $secret;

    $appEnv = getenv('APP_ENV') ?: 'production';
    $isDev = in_array($appEnv, ['local', 'dev', 'development']);

    if ($isDev) {
        $fallback = getenv('APP_SECRET') ?: 'alika-mobility-hmac-dev-fallback';
        return hash('sha256', $fallback, true);
    }

    return null;
}

function generateCardQrSecret() {
    return bin2hex(random_bytes(32));
}

function computeCardHmac($cardNumber, $memberId, $qrSecret) {
    $secret = getCardHmacSecret();
    if (!$secret) {
        error_log('CRITICAL: CARD_QR_HMAC_SECRET not configured in production');
        return null;
    }
    $payload = $cardNumber . '.' . $memberId . '.' . $qrSecret;
    return hash_hmac('sha256', $payload, $secret);
}

function verifyCardToken($cardNumber, $token) {
    if (!$cardNumber || !$token) {
        return false;
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM member_cards WHERE card_number = ? LIMIT 1");
    $stmt->execute([$cardNumber]);
    $card = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$card) return false;

    // If qr_secret is empty, generate and save one
    if (empty($card['qr_secret'])) {
        $qrSecret = generateCardQrSecret();
        $updateStmt = $db->prepare("UPDATE member_cards SET qr_secret = ?, updated = NOW() WHERE id = ?");
        $updateStmt->execute([$qrSecret, $card['id']]);
        $card['qr_secret'] = $qrSecret;
    }

    $expectedToken = computeCardHmac($card['card_number'], $card['member_id'], $card['qr_secret']);
    if (!$expectedToken) return false;
    return hash_equals($expectedToken, $token);
}

function generateSecureVerifyUrl($card) {
    $cardNumber = $card['card_number'];
    $memberId = $card['member_id'] ?? '';

    // Ensure qr_secret exists
    $db = getDB();
    $qrSecret = $card['qr_secret'] ?? null;
    if (empty($qrSecret)) {
        $qrSecret = generateCardQrSecret();
        $stmt = $db->prepare("UPDATE member_cards SET qr_secret = ?, updated = NOW() WHERE id = ?");
        $stmt->execute([$qrSecret, $card['id']]);
    }

    $token = computeCardHmac($cardNumber, $memberId, $qrSecret);
    if (!$token) return null;
    return "https://alikamobility.alika-konnect.com/verify/card/{$cardNumber}?token={$token}";
}
