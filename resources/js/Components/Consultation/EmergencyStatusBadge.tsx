import React from 'react';
import { EmergencyPatient, TriageAssessment } from '@/types';
import { Badge } from '@/Components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/Components/ui/tooltip';
import { AlertCircle, Clock, Ambulance } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmergencyStatusBadgeProps {
    emergencyData: EmergencyPatient;
    triageAssessment?: TriageAssessment;
    className?: string;
}

/**
 * EmergencyStatusBadge Component
 * 
 * Displays a prominent emergency indicator with triage priority color coding
 * and a tooltip containing emergency details.
 * 
 * Requirements: 1.1, 1.2
 */
export default function EmergencyStatusBadge({
    emergencyData,
    triageAssessment,
    className,
}: EmergencyStatusBadgeProps) {
    // Determine triage priority and color coding
    const getTriagePriority = () => {
        if (!triageAssessment) {
            return {
                label: 'Emergency',
                color: 'bg-yellow-500 hover:bg-yellow-600',
                textColor: 'text-white',
                borderColor: 'border-yellow-600',
            };
        }

        switch (triageAssessment.triage_category) {
            case 'CRITICAL':
                return {
                    label: 'Critical',
                    color: 'bg-red-600 hover:bg-red-700',
                    textColor: 'text-white',
                    borderColor: 'border-red-700',
                };
            case 'URGENT':
                return {
                    label: 'Urgent',
                    color: 'bg-orange-500 hover:bg-orange-600',
                    textColor: 'text-white',
                    borderColor: 'border-orange-600',
                };
            case 'SEMI_URGENT':
                return {
                    label: 'Semi-Urgent',
                    color: 'bg-yellow-500 hover:bg-yellow-600',
                    textColor: 'text-white',
                    borderColor: 'border-yellow-600',
                };
            case 'NON_URGENT':
                return {
                    label: 'Non-Urgent',
                    color: 'bg-green-500 hover:bg-green-600',
                    textColor: 'text-white',
                    borderColor: 'border-green-600',
                };
            default:
                return {
                    label: 'Emergency',
                    color: 'bg-yellow-500 hover:bg-yellow-600',
                    textColor: 'text-white',
                    borderColor: 'border-yellow-600',
                };
        }
    };

    const priority = getTriagePriority();

    // Format arrival time
    const formatArrivalTime = (arrivalTime: string) => {
        const date = new Date(arrivalTime);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Format arrival mode
    const formatArrivalMode = (mode: string) => {
        return mode.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg border-2 transition-all cursor-help animate-pulse',
                            priority.color,
                            priority.textColor,
                            priority.borderColor,
                            className
                        )}
                        role="status"
                        aria-label={`Emergency patient with ${priority.label.toLowerCase()} priority. ${emergencyData.chief_complaint ? `Chief complaint: ${emergencyData.chief_complaint}` : ''}`}
                        tabIndex={0}
                    >
                        <AlertCircle className="w-5 h-5" aria-hidden="true" />
                        <span className="uppercase tracking-wide">
                            {priority.label} Patient
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    className="max-w-sm p-4 bg-white border-2 shadow-xl"
                >
                    <div className="space-y-3">
                        {/* Emergency Status Header */}
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <AlertCircle className={cn('w-5 h-5', priority.color.replace('bg-', 'text-'))} />
                            <h4 className="font-bold text-gray-900">
                                Emergency Patient Details
                            </h4>
                        </div>

                        {/* Chief Complaint */}
                        {emergencyData.chief_complaint && (
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Chief Complaint
                                </p>
                                <p className="text-sm text-gray-900 mt-1">
                                    {emergencyData.chief_complaint}
                                </p>
                            </div>
                        )}

                        {/* Arrival Information */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    <Clock className="w-3 h-3" />
                                    <span>Arrival Time</span>
                                </div>
                                <p className="text-sm text-gray-900 mt-1">
                                    {formatArrivalTime(emergencyData.arrival_time)}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    <Ambulance className="w-3 h-3" />
                                    <span>Arrival Mode</span>
                                </div>
                                <p className="text-sm text-gray-900 mt-1">
                                    {formatArrivalMode(emergencyData.arrival_mode)}
                                </p>
                            </div>
                        </div>

                        {/* Triage Priority */}
                        {triageAssessment && (
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Triage Priority
                                </p>
                                <div className="mt-1">
                                    <Badge
                                        className={cn(
                                            'text-xs font-bold',
                                            priority.color,
                                            priority.textColor
                                        )}
                                    >
                                        {priority.label}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        {/* Triage Vitals */}
                        {triageAssessment && (
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                    Triage Vitals
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {triageAssessment.temperature && (
                                        <div>
                                            <span className="text-gray-600">Temp:</span>{' '}
                                            <span className="font-medium text-gray-900">
                                                {triageAssessment.temperature}°C
                                            </span>
                                        </div>
                                    )}
                                    {triageAssessment.blood_pressure && (
                                        <div>
                                            <span className="text-gray-600">BP:</span>{' '}
                                            <span className="font-medium text-gray-900">
                                                {triageAssessment.blood_pressure}
                                            </span>
                                        </div>
                                    )}
                                    {triageAssessment.heart_rate && (
                                        <div>
                                            <span className="text-gray-600">HR:</span>{' '}
                                            <span className="font-medium text-gray-900">
                                                {triageAssessment.heart_rate} bpm
                                            </span>
                                        </div>
                                    )}
                                    {triageAssessment.respiratory_rate && (
                                        <div>
                                            <span className="text-gray-600">RR:</span>{' '}
                                            <span className="font-medium text-gray-900">
                                                {triageAssessment.respiratory_rate} /min
                                            </span>
                                        </div>
                                    )}
                                    {triageAssessment.oxygen_saturation && (
                                        <div>
                                            <span className="text-gray-600">SpO2:</span>{' '}
                                            <span className="font-medium text-gray-900">
                                                {triageAssessment.oxygen_saturation}%
                                            </span>
                                        </div>
                                    )}
                                    {triageAssessment.gcs_total && (
                                        <div>
                                            <span className="text-gray-600">GCS:</span>{' '}
                                            <span className="font-medium text-gray-900">
                                                {triageAssessment.gcs_total}/15
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Assessment Notes */}
                        {triageAssessment?.assessment_notes && (
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                    Assessment Notes
                                </p>
                                <p className="text-sm text-gray-900 mt-1 italic">
                                    {triageAssessment.assessment_notes}
                                </p>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
