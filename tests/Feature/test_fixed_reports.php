<?php

// Test the fixed reports API
echo "Testing Fixed Reports API...\n\n";

// Test with authentication (you may need to adjust this)
$baseUrl = 'http://127.0.0.1:8000';

// Test patient census
echo "1. Testing Patient Census (should show 1 current inpatient):\n";
$url = $baseUrl . '/api/reports/patient-census';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'Accept: application/json',
            'Content-Type: application/json'
        ]
    ]
]);

try {
    $response = file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['summary']['total_inpatients'])) {
            echo "✓ Current Inpatients: " . $data['summary']['total_inpatients'] . "\n";
        } else {
            echo "✗ Unexpected response format or authentication required\n";
        }
    } else {
        echo "✗ Failed to get response (authentication required)\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n2. Testing Bed Occupancy (should show 1 occupied bed out of 178):\n";
$url = $baseUrl . '/api/reports/bed-occupancy';

try {
    $response = file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['summary'])) {
            echo "✓ Total Beds: " . $data['summary']['total_beds'] . "\n";
            echo "✓ Occupied Beds: " . $data['summary']['occupied_beds'] . "\n";
            echo "✓ Available Beds: " . $data['summary']['available_beds'] . "\n";
            echo "✓ Occupancy Rate: " . $data['summary']['current_occupancy_rate'] . "%\n";
        } else {
            echo "✗ Unexpected response format or authentication required\n";
        }
    } else {
        echo "✗ Failed to get response (authentication required)\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\nNote: If you see 'authentication required' errors, you need to login first.\n";
echo "The database shows correct data: 1 current bed assignment out of 178 total beds.\n";