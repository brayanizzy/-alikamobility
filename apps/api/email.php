<?php

function sendBrevoEmail($toEmail, $toName, $subject, $htmlContent) {
    $apiKey = getenv('BREVO_API_KEY') ?: '';
    $fromEmail = getenv('BREVO_FROM_EMAIL') ?: 'noreply@alika-mobility.com';
    $fromName = getenv('BREVO_FROM_NAME') ?: 'Alika Mobility';

    if (!$apiKey) {
        error_log('BREVO_API_KEY not set, skipping email to ' . $toEmail);
        return ['success' => false, 'message' => 'BREVO_API_KEY manquante'];
    }

    $payload = json_encode([
        'sender' => ['name' => $fromName, 'email' => $fromEmail],
        'to' => [['email' => $toEmail, 'name' => $toName]],
        'subject' => $subject,
        'htmlContent' => $htmlContent,
    ]);

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'api-key: ' . $apiKey,
            'Content-Type: application/json',
            'Accept: application/json',
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
        error_log('Brevo curl error: ' . $error);
        return ['success' => false, 'message' => $error];
    }

    if ($statusCode === 201 || $statusCode === 200) {
        $body = json_decode($response, true);
        error_log('Email sent to ' . $toEmail . ' | messageId: ' . ($body['messageId'] ?? 'OK'));
        return ['success' => true, 'messageId' => $body['messageId'] ?? null];
    }

    error_log('Brevo send failed | status: ' . $statusCode . ' | body: ' . $response);
    return ['success' => false, 'message' => 'HTTP ' . $statusCode];
}

function notifyNewMemberEmail($member, $org) {
    if (!getenv('BREVO_API_KEY')) return;

    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, name FROM users WHERE organization_id = ? AND role = 'admin'");
    $stmt->execute([$org['id']]);
    $admins = $stmt->fetchAll();

    $orgName = $org['name'] ?? 'Votre association';
    $memberName = $member['name'] ?? $member['full_name'] ?? 'Nouveau membre';

    foreach ($admins as $admin) {
        $html = buildMemberEmailHtml($orgName, $memberName, $admin['name'] ?? $admin['email']);
        sendBrevoEmail($admin['email'], $admin['name'] ?? 'Admin', "$memberName a rejoint $orgName", $html);
    }
}

function notifyLatePaymentEmail($payment, $member) {
    if (!getenv('BREVO_API_KEY')) return;

    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, name FROM users WHERE organization_id = ? AND role = 'admin'");
    $stmt->execute([$payment['organization_id']]);
    $admins = $stmt->fetchAll();

    $memberName = $member['name'] ?? $member['full_name'] ?? 'Membre';
    $amount = $payment['amount'] ?? '—';
    $paymentDate = $payment['payment_date'] ?? '—';

    foreach ($admins as $admin) {
        $html = buildLatePaymentHtml($memberName, $amount, $paymentDate);
        sendBrevoEmail($admin['email'], $admin['name'] ?? 'Admin', "Rattrapage: $memberName — $amount FC", $html);
    }
}

function buildMemberEmailHtml($orgName, $memberName, $adminName) {
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#FFB800;color:#1a1a2e;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Alika Mobility</div>
      <h1 style="color:#1a1a2e;font-size:22px;margin:16px 0 8px">Nouveau membre inscrit</h1>
      <p style="color:#555;line-height:1.6">Bonjour <strong>' . htmlspecialchars($adminName) . '</strong>,</p>
      <p style="color:#555;line-height:1.6"><strong>' . htmlspecialchars($memberName) . '</strong> a rejoint <strong>' . htmlspecialchars($orgName) . '</strong>.</p>
      <a href="https://alikamobility.alika-konnect.com/members" style="display:inline-block;background:#1A237E;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:8px">Voir les membres</a>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility — Application de gestion de transport</p>
    </div>';
}

function buildWelcomeEmailHtml($managerName, $orgName) {
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="background:#FFB800;color:#1a1a2e;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Alika Mobility</div>
      </div>
      <h1 style="color:#1a1a2e;font-size:24px;margin:0 0 8px">Bienvenue, ' . htmlspecialchars($managerName) . ' !</h1>
      <p style="color:#555;line-height:1.6">Votre association <strong>' . htmlspecialchars($orgName) . '</strong> a été créée avec succès.</p>
      <p style="color:#555;line-height:1.6">Notre équipe examine votre dossier. Vous recevrez une confirmation dès que votre compte sera approuvé.</p>
      <p style="color:#555;line-height:1.6">En attendant, vous pouvez déjà préparer votre espace : ajouter vos parkings, configurer vos tarifs, et inviter vos conducteurs.</p>
      <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#1a1a2e">🚀 Pour bien démarrer :</p>
        <ul style="color:#555;line-height:1.8;padding-left:20px;margin:0">
          <li>Ajoutez vos parkings depuis le tableau de bord</li>
          <li>Inscrivez vos premiers membres conducteurs</li>
          <li>Générez les QR codes de vos membres</li>
          <li>Commencez les encaissements</li>
        </ul>
      </div>
      <a href="https://alikamobility.alika-konnect.com/login" style="display:block;text-align:center;background:#1A237E;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin:24px 0">Se connecter à mon espace</a>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="font-size:12px;color:#999;text-align:center">Alika Mobility — Application de gestion de transport<br>Kinshasa, RDC</p>
    </div>';
}

function buildNewOrgEmailHtml($managerName, $orgName, $city, $phone) {
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#FFB800;color:#1a1a2e;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Nouvelle inscription</div>
      <h1 style="color:#1a1a2e;font-size:22px;margin:16px 0 8px">Nouvelle association en attente</h1>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Association</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($orgName) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Responsable</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($managerName) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Ville</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($city) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Téléphone</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($phone) . '</td></tr>
      </table>
      <a href="https://alikamobility.alika-konnect.com/super-admin" style="display:inline-block;background:#1A237E;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:8px">Voir dans le panneau admin</a>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility</p>
    </div>';
}

function buildLatePaymentHtml($memberName, $amount, $paymentDate) {
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#EF4444;color:#fff;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Paiement en retard</div>
      <h1 style="color:#1a1a2e;font-size:22px;margin:16px 0 8px">Rattrapage de paiement</h1>
      <p style="color:#555;line-height:1.6"><strong>' . htmlspecialchars($memberName) . '</strong> a payé <strong>' . htmlspecialchars($amount) . ' FC</strong> (date: ' . htmlspecialchars($paymentDate) . ').</p>
      <a href="https://alikamobility.alika-konnect.com/payments" style="display:inline-block;background:#1A237E;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:8px">Voir les paiements</a>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility</p>
    </div>';
}
