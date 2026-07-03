<?php

function createNotification($data) {
    $db = getDB();
    $id = generateId();
    $stmt = $db->prepare(
        "INSERT INTO notifications (`id`, `user_id`, `organization_id`, `type`, `title`, `message`, `related_collection`, `related_id`, `is_read`, `action_url`, `created`, `updated`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())"
    );
    $stmt->execute([
        $id,
        $data['user_id'],
        $data['organization_id'] ?? null,
        $data['type'],
        $data['title'],
        $data['message'],
        $data['related_collection'] ?? null,
        $data['related_id'] ?? null,
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
        'title' => 'Nouveau membre inscrit',
        'message' => "$memberName a été ajouté à votre organisation.",
        'related_collection' => 'members',
        'related_id' => $member['id'],
        'action_url' => '/members',
    ]);

    notifyNewMemberEmail($member, $org);
}

function handleDailyCollectionCheck() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $expectedToken = getenv('CRON_SECRET') ?: 'alika-cron-secret-2025';
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

function triggerPaymentCreated($payment, $member) {
    $orgId = $payment['organization_id'];
    $paymentDate = $payment['payment_date'] ?? $payment['created'];
    $yesterday = date('Y-m-d', strtotime('-1 day'));

    if ($paymentDate && $paymentDate < $yesterday) {
        $memberName = $member ? ($member['name'] ?? $member['full_name'] ?? 'Membre') : 'Membre';

        notifyAdmins($orgId, [
            'type' => 'late_payment',
            'title' => 'Paiement en retard régularisé',
            'message' => "{$memberName} a payé {$payment['amount']} FC en rattrapage (date: {$paymentDate}).",
            'related_collection' => 'payments',
            'related_id' => $payment['id'],
            'action_url' => '/payments',
        ]);

        if ($member) notifyLatePaymentEmail($payment, $member);
    }
}
