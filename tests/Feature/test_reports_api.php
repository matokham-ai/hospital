<?php

require_once 'vendor/autoload.php';

use Illuminate\Http\Request;

// Test the reports API endpoints
$baseUrl = 'http://127.0.0.1:8000';

echo "Testing Reports API Endpoints...\n\n";

// Test bed occupancy endpoint
echo "1. Testing Bed Occupancy API:\n";
$url = $baseUrl . '/api/reports/bed-occupancy';
echo "URL: $url\n";

try {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Accept: application/json',
                'Content-Type: application/json'
            ]
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['summary'])) {
            echo "✓ Bed Occupancy API working!\n";
            echo "  Total Beds: " . $data['summary']['total_beds'] . "\n";
            echo "  Occupied Beds: " . $data['summary']['occupied_beds'] . "\n";
            echo "  Occupancy Rate: " . $data['summary']['current_occupancy_rate'] . "%\n";
        } else {
            echo "✗ Unexpected response format\n";
            echo "Response: " . substr($response, 0, 200) . "...\n";
        }
    } else {
        echo "✗ Failed to get response\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test revenue endpoint
echo "2. Testing Revenue API:\n";
$url = $baseUrl . '/api/reports/revenue-department';
echo "URL: $url\n";

try {
    $response = file_get_contents($url, false, $context);
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['summary'])) {
            echo "✓ Revenue API working!\n";
            echo "  Total Revenue: " . number_format($data['summary']['total_revenue'], 2) . "\n";
            echo "  Total Transactions: " . $data['summary']['total_transactions'] . "\n";
        } else {
            echo "✗ Unexpected response format\n";
            echo "Response: " . substr($response, 0, 200) . "...\n";
        }
    } else {
        echo "✗ Failed to get response\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}

echo "\nTest completed!\n";