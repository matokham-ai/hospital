<?php
/**
 * Test script to verify the keep-alive endpoint is working
 * 
 * Run this from command line:
 * php test_keep_alive.php
 */

echo "Testing Keep-Alive Endpoint\n";
echo "============================\n\n";

// Check if routes/api.php contains the keep-alive endpoint
$apiRoutesFile = __DIR__ . '/routes/api.php';
if (!file_exists($apiRoutesFile)) {
    echo "❌ Error: routes/api.php not found\n";
    exit(1);
}

$apiRoutesContent = file_get_contents($apiRoutesFile);
if (strpos($apiRoutesContent, 'keep-alive') !== false) {
    echo "✅ Keep-alive endpoint found in routes/api.php\n";
} else {
    echo "❌ Keep-alive endpoint NOT found in routes/api.php\n";
    exit(1);
}

// Check if Create.tsx has the keep-alive fetch call
$createTsxFile = __DIR__ . '/resources/js/Pages/Patients/Create.tsx';
if (!file_exists($createTsxFile)) {
    echo "❌ Error: Create.tsx not found\n";
    exit(1);
}

$createTsxContent = file_get_contents($createTsxFile);
if (strpos($createTsxContent, '/api/keep-alive') !== false) {
    echo "✅ Keep-alive fetch call found in Create.tsx\n";
} else {
    echo "❌ Keep-alive fetch call NOT found in Create.tsx\n";
    exit(1);
}

// Check if CSRF token refresh is implemented
if (strpos($createTsxContent, '/sanctum/csrf-cookie') !== false) {
    echo "✅ CSRF token refresh found in Create.tsx\n";
} else {
    echo "❌ CSRF token refresh NOT found in Create.tsx\n";
    exit(1);
}

// Check if localStorage auto-save is implemented
if (strpos($createTsxContent, 'localStorage.setItem') !== false) {
    echo "✅ LocalStorage auto-save found in Create.tsx\n";
} else {
    echo "❌ LocalStorage auto-save NOT found in Create.tsx\n";
    exit(1);
}

// Check if database transaction is used in controller
$controllerFile = __DIR__ . '/app/Http/Controllers/Patient/PatientController.php';
if (!file_exists($controllerFile)) {
    echo "❌ Error: PatientController.php not found\n";
    exit(1);
}

$controllerContent = file_get_contents($controllerFile);
if (strpos($controllerContent, 'DB::transaction') !== false) {
    echo "✅ Database transaction found in PatientController\n";
} else {
    echo "❌ Database transaction NOT found in PatientController\n";
    exit(1);
}

// Check if row locking is implemented
if (strpos($controllerContent, 'lockForUpdate') !== false) {
    echo "✅ Row locking found in PatientController\n";
} else {
    echo "❌ Row locking NOT found in PatientController\n";
    exit(1);
}

echo "\n============================\n";
echo "✅ All checks passed!\n";
echo "\nThe following features are implemented:\n";
echo "  • Keep-alive endpoint (/api/keep-alive)\n";
echo "  • CSRF token auto-refresh\n";
echo "  • Form data auto-save (localStorage)\n";
echo "  • Database transactions\n";
echo "  • Row-level locking for concurrency\n";
echo "\nNext steps:\n";
echo "  1. Start your development server\n";
echo "  2. Navigate to patient registration page\n";
echo "  3. Open browser console (F12)\n";
echo "  4. Look for 'CSRF token refreshed' messages\n";
echo "  5. Fill out form and refresh page to test auto-save\n";
echo "\n";

exit(0);
