import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/useAccessibleForm';

interface Prescription {
    id: number;
    drug_id: number;
    drug_name: string;
    dosage: string;
    frequency: string;
    duration: number;
    quantity: number;
    instant_dispensing: boolean;
}

interface LabOrder {
    id: number;
    test_id: number;
    test_name: string;
    priority: 'urgent' | 'fast' | 'normal';
    clinical_notes?: string;
}

interface CompletionSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    prescriptions: Prescription[];
    labOrders: LabOrder[];
    isLoading: boolean;
}

/**
 * CompletionSummaryModal Component
 * 
 * Displays a summary of all prescriptions and lab orders before completing a consultation.
 * Shows instant dispensing prescriptions separately and requires confirmation.
 * 
 * Requirement 5.1: Display summary of all prescriptions and lab orders created
 */
export default function CompletionSummaryModal({
    isOpen,
    onClose,
    onConfirm,
    prescriptions,
    labOrders,
    isLoading,
}: CompletionSummaryModalProps) {
    /**
     * Get priority badge color classes
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

    // Requirement 5.1: Separate instant dispensing prescriptions
    const instantDispensingPrescriptions = prescriptions.filter((p) => p.instant_dispensing);
    const regularPrescriptions = prescriptions.filter((p) => !p.instant_dispensing);

    const hasInstantDispensing = instantDispensingPrescriptions.length > 0;
    const hasPrescriptions = prescriptions.length > 0;
    const hasLabOrders = labOrders.length > 0;
    
    // Accessibility: Focus trap for modal
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(isOpen, modalRef);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="max-w-3xl max-h-[90vh] overflow-y-auto"
                ref={modalRef}
                aria-describedby="completion-summary-description"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />
                        Complete Consultation
                    </DialogTitle>
                    <DialogDescription id="completion-summary-description">
                        Review the summary below before completing this consultation. All prescriptions and lab orders will be processed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Requirement 5.1: Show instant dispensing prescriptions separately */}
                    {hasInstantDispensing && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <h3 className="text-lg font-semibold text-red-900">
                                    🚨 Instant Dispensing Prescriptions ({instantDispensingPrescriptions.length})
                                </h3>
                            </div>
                            <p className="text-sm text-red-700 mb-4">
                                These medications will be dispensed immediately upon completion.
                            </p>
                            <div className="space-y-2">
                                {instantDispensingPrescriptions.map((prescription) => (
                                    <div
                                        key={prescription.id}
                                        className="bg-white border border-red-200 rounded-lg p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-lg">💊</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">
                                                    {prescription.drug_name}
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Dosage:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.dosage}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Frequency:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.frequency}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Duration:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.duration} days
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Quantity:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.quantity} units
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Requirement 5.1: Display all prescriptions */}
                    {regularPrescriptions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">💊</span>
                                <h3 className="text-lg font-semibold text-blue-900">
                                    Regular Prescriptions ({regularPrescriptions.length})
                                </h3>
                            </div>
                            <p className="text-sm text-blue-700 mb-4">
                                These prescriptions will be sent to the pharmacy for dispensing.
                            </p>
                            <div className="space-y-2">
                                {regularPrescriptions.map((prescription) => (
                                    <div
                                        key={prescription.id}
                                        className="bg-white border border-blue-200 rounded-lg p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-lg">💊</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">
                                                    {prescription.drug_name}
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Dosage:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.dosage}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Frequency:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.frequency}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Duration:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.duration} days
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Quantity:</span>
                                                        <span className="ml-1 font-medium text-gray-900">
                                                            {prescription.quantity} units
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Requirement 5.1: Display all lab orders */}
                    {hasLabOrders && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">🧪</span>
                                <h3 className="text-lg font-semibold text-purple-900">
                                    Lab Orders ({labOrders.length})
                                </h3>
                            </div>
                            <p className="text-sm text-purple-700 mb-4">
                                These lab tests will be submitted to the laboratory with their priority levels.
                            </p>
                            <div className="space-y-2">
                                {labOrders.map((labOrder) => (
                                    <div
                                        key={labOrder.id}
                                        className="bg-white border border-purple-200 rounded-lg p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <span className="text-lg">🧪</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {labOrder.test_name}
                                                    </h4>
                                                    {labOrder.clinical_notes && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {labOrder.clinical_notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!hasPrescriptions && !hasLabOrders && (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700">
                                        No Prescriptions or Lab Orders
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        This consultation will be completed without any prescriptions or lab orders.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Summary Statistics */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {prescriptions.length}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Total Prescriptions
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {instantDispensingPrescriptions.length}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Instant Dispensing
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {labOrders.length}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Lab Orders
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {labOrders.filter((l) => l.priority === 'urgent').length}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Urgent Tests
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                                    Important Notice
                                </h4>
                                <p className="text-sm text-yellow-700">
                                    Once you complete this consultation, you will not be able to modify prescriptions or lab orders. 
                                    Please review all information carefully before confirming.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                        aria-label="Cancel consultation completion"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        aria-label={isLoading ? 'Completing consultation' : 'Complete consultation'}
                        aria-disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                <span>Completing...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                                <span>Complete Consultation</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
