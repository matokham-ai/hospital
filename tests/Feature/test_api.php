<?php
// Simple test script to verify the API endpoint
echo "Testing Live Patient Profiles API...\n";

// You can run this with: php test_api.php
// Or test the endpoint directly at: http://your-domain/inpatient/api/live-patient-profiles

$url = 'http://localhost/hospital_management/public/inpatient/api/live-patient-profiles';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Accept: application/json',
        'timeout' => 10
    ]
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    echo "❌ Failed to connect to API endpoint\n";
    echo "Make sure your server is running and the URL is correct\n";
} else {
    $data = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo "✅ API endpoint is working!\n";
        echo "📊 Found " . count($data) . " patients\n";
        
        if (!empty($data)) {
            $patient = $data[0];
            echo "👤 Sample patient: " . $patient['name'] . "\n";
            echo "🏥 Bed: " . $patient['bedNumber'] . " | Ward: " . $patient['ward'] . "\n";
            echo "💓 Vitals: HR " . $patient['vitals']['hr'] . " bpm, BP " . $patient['vitals']['bp'] . "\n";
        }
    } else {
        echo "❌ Invalid JSON response\n";
        echo "Response: " . substr($response, 0, 200) . "...\n";
    }
}

echo "\nDone!\n";
?>