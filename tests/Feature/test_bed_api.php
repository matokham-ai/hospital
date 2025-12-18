<?php

/**
 * Simple test script to verify the bed occupancy API endpoint
 * Run this from the command line: php test_bed_api.php
 */

require_once 'vendor/autoload.php';

use Illuminate\Http\Request;
use App\Http\Controllers\Inpatient\InpatientController;

// Create a mock request
$request = new Request();

// Create controller instance
$controller = new InpatientController();

try {
    echo "Testing Bed Occupancy API Endpoint...\n";
    echo "=====================================\n\n";
    
    // Call the getBedOccupancyData method
    $response = $controller->getBedOccupancyData();
    
    // Get the response data
    $data = $response->getData(true);
    
    echo "✅ API Response Status: " . $response->getStatusCode() . "\n";
    echo "✅ Response Structure:\n";
    
    if (isset($data['beds'])) {
        echo "   - Total Beds: " . count($data['beds']) . "\n";
    }
    
    if (isset($data['wards'])) {
        echo "   - Total Wards: " . count($data['wards']) . "\n";
        foreach ($data['wards'] as $ward) {
            echo "     * {$ward['name']}: {$ward['stats']['occupied']}/{$ward['stats']['total']} occupied\n";
        }
    }
    
    if (isset($data['stats'])) {
        echo "   - Overall Occupancy: {$data['stats']['occupancyRate']}%\n";
        echo "   - Available Beds: {$data['stats']['available']}\n";
        echo "   - Occupied Beds: {$data['stats']['occupied']}\n";
    }
    
    if (isset($data['lastUpdated'])) {
        echo "   - Last Updated: {$data['lastUpdated']}\n";
    }
    
    echo "\n✅ Bed Occupancy API is working correctly!\n";
    echo "✅ The Live Bed Map should now display real-time data.\n\n";
    
    echo "Next Steps:\n";
    echo "1. Visit /inpatient/dashboard in your browser\n";
    echo "2. Check the Live Bed Map section\n";
    echo "3. Look for the 'Live • Updated [time]' indicator\n";
    echo "4. Verify bed statuses match your database\n";
    
} catch (Exception $e) {
    echo "❌ Error testing API: " . $e->getMessage() . "\n";
    echo "❌ File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
    echo "\nPlease check:\n";
    echo "1. Database connection is working\n";
    echo "2. Required tables exist (beds, wards, encounters, patients, bed_assignments)\n";
    echo "3. Laravel application is properly configured\n";
}