<?php

/**
 * Script to add branch_id to model fillable arrays
 * Run with: php update_models_branch.php
 */

$models = [
    'app/Models/Patient.php',
    'app/Models/Appointment.php',
    'app/Models/OpdAppointment.php',
    'app/Models/Encounter.php',
    'app/Models/VitalSign.php',
    'app/Models/TriageAssessment.php',
    'app/Models/LabOrder.php',
    'app/Models/LabResult.php',
    'app/Models/ImagingOrder.php',
    'app/Models/ImagingReport.php',
    'app/Models/Prescription.php',
    'app/Models/Dispensation.php',
    'app/Models/PharmacyStore.php',
    'app/Models/PharmacyStock.php',
    'app/Models/StockMovement.php',
    'app/Models/Physician.php',
    'app/Models/Department.php',
    'app/Models/Ward.php',
    'app/Models/Bed.php',
    'app/Models/BedAssignment.php',
    'app/Models/EmergencyPatient.php',
    'app/Models/OpdQueue.php',
    'app/Models/Deposit.php',
    'app/Models/InsuranceClaim.php',
    'app/Models/LedgerEntry.php',
];

$branchRelationship = <<<'PHP'

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
PHP;

$scopeMethod = <<<'PHP'

    public function scopeForBranch($query, $branchId)
    {
        return $branchId ? $query->where('branch_id', $branchId) : $query;
    }
PHP;

foreach ($models as $modelPath) {
    if (!file_exists($modelPath)) {
        echo "⚠️  Skipping $modelPath (file not found)\n";
        continue;
    }

    $content = file_get_contents($modelPath);
    $modified = false;

    // Check if branch_id is already in fillable
    if (strpos($content, "'branch_id'") === false) {
        // Find the $fillable array and add branch_id
        $pattern = '/(\$fillable\s*=\s*\[)(.*?)(\];)/s';
        if (preg_match($pattern, $content, $matches)) {
            $fillableContent = $matches[2];
            // Add branch_id to the end of the array
            $newFillable = rtrim($fillableContent, "\n\r\t ,") . ",\n        'branch_id',\n    ";
            $content = str_replace($matches[0], $matches[1] . $newFillable . $matches[3], $content);
            $modified = true;
            echo "✅ Added branch_id to fillable in $modelPath\n";
        }
    }

    // Check if branch relationship exists
    if (strpos($content, 'function branch()') === false) {
        // Find the last closing brace of the class and add the relationship before it
        $lastBrace = strrpos($content, '}');
        if ($lastBrace !== false) {
            $content = substr_replace($content, $branchRelationship . "\n" . $scopeMethod . "\n}", $lastBrace, 1);
            $modified = true;
            echo "✅ Added branch relationship and scope to $modelPath\n";
        }
    }

    if ($modified) {
        file_put_contents($modelPath, $content);
    } else {
        echo "ℹ️  No changes needed for $modelPath\n";
    }
}

echo "\n✨ Model update complete!\n";
