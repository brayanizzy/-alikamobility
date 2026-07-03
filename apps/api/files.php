<?php

function serveFile($collection, $recordId, $filename) {
    $safeCollection = preg_replace('/[^a-zA-Z0-9_]/', '', $collection);
    $safeId = preg_replace('/[^a-zA-Z0-9]/', '', $recordId);
    $safeFilename = preg_replace('/[^a-zA-Z0-9_.-]/', '', $filename);

    $filePath = UPLOAD_BASE_DIR . '/' . $safeCollection . '/' . $safeId . '/' . $safeFilename;

    if (!file_exists($filePath)) {
        jsonResponse(['error' => 'File not found'], 404);
    }

    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    if (!in_array($ext, $allowedExtensions)) {
        jsonResponse(['error' => 'File type not allowed'], 403);
    }

    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'pdf' => 'application/pdf',
    ];

    $mime = $mimeTypes[$ext] ?? 'application/octet-stream';

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($filePath));
    header('Content-Disposition: inline; filename="' . basename($filePath) . '"');
    header('Cache-Control: public, max-age=31536000');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    header('X-Content-Type-Options: nosniff');

    readfile($filePath);
    exit;
}
