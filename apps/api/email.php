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

// =============================================================
// REV-02 — Auth email architecture (configurable provider)
// Sends directly to an email address (no organization_id filter),
// so super-admin accounts with organization_id = NULL can receive
// auth emails (invitation, reset, password-changed).
// Active provider is selected via EMAIL_PROVIDER env (default: brevo).
// Future providers (resend, mailjet, smtp) can be added here.
// =============================================================

function getActiveEmailProvider() {
    $p = strtolower(getenv('EMAIL_PROVIDER') ?: '');
    if (!$p) {
        // Auto-detect: Brevo if key present
        if (getenv('BREVO_API_KEY')) return 'brevo';
        return 'none';
    }
    return $p;
}

function getEmailFrom() {
    $fromEmail = getenv('EMAIL_FROM_EMAIL') ?: getenv('BREVO_FROM_EMAIL') ?: 'noreply@alika-mobility.com';
    $fromName = getenv('EMAIL_FROM_NAME') ?: getenv('BREVO_FROM_NAME') ?: 'ALIKA MOBILITY';
    return ['email' => $fromEmail, 'name' => $fromName];
}

/**
 * Provider-agnostic email sender. Routes to the active provider.
 * Does NOT depend on organization_id — works for super-admin (org NULL).
 * Never logs the raw token; only the recipient + subject + messageId.
 */
function sendEmail($toEmail, $toName, $subject, $htmlContent) {
    $provider = getActiveEmailProvider();

    if ($provider === 'none') {
        error_log('No email provider configured (EMAIL_PROVIDER empty, BREVO_API_KEY missing). Skipping email to ' . $toEmail);
        return ['success' => false, 'message' => 'Aucun provider email configuré', 'provider' => 'none'];
    }

    if ($provider === 'brevo') {
        return sendBrevoEmail($toEmail, $toName, $subject, $htmlContent);
    }

    // Future providers can be wired here:
    // if ($provider === 'resend') return sendResendEmail(...);
    // if ($provider === 'mailjet') return sendMailjetEmail(...);
    // if ($provider === 'smtp') return sendSmtpEmail(...);

    error_log('Unknown email provider: ' . $provider . ' — skipping email to ' . $toEmail);
    return ['success' => false, 'message' => 'Provider inconnu: ' . $provider, 'provider' => $provider];
}

function buildInvitationHtml($name, $orgName, $roleLabel, $acceptUrl, $expiresAt) {
    $roleLine = $roleLabel ? '<p style="color:#555;line-height:1.6">Rôle : <strong>' . htmlspecialchars($roleLabel) . '</strong></p>' : '';
    $orgLine = $orgName ? '<p style="color:#555;line-height:1.6">Organisation : <strong>' . htmlspecialchars($orgName) . '</strong></p>' : '';
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#FFB800;color:#1a1a2e;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Alika Mobility</div>
      <h1 style="color:#1a1a2e;font-size:24px;margin:16px 0 8px">Invitation à rejoindre ALIKA MOBILITY</h1>
      <p style="color:#555;line-height:1.6">Bonjour <strong>' . htmlspecialchars($name ?: 'utilisateur') . '</strong>,</p>
      <p style="color:#555;line-height:1.6">Vous avez été invité à rejoindre la plateforme ALIKA MOBILITY. Veuillez définir votre mot de passe pour activer votre compte.</p>
      ' . $orgLine . $roleLine . '
      <a href="' . htmlspecialchars($acceptUrl) . '" style="display:inline-block;background:#1A237E;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin:20px 0">Définir mon mot de passe</a>
      <p style="color:#999;font-size:13px;line-height:1.5">Ce lien expire le ' . htmlspecialchars($expiresAt) . '.</p>
      <p style="color:#999;font-size:12px;line-height:1.5">Si le bouton ne fonctionne pas, copiez ce lien :<br><a href="' . htmlspecialchars($acceptUrl) . '">' . htmlspecialchars($acceptUrl) . '</a></p>
      <p style="color:#999;font-size:12px;line-height:1.5">Si vous n\'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility — Application de gestion de transport<br>Kinshasa, RDC</p>
    </div>';
}

function buildForgotPasswordHtml($name, $resetUrl, $expiresAt) {
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#FFB800;color:#1a1a2e;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Alika Mobility</div>
      <h1 style="color:#1a1a2e;font-size:24px;margin:16px 0 8px">Réinitialisation de votre mot de passe</h1>
      <p style="color:#555;line-height:1.6">Bonjour <strong>' . htmlspecialchars($name ?: 'utilisateur') . '</strong>,</p>
      <p style="color:#555;line-height:1.6">Vous avez demandé la réinitialisation de votre mot de passe ALIKA MOBILITY. Cliquez sur le bouton ci-dessous pour en définir un nouveau.</p>
      <a href="' . htmlspecialchars($resetUrl) . '" style="display:inline-block;background:#1A237E;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin:20px 0">Réinitialiser mon mot de passe</a>
      <p style="color:#999;font-size:13px;line-height:1.5">Ce lien expire le ' . htmlspecialchars($expiresAt) . '.</p>
      <p style="color:#999;font-size:12px;line-height:1.5">Si le bouton ne fonctionne pas, copiez ce lien :<br><a href="' . htmlspecialchars($resetUrl) . '">' . htmlspecialchars($resetUrl) . '</a></p>
      <p style="color:#999;font-size:12px;line-height:1.5">Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email : votre mot de passe restera inchangé.</p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility — Application de gestion de transport<br>Kinshasa, RDC</p>
    </div>';
}

function buildPasswordChangedHtml($name) {
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#16A34A;color:#fff;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Sécurité</div>
      <h1 style="color:#1a1a2e;font-size:22px;margin:16px 0 8px">Votre mot de passe a été modifié</h1>
      <p style="color:#555;line-height:1.6">Bonjour <strong>' . htmlspecialchars($name ?: 'utilisateur') . '</strong>,</p>
      <p style="color:#555;line-height:1.6">Votre mot de passe ALIKA MOBILITY a été modifié avec succès. Si vous êtes à l\'origine de ce changement, aucune action n\'est requise.</p>
      <p style="color:#555;line-height:1.6">Si vous n\'avez pas effectué cette modification, contactez immédiatement votre administrateur ou réinitialisez votre mot de passe.</p>
      <a href="https://alikamobility.alika-konnect.com/login" style="display:inline-block;background:#1A237E;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:8px">Se connecter</a>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility — Application de gestion de transport<br>Kinshasa, RDC</p>
    </div>';
}

// =============================================================
// REV-03.1 — Association registration emails
// =============================================================

function buildRegistrationReceivedHtml($assocName, $planCode) {
    $planLabels = ['starter' => 'Starter', 'pro' => 'Pro', 'premium' => 'Premium', 'enterprise' => 'Enterprise'];
    $planLabel = $planLabels[$planCode] ?? ucfirst($planCode);
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#FFB800;color:#1a1a2e;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Alika Mobility</div>
      <h1 style="color:#1a1a2e;font-size:24px;margin:16px 0 8px">Demande d\'inscription reçue</h1>
      <p style="color:#555;line-height:1.6">Bonjour,</p>
      <p style="color:#555;line-height:1.6">Nous avons bien reçu votre demande d\'inscription pour l\'association <strong>' . htmlspecialchars($assocName) . '</strong>.</p>
      <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:bold;color:#1a1a2e">Récapitulatif :</p>
        <p style="margin:0;color:#555">Association : <strong>' . htmlspecialchars($assocName) . '</strong></p>
        <p style="margin:4px 0 0;color:#555">Forfait choisi : <strong>' . htmlspecialchars($planLabel) . '</strong></p>
        <p style="margin:4px 0 0;color:#555">Statut : <strong>En attente de validation</strong></p>
      </div>
      <p style="color:#555;line-height:1.6">Notre équipe va examiner votre demande dans les meilleurs délais. Vous recevrez une confirmation par email dès que votre compte sera activé.</p>
      <p style="color:#555;line-height:1.6">Vous ne pouvez pas vous connecter tant que votre compte n\'est pas validé.</p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility — Application de gestion de transport<br>Kinshasa, RDC</p>
    </div>';
}

function buildNewRegistrationHtml($assocName, $managerName, $managerPhone, $managerEmail, $city, $planCode) {
    $planLabels = ['starter' => 'Starter', 'pro' => 'Pro', 'premium' => 'Premium', 'enterprise' => 'Enterprise'];
    $planLabel = $planLabels[$planCode] ?? ucfirst($planCode);
    return '
    <div style="font-family:sans-serif;max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:32px">
      <div style="background:#1A237E;color:#fff;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block">Nouvelle demande</div>
      <h1 style="color:#1a1a2e;font-size:22px;margin:16px 0 8px">Demande d\'association à valider</h1>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Association</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($assocName) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Responsable</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($managerName) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Téléphone</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($managerPhone) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Email</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($managerEmail) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Ville</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($city) . '</td></tr>
        <tr><td style="padding:8px 12px;color:#555;font-weight:bold">Forfait</td><td style="padding:8px 12px;color:#1a1a2e">' . htmlspecialchars($planLabel) . '</td></tr>
      </table>
      <a href="https://alikamobility.alika-konnect.com/super-admin" style="display:inline-block;background:#1A237E;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:8px">Voir dans le tableau de bord</a>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px" />
      <p style="font-size:12px;color:#999">Alika Mobility</p>
    </div>';
}
