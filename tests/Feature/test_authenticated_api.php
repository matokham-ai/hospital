<?php
// Test the API endpoints with proper Laravel session handling
require_once 'vendor/autoload.php';

use Illuminate\Http\Request;
use App\Http\Controllers\Inpatient\InpatientController;

echo "Testing Patient Search Functionality...\n\n";

// Create a mock request
$request = new Request();
$request->merge(['q' => 'John']);

// Create controller instance
$controller = new InpatientController();

try {
    // Test the searchPatients method directly
    echo "1. Testing searchPatients method directly:\n";
    $response = $controller->searchPatients($request);
    $data = $response->getData(true);
    
    echo "✅ Search method works!\n";
    echo "📊 Found " . count($data) . " patients matching 'John'\n";
    
    if (!empty($data)) {
        foreach ($data as $patient) {
            echo "👤 Patient: " . $patient['name'] . " (ID: " . $patient['id'] . ")\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n";

try {
    // Test the getAvailableDoctors method directly
    echo "2. Testing getAvailableDoctors method directly:\n";
    $response = $controller->getAvailableDoctors();
    $data = $response->getData(true);
    
    echo "✅ Doctors method works!\n";
    echo "👨‍⚕️ Found " . count($data) . " available doctors\n";
    
    if (!empty($data)) {
        foreach ($data as $doctor) {
            echo "🩺 Doctor: " . $doctor['name'] . " - " . $doctor['specialization'] . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\nDone!\n";
?>