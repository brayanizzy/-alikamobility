<?php

function getDefaultTemplates() {
    return [
        [
            'code' => 'debt_reminder',
            'name' => 'Rappel de dette',
            'channel' => 'email',
            'subject' => 'Rappel de dette — {{organization_name}}',
            'body' => "Bonjour {{member_name}},\n\nVous avez une dette de {{amount}} {{currency}} auprès de {{organization_name}}.\nMerci de régulariser votre situation avant le {{due_date}}.\n\nÉquipe {{organization_name}}",
            'variables_json' => json_encode(['member_name', 'amount', 'currency', 'due_date', 'organization_name']),
        ],
        [
            'code' => 'debt_reminder_sms',
            'name' => 'Rappel de dette SMS',
            'channel' => 'sms',
            'subject' => '',
            'body' => "Dette {{amount}} {{currency}} chez {{organization_name}}. Régularisez avant {{due_date}}. Merci.",
            'variables_json' => json_encode(['amount', 'currency', 'due_date', 'organization_name']),
        ],
        [
            'code' => 'debt_reminder_whatsapp',
            'name' => 'Rappel de dette WhatsApp',
            'channel' => 'whatsapp',
            'subject' => '',
            'body' => "Bonjour {{member_name}}.\n\nDette : {{amount}} {{currency}}\nÉchéance : {{due_date}}\nOrganisation : {{organization_name}}\n\nMerci de régulariser.",
            'variables_json' => json_encode(['member_name', 'amount', 'currency', 'due_date', 'organization_name']),
        ],
        [
            'code' => 'payment_receipt',
            'name' => 'Reçu de paiement',
            'channel' => 'email',
            'subject' => 'Reçu de paiement — {{organization_name}}',
            'body' => "Bonjour {{member_name}},\n\nNous confirmons votre paiement de {{amount}} {{currency}} effectué le {{payment_date}}.\nRéférence reçu : {{receipt_number}}\n\nMerci de votre confiance.\nÉquipe {{organization_name}}",
            'variables_json' => json_encode(['member_name', 'amount', 'currency', 'payment_date', 'receipt_number', 'organization_name']),
        ],
        [
            'code' => 'payment_receipt_sms',
            'name' => 'Reçu de paiement SMS',
            'channel' => 'sms',
            'subject' => '',
            'body' => "Paiement {{amount}} {{currency}} reçu le {{payment_date}}. Réf: {{receipt_number}}. Merci.",
            'variables_json' => json_encode(['amount', 'currency', 'payment_date', 'receipt_number']),
        ],
        [
            'code' => 'penalty_notice',
            'name' => 'Avis de pénalité',
            'channel' => 'email',
            'subject' => 'Avis de pénalité — {{organization_name}}',
            'body' => "Bonjour {{member_name}},\n\nUne pénalité de {{amount}} {{currency}} vous a été appliquée.\nMotif : {{reason}}\n\nContactez votre administration pour plus d'informations.\nÉquipe {{organization_name}}",
            'variables_json' => json_encode(['member_name', 'amount', 'currency', 'reason', 'organization_name']),
        ],
        [
            'code' => 'penalty_notice_sms',
            'name' => 'Avis de pénalité SMS',
            'channel' => 'sms',
            'subject' => '',
            'body' => "Pénalité {{amount}} {{currency}}: {{reason}}. Contactez votre administration.",
            'variables_json' => json_encode(['amount', 'currency', 'reason']),
        ],
        [
            'code' => 'document_expiry',
            'name' => 'Document expiré ou bientôt expiré',
            'channel' => 'email',
            'subject' => 'Alerte expiration document — {{organization_name}}',
            'body' => "Bonjour {{driver_name}},\n\nVotre document ({{document_type}}) expire le {{expiry_date}}.\nMerci de le renouveler avant la date d'échéance.\n\nÉquipe {{organization_name}}",
            'variables_json' => json_encode(['driver_name', 'document_type', 'expiry_date', 'organization_name']),
        ],
        [
            'code' => 'member_card_ready',
            'name' => 'Carte membre prête',
            'channel' => 'email',
            'subject' => 'Votre carte membre est prête — {{organization_name}}',
            'body' => "Bonjour {{member_name}},\n\nVotre carte membre numéro {{card_number}} est prête.\nVous pouvez la retirer auprès de votre administration.\n\nÉquipe {{organization_name}}",
            'variables_json' => json_encode(['member_name', 'card_number', 'organization_name']),
        ],
        [
            'code' => 'admin_custom_message',
            'name' => 'Message personnalisé',
            'channel' => 'email',
            'subject' => 'Message de {{organization_name}}',
            'body' => "Bonjour {{recipient_name}},\n\n{{custom_message}}\n\nÉquipe {{organization_name}}",
            'variables_json' => json_encode(['recipient_name', 'custom_message', 'organization_name']),
        ],
        [
            'code' => 'admin_custom_message_sms',
            'name' => 'Message personnalisé SMS',
            'channel' => 'sms',
            'subject' => '',
            'body' => "{{custom_message}} — {{organization_name}}",
            'variables_json' => json_encode(['custom_message', 'organization_name']),
        ],
    ];
}

function seedDefaultTemplates($db, $orgId = null) {
    $templates = getDefaultTemplates();
    $count = 0;

    foreach ($templates as $tpl) {
        $checkSql = "SELECT id FROM notification_templates WHERE code = ?";
        if ($orgId) {
            $checkSql .= " AND (organization_id = ? OR organization_id IS NULL)";
        } else {
            $checkSql .= " AND organization_id IS NULL";
        }
        $stmt = $db->prepare($checkSql);
        $params = [$tpl['code']];
        if ($orgId) $params[] = $orgId;
        $stmt->execute($params);

        if (!$stmt->fetch()) {
            $id = generateId();
            $stmt = $db->prepare(
                "INSERT INTO notification_templates (`id`, `organization_id`, `code`, `name`, `channel`, `subject`, `body`, `variables_json`, `is_active`, `created`, `updated`)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())"
            );
            $stmt->execute([$id, $orgId, $tpl['code'], $tpl['name'], $tpl['channel'], $tpl['subject'], $tpl['body'], $tpl['variables_json']]);
            $count++;
        }
    }

    return $count;
}

function handleNotificationTemplatesGet() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $db = getDB();
    $channel = $_GET['channel'] ?? null;
    $code = $_GET['code'] ?? null;

    $sql = "SELECT * FROM notification_templates WHERE (organization_id = ? OR organization_id IS NULL)";
    $params = [$user['organization_id']];

    if ($channel) {
        $sql .= " AND channel = ?";
        $params[] = $channel;
    }
    if ($code) {
        $sql .= " AND code = ?";
        $params[] = $code;
    }

    $sql .= " ORDER BY created ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    jsonResponse(['items' => $items, 'totalItems' => count($items)]);
}

function handleNotificationTemplatesCreate() {
    $user = getAuthUser();
    if (!$user || !in_array($user['role'], ['super-admin', 'admin'])) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $body = getRequestBody();
    $required = ['code', 'name', 'channel', 'body'];
    foreach ($required as $field) {
        if (empty($body[$field])) {
            jsonResponse(['error' => "Le champ '$field' est requis."], 400);
        }
    }

    $allowedChannels = ['email', 'sms', 'whatsapp', 'in_app'];
    if (!in_array($body['channel'], $allowedChannels)) {
        jsonResponse(['error' => 'Canal invalide.'], 400);
    }

    $db = getDB();
    $id = generateId();
    $stmt = $db->prepare(
        "INSERT INTO notification_templates (`id`, `organization_id`, `code`, `name`, `channel`, `subject`, `body`, `variables_json`, `is_active`, `created`, `updated`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())"
    );
    $stmt->execute([
        $id,
        $user['organization_id'],
        $body['code'],
        $body['name'],
        $body['channel'],
        $body['subject'] ?? null,
        $body['body'],
        $body['variables_json'] ?? null,
    ]);

    jsonResponse(['id' => $id, 'success' => true]);
}

function handleNotificationTemplatesUpdate() {
    $user = getAuthUser();
    if (!$user || !in_array($user['role'], ['super-admin', 'admin'])) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $id = $_GET['id'] ?? null;
    if (!$id) { jsonResponse(['error' => 'Template ID is required'], 400); }

    $body = getRequestBody();
    $db = getDB();

    $stmt = $db->prepare("SELECT * FROM notification_templates WHERE id = ? AND (organization_id = ? OR organization_id IS NULL)");
    $stmt->execute([$id, $user['organization_id']]);
    $existing = $stmt->fetch();

    if (!$existing) { jsonResponse(['error' => 'Template not found'], 404); }

    $updates = [];
    $params = [];
    foreach (['name', 'code', 'channel', 'subject', 'body', 'variables_json', 'is_active'] as $field) {
        if (isset($body[$field])) {
            $updates[] = "`$field` = ?";
            $params[] = $body[$field];
        }
    }

    if (empty($updates)) {
        jsonResponse(['error' => 'No fields to update'], 400);
    }

    $params[] = $id;
    $stmt = $db->prepare("UPDATE notification_templates SET " . implode(', ', $updates) . ", `updated` = NOW() WHERE id = ?");
    $stmt->execute($params);

    jsonResponse(['success' => true]);
}

function handleNotificationTemplatesDelete() {
    $user = getAuthUser();
    if (!$user || !in_array($user['role'], ['super-admin', 'admin'])) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $id = $_GET['id'] ?? null;
    if (!$id) { jsonResponse(['error' => 'Template ID is required'], 400); }

    $db = getDB();
    $stmt = $db->prepare("DELETE FROM notification_templates WHERE id = ? AND (organization_id = ? OR organization_id IS NULL)");
    $stmt->execute([$id, $user['organization_id']]);

    jsonResponse(['success' => true]);
}

function handleNotificationTemplatesSeed() {
    $user = getAuthUser();
    if (!$user || $user['role'] !== 'super-admin') {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $db = getDB();
    $orgId = $_GET['organization_id'] ?? null;
    $count = seedDefaultTemplates($db, $orgId);

    jsonResponse(['success' => true, 'seeded' => $count]);
}
