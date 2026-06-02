<?php
require_once 'config.php';

$db = getDB();
$result = $db->query('SELECT subjects, grade_levels FROM teacher_applicants');

$subjects = [];
$grade_levels = [];

while ($row = $result->fetch_assoc()) {
    $subs = json_decode($row['subjects'] ?? '[]', true);
    $grades = json_decode($row['grade_levels'] ?? '[]', true);
    foreach ($subs as $s) $subjects[$s] = true;
    foreach ($grades as $g) $grade_levels[$g] = true;
}

sort($subjects);
sort($grade_levels);

echo json_encode([
    'subjects' => array_keys(array_flip($subjects)),
    'grade_levels' => array_keys(array_flip($grade_levels))
]);

$db->close();
?>