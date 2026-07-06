<?php

require_once __DIR__ . '/notification-providers.php';
require_once __DIR__ . '/notification-templates.php';

function createNotification($data) {
    $db = getDB();
    $id = generateId();
    $stmt = $db->prepare(
        "INSERT INTO notifications (`id`, `user_id`, `organization_id`, `type`, `channel`, `title`, `message`, `related_collection`, `related_id`, `notification_log_id`, `is_read`, `action_url`, `created`, `updated`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())"
    );
    $stmt->execute([
        $id,
        $data['user_id'],
        $data['organization_id'] ?? null,
        $data['type'],
        $data['channel'] ?? 'in_app',
        $data['title'],
        $data['message'],
        $data['related_collection'] ?? null,
        $data['related_id'] ?? null,
        $data['notification_log_id'] ?? null,
        $data['action_url'] ?? null,
    ]);
    return $id;
}

function notifyAdmins($orgId, $notification) {
    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM users WHERE organization_id = ? AND role = 'admin'");
    $stmt->execute([$orgId]);
    $admins = $stmt->fetchAll();

    foreach ($admins as $admin) {
        $notification['user_id'] = $admin['id'];
        $notification['organization_id'] = $orgId;
        createNotification($notification);
    }
}

function notifySuperAdmins($notification) {
    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM users WHERE role = 'super-admin'");
    $stmt->execute();
    $superAdmins = $stmt->fetchAll();

    foreach ($superAdmins as $sa) {
        $notification['user_id'] = $sa['id'];
        createNotification($notification);
    }
}

function triggerMemberCreated($member, $org) {
    $memberName = $member['name'] ?? $member['full_name'] ?? 'Nouveau membre';
    $orgId = $member['organization_id'];

    notifyAdmins($orgId, [
        'type' => 'new_member',
        'channel' => 'in_app',
        'title' => 'Nouveau membre inscrit',
        'message' => "$memberName a été ajouté à votre organisation.",
        'related_collection' => 'members',
        'related_id' => $member['id'],
        'action_url' => '/members',
    ]);

    notifyNewMemberEmail($member, $org);
}

function triggerPaymentCreated($payment, $member) {
    $orgId = $payment['organization_id'];
    $paymentDate = $payment['payment_date'] ?? $payment['created'];
    $yesterday = date('Y-m-d', strtotime('-1 day'));

    if ($paymentDate && $paymentDate < $yesterday) {
        $memberName = $member ? ($member['name'] ?? $member['full_name'] ?? 'Membre') : 'Membre';

        notifyAdmins($orgId, [
            'type' => 'late_payment',
            'channel' => 'in_app',
            'title' => 'Paiement en retard régularisé',
            'message' => "{$memberName} a payé {$payment['amount']} FC en rattrapage (date: {$paymentDate}).",
            'related_collection' => 'payments',
            'related_id' => $payment['id'],
            'action_url' => '/payments',
        ]);

        if ($member) notifyLatePaymentEmail($payment, $member);
    }
}

function handleDailyCollectionCheck() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $expectedToken = getenv('CRON_SECRET');
    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m) || $m[1] !== $expectedToken) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $orgStmt = $db->query("SELECT id FROM organizations WHERE status = 'active'");
    $orgs = $orgStmt->fetchAll();
    $today = date('Y-m-d');
    $notified = 0;

    foreach ($orgs as $org) {
        $orgId = $org['id'];
        $members = $db->prepare("SELECT id, name, full_name FROM members WHERE organization_id = ? AND status = 'active'");
        $members->execute([$orgId]);
        $allMembers = $members->fetchAll();

        if (empty($allMembers)) continue;

        $payments = $db->prepare("SELECT member_id FROM payments WHERE organization_id = ? AND payment_date = ?");
        $payments->execute([$orgId, $today]);
        $paidIds = array_column($payments->fetchAll(), 'member_id');

        $lateMembers = array_filter($allMembers, function($m) use ($paidIds) {
            return !in_array($m['id'], $paidIds);
        });

        $lateCount = count($lateMembers);
        if ($lateCount === 0) continue;

        if ($lateCount > 5) {
            notifyAdmins($orgId, [
                'type' => 'collection_alert',
                'channel' => 'in_app',
                'title' => 'Collecte préoccupante',
                'message' => "{$lateCount} membres n'ont pas encore payé aujourd'hui ({$today}).",
                'is_read' => false,
                'action_url' => '/late-payments',
            ]);
            $notified++;
        }

        if ($lateCount > 0 && $lateCount <= 5) {
            foreach ($lateMembers as $member) {
                $memberName = $member['name'] ?? $member['full_name'] ?? 'Membre';
                notifyAdmins($orgId, [
                    'type' => 'late_payment',
                    'channel' => 'in_app',
                    'title' => 'Paiement en retard',
                    'message' => "{$memberName} n'a pas payé aujourd'hui ({$today}).",
                    'related_collection' => 'members',
                    'related_id' => $member['id'],
                    'is_read' => false,
                    'action_url' => '/late-payments',
                ]);
                $notified++;
            }
        }
    }

    jsonResponse(['notified' => $notified]);
}

function handleCronDailyReminders() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $expectedToken = getenv('CRON_SECRET');
    if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $m) || $m[1] !== $expectedToken) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $dryRun = isDryRun();
    $db = getDB();
    $today = date('Y-m-d');
    $in30Days = date('Y-m-d', strtotime('+30 days'));
    $in7Days = date('Y-m-d', strtotime('+7 days'));
    $results = [];

    $orgs = $db->query("SELECT id, name FROM organizations WHERE status = 'active'")->fetchAll();

    foreach ($orgs as $org) {
        $orgId = $org['id'];
        $orgName = $org['name'];

        // 1. Debt reminders (debts pending > 30 days)
        $stmt = $db->prepare(
            "SELECT d.id, d.member_id, d.amount_original, d.amount_remaining, d.currency, m.name as member_name, m.phone, '' as email
             FROM debts d JOIN members m ON d.member_id = m.id
             WHERE d.organization_id = ? AND d.status IN ('pending', 'partially_paid') AND d.created < DATE_SUB(NOW(), INTERVAL 30 DAY)"
        );
        $stmt->execute([$orgId]);
        $overdueDebts = $stmt->fetchAll();

        foreach ($overdueDebts as $debt) {
            $idempotencyKey = 'debt_reminder:' . $debt['id'] . ':' . $today;
            if (hasBeenSentToday($db, $idempotencyKey)) continue;

            $result = sendMultiChannelNotification($db, $orgId, null, [
                'template_code' => 'debt_reminder',
                'channel' => 'email',
                'recipient_type' => 'member',
                'recipient_id' => $debt['member_id'],
                'recipient_name' => $debt['member_name'],
                'recipient_contact' => $debt['email'],
                'variables' => [
                    'member_name' => $debt['member_name'],
                    'amount' => $debt['amount_remaining'],
                    'currency' => $debt['currency'] ?? 'CDF',
                    'due_date' => $today,
                    'organization_name' => $orgName,
                ],
                'idempotency_key' => $idempotencyKey,
                'is_dry_run' => $dryRun,
            ]);
            $results[] = $result;
        }

        // 2. Documents expiring in 7 days (related_type = 'driver')
          $stmt = $db->prepare(
              "SELECT d.id, d.related_id as driver_id, d.document_type as type, d.expiry_date, m.name as driver_name, m.phone, '' as email
               FROM documents d LEFT JOIN drivers dr ON d.related_type = 'driver' AND d.related_id = dr.id
               LEFT JOIN members m ON dr.member_id = m.id
               WHERE d.organization_id = ? AND d.related_type = 'driver' AND d.expiry_date IS NOT NULL AND d.expiry_date = ?"
          );
          $stmt->execute([$orgId, $in7Days]);
          $expiringDocs = $stmt->fetchAll();
  
          foreach ($expiringDocs as $doc) {
              $idempotencyKey = 'doc_expiry_7d:' . $doc['id'] . ':' . $today;
              if (hasBeenSentToday($db, $idempotencyKey)) continue;
  
              $result = sendMultiChannelNotification($db, $orgId, null, [
                  'template_code' => 'document_expiry',
                  'channel' => 'email',
                  'recipient_type' => 'driver',
                  'recipient_id' => $doc['driver_id'],
                  'recipient_name' => $doc['driver_name'] ?: 'Chauffeur',
                  'recipient_contact' => $doc['email'],
                  'variables' => [
                      'driver_name' => $doc['driver_name'] ?: 'Chauffeur',
                      'document_type' => $doc['type'],
                      'expiry_date' => $doc['expiry_date'],
                      'organization_name' => $orgName,
                  ],
                  'idempotency_key' => $idempotencyKey,
                  'is_dry_run' => $dryRun,
              ]);
              $results[] = $result;
          }
  
          // 3. Documents already expired (related_type = 'driver')
          $stmt = $db->prepare(
              "SELECT d.id, d.related_id as driver_id, d.document_type as type, d.expiry_date, m.name as driver_name, m.phone, '' as email
               FROM documents d LEFT JOIN drivers dr ON d.related_type = 'driver' AND d.related_id = dr.id
               LEFT JOIN members m ON dr.member_id = m.id
               WHERE d.organization_id = ? AND d.related_type = 'driver' AND d.expiry_date IS NOT NULL AND d.expiry_date < ? AND d.status != 'expired'"
          );
          $stmt->execute([$orgId, $today]);
          $expiredDocs = $stmt->fetchAll();
  
          foreach ($expiredDocs as $doc) {
              $idempotencyKey = 'doc_expired:' . $doc['id'] . ':' . $today;
              if (hasBeenSentToday($db, $idempotencyKey)) continue;
  
              $result = sendMultiChannelNotification($db, $orgId, null, [
                  'template_code' => 'document_expiry',
                  'channel' => 'email',
                  'recipient_type' => 'driver',
                  'recipient_id' => $doc['driver_id'],
                  'recipient_name' => $doc['driver_name'] ?: 'Chauffeur',
                  'recipient_contact' => $doc['email'],
                  'variables' => [
                      'driver_name' => $doc['driver_name'] ?: 'Chauffeur',
                      'document_type' => $doc['type'],
                      'expiry_date' => $doc['expiry_date'],
                      'organization_name' => $orgName,
                  ],
                  'idempotency_key' => $idempotencyKey,
                  'is_dry_run' => $dryRun,
              ]);
              $results[] = $result;
          }
    }

    jsonResponse(['results' => $results, 'count' => count($results), 'dry_run' => $dryRun]);
}

function hasBeenSentToday($db, $idempotencyKey) {
    $today = date('Y-m-d');
    $stmt = $db->prepare(
        "SELECT id FROM notification_logs WHERE idempotency_key = ? AND DATE(created) = ? AND status IN ('sent', 'sent_simulated') LIMIT 1"
    );
    $stmt->execute([$idempotencyKey, $today]);
    return (bool)$stmt->fetch();
}

function sendMultiChannelNotification($db, $orgId, $userId, $params) {
    $channel = $params['channel'] ?? 'in_app';
    $templateCode = $params['template_code'] ?? null;
    $variables = $params['variables'] ?? [];
    $recipientType = $params['recipient_type'] ?? null;
    $recipientId = $params['recipient_id'] ?? null;
    $recipientName = $params['recipient_name'] ?? '';
    $recipientContact = $params['recipient_contact'] ?? '';
    $idempotencyKey = $params['idempotency_key'] ?? null;
    $isDryRun = $params['is_dry_run'] ?? isDryRun();
    $customMessage = $params['custom_message'] ?? null;

    // Resolve template
    $subject = '';
    $body = '';
    if ($templateCode && !$customMessage) {
        $stmt = $db->prepare(
            "SELECT * FROM notification_templates WHERE code = ? AND (organization_id = ? OR organization_id IS NULL) AND channel = ? AND is_active = 1 ORDER BY organization_id IS NOT NULL DESC LIMIT 1"
        );
        $stmt->execute([$templateCode, $orgId, $channel]);
        $template = $stmt->fetch();

        if ($template) {
            $subject = renderNotificationTemplate($template['subject'] ?? '', $variables);
            $body = renderNotificationTemplate($template['body'], $variables);
        } else {
            // Fallback: use generic body
            $body = $customMessage ?? 'Notification de ' . ($variables['organization_name'] ?? 'Alika Mobility');
            $subject = 'Notification';
        }
    } else {
        $body = $customMessage ?? 'Notification';
        $subject = $customMessage ? mb_substr($customMessage, 0, 100) : 'Notification';
    }

    // Create log entry
    $logId = generateId();
    $status = $isDryRun ? 'sent_simulated' : 'queued';
    $stmt = $db->prepare(
        "INSERT INTO notification_logs (`id`, `organization_id`, `template_code`, `channel`, `recipient_type`, `recipient_id`, `recipient_name`, `recipient_contact`, `subject`, `message`, `status`, `idempotency_key`, `attempt_count`, `max_attempts`, `created_by`, `created`, `updated`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 3, ?, NOW(), NOW())"
    );
    $stmt->execute([
        $logId, $orgId, $templateCode, $channel, $recipientType, $recipientId,
        $recipientName, $recipientContact, $subject, $body, $status,
        $idempotencyKey, $userId
    ]);

    // For in_app, just create notification
    if ($channel === 'in_app') {
        if ($userId) {
            $notifId = createNotification([
                'user_id' => $userId,
                'organization_id' => $orgId,
                'type' => $templateCode ?? 'custom_message',
                'channel' => 'in_app',
                'title' => $subject ?: 'Notification',
                'message' => $body,
                'notification_log_id' => $logId,
                'action_url' => $params['action_url'] ?? null,
            ]);
        }
        $db->prepare("UPDATE notification_logs SET status = 'sent', sent_at = NOW() WHERE id = ?")->execute([$logId]);
        return ['success' => true, 'log_id' => $logId, 'channel' => 'in_app'];
    }

    // For external channels, attempt send
    $sendResult = attemptExternalSend($channel, $recipientContact, $subject, $body);

    $newStatus = $sendResult['success'] ? ($isDryRun ? 'sent_simulated' : 'sent') : 'failed';
    $stmt = $db->prepare(
        "UPDATE notification_logs SET status = ?, provider_message_id = ?, error_message = ?, attempt_count = 1, sent_at = IF(? = 'sent' OR ? = 'sent_simulated', NOW(), NULL), updated = NOW() WHERE id = ?"
    );
    $stmt->execute([
        $newStatus,
        $sendResult['provider_message_id'] ?? null,
        !$sendResult['success'] ? ($sendResult['message'] ?? 'Erreur inconnue') : null,
        $newStatus, $newStatus, $logId
    ]);

    return [
        'success' => $sendResult['success'],
        'log_id' => $logId,
        'channel' => $channel,
        'provider_message_id' => $sendResult['provider_message_id'] ?? null,
        'error' => !$sendResult['success'] ? ($sendResult['message'] ?? null) : null,
        'dry_run' => $isDryRun,
    ];
}

function attemptExternalSend($channel, $contact, $subject, $body) {
    if (empty($contact)) {
        return ['success' => false, 'message' => 'Coordonnée du destinataire manquante'];
    }

    switch ($channel) {
        case 'email':
            return sendEmailNotification($contact, '', $subject, buildEmailHtmlFromText($body));
        case 'sms':
            return sendSmsNotification($contact, $body);
        case 'whatsapp':
            return sendWhatsAppNotification($contact, $body);
        default:
            return ['success' => false, 'message' => 'Canal non supporté: ' . $channel];
    }
}

// ---- API Handlers ----

function handleNotificationsGet() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $db = getDB();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['perPage'] ?? 50)));
    $offset = ($page - 1) * $perPage;

    $where = "WHERE n.user_id = ?";
    $params = [$user['id']];

    if ($user['role'] === 'super-admin' && !empty($_GET['organization_id'])) {
        $where = "WHERE n.organization_id = ?";
        $params = [$_GET['organization_id']];
    }

    if (!empty($_GET['filter'])) {
        $where .= " AND n.is_read = ?";
        $params[] = $_GET['filter'] === 'unread' ? 0 : 1;
    }

    if (!empty($_GET['type'])) {
        $where .= " AND n.type = ?";
        $params[] = $_GET['type'];
    }

    if (!empty($_GET['channel'])) {
        $where .= " AND n.channel = ?";
        $params[] = $_GET['channel'];
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM notifications n $where");
    $countStmt->execute($params);
    $totalItems = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare("SELECT n.* FROM notifications n $where ORDER BY n.created DESC LIMIT $perPage OFFSET $offset");
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    jsonResponse([
        'items' => $items,
        'totalItems' => $totalItems,
        'page' => $page,
        'perPage' => $perPage,
        'totalPages' => ceil($totalItems / $perPage),
    ]);
}

function handleNotificationMarkRead() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $id = $_GET['id'] ?? null;
    if (!$id) { jsonResponse(['error' => 'Notification ID is required'], 400); }

    $db = getDB();
    $stmt = $db->prepare("UPDATE notifications SET is_read = 1, updated = NOW() WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['id']]);

    jsonResponse(['success' => true]);
}

function handleNotificationMarkAllRead() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $db = getDB();
    $stmt = $db->prepare("UPDATE notifications SET is_read = 1, updated = NOW() WHERE user_id = ? AND is_read = 0");
    $stmt->execute([$user['id']]);

    jsonResponse(['success' => true]);
}

function handleNotificationsSend() {
    $user = getAuthUser();
    if (!$user || !in_array($user['role'], ['super-admin', 'admin'])) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $body = getRequestBody();
    $channel = $body['channel'] ?? '';
    $recipientType = $body['recipient_type'] ?? '';
    $recipientId = $body['recipient_id'] ?? null;
    $templateCode = $body['template_code'] ?? null;
    $customMessage = $body['custom_message'] ?? null;
    $isDryRun = !empty($body['dry_run']);

    if (!in_array($channel, ['email', 'sms', 'whatsapp', 'in_app'])) {
        jsonResponse(['error' => 'Canal invalide. Utilisez email, sms, whatsapp ou in_app.'], 400);
    }

    if (!$templateCode && !$customMessage) {
        jsonResponse(['error' => 'template_code ou custom_message requis.'], 400);
    }

    $db = getDB();

    // Resolve recipient
    $recipientName = '';
    $recipientContact = '';

    if ($recipientId && $recipientType) {
        $table = '';
        $contactField = 'email';
        $nameField = 'name';

        switch ($recipientType) {
            case 'member':
                $table = 'members';
                $contactField = ($channel === 'email') ? 'email' : 'phone';
                break;
            case 'driver':
                $table = 'drivers';
                $contactField = ($channel === 'email') ? 'email' : 'phone';
                break;
            case 'user':
            case 'agent':
                $table = 'users';
                $recipientType = 'user';
                break;
            default:
                jsonResponse(['error' => 'Type de destinataire invalide'], 400);
        }

        if ($table) {
            $stmt = $db->prepare("SELECT id, $nameField as name, email, phone FROM $table WHERE id = ? AND organization_id = ?");
            $stmt->execute([$recipientId, $user['organization_id']]);
            $recipient = $stmt->fetch();

            if (!$recipient) {
                jsonResponse(['error' => 'Destinataire introuvable dans votre organisation'], 404);
            }

            $recipientName = $recipient['name'] ?? '';
            $recipientContact = $recipient[$contactField] ?? $recipient['email'] ?? $recipient['phone'] ?? '';

            if ($channel !== 'in_app' && empty($recipientContact)) {
                jsonResponse(['error' => 'Le destinataire n\'a pas de ' . ($contactField === 'email' ? 'd\'email' : 'de téléphone') . ' enregistré.'], 400);
            }
        }
    }

    // Build variables for template rendering
    $variables = $body['variables'] ?? [];
    $variables['recipient_name'] = $recipientName;
    $variables['organization_name'] = $user['organization_name'] ?? ($user['name'] ?? 'Alika Mobility');

    if ($customMessage) {
        $variables['custom_message'] = $customMessage;
    }

    $result = sendMultiChannelNotification($db, $user['organization_id'], $user['id'], [
        'template_code' => $templateCode,
        'channel' => $channel,
        'recipient_type' => $recipientType,
        'recipient_id' => $recipientId,
        'recipient_name' => $recipientName,
        'recipient_contact' => $recipientContact,
        'variables' => $variables,
        'custom_message' => $customMessage,
        'is_dry_run' => $isDryRun,
        'action_url' => $body['action_url'] ?? null,
    ]);

    jsonResponse($result);
}

function handleNotificationsLogsGet() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $db = getDB();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['perPage'] ?? 50)));
    $offset = ($page - 1) * $perPage;

    $where = "WHERE nl.organization_id = ?";
    $params = [$user['organization_id']];

    if ($user['role'] === 'super-admin' && !empty($_GET['all'])) {
        $where = "WHERE 1=1";
        $params = [];
    }

    if (!empty($_GET['channel'])) {
        $where .= " AND nl.channel = ?";
        $params[] = $_GET['channel'];
    }
    if (!empty($_GET['status'])) {
        $where .= " AND nl.status = ?";
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['recipient_id'])) {
        $where .= " AND nl.recipient_id = ?";
        $params[] = $_GET['recipient_id'];
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM notification_logs nl $where");
    $countStmt->execute($params);
    $totalItems = (int)$countStmt->fetchColumn();

    $stmt = $db->prepare("SELECT nl.* FROM notification_logs nl $where ORDER BY nl.created DESC LIMIT $perPage OFFSET $offset");
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    jsonResponse([
        'items' => $items,
        'totalItems' => $totalItems,
        'page' => $page,
        'perPage' => $perPage,
        'totalPages' => ceil($totalItems / $perPage),
    ]);
}

function handleNotificationLogsRetry() {
    $user = getAuthUser();
    if (!$user || !in_array($user['role'], ['super-admin', 'admin'])) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $id = $_GET['id'] ?? null;
    if (!$id) { jsonResponse(['error' => 'Log ID is required'], 400); }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM notification_logs WHERE id = ? AND organization_id = ? AND status = 'failed'");
    $stmt->execute([$id, $user['organization_id']]);
    $log = $stmt->fetch();

    if (!$log) { jsonResponse(['error' => 'Log not found or not failed'], 404); }

    $attemptCount = (int)$log['attempt_count'] + 1;
    if ($attemptCount > (int)$log['max_attempts']) {
        jsonResponse(['error' => 'Nombre maximal de tentatives atteint (' . $log['max_attempts'] . ')'], 400);
    }

    $sendResult = attemptExternalSend($log['channel'], $log['recipient_contact'], $log['subject'], $log['message']);

    $newStatus = $sendResult['success'] ? 'sent' : 'failed';
    $stmt = $db->prepare(
        "UPDATE notification_logs SET status = ?, provider_message_id = ?, error_message = ?, attempt_count = ?, sent_at = IF(? = 'sent', NOW(), NULL), updated = NOW() WHERE id = ?"
    );
    $stmt->execute([
        $newStatus,
        $sendResult['provider_message_id'] ?? null,
        !$sendResult['success'] ? ($sendResult['message'] ?? 'Erreur inconnue') : null,
        $attemptCount, $newStatus, $id
    ]);

    jsonResponse([
        'success' => $sendResult['success'],
        'log_id' => $id,
        'attempt_count' => $attemptCount,
        'error' => !$sendResult['success'] ? ($sendResult['message'] ?? null) : null,
    ]);
}

function handleNotificationsUnreadCount() {
    $user = getAuthUser();
    if (!$user) { jsonResponse(['error' => 'Unauthorized'], 401); }

    $db = getDB();
    $stmt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
    $stmt->execute([$user['id']]);

    jsonResponse(['count' => (int)$stmt->fetchColumn()]);
}

function handleNotificationsActionSend() {
    $user = getAuthUser();
    if (!$user || !in_array($user['role'], ['super-admin', 'admin'])) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }

    $body = getRequestBody();
    $action = $_GET['action'] ?? '';
    $dryRun = !empty($body['dry_run']);

    $db = getDB();
    $orgId = $user['organization_id'];

    switch ($action) {
        case 'send-debt-reminder':
            $debtId = $body['debt_id'] ?? null;
            $channel = $body['channel'] ?? 'email';
            if (!$debtId) { jsonResponse(['error' => 'debt_id requis'], 400); }

            $stmt = $db->prepare(
                "SELECT d.*, m.name as member_name, '' as email, m.phone
                 FROM debts d JOIN members m ON d.member_id = m.id
                 WHERE d.id = ? AND d.organization_id = ?"
            );
            $stmt->execute([$debtId, $orgId]);
            $debt = $stmt->fetch();
            if (!$debt) { jsonResponse(['error' => 'Dette introuvable'], 404); }

            $result = sendMultiChannelNotification($db, $orgId, $user['id'], [
                'template_code' => $channel === 'sms' ? 'debt_reminder_sms' : ($channel === 'whatsapp' ? 'debt_reminder_whatsapp' : 'debt_reminder'),
                'channel' => $channel,
                'recipient_type' => 'member',
                'recipient_id' => $debt['member_id'],
                'recipient_name' => $debt['member_name'],
                'recipient_contact' => ($channel === 'email') ? $debt['email'] : $debt['phone'],
                'variables' => [
                    'member_name' => $debt['member_name'],
                    'amount' => $debt['amount_remaining'],
                    'currency' => $debt['currency'] ?? 'CDF',
                    'due_date' => date('Y-m-d'),
                    'organization_name' => $user['organization_name'] ?? 'Alika Mobility',
                ],
                'is_dry_run' => $dryRun,
                'action_url' => '/debts/' . $debtId,
            ]);
            jsonResponse($result);
            break;

        case 'send-payment-receipt':
            $paymentId = $body['payment_id'] ?? null;
            $channel = $body['channel'] ?? 'email';
            if (!$paymentId) { jsonResponse(['error' => 'payment_id requis'], 400); }

            $stmt = $db->prepare(
                "SELECT p.*, m.name as member_name, '' as email
                 FROM payments p JOIN members m ON p.member_id = m.id
                 WHERE p.id = ? AND p.organization_id = ?"
            );
            $stmt->execute([$paymentId, $orgId]);
            $payment = $stmt->fetch();
            if (!$payment) { jsonResponse(['error' => 'Paiement introuvable'], 404); }

            $receiptStmt = $db->prepare("SELECT id FROM receipts WHERE payment_id = ? LIMIT 1");
            $receiptStmt->execute([$paymentId]);
            $receipt = $receiptStmt->fetch();

            $result = sendMultiChannelNotification($db, $orgId, $user['id'], [
                'template_code' => $channel === 'sms' ? 'payment_receipt_sms' : 'payment_receipt',
                'channel' => $channel,
                'recipient_type' => 'member',
                'recipient_id' => $payment['member_id'],
                'recipient_name' => $payment['member_name'],
                'recipient_contact' => $payment['email'],
                'variables' => [
                    'member_name' => $payment['member_name'],
                    'amount' => $payment['amount'],
                    'currency' => 'CDF',
                    'payment_date' => $payment['payment_date'] ?? date('Y-m-d'),
                    'receipt_number' => $receipt ? $receipt['id'] : $paymentId,
                    'organization_name' => $user['organization_name'] ?? 'Alika Mobility',
                ],
                'is_dry_run' => $dryRun,
            ]);
            jsonResponse($result);
            break;

        case 'send-penalty-notice':
            $penaltyId = $body['penalty_id'] ?? null;
            $channel = $body['channel'] ?? 'email';
            if (!$penaltyId) { jsonResponse(['error' => 'penalty_id requis'], 400); }

            $stmt = $db->prepare(
                "SELECT p.*, m.name as member_name, '' as email
                 FROM penalties p JOIN members m ON p.member_id = m.id
                 WHERE p.id = ? AND p.organization_id = ?"
            );
            $stmt->execute([$penaltyId, $orgId]);
            $penalty = $stmt->fetch();
            if (!$penalty) { jsonResponse(['error' => 'Pénalité introuvable'], 404); }

            $result = sendMultiChannelNotification($db, $orgId, $user['id'], [
                'template_code' => $channel === 'sms' ? 'penalty_notice_sms' : 'penalty_notice',
                'channel' => $channel,
                'recipient_type' => 'member',
                'recipient_id' => $penalty['member_id'],
                'recipient_name' => $penalty['member_name'],
                'recipient_contact' => $penalty['email'],
                'variables' => [
                    'member_name' => $penalty['member_name'],
                    'amount' => $penalty['amount'],
                    'currency' => 'CDF',
                    'reason' => $penalty['reason'] ?? 'Non spécifié',
                    'organization_name' => $user['organization_name'] ?? 'Alika Mobility',
                ],
                'is_dry_run' => $dryRun,
            ]);
            jsonResponse($result);
            break;

        case 'send-custom-message':
            $recipientType = $body['recipient_type'] ?? '';
            $recipientId = $body['recipient_id'] ?? null;
            $channel = $body['channel'] ?? 'email';
            $customMessage = $body['custom_message'] ?? '';

            if (!$customMessage) { jsonResponse(['error' => 'Message personnalisé requis'], 400); }

            $result = handleNotificationsSend();
            return;

        default:
            jsonResponse(['error' => 'Action inconnue: ' . $action], 400);
    }
}
