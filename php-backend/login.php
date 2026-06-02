<?php
require_once 'config.php';

$data = json_decode(file_get_contents('php://input'), true);
$code = isset($data['code']) ? trim($data['code']) : '';

if (!$code) {
    http_response_code(400);
    echo json_encode(['error' => 'Invite code required']);
    exit;
}

$db = getDB();
$stmt = $db->prepare('SELECT role FROM invite_codes WHERE code = ?');
$stmt->bind_param('s', $code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid invite code']);
    exit;
}

$row = $result->fetch_assoc();
echo json_encode(['role' => $row['role']]);
$db->close();
?>