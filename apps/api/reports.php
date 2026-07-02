<?php

function requireReportsAuth() {
    $user = getAuthUser();
    if (!$user) jsonResponse(['error' => 'Unauthorized'], 401);
    return $user;
}

function getReportOrgFilter($user, &$params) {
    if ($user['role'] === 'super-admin' && !empty($_GET['organization_id'])) {
        $params[] = $_GET['organization_id'];
        return 'AND p.organization_id = ?';
    }
    if ($user['role'] !== 'super-admin') {
        $params[] = $user['organization_id'];
        return 'AND p.organization_id = ?';
    }
    return '';
}

function handleReportsOverview() {
    $user = requireReportsAuth();
    $db = getDB();

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
    $to = $_GET['to'] ?? date('Y-m-d');
    validateDateRange($from, $to);

    $params = [];
    $orgFilter = getReportOrgFilter($user, $params);
    $orgFilterNoPrefix = $orgFilter ? str_replace('p.', '', $orgFilter) : '';
    $orgSql = $orgFilter ? 'WHERE organization_id = ?' : '';
    $orgParams = $orgFilter ? [$params[0]] : [];
    $dateOrgParams = $orgFilter ? [$from, $to, $params[0]] : [$from, $to];

    // Payments summary for period
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_collected,
        COALESCE(AVG(amount), 0) as avg_payment,
        COUNT(DISTINCT member_id) as unique_payers
        FROM payments WHERE payment_date >= ? AND payment_date <= ? $orgFilterNoPrefix");
    $stmt->execute($dateOrgParams);
    $paymentsSummary = $stmt->fetch();

    // Breakdown by method
    $stmt = $db->prepare("SELECT payment_method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM payments WHERE payment_date >= ? AND payment_date <= ? $orgFilterNoPrefix
        GROUP BY payment_method ORDER BY total DESC");
    $stmt->execute($dateOrgParams);
    $byMethod = $stmt->fetchAll();

    // Breakdown by day
    $stmt = $db->prepare("SELECT payment_date, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM payments WHERE payment_date >= ? AND payment_date <= ? $orgFilterNoPrefix
        GROUP BY payment_date ORDER BY payment_date ASC");
    $stmt->execute($dateOrgParams);
    $byDay = $stmt->fetchAll();

    // Members summary
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_members,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_members
        FROM members $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $membersSummary = $stmt->fetch();

    // Debts summary
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_debts,
        SUM(CASE WHEN status IN ('pending', 'partially_paid') THEN 1 ELSE 0 END) as open_debts,
        COALESCE(SUM(CASE WHEN status IN ('pending', 'partially_paid') THEN amount_remaining ELSE 0 END), 0) as total_debt_remaining
        FROM debts $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $debtsSummary = $stmt->fetch();

    // Vehicles summary
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vehicles
        FROM vehicles $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $vehiclesSummary = $stmt->fetch();

    // Documents expiry
    $stmt = $db->prepare("SELECT
        SUM(CASE WHEN status = 'expired' OR (expiry_date IS NOT NULL AND expiry_date < CURDATE()) THEN 1 ELSE 0 END) as expired_documents,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon_documents
        FROM documents $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $documentsSummary = $stmt->fetch();

    // Member cards
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_cards,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_cards
        FROM member_cards $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $cardsSummary = $stmt->fetch();

    // Penalties summary
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_penalties,
        COALESCE(SUM(amount), 0) as total_penalty_amount,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_penalties
        FROM penalties $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $penaltiesSummary = $stmt->fetch();

    // Previous period comparison
    $diff = (strtotime($to) - strtotime($from));
    $prevTo = date('Y-m-d', strtotime($from) - 86400);
    $prevFrom = date('Y-m-d', strtotime($from) - $diff);

    $prevParams = $orgFilter ? [$prevFrom, $prevTo, $params[0]] : [$prevFrom, $prevTo];
    $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as prev_collected FROM payments
        WHERE payment_date >= ? AND payment_date <= ? $orgFilterNoPrefix");
    $stmt->execute($prevParams);
    $prevSummary = $stmt->fetch();

    jsonResponse([
        'period' => ['from' => $from, 'to' => $to],
        'payments' => [
            'total_payments' => (int)$paymentsSummary['total_payments'],
            'total_collected' => (float)$paymentsSummary['total_collected'],
            'avg_payment' => round((float)$paymentsSummary['avg_payment'], 2),
            'unique_payers' => (int)$paymentsSummary['unique_payers'],
            'by_method' => $byMethod,
            'by_day' => $byDay,
            'previous_collected' => (float)$prevSummary['prev_collected'],
        ],
        'members' => [
            'total_members' => (int)$membersSummary['total_members'],
            'active_members' => (int)$membersSummary['active_members'],
            'suspended_members' => (int)$membersSummary['suspended_members'],
        ],
        'debts' => [
            'total_debts' => (int)$debtsSummary['total_debts'],
            'open_debts' => (int)$debtsSummary['open_debts'],
            'total_debt_remaining' => (float)$debtsSummary['total_debt_remaining'],
        ],
        'vehicles' => [
            'total_vehicles' => (int)$vehiclesSummary['total_vehicles'],
            'active_vehicles' => (int)$vehiclesSummary['active_vehicles'],
        ],
        'documents' => [
            'expired_documents' => (int)$documentsSummary['expired_documents'],
            'expiring_soon_documents' => (int)$documentsSummary['expiring_soon_documents'],
        ],
        'cards' => [
            'total_cards' => (int)$cardsSummary['total_cards'],
            'active_cards' => (int)$cardsSummary['active_cards'],
        ],
        'penalties' => [
            'total_penalties' => (int)$penaltiesSummary['total_penalties'],
            'total_penalty_amount' => (float)$penaltiesSummary['total_penalty_amount'],
            'paid_penalties' => (int)$penaltiesSummary['paid_penalties'],
        ],
    ]);
}

function handleReportsPayments() {
    $user = requireReportsAuth();
    $db = getDB();

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
    $to = $_GET['to'] ?? date('Y-m-d');
    $parkingId = $_GET['parking_id'] ?? null;
    $agentId = $_GET['agent_id'] ?? null;
    $memberId = $_GET['member_id'] ?? null;
    $method = $_GET['method'] ?? null;
    $page = max(1, intval($_GET['page'] ?? 1));
    $perPage = min(100, max(1, intval($_GET['perPage'] ?? 50)));
    validateDateRange($from, $to);

    $params = [];
    $orgFilter = getReportOrgFilter($user, $params);

    $conditions = ["p.payment_date >= ?", "p.payment_date <= ?"];
    $condParams = [$from, $to];

    if ($parkingId) { $conditions[] = "p.parking_id = ?"; $condParams[] = $parkingId; }
    if ($agentId) { $conditions[] = "p.collector_id = ?"; $condParams[] = $agentId; }
    if ($memberId) { $conditions[] = "p.member_id = ?"; $condParams[] = $memberId; }
    if ($method) { $conditions[] = "p.payment_method = ?"; $condParams[] = $method; }

    if ($orgFilter) {
        $conditions[] = substr($orgFilter, 4); // Remove "AND "
        $condParams[] = $params[0];
    } elseif ($user['role'] !== 'super-admin') {
        $conditions[] = "p.organization_id = ?";
        $condParams[] = $user['organization_id'];
    }

    $where = implode(' AND ', $conditions);

    // Summary
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_payments,
        COALESCE(SUM(p.amount), 0) as total_collected,
        COALESCE(AVG(p.amount), 0) as avg_payment,
        COUNT(DISTINCT p.member_id) as unique_payers
        FROM payments p WHERE $where");
    $stmt->execute($condParams);
    $summary = $stmt->fetch();

    // Breakdown by method
    $stmt = $db->prepare("SELECT p.payment_method, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
        FROM payments p WHERE $where GROUP BY p.payment_method ORDER BY total DESC");
    $stmt->execute($condParams);
    $byMethod = $stmt->fetchAll();

    // Breakdown by day
    $stmt = $db->prepare("SELECT p.payment_date, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
        FROM payments p WHERE $where GROUP BY p.payment_date ORDER BY p.payment_date ASC");
    $stmt->execute($condParams);
    $byDay = $stmt->fetchAll();

    // Breakdown by agent
    $stmt = $db->prepare("SELECT p.collector_id, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
        FROM payments p WHERE $where GROUP BY p.collector_id ORDER BY total DESC LIMIT 20");
    $stmt->execute($condParams);
    $byAgent = $stmt->fetchAll();

    // Breakdown by parking
    $stmt = $db->prepare("SELECT p.parking_id, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
        FROM payments p WHERE $where GROUP BY p.parking_id ORDER BY total DESC LIMIT 20");
    $stmt->execute($condParams);
    $byParking = $stmt->fetchAll();

    // Paginated rows
    $offset = ($page - 1) * $perPage;
    $stmt = $db->prepare("SELECT p.*, m.name as member_name
        FROM payments p LEFT JOIN members m ON p.member_id = m.id
        WHERE $where ORDER BY p.payment_date DESC, p.created DESC LIMIT $perPage OFFSET $offset");
    $stmt->execute($condParams);
    $rows = $stmt->fetchAll();

    // Total count for pagination
    $countStmt = $db->prepare("SELECT COUNT(*) FROM payments p WHERE $where");
    $countStmt->execute($condParams);
    $totalItems = (int)$countStmt->fetchColumn();

    jsonResponse([
        'summary' => [
            'total_payments' => (int)$summary['total_payments'],
            'total_collected' => (float)$summary['total_collected'],
            'avg_payment' => round((float)$summary['avg_payment'], 2),
            'unique_payers' => (int)$summary['unique_payers'],
        ],
        'by_method' => $byMethod,
        'by_day' => $byDay,
        'by_agent' => $byAgent,
        'by_parking' => $byParking,
        'rows' => $rows,
        'page' => $page,
        'perPage' => $perPage,
        'totalItems' => $totalItems,
        'totalPages' => (int)ceil($totalItems / $perPage),
    ]);
}

function handleReportsDebts() {
    $user = requireReportsAuth();
    $db = getDB();

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
    $to = $_GET['to'] ?? date('Y-m-d');
    $status = $_GET['status'] ?? null;
    validateDateRange($from, $to);

    $params = [];
    $orgFilter = getReportOrgFilter($user, $params);
    $orgSql = $orgFilter ? 'WHERE organization_id = ?' : '';
    $orgParams = $orgFilter ? [$params[0]] : [];
    $orgSqlAlias = $orgFilter ? 'WHERE d.organization_id = ?' : '';

    // Summary
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_debts,
        COALESCE(SUM(amount_original), 0) as total_original,
        COALESCE(SUM(amount_remaining), 0) as total_remaining,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_debts,
        SUM(CASE WHEN status = 'partially_paid' THEN 1 ELSE 0 END) as partially_paid_debts,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_debts,
        SUM(CASE WHEN status = 'written_off' THEN 1 ELSE 0 END) as written_off_debts
        FROM debts $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $summary = $stmt->fetch();

    $whereAnd = $orgSqlAlias ? "$orgSqlAlias AND" : "WHERE";

    // Top debtors
    $stmt = $db->prepare("SELECT d.member_id, m.name as member_name, d.amount_remaining, d.amount_original, d.status, d.currency
        FROM debts d LEFT JOIN members m ON d.member_id = m.id
        $whereAnd d.status IN ('pending', 'partially_paid')
        ORDER BY d.amount_remaining DESC LIMIT 20");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $topDebtors = $stmt->fetchAll();

    // Evolution over period (grouped by month)
    $stmt = $db->prepare("SELECT
        DATE_FORMAT(d.created, '%Y-%m') as month,
        COUNT(*) as count,
        COALESCE(SUM(d.amount_original), 0) as total
        FROM debts d $whereAnd d.created >= ? AND d.created <= DATE_ADD(?, INTERVAL 1 DAY)
        GROUP BY DATE_FORMAT(d.created, '%Y-%m') ORDER BY month ASC");
    if ($orgParams) {
        $stmt->execute([$params[0], $from, $to]);
    } else {
        $stmt->execute([$from, $to]);
    }
    $evolution = $stmt->fetchAll();

    jsonResponse([
        'summary' => [
            'total_debts' => (int)$summary['total_debts'],
            'total_original' => (float)$summary['total_original'],
            'total_remaining' => (float)$summary['total_remaining'],
            'pending_debts' => (int)$summary['pending_debts'],
            'partially_paid_debts' => (int)$summary['partially_paid_debts'],
            'paid_debts' => (int)$summary['paid_debts'],
            'written_off_debts' => (int)$summary['written_off_debts'],
        ],
        'top_debtors' => $topDebtors,
        'evolution' => $evolution,
    ]);
}

function handleReportsTransport() {
    $user = requireReportsAuth();
    $db = getDB();

    $params = [];
    $orgFilter = getReportOrgFilter($user, $params);
    $orgSql = $orgFilter ? 'WHERE organization_id = ?' : '';
    $orgParams = $orgFilter ? [$params[0]] : [];

    // Parkings
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_parkings,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_parkings
        FROM parkings $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $parkingsSummary = $stmt->fetch();

    // Lines
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_lines,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_lines
        FROM `lines` $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $linesSummary = $stmt->fetch();

    // Vehicles
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vehicles,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_vehicles,
        SUM(CASE WHEN status = 'out_of_service' THEN 1 ELSE 0 END) as out_of_service_vehicles,
        v.vehicle_type_id, vt.name as type_name, COUNT(*) as type_count
        FROM vehicles v LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id $orgSql
        GROUP BY v.vehicle_type_id, vt.name ORDER BY type_count DESC");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $vehiclesByType = $stmt->fetchAll();

    // Vehicles summary (without group by)
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vehicles,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_vehicles,
        SUM(CASE WHEN status = 'out_of_service' THEN 1 ELSE 0 END) as out_of_service_vehicles
        FROM vehicles $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $vehiclesSummary = $stmt->fetch();

    // Assignments
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_assignments
        FROM vehicle_assignments $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $assignmentsSummary = $stmt->fetch();

    // Documents status
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_documents,
        SUM(CASE WHEN status = 'expired' OR (expiry_date IS NOT NULL AND expiry_date < CURDATE()) THEN 1 ELSE 0 END) as expired_documents,
        SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date >= CURDATE() AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon_documents,
        SUM(CASE WHEN (status = 'active' OR status IS NULL) AND (expiry_date IS NULL OR expiry_date >= CURDATE()) THEN 1 ELSE 0 END) as valid_documents
        FROM documents $orgSql");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $documentsSummary = $stmt->fetch();

    jsonResponse([
        'parkings' => [
            'total_parkings' => (int)$parkingsSummary['total_parkings'],
            'active_parkings' => (int)$parkingsSummary['active_parkings'],
        ],
        'lines' => [
            'total_lines' => (int)$linesSummary['total_lines'],
            'active_lines' => (int)$linesSummary['active_lines'],
        ],
        'vehicles' => [
            'total_vehicles' => (int)$vehiclesSummary['total_vehicles'],
            'active_vehicles' => (int)$vehiclesSummary['active_vehicles'],
            'suspended_vehicles' => (int)$vehiclesSummary['suspended_vehicles'],
            'out_of_service_vehicles' => (int)$vehiclesSummary['out_of_service_vehicles'],
            'by_type' => $vehiclesByType,
        ],
        'assignments' => [
            'total_assignments' => (int)$assignmentsSummary['total_assignments'],
            'active_assignments' => (int)$assignmentsSummary['active_assignments'],
        ],
        'documents' => [
            'total_documents' => (int)$documentsSummary['total_documents'],
            'valid_documents' => (int)$documentsSummary['valid_documents'],
            'expired_documents' => (int)$documentsSummary['expired_documents'],
            'expiring_soon_documents' => (int)$documentsSummary['expiring_soon_documents'],
        ],
    ]);
}

function handleReportsMembers() {
    $user = requireReportsAuth();
    $db = getDB();

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
    $to = $_GET['to'] ?? date('Y-m-d');
    validateDateRange($from, $to);

    $params = [];
    $orgFilter = getReportOrgFilter($user, $params);
    $orgSql = $orgFilter ? 'WHERE organization_id = ?' : '';
    $orgParams = $orgFilter ? [$params[0]] : [];
    $orgSqlM = $orgFilter ? 'WHERE m.organization_id = ?' : '';
    $orgSqlD = $orgFilter ? 'WHERE d.organization_id = ?' : '';
    $orgSqlMc = $orgFilter ? 'WHERE mc.organization_id = ?' : '';
    $whereAndM = $orgSqlM ? "$orgSqlM AND" : "WHERE";
    $whereAndD = $orgSqlD ? "$orgSqlD AND" : "WHERE";
    $whereAndMc = $orgSqlMc ? "$orgSqlMc AND" : "WHERE";

    // Members summary
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_members,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_members,
        SUM(CASE WHEN created >= ? AND created <= DATE_ADD(?, INTERVAL 1 DAY) THEN 1 ELSE 0 END) as new_members
        FROM members $orgSql");
    if ($orgParams) {
        $stmt->execute([$from, $to, $params[0]]);
    } else {
        $stmt->execute([$from, $to]);
    }
    $summary = $stmt->fetch();

    // Members by parking
    $stmt = $db->prepare("SELECT m.parking_id, pk.name as parking_name, COUNT(*) as count
        FROM members m LEFT JOIN parkings pk ON m.parking_id = pk.id
        $orgSqlM GROUP BY m.parking_id, pk.name ORDER BY count DESC LIMIT 20");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $byParking = $stmt->fetchAll();

    // Members with debt
    $stmt = $db->prepare("SELECT COUNT(DISTINCT d.member_id) as members_with_debt
        FROM debts d $whereAndD d.status IN ('pending', 'partially_paid')");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $membersWithDebt = $stmt->fetch();

    // Members with active card
    $stmt = $db->prepare("SELECT COUNT(DISTINCT mc.member_id) as members_with_card
        FROM member_cards mc $whereAndMc mc.status = 'active'");
    if ($orgParams) $stmt->execute($orgParams); else $stmt->execute();
    $membersWithCard = $stmt->fetch();

    // Members without card
    $totalMembers = (int)$summary['total_members'];
    $membersWithoutCard = $totalMembers - (int)$membersWithCard['members_with_card'];

    jsonResponse([
        'summary' => [
            'total_members' => $totalMembers,
            'active_members' => (int)$summary['active_members'],
            'suspended_members' => (int)$summary['suspended_members'],
            'new_members' => (int)$summary['new_members'],
            'members_with_debt' => (int)$membersWithDebt['members_with_debt'],
            'members_with_card' => (int)$membersWithCard['members_with_card'],
            'members_without_card' => max(0, $membersWithoutCard),
        ],
        'by_parking' => $byParking,
    ]);
}

function handleReportsAgentPerformance() {
    $user = requireReportsAuth();
    $db = getDB();

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
    $to = $_GET['to'] ?? date('Y-m-d');
    validateDateRange($from, $to);

    $params = [];
    $orgFilter = getReportOrgFilter($user, $params);

    $orgCond = '';
    $condParams = [$from, $to];
    if ($orgFilter) {
        $orgCond = 'AND u.organization_id = ?';
        $condParams[] = $params[0];
    } elseif ($user['role'] !== 'super-admin') {
        $orgCond = 'AND u.organization_id = ?';
        $condParams[] = $user['organization_id'];
    }

    // Limit role to agents
    $stmt = $db->prepare("SELECT
        u.id, u.name, u.email, u.role, u.agent_type,
        COUNT(p.id) as payment_count,
        COALESCE(SUM(p.amount), 0) as total_collected,
        COALESCE(AVG(p.amount), 0) as avg_payment,
        MAX(p.payment_date) as last_payment_date,
        MIN(p.payment_date) as first_payment_date
        FROM users u
        LEFT JOIN payments p ON p.collector_id = u.id AND p.payment_date >= ? AND p.payment_date <= ?
        WHERE u.role = 'agent' $orgCond
        GROUP BY u.id, u.name, u.email, u.role, u.agent_type
        ORDER BY total_collected DESC LIMIT 50");
    $stmt->execute($condParams);
    $agents = $stmt->fetchAll();

    // Daily activity for the period
    $stmt = $db->prepare("SELECT p.collector_id, p.payment_date, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        LEFT JOIN users u ON p.collector_id = u.id
        WHERE p.payment_date >= ? AND p.payment_date <= ? $orgCond AND u.role = 'agent'
        GROUP BY p.collector_id, p.payment_date ORDER BY p.payment_date ASC");
    $stmt->execute($condParams);
    $dailyActivity = $stmt->fetchAll();

    jsonResponse([
        'agents' => $agents,
        'daily_activity' => $dailyActivity,
    ]);
}

function handleReportsCashier() {
    $user = requireReportsAuth();
    $db = getDB();

    $from = $_GET['from'] ?? date('Y-m-d', strtotime('-7 days'));
    $to = $_GET['to'] ?? date('Y-m-d');
    validateDateRange($from, $to);

    // Cashier sees only their own payments
    $stmt = $db->prepare("SELECT
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_collected,
        COALESCE(AVG(amount), 0) as avg_payment,
        COUNT(*) as operation_count,
        SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END) as cash_total,
        SUM(CASE WHEN payment_method = 'mobile' THEN amount ELSE 0 END) as mobile_total,
        SUM(CASE WHEN payment_method = 'bank' THEN amount ELSE 0 END) as bank_total,
        SUM(CASE WHEN payment_method NOT IN ('cash', 'mobile', 'bank') THEN amount ELSE 0 END) as other_total
        FROM payments
        WHERE collector_id = ? AND payment_date >= ? AND payment_date <= ? AND organization_id = ?");
    $stmt->execute([$user['id'], $from, $to, $user['organization_id']]);
    $summary = $stmt->fetch();

    // Recent payments
    $stmt = $db->prepare("SELECT p.*, m.name as member_name
        FROM payments p LEFT JOIN members m ON p.member_id = m.id
        WHERE p.collector_id = ? AND p.payment_date >= ? AND p.payment_date <= ? AND p.organization_id = ?
        ORDER BY p.created DESC LIMIT 50");
    $stmt->execute([$user['id'], $from, $to, $user['organization_id']]);
    $payments = $stmt->fetchAll();

    // Daily breakdown
    $stmt = $db->prepare("SELECT payment_date, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE collector_id = ? AND payment_date >= ? AND payment_date <= ? AND organization_id = ?
        GROUP BY payment_date ORDER BY payment_date ASC");
    $stmt->execute([$user['id'], $from, $to, $user['organization_id']]);
    $byDay = $stmt->fetchAll();

    jsonResponse([
        'summary' => [
            'total_payments' => (int)$summary['total_payments'],
            'total_collected' => (float)$summary['total_collected'],
            'avg_payment' => round((float)$summary['avg_payment'], 2),
            'operation_count' => (int)$summary['operation_count'],
            'cash_total' => (float)$summary['cash_total'],
            'mobile_total' => (float)$summary['mobile_total'],
            'bank_total' => (float)$summary['bank_total'],
            'other_total' => (float)$summary['other_total'],
        ],
        'payments' => $payments,
        'by_day' => $byDay,
    ]);
}

function validateDateRange($from, $to) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        jsonResponse(['error' => 'Format de date invalide. Utilisez YYYY-MM-DD.'], 400);
    }
    if ($from > $to) {
        jsonResponse(['error' => 'La date de début doit être antérieure à la date de fin.'], 400);
    }
}
