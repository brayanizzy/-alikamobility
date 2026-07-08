<?php

function getCollectionConfig() {
    return [
        'validations' => [
            'agencies' => [
                'required' => ['organization_id', 'name'],
                'status' => ['active', 'suspended', 'inactive'],
            ],
            'vehicle_types' => [
                'required' => ['name', 'slug'],
            ],
            'vehicles' => [
                'required' => ['organization_id'],
                'status' => ['active', 'suspended', 'out_of_service', 'retired', 'sold', 'pending'],
            ],
            'drivers' => [
                'required' => ['member_id'],
                'status' => ['active', 'suspended', 'expired', 'inactive'],
            ],
            'owners' => [
                'required' => ['member_id'],
            ],
            'lines' => [
                'required' => ['organization_id', 'name'],
                'status' => ['active', 'inactive', 'suspended'],
            ],
            'vehicle_assignments' => [
                'required' => ['organization_id', 'vehicle_id', 'start_date'],
                'status' => ['active', 'ended', 'cancelled'],
            ],
            'documents' => [
                'required' => ['organization_id', 'related_type', 'related_id', 'document_type'],
                'related_type' => ['vehicle', 'driver', 'member', 'owner'],
                'status' => ['active', 'expired', 'archived', 'pending', 'rejected'],
            ],
            'debts' => [
                'required' => ['organization_id', 'amount_original', 'amount_remaining'],
                'status' => ['active', 'paid', 'partially_paid', 'written_off'],
            ],
            'penalties' => [
                'required' => ['organization_id', 'amount', 'reason'],
                'status' => ['pending', 'applied', 'waived', 'paid'],
            ],
            'member_cards' => [
                'required' => ['organization_id', 'member_id', 'card_number', 'issued_date'],
                'status' => ['active', 'expired', 'lost', 'replaced', 'cancelled'],
                'card_type' => ['standard', 'premium', 'vip'],
            ],
        ],
        'permissions' => [
            'super-admin' => '*',
            'admin' => ['agencies', 'vehicle_types', 'vehicles', 'drivers', 'owners', 'lines', 'vehicle_assignments', 'documents', 'debts', 'penalties', 'member_cards', 'organizations', 'users', 'members', 'payments', 'parkings', 'qrcodes', 'receipts', 'notifications', 'admin_audit_logs', 'sessions'],
            'agent' => ['members', 'parkings', 'payments', 'qrcodes', 'receipts', 'notifications', 'vehicles', 'drivers', 'vehicle_types', 'documents', 'member_cards', 'lines', 'vehicle_assignments'],
            'field_collector' => ['members', 'parkings', 'payments', 'qrcodes', 'receipts', 'vehicles', 'drivers', 'vehicle_types'],
            'office_collector' => ['members', 'payments', 'receipts', 'debts', 'penalties', 'notifications', 'vehicles', 'drivers', 'vehicle_types', 'documents', 'member_cards', 'lines', 'vehicle_assignments'],
        ],
        'readonly' => [
            'field_collector' => ['vehicles', 'drivers', 'vehicle_types', 'documents', 'member_cards', 'lines', 'vehicle_assignments'],
            'office_collector' => ['vehicles', 'drivers', 'vehicle_types', 'documents', 'member_cards', 'lines', 'vehicle_assignments'],
        ],
    ];
}

function checkCollectionPermission($collection, $user) {
    if (!$user) return false;
    $config = getCollectionConfig();
    $perms = $config['permissions'];
    $role = $user['role'] ?? '';
    $agentType = $user['agent_type'] ?? '';

    if ($role === 'super-admin') return true;

    $allowed = $perms[$role] ?? [];
    if ($allowed === '*') return true;
    if (in_array($collection, $allowed)) return true;

    if ($role === 'agent') {
        $subPerms = $perms[$agentType] ?? [];
        if (in_array($collection, $subPerms)) return true;
    }

    return false;
}

function isReadOnlyCollection($collection, $user) {
    $config = getCollectionConfig();
    $readonly = $config['readonly'] ?? [];
    $role = $user['role'] ?? '';
    $agentType = $user['agent_type'] ?? '';

    if ($role === 'super-admin' || $role === 'admin') return false;

    // Check by agent_type first (more specific)
    if ($agentType && isset($readonly[$agentType])) {
        if (in_array($collection, $readonly[$agentType])) return true;
    }

    // Check by role
    if (isset($readonly[$role])) {
        if (in_array($collection, $readonly[$role])) return true;
    }

    return false;
}

function validateCollectionData($collection, $data) {
    $config = getCollectionConfig();
    $rules = $config['validations'][$collection] ?? null;
    if (!$rules) return [];

    $errors = [];

    // Custom field labels for user-friendly messages
    $fieldLabels = [
        'debts' => [
            'amount_original' => 'Le montant initial est requis.',
            'amount_remaining' => 'Le montant restant est requis.',
        ],
    ];
    $labels = $fieldLabels[$collection] ?? [];

    // Check required fields
    if (!empty($rules['required'])) {
        foreach ($rules['required'] as $field) {
            $val = $data[$field] ?? null;
            if ($val === null || (is_string($val) && trim($val) === '')) {
                $errors[] = $labels[$field] ?? "Le champ '$field' est requis";
            }
        }
    }

    // Check enum fields
    if (!empty($rules['status'])) {
        $val = $data['status'] ?? null;
        if ($val !== null && !in_array($val, $rules['status'])) {
            $errors[] = "Statut invalide : '" . $val . "'. Valeurs autorisées : " . implode(', ', $rules['status']);
        }
    }

    if (!empty($rules['related_type'])) {
        $val = $data['related_type'] ?? null;
        if ($val !== null && !in_array($val, $rules['related_type'])) {
            $errors[] = "Type lié invalide : '$val'. Valeurs autorisées : " . implode(', ', $rules['related_type']);
        }
    }

    if (!empty($rules['card_type'])) {
        $val = $data['card_type'] ?? null;
        if ($val !== null && !in_array($val, $rules['card_type'])) {
            $errors[] = "Type de carte invalide : '$val'. Valeurs autorisées : " . implode(', ', $rules['card_type']);
        }
    }

    // Numeric checks for debts
    if ($collection === 'debts') {
        if (isset($data['amount_original']) && (!is_numeric($data['amount_original']) || $data['amount_original'] < 0)) {
            $errors[] = "Le montant doit être numérique et positif.";
        }
        if (isset($data['amount_remaining']) && (!is_numeric($data['amount_remaining']) || $data['amount_remaining'] < 0)) {
            $errors[] = "Le montant doit être numérique et positif.";
        }
    }

    // Numeric checks for penalties
    if ($collection === 'penalties') {
        if (isset($data['amount']) && (!is_numeric($data['amount']) || $data['amount'] < 0)) {
            $errors[] = "Le montant de la pénalité doit être un nombre positif";
        }
    }

    return $errors;
}

// =============================================================
// TENANT ISOLATION HELPERS (REV-01.2)
// Guarantees admin/agent only access data within their own
// organization. Super-admin retains global access.
// =============================================================

function isSuperAdmin($user) {
    return ($user['role'] ?? '') === 'super-admin';
}

function getUserOrgId($user) {
    return $user['organization_id'] ?? null;
}

/**
 * Collections whose organization is determined indirectly via a
 * relation to another table holding organization_id.
 * collection => [foreign_table, foreign_key_column, org_column_on_foreign_table]
 */
function getCollectionOrgRelations() {
    return [
        'drivers'  => ['members',  'member_id',  'organization_id'],
        'owners'   => ['members',  'member_id',  'organization_id'],
        'receipts' => ['payments', 'payment_id', 'organization_id'],
    ];
}

/**
 * Global reference data shared across all tenants (no org scoping).
 */
function isGlobalReferenceCollection($collection) {
    return in_array($collection, ['vehicle_types'], true);
}

/**
 * System collections that non-super-admin users must not create/modify/delete.
 */
function isSystemCollection($collection) {
    return in_array($collection, ['organizations', 'sessions', 'vehicle_types', 'admin_audit_logs'], true);
}

/**
 * Cached introspection: does the given table have a column?
 */
function tableHasColumn($db, $table, $column) {
    static $cache = [];
    $key = $table . '.' . $column;
    if (isset($cache[$key])) return $cache[$key];
    try {
        $stmt = $db->prepare("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1");
        $stmt->execute([$table, $column]);
        $cache[$key] = (bool)$stmt->fetch();
    } catch (Throwable $e) {
        $cache[$key] = false;
    }
    return $cache[$key];
}

/**
 * Build the tenant WHERE clause fragment for a collection + user.
 * Super-admin -> '' (no enforced scope; may optionally filter via client filter).
 * Admin/agent -> SQL fragment restricting to their organization.
 * Pushes bound params into $params.
 * Returns '1=0' when no tenant boundary can be established (safe deny).
 */
function buildTenantWhereClause($collection, $user, &$params) {
    if (isSuperAdmin($user)) {
        return '';
    }
    $orgId = getUserOrgId($user);

    // organizations table: the PK (id) IS the org -> admin sees only their own org
    if ($collection === 'organizations') {
        if ($orgId === null) return '1=0';
        $params[] = $orgId;
        return '`id` = ?';
    }
    // sessions: scope by user_id (own session only) — never expose other users' tokens
    if ($collection === 'sessions') {
        $params[] = $user['id'] ?? '';
        return '`user_id` = ?';
    }
    // admin_audit_logs: no tenant column -> super-admin only
    if ($collection === 'admin_audit_logs') {
        return '1=0';
    }
    // Global reference data (vehicle_types) -> no tenant filter
    if (isGlobalReferenceCollection($collection)) {
        return '';
    }

    $db = getDB();
    // Direct organization_id column?
    if (tableHasColumn($db, $collection, 'organization_id')) {
        if ($orgId === null) return '1=0';
        $params[] = $orgId;
        return '`organization_id` = ?';
    }
    // Relational scoping (drivers/owners/receipts via foreign table)
    $relations = getCollectionOrgRelations();
    if (isset($relations[$collection])) {
        if ($orgId === null) return '1=0';
        [$fkTable, $fkCol, $orgCol] = $relations[$collection];
        $params[] = $orgId;
        return "`$fkCol` IN (SELECT `id` FROM `$fkTable` WHERE `$orgCol` = ?)";
    }
    // No tenant boundary known -> deny all for non-super-admin (safe default)
    return '1=0';
}

/**
 * For GET one / update / delete: fetch a record only if it belongs to
 * the user's organization (or user is super-admin). Returns the record
 * array when authorized, or null (-> 404 to avoid revealing existence).
 */
function fetchScopedRecord($db, $collection, $id, $user) {
    $params = [];
    $tenantClause = buildTenantWhereClause($collection, $user, $params);
    if ($tenantClause !== '') {
        $sql = "SELECT * FROM `$collection` WHERE $tenantClause AND `id` = ?";
    } else {
        $sql = "SELECT * FROM `$collection` WHERE `id` = ?";
    }
    $params[] = $id;
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    return $record ?: null;
}

/**
 * Enforce tenant rules on a CREATE payload (mutates $data).
 * - Non-super-admin cannot create system collections.
 * - Forces organization_id to the user's org (ignores client value).
 * - For relational collections, verifies the linked record belongs to org.
 */
function enforceTenantCreate($collection, $user, &$data) {
    if (isSuperAdmin($user)) return;
    $orgId = getUserOrgId($user);
    if (isSystemCollection($collection)) {
        jsonResponse(['error' => 'Forbidden: cannot create this collection'], 403);
    }
    $db = getDB();
    if (tableHasColumn($db, $collection, 'organization_id')) {
        $data['organization_id'] = $orgId;
    }
    $relations = getCollectionOrgRelations();
    if (isset($relations[$collection]) && !empty($data[$relations[$collection][1]])) {
        [$fkTable, $fkCol, $orgCol] = $relations[$collection];
        $chk = $db->prepare("SELECT 1 FROM `$fkTable` WHERE `id` = ? AND `$orgCol` = ? LIMIT 1");
        $chk->execute([$data[$fkCol], $orgId]);
        if (!$chk->fetch()) {
            jsonResponse(['error' => 'La référence fournie n\'appartient pas à votre organisation.'], 403);
        }
    }
}

/**
 * Enforce tenant rules on an UPDATE payload (mutates $data). The record
 * has already been verified to belong to the user's org via fetchScopedRecord.
 * - Non-super-admin cannot modify system collections.
 * - Prevents moving a record to another organization.
 * - For relational collections, verifies a changed reference belongs to org.
 */
function enforceTenantUpdate($collection, $user, &$data) {
    if (isSuperAdmin($user)) return;
    $orgId = getUserOrgId($user);
    if (isSystemCollection($collection)) {
        jsonResponse(['error' => 'Forbidden: cannot modify this collection'], 403);
    }
    $db = getDB();
    if (tableHasColumn($db, $collection, 'organization_id')) {
        $data['organization_id'] = $orgId;
    }
    $relations = getCollectionOrgRelations();
    if (isset($relations[$collection]) && array_key_exists($relations[$collection][1], $data)) {
        [$fkTable, $fkCol, $orgCol] = $relations[$collection];
        if ($data[$fkCol] !== null && $data[$fkCol] !== '') {
            $chk = $db->prepare("SELECT 1 FROM `$fkTable` WHERE `id` = ? AND `$orgCol` = ? LIMIT 1");
            $chk->execute([$data[$fkCol], $orgId]);
            if (!$chk->fetch()) {
                jsonResponse(['error' => 'La référence fournie n\'appartient pas à votre organisation.'], 403);
            }
        }
    }
}

function handleCrud($method, $collection, $id) {
    $user = getAuthUser();
    $allowedTables = [
        'organizations', 'users', 'members', 'payments', 'parkings',
        'qrcodes', 'receipts', 'notifications', 'admin_audit_logs', 'sessions',
        'agencies', 'vehicle_types', 'vehicles', 'drivers', 'owners',
        'lines', 'vehicle_assignments', 'documents', 'debts', 'penalties',
        'member_cards',
    ];

    if (!in_array($collection, $allowedTables)) {
        jsonResponse(['error' => 'Invalid collection: ' . $collection], 404);
    }

    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    if (!checkCollectionPermission($collection, $user)) {
        jsonResponse(['error' => 'Forbidden: insufficient permissions'], 403);
    }

    // Enforce read-only for agents on transport collections
    if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']) && isReadOnlyCollection($collection, $user)) {
        jsonResponse(['error' => 'Forbidden: lecture seule sur cette collection'], 403);
    }

    switch ($method) {
        case 'GET':
            if ($id) {
                handleGetOne($collection, $id, $user);
            } else {
                handleGetList($collection, $user);
            }
            break;
        case 'POST':
            handleCreate($collection, $user);
            break;
        case 'PATCH':
        case 'PUT':
            if ($id) {
                handleUpdate($collection, $id, $user);
            } else {
                jsonResponse(['error' => 'ID is required for update'], 400);
            }
            break;
        case 'DELETE':
            if ($id) {
                handleDelete($collection, $id, $user);
            } else {
                jsonResponse(['error' => 'ID is required for delete'], 400);
            }
            break;
        default:
            jsonResponse(['error' => 'Method not allowed'], 405);
    }
}

function handleGetOne($collection, $id, $user) {
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    $db = getDB();
    $record = fetchScopedRecord($db, $collection, $id, $user);

    if (!$record) {
        jsonResponse(['error' => 'Record not found'], 404);
    }

    $record = applyFileUrls($collection, $record);
    removePassword($record);
    jsonResponse($record);
}

function handleGetList($collection, $user) {
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $page = max(1, intval($_GET['page'] ?? 1));
    $perPage = intval($_GET['perPage'] ?? $_GET['per_page'] ?? 50);
    if ($perPage < 1) $perPage = 50;
    $maxPerPage = 500;
    if ($perPage > $maxPerPage) $perPage = $maxPerPage;
    $skipTotal = isset($_GET['skipTotal']) || isset($_GET['skip_total']);

    $filterStr = $_GET['filter'] ?? $_GET['filters'] ?? '';
    $sortStr = $_GET['sort'] ?? '';

    $where = [];
    $params = [];

    // Enforce tenant isolation FIRST so a client filter can never override it
    $tenantClause = buildTenantWhereClause($collection, $user, $params);
    if ($tenantClause !== '') {
        $where[] = $tenantClause;
    }

    if ($filterStr) {
        $filterSql = parseFilter($filterStr, $params);
        if ($filterSql) {
            $where[] = $filterSql;
        }
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $orderClause = '';
    if ($sortStr) {
        $parts = explode(',', $sortStr);
        $orderParts = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if (!$part) continue;
            $dir = 'ASC';
            if ($part[0] === '-') {
                $dir = 'DESC';
                $part = substr($part, 1);
            } elseif ($part[0] === '+') {
                $part = substr($part, 1);
            }
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $part);
            if ($safeCol) {
                $orderParts[] = "`$safeCol` $dir";
            }
        }
        if ($orderParts) {
            $orderClause = 'ORDER BY ' . implode(', ', $orderParts);
        }
    }

    if (!$skipTotal) {
        $countStmt = $db->prepare("SELECT COUNT(*) FROM `$collection` $whereClause");
        $countStmt->execute($params);
        $totalItems = intval($countStmt->fetchColumn());
        $totalPages = $perPage > 0 ? (int)ceil($totalItems / $perPage) : 0;
    } else {
        $totalItems = 0;
        $totalPages = 0;
    }

    $offset = ($page - 1) * $perPage;
    $perPage = (int)$perPage;
    $offset = (int)$offset;
    $stmt = $db->prepare("SELECT * FROM `$collection` $whereClause $orderClause LIMIT $perPage OFFSET $offset");
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$item) {
        $item = applyFileUrls($collection, $item);
        removePassword($item);
    }

    jsonResponse([
        'page' => $page,
        'perPage' => $perPage,
        'totalItems' => $totalItems,
        'totalPages' => $totalPages,
        'items' => $items
    ]);
}

function handleCreate($collection, $user) {
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $data = getRequestBody();
    $isFormData = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;

    $id = generateId();
    $data['id'] = $id;

    if (isset($data['password'])) {
        $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        unset($data['password']);
    }
    if (isset($data['passwordConfirm'])) {
        unset($data['passwordConfirm']);
    }

    unset($data['id']);

    // Validate data against collection rules
    $validationErrors = validateCollectionData($collection, $data);
    if (!empty($validationErrors)) {
        jsonResponse(['error' => implode('; ', $validationErrors)], 400);
    }

    // Enforce tenant isolation on the payload (forces org_id, checks relations)
    enforceTenantCreate($collection, $user, $data);

    $columns = array_keys($data);
    $safeColumns = [];
    foreach ($columns as $col) {
        $safe = preg_replace('/[^a-zA-Z0-9_]/', '', $col);
        if ($safe) $safeColumns[] = $safe;
    }

    if (empty($safeColumns)) {
        jsonResponse(['error' => 'No valid data provided'], 400);
    }

    $colList = '`' . implode('`,`', $safeColumns) . '`';
    $placeholders = implode(',', array_fill(0, count($safeColumns), '?'));
    $values = [];
    foreach ($safeColumns as $col) {
        $values[] = $data[$col] ?? null;
    }

    $stmt = $db->prepare("INSERT INTO `$collection` (`id`, $colList, `created`, `updated`) VALUES (?, $placeholders, NOW(), NOW())");
    array_unshift($values, $id);
    $stmt->execute($values);

    // Handle file uploads
    if ($isFormData) {
        handleFileUploads($collection, $id, $_FILES);
    }

    $stmt = $db->prepare("SELECT * FROM `$collection` WHERE id = ?");
    $stmt->execute([$id]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    $record = applyFileUrls($collection, $record);
    removePassword($record);

    if ($collection === 'members') {
        try {
            $orgStmt = $db->prepare("SELECT * FROM organizations WHERE id = ?");
            $orgStmt->execute([$record['organization_id']]);
            $org = $orgStmt->fetch();
            triggerMemberCreated($record, $org ?: []);
        } catch (Throwable $e) {
            error_log('Notification trigger (member) failed: ' . $e->getMessage());
        }
    }

    // Auto-generate qr_secret for new member cards
    if ($collection === 'member_cards' && empty($record['qr_secret'])) {
        require_once __DIR__ . '/card-security.php';
        $qrSecret = generateCardQrSecret();
        $updStmt = $db->prepare("UPDATE member_cards SET qr_secret = ?, updated = NOW() WHERE id = ?");
        $updStmt->execute([$qrSecret, $id]);
        $record['qr_secret'] = $qrSecret;
    }

    if ($collection === 'payments') {
        try {
            $member = null;
            if (!empty($record['member_id'])) {
                $mStmt = $db->prepare("SELECT * FROM members WHERE id = ?");
                $mStmt->execute([$record['member_id']]);
                $member = $mStmt->fetch();
            }
            triggerPaymentCreated($record, $member ?: []);
        } catch (Throwable $e) {
            error_log('Notification trigger (payment) failed: ' . $e->getMessage());
        }
    }

    jsonResponse($record, 201);
}

function handleUpdate($collection, $id, $user) {
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    $db = getDB();
    $data = getRequestBody();
    $isFormData = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;

    // Verify record exists AND belongs to the user's organization
    if (!fetchScopedRecord($db, $collection, $id, $user)) {
        jsonResponse(['error' => 'Record not found'], 404);
    }

    if (isset($data['password'])) {
        $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
        unset($data['password']);
    }
    if (isset($data['passwordConfirm'])) {
        unset($data['passwordConfirm']);
    }

    // Remove id from update data
    unset($data['id']);
    unset($data['created']);

    // Validate data against collection rules
    $validationErrors = validateCollectionData($collection, $data);
    if (!empty($validationErrors)) {
        jsonResponse(['error' => implode('; ', $validationErrors)], 400);
    }

    // Enforce tenant isolation on the payload (prevents org change, checks relations)
    enforceTenantUpdate($collection, $user, $data);

    $columns = array_keys($data);
    $safeColumns = [];
    foreach ($columns as $col) {
        $safe = preg_replace('/[^a-zA-Z0-9_]/', '', $col);
        if ($safe) $safeColumns[] = $safe;
    }

    if (empty($safeColumns)) {
        jsonResponse(['error' => 'No valid data provided'], 400);
    }

    $setParts = [];
    $values = [];
    foreach ($safeColumns as $col) {
        $setParts[] = "`$col` = ?";
        $values[] = $data[$col] ?? null;
    }
    $setParts[] = "`updated` = NOW()";

    $stmt = $db->prepare("UPDATE `$collection` SET " . implode(', ', $setParts) . " WHERE id = ?");
    $values[] = $id;
    $stmt->execute($values);

    // Handle file uploads
    if ($isFormData) {
        handleFileUploads($collection, $id, $_FILES);
    }

    $stmt = $db->prepare("SELECT * FROM `$collection` WHERE id = ?");
    $stmt->execute([$id]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    $record = applyFileUrls($collection, $record);
    removePassword($record);

    jsonResponse($record);
}

function handleDelete($collection, $id, $user) {
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }

    // Non-super-admin cannot delete system collections
    if (!isSuperAdmin($user) && isSystemCollection($collection)) {
        jsonResponse(['error' => 'Forbidden: cannot delete this collection'], 403);
    }

    $db = getDB();

    // Verify record exists AND belongs to the user's organization
    if (!fetchScopedRecord($db, $collection, $id, $user)) {
        jsonResponse(['error' => 'Record not found'], 404);
    }

    $stmt = $db->prepare("DELETE FROM `$collection` WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['message' => 'Record deleted successfully', 'id' => $id]);
}

function parseFilter($filterStr, &$params) {
    $parts = explode('&&', $filterStr);
    $conditions = [];

    foreach ($parts as $part) {
        $part = trim($part);
        if (!$part) continue;

        $matched = false;

        // != (not equal)
        if (preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\s*!=\s*"(.+)"$/s', $part, $m)) {
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $m[1]);
            $params[] = $m[2];
            $conditions[] = "`$safeCol` != ?";
            $matched = true;
        }

        // ~ (like)
        if (!$matched && preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\s*~\s*"(.+)"$/s', $part, $m)) {
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $m[1]);
            $params[] = '%' . $m[2] . '%';
            $conditions[] = "`$safeCol` LIKE ?";
            $matched = true;
        }

        // >= (greater or equal)
        if (!$matched && preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\s*>=\s*"(.+)"$/s', $part, $m)) {
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $m[1]);
            $params[] = $m[2];
            $conditions[] = "`$safeCol` >= ?";
            $matched = true;
        }

        // <= (less or equal)
        if (!$matched && preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\s*<=\s*"(.+)"$/s', $part, $m)) {
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $m[1]);
            $params[] = $m[2];
            $conditions[] = "`$safeCol` <= ?";
            $matched = true;
        }

        // > (greater)
        if (!$matched && preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\s*>\s*"(.+)"$/s', $part, $m)) {
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $m[1]);
            $params[] = $m[2];
            $conditions[] = "`$safeCol` > ?";
            $matched = true;
        }

        // < (less)
        if (!$matched && preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\s*<\s*"(.+)"$/s', $part, $m)) {
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $m[1]);
            $params[] = $m[2];
            $conditions[] = "`$safeCol` < ?";
            $matched = true;
        }

        // = (equality)
        if (!$matched && preg_match('/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"(.+)"$/s', $part, $m)) {
            $safeCol = preg_replace('/[^a-zA-Z0-9_]/', '', $m[1]);
            $params[] = $m[2];
            $conditions[] = "`$safeCol` = ?";
            $matched = true;
        }

        if (!$matched) {
            $conditions[] = "1=0";
        }
    }

    return $conditions ? implode(' AND ', $conditions) : '';
}

function applyFileUrls($collection, $record) {
    if (!is_array($record)) return $record;
    $record['@collectionName'] = $collection;
    return $record;
}

function validateUploadedFile($file) {
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    $allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];
    $maxSize = 5 * 1024 * 1024; // 5 MB

    $name = $file['name'] ?? '';
    $size = $file['size'] ?? 0;
    $tmpName = $file['tmp_name'] ?? '';

    // Check upload error
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return 'Erreur lors du téléchargement du fichier';
    }

    // Check file size
    if ($size > $maxSize) {
        return 'Le fichier est trop volumineux. Taille max : 5 Mo';
    }

    if ($size === 0) {
        return 'Le fichier est vide';
    }

    // Check name is not empty
    if (empty($name)) {
        return 'Nom de fichier invalide';
    }

    // Check for dangerous double extensions
    $name = basename($name);
    if (preg_match('/\.(php\d*|phtml|pht|phar|shtml|js|html?|exe|sh|bat|cmd|com|msi|vbs|pl|cgi|htaccess)\..+$/i', $name)) {
        return 'Extension de fichier invalide';
    }

    // Get extension
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExtensions)) {
        return 'Extension non autorisée : ' . $ext . '. Extensions acceptées : ' . implode(', ', $allowedExtensions);
    }

    // MIME type verification
    if (!empty($tmpName) && file_exists($tmpName)) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $tmpName);
        finfo_close($finfo);
        if (!in_array($mime, $allowedMimeTypes)) {
            return 'Type de fichier invalide : ' . $mime;
        }
    }

    return null;
}

function handleFileUploads($collection, $recordId, $files) {
    $fileFields = [
        'users' => ['avatar'],
        'members' => ['photo'],
        'organizations' => ['logo'],
    ];

    $fields = $fileFields[$collection] ?? [];
    if (empty($fields)) return;

    $uploadDir = UPLOAD_BASE_DIR . '/' . $collection . '/' . $recordId;
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    $db = getDB();
    $setParts = [];
    $params = [];

    foreach ($fields as $field) {
        if (!isset($files[$field]) || $files[$field]['error'] !== UPLOAD_ERR_OK) continue;

        $file = $files[$field];

        // Validate file
        $validationError = validateUploadedFile($file);
        if ($validationError) {
            error_log('Upload rejected for ' . $collection . '/' . $recordId . '/' . $field . ': ' . $validationError);
            continue;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $safeExt = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
        $timestamp = time();
        $filename = $field . '_' . $recordId . '_' . $timestamp . '.' . $safeExt;

        $destPath = $uploadDir . '/' . $filename;
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $setParts[] = "`$field` = ?";
            $params[] = $filename;
        }
    }

    if (!empty($setParts)) {
        $setParts[] = "`updated` = NOW()";
        $params[] = $recordId;
        $stmt = $db->prepare("UPDATE `$collection` SET " . implode(', ', $setParts) . " WHERE id = ?");
        $stmt->execute($params);
    }
}
