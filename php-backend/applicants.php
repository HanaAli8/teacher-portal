<?php
require_once 'config.php';

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET - fetch applicants with filters
if ($method === 'GET') {
    $where = [];
    $params = [];
    $types = '';

    if (!empty($_GET['search'])) {
        $where[] = '(full_name LIKE ? OR email LIKE ?)';
        $search = '%' . $_GET['search'] . '%';
        $params[] = $search;
        $params[] = $search;
        $types .= 'ss';
    }
    if (!empty($_GET['subject'])) {
        $where[] = 'JSON_CONTAINS(subjects, JSON_QUOTE(?))';
        $params[] = $_GET['subject'];
        $types .= 's';
    }
    if (!empty($_GET['grade'])) {
        $where[] = 'JSON_CONTAINS(grade_levels, JSON_QUOTE(?))';
        $params[] = $_GET['grade'];
        $types .= 's';
    }
    if (!empty($_GET['status'])) {
        $where[] = 'status = ?';
        $params[] = $_GET['status'];
        $types .= 's';
    }
    if (!empty($_GET['minDob'])) {
        $where[] = 'date_of_birth >= ?';
        $params[] = $_GET['minDob'];
        $types .= 's';
    }
    if (!empty($_GET['maxDob'])) {
        $where[] = 'date_of_birth <= ?';
        $params[] = $_GET['maxDob'];
        $types .= 's';
    }

    $allowed_sorts = ['submitted_at', 'full_name'];
    $sort = in_array($_GET['sort'] ?? '', $allowed_sorts) ? $_GET['sort'] : 'submitted_at';
    $order = ($_GET['order'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

    $sql = 'SELECT * FROM teacher_applicants';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $row['subjects'] = json_decode($row['subjects'] ?? '[]');
        $row['grade_levels'] = json_decode($row['grade_levels'] ?? '[]');
        $rows[] = $row;
    }
    echo json_encode($rows);
}

// POST - submit application
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $full_name = $data['full_name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? null;
    $dob = $data['date_of_birth'] ?? null;
    $subjects = json_encode($data['subjects'] ?? []);
    $grade_levels = json_encode($data['grade_levels'] ?? []);

    if (!$full_name || !$email) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and email are required']);
        exit;
    }

    $stmt = $db->prepare('INSERT INTO teacher_applicants (full_name, email, phone, date_of_birth, subjects, grade_levels) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('ssssss', $full_name, $email, $phone, $dob, $subjects, $grade_levels);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(['success' => true, 'id' => $db->insert_id]);
    } else {
        if ($db->errno === 1062) {
            if (strpos($db->error, 'email') !== false) {
                http_response_code(409);
                echo json_encode(['error' => 'This email already has an application']);
            } else {
                http_response_code(409);
                echo json_encode(['error' => 'This phone number already has an application']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}

// PATCH - update status
elseif ($method === 'PATCH') {
    $parts = explode('/', trim($_GET['id'] ?? '', '/'));
    $id = intval($parts[0]);
    $data = json_decode(file_get_contents('php://input'), true);
    $status = $data['status'] ?? '';
    $allowed = ['pending', 'reviewed', 'accepted', 'rejected'];

    if (!in_array($status, $allowed)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status']);
        exit;
    }

    $stmt = $db->prepare('UPDATE teacher_applicants SET status = ?, updated_at = NOW() WHERE id = ?');
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();
    echo json_encode(['success' => true]);
}

// DELETE - delete applicant
elseif ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    $stmt = $db->prepare('DELETE FROM teacher_applicants WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['deleted' => true]);
}

$db->close();
?>