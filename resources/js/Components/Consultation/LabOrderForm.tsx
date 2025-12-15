import React, { useState, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccessibleForm } from '@/hooks/useAccessibleForm';

interface TestCatalog {
    id: number;
    name: string;
    code: string;
    price: number | string;
    turnaround_time: number;
    category?: {
        id: number;
        name: string;
    };
    unit?: string;
    normal_range?: string;
    sample_type?: string;
}

interface LabOrderData {
    test_id: number;
    test_name: string;
    priority: 'urgent' | 'fast' | 'normal';
    clinical_notes: string;
}

interface LabOrderFormProps {
    test: TestCatalog;
    onSave: (labOrder: LabOrderData) => void;
    onCancel: () => void;
}

interface PriorityOption {
    value: 'urgent' | 'fast' | 'normal';
    label: string;
    turnaroundHours: number;
    color: string;
    description: string;
}

/**
 * LabOrderForm Component
 * 
 * Form for creating lab orders with priority level selection.
 * Displays expected turnaround time for each priority level.
 * 
 * Requirements: 4.2, 4.3
 */
export default function LabOrderForm({
    test,
    onSave,
    onCancel,
}: LabOrderFormProps) {
    // Requirement 4.2: Priority level selection
    const [priority, setPriority] = useState<'urgent' | 'fast' | 'normal'>('normal');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Accessibility: Announce errors to screen readers
    const { errorAnnouncementRef } = useAccessibleForm(errors);

    // Requirement 4.3: Priority options with turnaround times
    const priorityOptions: PriorityOption[] = [
        {
            value: 'urgent',
            label: 'Urgent',
            turnaroundHours: 2,
            color: 'red',
            description: 'Critical - Results needed immediately',
        },
        {
            value: 'fast',
            label: 'Fast',
            turnaroundHours: 6,
            color: 'orange',
            description: 'High priority - Results needed today',
        },
        {
            value: 'normal',
            label: 'Normal',
            turnaroundHours: 24,
            color: 'blue',
            description: 'Standard processing time',
        },
    ];

    /**
     * Format turnaround time for display
     * Requirement 4.3: Display expected turnaround time
     */
    const formatTurnaroundTime = (hours: number): string => {
        if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        if (remainingHours === 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
        return `${days}d ${remainingHours}h`;
    };

    /**
     * Get color classes for priority
     */
    const getPriorityColorClasses = (color: string, isSelected: boolean) => {
        const baseClasses = 'border-2 transition-all duration-200';
        
        if (isSelected) {
            switch (color) {
                case 'red':
                    return `${baseClasses} border-red-500 bg-red-50 ring-2 ring-red-200`;
                case 'orange':
                    return `${baseClasses} border-orange-500 bg-orange-50 ring-2 ring-orange-200`;
                case 'blue':
                    return `${baseClasses} border-blue-500 bg-blue-50 ring-2 ring-blue-200`;
                default:
                    return `${baseClasses} border-gray-500 bg-gray-50 ring-2 ring-gray-200`;
            }
        }
        
        return `${baseClasses} border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50`;
    };

    /**
     * Get badge color classes for priority
     */
    const getBadgeColorClasses = (color: string) => {
        switch (color) {
            case 'red':
                return 'bg-red-100 text-red-700 border-red-300';
            case 'orange':
                return 'bg-orange-100 text-orange-700 border-orange-300';
            case 'blue':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    /**
     * Validate form fields
     * Requirement 4.2: Priority level is required
     */
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Requirement 4.2: Priority must be selected
        if (!priority) {
            newErrors.priority = 'Priority level is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Requirement 4.2: Validate priority is selected
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const labOrderData: LabOrderData = {
                test_id: test.id,
                test_name: `${test.name} (${test.code})`,
                priority,
                clinical_notes: clinicalNotes.trim(),
            };

            onSave(labOrderData);
        } catch (error) {
            console.error('Failed to save lab order:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
            role="form"
            aria-label="New lab order form"
        >
            <div className="mb-4">
                <h3 
                    className="text-lg font-semibold text-gray-900 flex items-center gap-2"
                    id="lab-order-form-title"
                >
                    <span aria-hidden="true">🧪</span> New Lab Order
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {test.name}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {test.code}
                    </span>
                    {test.category && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                            {test.category.name}
                        </span>
                    )}
                    {test.sample_type && (
                        <span>Sample: {test.sample_type}</span>
                    )}
                    <span className="font-medium text-gray-700">
                        KES {typeof test.price === 'number' ? test.price.toFixed(2) : test.price}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Requirement 4.2, 4.3: Priority level selection with turnaround times */}
                <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Priority Level <span className="text-red-500" aria-label="required">*</span>
                    </Label>
                    <p 
                        className="text-xs text-gray-600 mb-3"
                        id="priority-description"
                    >
                        Select the urgency level for this lab test. Higher priority tests are processed faster.
                    </p>

                    <div 
                        className="space-y-3"
                        role="radiogroup"
                        aria-labelledby="priority-description"
                        aria-required="true"
                    >
                        {priorityOptions.map((option) => {
                            const isSelected = priority === option.value;
                            
                            return (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'block p-4 rounded-lg cursor-pointer',
                                        getPriorityColorClasses(option.color, isSelected)
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Radio Button */}
                                        <input
                                            type="radio"
                                            name="priority"
                                            value={option.value}
                                            checked={isSelected}
                                            onChange={(e) => setPriority(e.target.value as 'urgent' | 'fast' | 'normal')}
                                            className="mt-1 w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                            aria-label={`${option.label} priority - ${option.description} - Expected turnaround: ${formatTurnaroundTime(option.turnaroundHours)}`}
                                            aria-describedby={`priority-${option.value}-description`}
                                        />

                                        {/* Priority Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-3 mb-1">
                                                <span className="font-semibold text-gray-900">
                                                    {option.label}
                                                </span>
                                                
                                                {/* Requirement 4.3: Expected turnaround time display */}
                                                <span
                                                    className={cn(
                                                        'px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5',
                                                        getBadgeColorClasses(option.color)
                                                    )}
                                                    aria-label={`Expected turnaround time: ${formatTurnaroundTime(option.turnaroundHours)}`}
                                                >
                                                    <Clock className="w-3 h-3" aria-hidden="true" />
                                                    <span>{formatTurnaroundTime(option.turnaroundHours)}</span>
                                                </span>
                                            </div>
                                            
                                            <p 
                                                className="text-sm text-gray-600"
                                                id={`priority-${option.value}-description`}
                                            >
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {errors.priority && (
                        <div 
                            className="mt-2 flex items-center gap-2 text-sm text-red-600"
                            role="alert"
                            aria-live="assertive"
                        >
                            <AlertCircle className="w-4 h-4" aria-hidden="true" />
                            <span>{errors.priority}</span>
                        </div>
                    )}
                </div>

                {/* Clinical Notes */}
                <div>
                    <Label htmlFor="clinical-notes" className="text-sm font-medium text-gray-700">
                        Clinical Notes
                    </Label>
                    <p 
                        className="text-xs text-gray-600 mb-2"
                        id="clinical-notes-description"
                    >
                        Add any relevant clinical information or special instructions for the laboratory.
                    </p>
                    <Textarea
                        id="clinical-notes"
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        placeholder="e.g., Patient is on anticoagulants, fasting sample required, etc."
                        rows={4}
                        className="resize-none"
                        aria-describedby="clinical-notes-description"
                        aria-label="Clinical notes for laboratory"
                    />
                </div>

                {/* Test Information Summary */}
                <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Test Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                        {test.unit && (
                            <div className="flex gap-2">
                                <span className="font-medium">Unit:</span>
                                <span>{test.unit}</span>
                            </div>
                        )}
                        {test.normal_range && (
                            <div className="flex gap-2">
                                <span className="font-medium">Normal Range:</span>
                                <span>{test.normal_range}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <span className="font-medium">Standard Turnaround:</span>
                            <span>{formatTurnaroundTime(test.turnaround_time)}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        aria-label="Cancel lab order form"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                        aria-label={isLoading ? 'Saving lab order' : 'Add lab order'}
                        aria-disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" aria-hidden="true"></div>
                                Saving...
                            </>
                        ) : (
                            'Add Lab Order'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
