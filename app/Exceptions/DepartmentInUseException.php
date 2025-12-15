<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentInUseException extends Exception
{
    protected $department;
    protected $references;

    public function __construct($department, array $references = [], $message = null)
    {
        $this->department = $department;
        $this->references = $references;
        
        $defaultMessage = "Department '{$department->name}' cannot be deleted because it has active references.";
        if (!empty($references)) {
            $referenceList = implode(', ', array_map(function($ref) {
                return "{$ref['count']} {$ref['type']}";
            }, $references));
            $defaultMessage .= " References: {$referenceList}.";
        }
        
        parent::__construct($message ?? $defaultMessage);
    }

    public function getDepartment()
    {
        return $this->department;
    }

    public function getReferences(): array
    {
        return $this->references;
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error' => 'DEPARTMENT_IN_USE',
            'department' => [
                'id' => $this->department->id,
                'name' => $this->department->name,
                'code' => $this->department->code,
            ],
            'references' => $this->references,
            'suggestions' => [
                'You can deactivate the department instead of deleting it.',
                'Remove all references before attempting to delete.',
                'Transfer associated records to another department first.'
            ]
        ], 422);
    }
}
