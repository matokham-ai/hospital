import React, { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Prescription {
    id: number;
    drug_id: number;
    drug_name: string;
    dosage: string;
    frequency: string;
    duration: number;
    quantity: number;
    instant_dispensing: boolean;
    created_at?: string;
    updated_at?: string;
}

interface PrescriptionListProps {
    prescriptions: Prescription[];
    isConsultationCompleted: boolean;
    onEdit: (prescription: Prescription) => void;
    onDelete: (prescriptionId: number) => void;
}

/**
 * PrescriptionList Component
 * 
 * Displays all prescriptions created during a consultation with edit/delete actions.
 * Shows instant dispensing status and supports inline editing before consultation completion.
 * 
 * Requirements: 6.1 (display prescriptions), 6.3 (edit/delete prescriptions)
 */
export default function PrescriptionList({
    prescriptions,
    isConsultationCompleted,
    onEdit,
    onDelete,
}: PrescriptionListProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    /**
     * Handle prescription deletion
     * Requirement 6.5: Delete prescription and release reserved stock
     */
    const handleDelete = async (prescriptionId: number) => {
        if (isConsultationCompleted) {
            return; // Requirement 5.5: Prevent modifications after completion
        }

        setDeletingId(prescriptionId);
        try {
            await onDelete(prescriptionId);
        } finally {
            setDeletingId(null);
        }
    };

    /**
     * Handle prescription edit
     * Requirement 6.3: Allow editing before consultation completion
     */
    const handleEdit = (prescription: Prescription) => {
        if (isConsultationCompleted) {
            return; // Requirement 5.5: Prevent modifications after completion
        }

        onEdit(prescription);
    };

    // Requirement 6.1: Display all prescriptions in consultation
    if (prescriptions.length === 0) {
        return (
            <div 
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                role="status"
                aria-label="No prescriptions added yet"
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-3xl" aria-hidden="true">💊</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700">
                            No Prescriptions Yet
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Add medications to this consultation using the prescription form above.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="space-y-3"
            role="region"
            aria-label="Prescription list"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 
                    className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                    id="prescription-list-heading"
                >
                    <span aria-hidden="true">💊</span> Prescriptions
                    <span className="text-sm font-normal text-gray-500">
                        ({prescriptions.length})
                    </span>
                </h3>
                {isConsultationCompleted && (
                    <div 
                        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                        role="status"
                        aria-label="Consultation completed, prescriptions are read-only"
                    >
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>Consultation completed - read only</span>
                    </div>
                )}
            </div>

            {/* Requirement 6.1: Display all prescriptions with clear visual grouping */}
            <div 
                className="space-y-3"
                role="list"
                aria-labelledby="prescription-list-heading"
            >
                {prescriptions.map((prescription) => (
                    <div
                        key={prescription.id}
                        className={cn(
                            'bg-white border rounded-lg p-4 transition-all',
                            isConsultationCompleted
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                        )}
                        role="listitem"
                        aria-label={`Prescription for ${prescription.drug_name}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            {/* Prescription Details */}
                            <div className="flex-1">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl">💊</span>
                                    </div>
                                    <div className="flex-1">
                                        {/* Drug Name */}
                                        <h4 className="font-semibold text-gray-900 text-base">
                                            {prescription.drug_name}
                                        </h4>

                                        {/* Prescription Details Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                                    Dosage
                                                </span>
                                                <p className="text-sm font-medium text-gray-900 mt-0.5">
                                                    {prescription.dosage}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                                    Frequency
                                                </span>
                                                <p className="text-sm font-medium text-gray-900 mt-0.5">
                                                    {prescription.frequency}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                                    Duration
                                                </span>
                                                <p className="text-sm font-medium text-gray-900 mt-0.5">
                                                    {prescription.duration} days
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                                    Quantity
                                                </span>
                                                <p className="text-sm font-medium text-gray-900 mt-0.5">
                                                    {prescription.quantity} units
                                                </p>
                                            </div>
                                        </div>

                                        {/* Requirement 3.1, 3.5: Show instant dispensing status */}
                                        {prescription.instant_dispensing && (
                                            <div className="mt-3 inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                                <CheckCircle2 className="w-4 h-4 text-red-600" />
                                                <span className="text-sm font-semibold text-red-900">
                                                    🚨 Instant Dispensing (Emergency)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Requirement 6.3: Edit/Delete actions */}
                            {!isConsultationCompleted && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(prescription)}
                                        className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-400"
                                        aria-label={`Edit prescription for ${prescription.drug_name}`}
                                    >
                                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(prescription.id)}
                                        disabled={deletingId === prescription.id}
                                        className="flex items-center gap-2 hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                                        aria-label={`Delete prescription for ${prescription.drug_name}`}
                                        aria-disabled={deletingId === prescription.id}
                                    >
                                        {deletingId === prescription.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                                                <span className="hidden sm:inline">Deleting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                <span className="hidden sm:inline">Delete</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Footer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">
                            Total Prescriptions:
                        </span>
                        <span className="text-lg font-bold text-blue-900">
                            {prescriptions.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">
                            Instant Dispensing:
                        </span>
                        <span className="text-lg font-bold text-blue-900">
                            {prescriptions.filter((p) => p.instant_dispensing).length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
