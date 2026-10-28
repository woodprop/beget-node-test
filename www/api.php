<?php
require __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? '';

try {
    if ($action === 'init') {
        ensureTable();
        echo json_encode(['ok' => true, 'message' => 'Таблица готова']);
        exit;
    }

    if ($action === 'list') {
        $rows = getDb()
            ->query('SELECT id, text, created_at FROM messages ORDER BY id DESC LIMIT 20')
            ->fetchAll();
        echo json_encode(['ok' => true, 'messages' => $rows]);
        exit;
    }

    if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $text = trim($body['text'] ?? '');
        if ($text === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'text is required']);
            exit;
        }
        $stmt = getDb()->prepare('INSERT INTO messages (text) VALUES (?)');
        $stmt->execute([$text]);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Unknown action']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
