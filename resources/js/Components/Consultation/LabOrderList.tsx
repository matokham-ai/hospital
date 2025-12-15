import React, { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Edit2, Trash2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabOrder {
    id: number;
    test_id: number;
    test_name: string;
    priority: 'urgent' | 'fast' | 'normal';
    clinical_notes?: string;
    expected_completion_at?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

interface LabOrderListProps {
    labOrders: LabOrder[];
    isConsultationCompleted: boolean;
    onEdit: (labOrder: LabOrder) => void;
    onDelete: (labOrderId: number) => void;
}

/**
 * LabOrderList Component
 * 
 * Displays all lab orders created during a consultation with edit/delete actions.
 * Shows priority levels with color-coded badges and supports inline editing before consultation completion.
 * 
 * Requirements: 6.2 (display lab orders with priority), 6.4 (edit/delete lab orders)
 */
export default function LabOrderList({
    labOrders,
    isConsultationCompleted,
    onEdit,
    onDelete,
}: LabOrderListProps) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    /**
     * Get priority badge color classes
     * Requirement 6.2: Display priority levels clearly indicated
     */
    const getPriorityBadgeClasses = (priority: 'urgent' | 'fast' | 'normal'): string => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'fast':
                return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'normal':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    /**
     * Get priority label
     */
    const getPriorityLabel = (priority: 'urgent' | 'fast' | 'normal'): string => {
        switch (priority) {
            case 'urgent':
                return 'Urgent';
            case 'fast':
                return 'Fast';
            case 'normal':
                return 'Normal';
            default:
                return 'Normal';
        }
    };

    /**
     * Get priority icon
     */
    const getPriorityIcon = (priority: 'urgent' | 'fast' | 'normal'): string => {
        switch (priority) {
            case 'urgent':
                return '🚨';
            case 'fast':
                return '⚡';
            case 'normal':
                return '📋';
            default:
                return '📋';
        }
    };

    /**
     * Format turnaround time for display
     */
    const formatTurnaroundTime = (priority: 'urgent' | 'fast' | 'normal'): string => {
        switch (priority) {
            case 'urgent':
                return '2 hours';
            case 'fast':
                return '6 hours';
            case 'normal':
                return '24 hours';
            default:
                return '24 hours';
        }
    };

    /**
     * Handle lab order deletion
     * Requirement 6.4: Delete lab order
     */
    const handleDelete = async (labOrderId: number) => {
        if (isConsultationCompleted) {
            return; // Requirement 5.5: Prevent modifications after completion
        }

        setDeletingId(labOrderId);
        try {
            await onDelete(labOrderId);
        } finally {
            setDeletingId(null);
        }
    };

    /**
     * Handle lab order edit
     * Requirement 6.4: Allow editing before consultation completion
     */
    const handleEdit = (labOrder: LabOrder) => {
        if (isConsultationCompleted) {
            return; // Requirement 5.5: Prevent modifications after completion
        }

        onEdit(labOrder);
    };

    // Requirement 6.2: Display all lab orders in consultation
    if (labOrders.length === 0) {
        return (
            <div 
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
                role="status"
                aria-label="No lab orders added yet"
            >
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-3xl" aria-hidden="true">🧪</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700">
                            No Lab Orders Yet
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Add laboratory tests to this consultation using the lab order form above.
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
            aria-label="Lab order list"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 
                    className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                    id="lab-order-list-heading"
                >
                    <span aria-hidden="true">🧪</span> Lab Orders
                    <span className="text-sm font-normal text-gray-500">
                        ({labOrders.length})
                    </span>
                </h3>
                {isConsultationCompleted && (
                    <div 
                        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full"
                        role="status"
                        aria-label="Consultation completed, lab orders are read-only"
                    >
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        <span>Consultation completed - read only</span>
                    </div>
                )}
            </div>

            {/* Requirement 6.2: Display all lab orders with priority levels clearly indicated */}
            <div 
                className="space-y-3"
                role="list"
                aria-labelledby="lab-order-list-heading"
            >
                {labOrders.map((labOrder) => (
                    <div
                        key={labOrder.id}
                        className={cn(
                            'bg-white border rounded-lg p-4 transition-all',
                            isConsultationCompleted
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-gray-300 hover:border-blue-400 hover:shadow-md'
                        )}
                        role="listitem"
                        aria-label={`Lab order for ${labOrder.test_name} with ${labOrder.priority} priority`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            {/* Lab Order Details */}
                            <div className="flex-1">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl">🧪</span>
                                    </div>
                                    <div className="flex-1">
                                        {/* Test Name */}
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="font-semibold text-gray-900 text-base">
                                                {labOrder.test_name}
                                            </h4>
                                            
                                            {/* Requirement 6.2: Priority badge with clear indication */}
                                            <span
                                                className={cn(
                                                    'px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 flex-shrink-0',
                                                    getPriorityBadgeClasses(labOrder.priority)
                                                )}
                                            >
                                                <span>{getPriorityIcon(labOrder.priority)}</span>
                                                <span>{getPriorityLabel(labOrder.priority)}</span>
                                            </span>
                                        </div>

                                        {/* Expected Turnaround Time */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                            <Clock className="w-4 h-4" />
                                            <span>Expected turnaround: {formatTurnaroundTime(labOrder.priority)}</span>
                                        </div>

                                        {/* Clinical Notes */}
                                        {labOrder.clinical_notes && (
                                            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                <span className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1">
                                                    Clinical Notes
                                                </span>
                                                <p className="text-sm text-gray-700">
                                                    {labOrder.clinical_notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Requirement 6.4: Edit/Delete actions */}
                            {!isConsultationCompleted && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(labOrder)}
                                        className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-400"
                                        aria-label={`Edit lab order for ${labOrder.test_name}`}
                                    >
                                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(labOrder.id)}
                                        disabled={deletingId === labOrder.id}
                                        className="flex items-center gap-2 hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                                        aria-label={`Delete lab order for ${labOrder.test_name}`}
                                        aria-disabled={deletingId === labOrder.id}
                                    >
                                        {deletingId === labOrder.id ? (
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
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-900">
                            Total Lab Orders:
                        </span>
                        <span className="text-lg font-bold text-blue-900">
                            {labOrders.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-red-700">
                                🚨 Urgent:
                            </span>
                            <span className="text-sm font-bold text-red-700">
                                {labOrders.filter((l) => l.priority === 'urgent').length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-orange-700">
                                ⚡ Fast:
                            </span>
                            <span className="text-sm font-bold text-orange-700">
                                {labOrders.filter((l) => l.priority === 'fast').length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-blue-700">
                                📋 Normal:
                            </span>
                            <span className="text-sm font-bold text-blue-700">
                                {labOrders.filter((l) => l.priority === 'normal').length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
