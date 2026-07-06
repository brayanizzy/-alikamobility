<?php

function isDryRun() {
    return getenv('NOTIFICATION_DRY_RUN') === 'true';
}

function sendEmailNotification($toEmail, $toName, $subject, $htmlContent) {
    if (isDryRun()) {
        return ['success' => true, 'dry_run' => true, 'message' => 'Simulation : email non envoyé'];
    }
    return sendBrevoEmail($toEmail, $toName, $subject, $htmlContent);
}

function sendSmsNotification($phone, $message) {
    if (isDryRun()) {
        return ['success' => true, 'dry_run' => true, 'message' => 'Simulation : SMS non envoyé'];
    }

    $provider = getenv('SMS_PROVIDER') ?: '';

    if (!$provider) {
        return ['success' => false, 'message' => 'SMS_PROVIDER non configuré'];
    }

    $apiUrl = getenv('SMS_API_URL') ?: '';
    $apiKey = getenv('SMS_API_KEY') ?: '';
    $senderId = getenv('SMS_SENDER_ID') ?: 'ALIKA';

    if (!$apiUrl || !$apiKey) {
        return ['success' => false, 'message' => 'Configuration SMS incomplète (API_URL ou API_KEY manquant)'];
    }

    $normalizedPhone = normalizePhoneRdc($phone);
    if (!$normalizedPhone) {
        return ['success' => false, 'message' => 'Numéro de téléphone invalide pour la RDC'];
    }

    $payload = json_encode([
        'to' => $normalizedPhone,
        'text' => $message,
        'from' => $senderId,
    ]);

    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log('SMS curl error: ' . $error);
        return ['success' => false, 'message' => $error];
    }

    if ($statusCode >= 200 && $statusCode < 300) {
        $body = json_decode($response, true);
        $msgId = $body['message_id'] ?? $body['id'] ?? null;
        return ['success' => true, 'provider_message_id' => $msgId];
    }

    error_log('SMS send failed | status: ' . $statusCode . ' | body: ' . $response);
    return ['success' => false, 'message' => 'HTTP ' . $statusCode];
}

function sendWhatsAppNotification($phone, $message) {
    if (isDryRun()) {
        return ['success' => true, 'dry_run' => true, 'message' => 'Simulation : WhatsApp non envoyé'];
    }

    $provider = getenv('WHATSAPP_PROVIDER') ?: '';

    if (!$provider) {
        return ['success' => false, 'message' => 'WHATSAPP_PROVIDER non configuré'];
    }

    $apiUrl = getenv('WHATSAPP_API_URL') ?: '';
    $token = getenv('WHATSAPP_TOKEN') ?: '';
    $phoneNumberId = getenv('WHATSAPP_PHONE_NUMBER_ID') ?: '';

    if (!$apiUrl || !$token || !$phoneNumberId) {
        return ['success' => false, 'message' => 'Configuration WhatsApp incomplète (API_URL, TOKEN ou PHONE_NUMBER_ID manquant)'];
    }

    $normalizedPhone = normalizePhoneRdc($phone);
    if (!$normalizedPhone) {
        return ['success' => false, 'message' => 'Numéro de téléphone invalide pour la RDC'];
    }

    $payload = json_encode([
        'messaging_product' => 'whatsapp',
        'to' => $normalizedPhone,
        'type' => 'text',
        'text' => ['body' => $message],
    ]);

    $ch = curl_init($apiUrl . '/' . $phoneNumberId . '/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $token,
        ],
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);

    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log('WhatsApp curl error: ' . $error);
        return ['success' => false, 'message' => $error];
    }

    if ($statusCode >= 200 && $statusCode < 300) {
        $body = json_decode($response, true);
        $msgId = $body['messages'][0]['id'] ?? null;
        return ['success' => true, 'provider_message_id' => $msgId];
    }

    error_log('WhatsApp send failed | status: ' . $statusCode . ' | body: ' . $response);
    return ['success' => false, 'message' => 'HTTP ' . $statusCode];
}

function normalizePhoneRdc($phone) {
    $phone = preg_replace('/[^0-9+]/', '', $phone);

    if (preg_match('/^\+243\d{9}$/', $phone)) {
        return $phone;
    }

    if (preg_match('/^0(8[0-9]\d{7})$/', $phone, $m)) {
        return '+243' . $m[1];
    }

    if (preg_match('/^243\d{9}$/', $phone, $m)) {
        return '+' . $phone;
    }

    return null;
}

function renderNotificationTemplate($body, $variables) {
    $result = $body;
    foreach ($variables as $key => $value) {
        $result = str_replace('{{' . $key . '}}', htmlspecialchars((string)$value), $result);
    }
    return $result;
}

function buildEmailHtmlFromText($textContent, $title = 'Alika Mobility') {
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#FFB800;color:#1a1a2e;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">' . htmlspecialchars($title) . '</div>
      <div style="color:#555;line-height:1.6;margin:16px 0">' . nl2br(htmlspecialchars($textContent)) . '</div>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility — Application de gestion de transport</p>
    </div>';
}
