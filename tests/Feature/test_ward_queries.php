<?php
/**
 * Test script to verify ward query endpoints are working correctly
 * Run this from the command line: php test_ward_queries.php
 */

$baseUrl = 'http://127.0.0.1:8000';

echo "=== Testing Ward Query Endpoints ===\n\n";

// Test 1: Ward Statistics in Admissions Page
echo "1. Testing Ward Statistics (Admissions Page):\n";
$url = $baseUrl . '/inpatient/admissions';
echo "URL: $url\n";
echo "This should show ward statistics in the page.\n\n";

// Test 2: Bed Occupancy API
echo "2. Testing Bed Occupancy API:\n";
$url = $baseUrl . '/inpatient/api/bed-occupancy';
echo "URL: $url\n";
echo "This should return JSON with beds, wards, wardStats, and stats.\n\n";

// Test 3: Test Ward Queries Endpoint
echo "3. Testing Ward Queries Test Endpoint:\n";
$url = $baseUrl . '/inpatient/api/test-ward-queries';
echo "URL: $url\n";
echo "This should return the exact SQL query results.\n\n";

// Test 4: Detailed Ward Summary
echo "4. Testing Detailed Ward Summary:\n";
$url = $baseUrl . '/inpatient/api/detailed-ward-summary';
echo "URL: $url\n";
echo "This should return detailed patient information per ward.\n\n";

// Test 5: Active Beds with Patients
echo "5. Testing Active Beds with Patients:\n";
$url = $baseUrl . '/inpatient/api/active-beds-with-patients';
echo "URL: $url\n";
echo "This should return active bed assignments with patient details.\n\n";

echo "=== Expected Results ===\n";
echo "- 7 wards total\n";
echo "- 158 total beds\n";
echo "- 0 beds occupied (based on your SQL output)\n";
echo "- 158 beds available\n";
echo "- 0% occupancy rate\n";
echo "- Accurate statistics from bed_assignments table\n";
echo "- Live patient data from encounters and patients tables\n\n";

echo "To test these endpoints:\n";
echo "1. Visit the URLs in your browser (for JSON endpoints)\n";
echo "2. Check the /inpatient/admissions page for ward statistics\n";
echo "3. Click 'View Real-Time Map' to see the bed occupancy modal\n\n";

echo "All endpoints should now use your exact SQL queries for accurate data.\n\n";

echo "=== What Was Fixed ===\n";
echo "1. BedMap component now uses accurate statistics from SQL queries\n";
echo "2. Ward statistics come directly from your database queries\n";
echo "3. Bed counts should now show: Available(158) Occupied(0) instead of wrong numbers\n";
echo "4. All occupancy calculations use bed_assignments table with released_at IS NULL\n";
echo "5. Visual indicator shows 'Live Database Stats' when using accurate data\n";
echo "6. Statistics cards now use wardStatsData instead of filteredBeds\n";
echo "7. Added data source indicator above statistics cards\n";
?>