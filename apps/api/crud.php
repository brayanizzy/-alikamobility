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
            ],
        ],
        'permissions' => [
            'super-admin' => '*',
            'admin' => ['agencies', 'vehicle_types', 'vehicles', 'drivers', 'owners', 'lines', 'vehicle_assignments', 'documents', 'debts', 'penalties', 'member_cards', 'organizations', 'users', 'members', 'payments', 'parkings', 'qrcodes', 'receipts', 'notifications', 'admin_audit_logs', 'sessions'],
            'agent' => ['members', 'parkings', 'payments', 'qrcodes', 'receipts', 'notifications', 'vehicles', 'drivers', 'vehicle_types', 'documents', 'member_cards', 'lines', 'vehicle_assignments'],
            'field_collector' => ['members', 'parkings', 'payments', 'qrcodes', 'receipts', 'vehicles', 'driver'],
            'office_collector' => ['members', 'payments', 'receipts', 'debts', 'penalties', 'notifications'],
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
    $stmt = $db->prepare("SELECT * FROM `$collection` WHERE id = ?");
    $stmt->execute([$id]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);

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

    // Check record exists
    $stmt = $db->prepare("SELECT id FROM `$collection` WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
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

    $db = getDB();

    $stmt = $db->prepare("SELECT id FROM `$collection` WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
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
