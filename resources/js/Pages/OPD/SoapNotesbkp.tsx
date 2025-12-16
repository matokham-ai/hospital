import { useEffect, useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { useToast } from '@/hooks/use-toast';
import type { PageProps } from '@/types';

interface SoapNotesProps extends PageProps {
    appointment: {
        id: number;
        type?: 'opd' | 'regular';
        appointment_number: string;
        patient: {
            id: string;
            first_name: string;
            last_name: string;
        };
        doctor?: {
            id: number | string;
            name: string;
        };
        status: string;
        chief_complaint: string;
    };
    soapNote?: {
        id: number;
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
        vital_signs: any;
    } | {
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
        created_at: string;
        created_by: string;
    };
}

export default function SoapNotes({ auth, appointment, soapNote }: SoapNotesProps) {
    const { props } = usePage();
    const { toast } = useToast();
    const { data, setData, post, processing } = useForm({
        subjective: soapNote?.subjective || '',
        objective: soapNote?.objective || '',
        assessment: soapNote?.assessment || '',
        plan: soapNote?.plan || '',
    });
    
    const [completing, setCompleting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Handle flash messages
    useEffect(() => {
        if (props.flash?.success) {
            toast({
                title: "Success",
                description: props.flash.success,
                variant: "default",
            });
        }
        if (props.flash?.error) {
            toast({
                title: "Error",
                description: props.flash.error,
                variant: "destructive",
            });
        }
    }, [props.flash, toast]);

    const handleSave = () => {
        post(`/opd/appointments/${appointment.id}/soap`);
    };

    const handleCompleteClick = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmComplete = () => {
        setShowConfirmModal(false);
        setCompleting(true);
        
        // Save SOAP notes first, then complete consultation
        post(`/opd/appointments/${appointment.id}/soap`, {
            onSuccess: () => {
                // After saving SOAP notes, complete the consultation using Inertia
                const completeUrl = appointment.type === 'regular' 
                    ? `/appointments/${appointment.id}/complete-consultation`
                    : `/opd/appointments/${appointment.id}/complete`;
                
                router.post(completeUrl, {}, {
                    onSuccess: () => {
                        toast({
                            title: "✅ Consultation Completed",
                            description: "The consultation has been successfully completed and the patient has been moved to completed status.",
                            variant: "default",
                        });
                        
                        // Redirect to consultations page after successful completion
                        setTimeout(() => {
                            router.visit('/opd/consultations');
                        }, 1500);
                    },
                    onError: (errors) => {
                        console.error('Error completing consultation:', errors);
                        toast({
                            title: "❌ Completion Failed",
                            description: "Failed to complete the consultation. Please try again or contact support if the issue persists.",
                            variant: "destructive",
                        });
                        setCompleting(false);
                    }
                });
            },
            onError: (errors) => {
                console.error('Error saving SOAP notes:', errors);
                toast({
                    title: "❌ Save Failed",
                    description: "Failed to save SOAP notes. Please check your entries and try again.",
                    variant: "destructive",
                });
                setCompleting(false);
            }
        });
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title={`SOAP Notes - ${appointment.patient.first_name} ${appointment.patient.last_name}`} />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">SOAP Notes</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-gray-600">
                                        {appointment.patient.first_name} {appointment.patient.last_name} - {appointment.appointment_number}
                                    </p>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        appointment.type === 'opd' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-purple-100 text-purple-700'
                                    }`}>
                                        {appointment.type === 'opd' ? 'Walk-in' : 'Scheduled'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={processing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {processing ? 'Saving...' : 'Save Notes'}
                                </button>
                                <button
                                    onClick={handleCompleteClick}
                                    disabled={processing || completing}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {completing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Completing...
                                        </>
                                    ) : (
                                        <>
                                            ✅ Complete Consultation
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Patient</label>
                                <p className="text-gray-900">{appointment.patient.first_name} {appointment.patient.last_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Doctor</label>
                                <p className="text-gray-900">{appointment.doctor?.name || 'Not assigned'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Chief Complaint</label>
                                <p className="text-gray-900">{appointment.chief_complaint}</p>
                            </div>
                        </div>
                    </div>

                    {/* SOAP Notes Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="space-y-6">
                            {/* Subjective */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subjective (Patient's History & Symptoms)
                                </label>
                                <textarea
                                    value={data.subjective}
                                    onChange={(e) => setData('subjective', e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Patient reports..."
                                />
                            </div>

                            {/* Objective */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Objective (Physical Examination & Vital Signs)
                                </label>
                                <textarea
                                    value={data.objective}
                                    onChange={(e) => setData('objective', e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Physical examination reveals..."
                                />
                            </div>

                            {/* Assessment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assessment (Diagnosis & Clinical Impression)
                                </label>
                                <textarea
                                    value={data.assessment}
                                    onChange={(e) => setData('assessment', e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Primary diagnosis..."
                                />
                            </div>

                            {/* Plan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Plan (Treatment & Follow-up)
                                </label>
                                <textarea
                                    value={data.plan}
                                    onChange={(e) => setData('plan', e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Treatment plan and recommendations..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-xl">✅</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Complete Consultation</h3>
                                <p className="text-sm text-gray-600">Are you ready to finalize this consultation?</p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-700">
                                This will save your SOAP notes and mark the consultation as completed. 
                                The patient will be moved from the active queue to completed consultations.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                disabled={completing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                disabled={completing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                                {completing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Completing...
                                    </>
                                ) : (
                                    'Yes, Complete Consultation'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </HMSLayout>
    );
}
