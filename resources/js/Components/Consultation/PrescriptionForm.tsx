import React, { useState, useEffect } from 'react';
import { Patient } from '@/types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Checkbox } from '@/Components/ui/checkbox';
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibleForm } from '@/hooks/useAccessibleForm';

interface DrugFormulary {
    id: number;
    name: string;
    generic_name: string;
    brand_name?: string | null;
    strength: string;
    form: string;
    unit_price: string | number;
    stock_quantity?: number;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface PrescriptionData {
    drug_id: number;
    drug_name: string;
    dosage: string;
    frequency: string;
    duration: number;
    quantity: number;
    instant_dispensing: boolean;
}

interface DrugInteraction {
    drug_name: string;
    severity: 'mild' | 'moderate' | 'severe';
    description: string;
}

interface PrescriptionFormProps {
    drug: DrugFormulary;
    patient: Patient;
    isEmergencyPatient: boolean;
    appointmentId: number;
    onSave: (prescription: PrescriptionData) => void;
    onCancel: () => void;
}

/**
 * PrescriptionForm Component
 * 
 * Form for creating prescriptions with instant dispensing support for emergency patients.
 * Includes validation, drug interaction warnings, and allergy checking.
 * 
 * Requirements: 2.4, 2.5, 2.6, 2.7, 3.1, 3.4
 */
export default function PrescriptionForm({
    drug,
    patient,
    isEmergencyPatient,
    appointmentId,
    onSave,
    onCancel,
}: PrescriptionFormProps) {
    // Form state - Requirement 2.4: Auto-populate prescription fields
    const [dosage, setDosage] = useState(drug.strength || '');
    const [frequency, setFrequency] = useState('Twice daily');
    const [duration, setDuration] = useState(7);
    const [quantity, setQuantity] = useState(30);
    const [instantDispensing, setInstantDispensing] = useState(false);

    // Validation and checking state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([]);
    const [allergyConflict, setAllergyConflict] = useState<string | null>(null);
    const [stockValidation, setStockValidation] = useState<{
        isValid: boolean;
        message: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
    
    // Accessibility: Announce errors to screen readers
    const { errorAnnouncementRef } = useAccessibleForm(errors);

    // Check for drug interactions and allergies on mount - Requirements 2.6, 2.7
    useEffect(() => {
        checkDrugInteractionsAndAllergies();
    }, [drug.id, patient.id]);

    // Validate stock when instant dispensing is toggled - Requirement 3.2
    useEffect(() => {
        if (instantDispensing && quantity > 0) {
            validateStock();
        } else {
            setStockValidation(null);
        }
    }, [instantDispensing, quantity]);

    /**
     * Check for drug interactions and allergies
     * Requirements: 2.6 (drug interactions), 2.7 (allergy checking)
     */
    const checkDrugInteractionsAndAllergies = async () => {
        setIsCheckingInteractions(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(`/api/opd/appointments/${appointmentId}/prescriptions/check`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    drug_id: drug.id,
                    patient_id: patient.id,
                }),
            });

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error('Session expired while checking drug interactions');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                
                // Requirement 2.6: Display drug interaction warnings
                if (data.interactions && data.interactions.length > 0) {
                    setDrugInteractions(data.interactions);
                }
                
                // Requirement 2.7: Block prescription if allergy conflict
                if (data.allergy_conflict) {
                    setAllergyConflict(data.allergy_message || 'Patient is allergic to this medication');
                }
            }
        } catch (error) {
            console.error('Failed to check drug interactions and allergies:', error);
        } finally {
            setIsCheckingInteractions(false);
        }
    };

    /**
     * Validate stock availability for instant dispensing
     * Requirement 3.2: Validate sufficient stock exists
     */
    const validateStock = async () => {
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            
            const response = await fetch(`/api/opd/appointments/${appointmentId}/prescriptions/validate-stock`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    drug_id: drug.id,
                    quantity: quantity,
                }),
            });

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error('Session expired while validating stock');
                setStockValidation({
                    isValid: false,
                    message: 'Session expired. Please refresh the page.',
                });
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setStockValidation({
                    isValid: data.is_valid,
                    message: data.message,
                });
            }
        } catch (error) {
            console.error('Failed to validate stock:', error);
            setStockValidation({
                isValid: false,
                message: 'Unable to validate stock availability',
            });
        }
    };

    /**
     * Validate form fields
     * Requirement 2.5: Validate required fields
     */
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Requirement 2.5: Validate dosage, frequency, duration, quantity
        if (!dosage.trim()) {
            newErrors.dosage = 'Dosage is required';
        }
        if (!frequency.trim()) {
            newErrors.frequency = 'Frequency is required';
        }
        if (duration <= 0) {
            newErrors.duration = 'Duration must be greater than 0';
        }
        if (quantity <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0';
        }

        // Requirement 3.2: Validate stock for instant dispensing
        if (instantDispensing && stockValidation && !stockValidation.isValid) {
            newErrors.stock = stockValidation.message;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Requirement 2.7: Block if allergy conflict
        if (allergyConflict) {
            return;
        }

        // Requirement 2.5: Validate all required fields
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const prescriptionData: PrescriptionData = {
                drug_id: drug.id,
                drug_name: `${drug.generic_name || drug.name} ${drug.strength} (${drug.form})`,
                dosage,
                frequency,
                duration,
                quantity,
                instant_dispensing: instantDispensing,
            };

            onSave(prescriptionData);
        } catch (error) {
            console.error('Failed to save prescription:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Build drug display name
    const drugDisplayName = `${drug.generic_name || drug.name} ${drug.strength} (${drug.form})`;

    return (
        <div 
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
            role="form"
            aria-label="New prescription form"
        >
            <div className="mb-4">
                <h3 
                    className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                    id="prescription-form-title"
                >
                    <span aria-hidden="true">💊</span> New Prescription
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {drugDisplayName}
                </p>
                {drug.brand_name && (
                    <p className="text-xs text-gray-500">
                        Brand: {drug.brand_name}
                    </p>
                )}
            </div>

            {/* Requirement 2.7: Allergy Conflict Blocking */}
            {allergyConflict && (
                <div 
                    className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                >
                    <div className="flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="flex-1">
                            <h4 className="font-bold text-red-900 mb-1">
                                <span aria-hidden="true">⚠️</span> Allergy Conflict - Prescription Blocked
                            </h4>
                            <p className="text-sm text-red-800">
                                {allergyConflict}
                            </p>
                            <p className="text-xs text-red-700 mt-2">
                                This prescription cannot be saved due to patient allergy.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Requirement 2.6: Drug Interaction Warnings */}
            {drugInteractions.length > 0 && (
                <div 
                    className="mb-4 space-y-2"
                    role="alert"
                    aria-live="polite"
                    aria-label={`${drugInteractions.length} drug interaction${drugInteractions.length > 1 ? 's' : ''} detected`}
                >
                    {drugInteractions.map((interaction, index) => {
                        const severityConfig = {
                            mild: {
                                bg: 'bg-yellow-50',
                                border: 'border-yellow-300',
                                text: 'text-yellow-900',
                                icon: <AlertCircle className="w-5 h-5 text-yellow-600" aria-hidden="true" />,
                            },
                            moderate: {
                                bg: 'bg-orange-50',
                                border: 'border-orange-400',
                                text: 'text-orange-900',
                                icon: <AlertTriangle className="w-5 h-5 text-orange-600" aria-hidden="true" />,
                            },
                            severe: {
                                bg: 'bg-red-50',
                                border: 'border-red-500',
                                text: 'text-red-900',
                                icon: <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />,
                            },
                        };

                        const config = severityConfig[interaction.severity];

                        return (
                            <div
                                key={index}
                                className={cn(
                                    'p-3 rounded-lg border-2',
                                    config.bg,
                                    config.border
                                )}
                                role="alert"
                                aria-label={`${interaction.severity} severity drug interaction with ${interaction.drug_name}`}
                            >
                                <div className="flex items-start gap-2">
                                    {config.icon}
                                    <div className="flex-1">
                                        <h4 className={cn('font-semibold text-sm', config.text)}>
                                            Drug Interaction: {interaction.drug_name}
                                        </h4>
                                        <p className={cn('text-xs mt-1', config.text)}>
                                            {interaction.description}
                                        </p>
                                        <p className="text-xs font-medium mt-1 uppercase">
                                            Severity: {interaction.severity}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isCheckingInteractions && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Checking for drug interactions and allergies...
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Requirement 2.4, 2.5: Dosage, frequency, duration, quantity fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dosage */}
                    <div>
                        <Label htmlFor="dosage" className="text-sm font-medium text-gray-700">
                            Dosage <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="dosage"
                            type="text"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            placeholder="e.g., 500mg"
                            className={cn(
                                'mt-1',
                                errors.dosage && 'border-red-500 focus:ring-red-500'
                            )}
                            disabled={!!allergyConflict}
                            aria-required="true"
                            aria-invalid={!!errors.dosage}
                            aria-describedby={errors.dosage ? 'dosage-error' : undefined}
                        />
                        {errors.dosage && (
                            <p 
                                className="text-xs text-red-600 mt-1" 
                                role="alert"
                                aria-live="polite"
                                id="dosage-error"
                            >
                                {errors.dosage}
                            </p>
                        )}
                    </div>

                    {/* Frequency */}
                    <div>
                        <Label htmlFor="frequency" className="text-sm font-medium text-gray-700">
                            Frequency <span className="text-red-500" aria-label="required">*</span>
                        </Label>
                        <Input
                            id="frequency"
                            type="text"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            placeholder="e.g., Twice daily"
                            className={cn(
                                'mt-1',
                                errors.frequency && 'border-red-500 focus:ring-red-500'
                            )}
                            disabled={!!allergyConflict}
                            aria-required="true"
                            aria-invalid={!!errors.frequency}
                            aria-describedby={errors.frequency ? 'frequency-error' : undefined}
                        />
                        {errors.frequency && (
                            <p 
                                className="text-xs text-red-600 mt-1" 
                                role="alert"
                                aria-live="polite"
                                id="frequency-error"
                            >
                                {errors.frequency}
                            </p>
                        )}
                    </div>

                    {/* Duration */}
                    <div>
                        <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                            Duration (days) <span className="text-red-500" aria-label="required">*</span>
                        </Label>
                        <Input
                            id="duration"
                            type="number"
                            min={1}
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className={cn(
                                'mt-1',
                                errors.duration && 'border-red-500 focus:ring-red-500'
                            )}
                            disabled={!!allergyConflict}
                            aria-required="true"
                            aria-invalid={!!errors.duration}
                            aria-describedby={errors.duration ? 'duration-error' : undefined}
                        />
                        {errors.duration && (
                            <p 
                                className="text-xs text-red-600 mt-1" 
                                role="alert"
                                aria-live="polite"
                                id="duration-error"
                            >
                                {errors.duration}
                            </p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                            Quantity <span className="text-red-500" aria-label="required">*</span>
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className={cn(
                                'mt-1',
                                errors.quantity && 'border-red-500 focus:ring-red-500'
                            )}
                            disabled={!!allergyConflict}
                            aria-required="true"
                            aria-invalid={!!errors.quantity}
                            aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                        />
                        {errors.quantity && (
                            <p 
                                className="text-xs text-red-600 mt-1" 
                                role="alert"
                                aria-live="polite"
                                id="quantity-error"
                            >
                                {errors.quantity}
                            </p>
                        )}
                    </div>
                </div>

                {/* Requirement 3.1, 3.4: Instant Dispensing (Emergency patients only) */}
                {isEmergencyPatient && (
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <Checkbox
                                id="instant-dispensing"
                                checked={instantDispensing}
                                onCheckedChange={(checked) => setInstantDispensing(checked as boolean)}
                                disabled={!!allergyConflict}
                                className="mt-1"
                                aria-label="Mark prescription for instant dispensing"
                                aria-describedby="instant-dispensing-description"
                            />
                            <div className="flex-1">
                                <Label
                                    htmlFor="instant-dispensing"
                                    className="text-sm font-semibold text-blue-900 cursor-pointer"
                                >
                                    <span aria-hidden="true">🚨</span> Instant Dispensing (Emergency)
                                </Label>
                                <p 
                                    className="text-xs text-blue-800 mt-1"
                                    id="instant-dispensing-description"
                                >
                                    Mark this prescription for immediate dispensing. Stock will be reserved
                                    and medication will be available for pickup immediately after consultation
                                    completion.
                                </p>
                            </div>
                        </div>

                        {/* Requirement 3.2: Stock Validation Display */}
                        {instantDispensing && stockValidation && (
                            <div
                                className={cn(
                                    'mt-2 p-3 rounded-lg border',
                                    stockValidation.isValid
                                        ? 'bg-green-50 border-green-300'
                                        : 'bg-red-50 border-red-300'
                                )}
                                role="status"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                <div className="flex items-center gap-2">
                                    {stockValidation.isValid ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
                                    ) : (
                                        <XCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
                                    )}
                                    <p
                                        className={cn(
                                            'text-sm font-medium',
                                            stockValidation.isValid ? 'text-green-900' : 'text-red-900'
                                        )}
                                    >
                                        {stockValidation.message}
                                    </p>
                                </div>
                            </div>
                        )}

                        {errors.stock && (
                            <p 
                                className="text-xs text-red-600 mt-2"
                                role="alert"
                                aria-live="assertive"
                            >
                                {errors.stock}
                            </p>
                        )}
                    </div>
                )}

                {/* Stock Information */}
                <div className="pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-medium">Current Stock:</span>
                        <span
                            className={cn(
                                'px-2 py-1 rounded-full text-xs font-semibold',
                                drug.stock_status === 'in_stock' && 'bg-green-100 text-green-700',
                                drug.stock_status === 'low_stock' && 'bg-yellow-100 text-yellow-700',
                                drug.stock_status === 'out_of_stock' && 'bg-red-100 text-red-700'
                            )}
                        >
                            {drug.stock_quantity || 0} units
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        aria-label="Cancel prescription form"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !!allergyConflict}
                        className="bg-blue-600 hover:bg-blue-700"
                        aria-label={isLoading ? 'Saving prescription' : 'Save prescription'}
                        aria-disabled={isLoading || !!allergyConflict}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Prescription'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
