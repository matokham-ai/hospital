import { useState, FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { PageProps } from '@/types';

interface LabOrder {
    id: number;
    patient_name: string;
    patient_mrn: string;
    test_name: string;
    test_code: string;
    ordered_at: string;
    priority: string;
    reference_range?: string;
    unit?: string;
}

interface Props extends PageProps {
    order: LabOrder;
}

export default function LabResultEntry({ auth, order }: Props) {
    const [isCritical, setIsCritical] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        result_value: '',
        result_unit: order.unit || '',
        is_critical: false,
        notes: '',
        performed_at: new Date().toISOString().slice(0, 16),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`/nurse/lab-results/${order.id}/submit`);
    };

    const checkCriticalValue = (value: string) => {
        // Simple critical value detection logic
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // Example: flag as critical if outside reference range significantly
            setIsCritical(numValue < 0 || numValue > 1000);
            setData('is_critical', numValue < 0 || numValue > 1000);
        }
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="Enter Lab Result" />

            <div className="py-6">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Enter Lab Result</h1>
                        <p className="mt-1 text-sm text-gray-600">Record laboratory test results</p>
                    </div>

                    {/* Patient & Order Info */}
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">Patient Information</h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p><strong>Name:</strong> {order.patient_name}</p>
                                    <p><strong>MRN:</strong> {order.patient_mrn}</p>
                                    <p><strong>Test:</strong> {order.test_name} ({order.test_code})</p>
                                    <p><strong>Ordered:</strong> {new Date(order.ordered_at).toLocaleString()}</p>
                                    {order.reference_range && (
                                        <p><strong>Reference Range:</strong> {order.reference_range}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Entry Form */}
                    <div className="bg-white shadow rounded-lg">
                        <form onSubmit={submit} className="p-6 space-y-6">
                            {/* Result Value */}
                            <div>
                                <label htmlFor="result_value" className="block text-sm font-medium text-gray-700">
                                    Result Value *
                                </label>
                                <input
                                    type="text"
                                    id="result_value"
                                    value={data.result_value}
                                    onChange={(e) => {
                                        setData('result_value', e.target.value);
                                        checkCriticalValue(e.target.value);
                                    }}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                />
                                {errors.result_value && (
                                    <p className="mt-1 text-sm text-red-600">{errors.result_value}</p>
                                )}
                            </div>

                            {/* Unit */}
                            <div>
                                <label htmlFor="result_unit" className="block text-sm font-medium text-gray-700">
                                    Unit
                                </label>
                                <input
                                    type="text"
                                    id="result_unit"
                                    value={data.result_unit}
                                    onChange={(e) => setData('result_unit', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="e.g., mg/dL, mmol/L"
                                />
                            </div>

                            {/* Performed At */}
                            <div>
                                <label htmlFor="performed_at" className="block text-sm font-medium text-gray-700">
                                    Performed At *
                                </label>
                                <input
                                    type="datetime-local"
                                    id="performed_at"
                                    value={data.performed_at}
                                    onChange={(e) => setData('performed_at', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            {/* Critical Value Alert */}
                            {isCritical && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                Critical Value Detected
                                            </h3>
                                            <p className="mt-1 text-sm text-red-700">
                                                This result appears to be outside normal range. Please verify and notify the physician immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Critical Checkbox */}
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="is_critical"
                                        type="checkbox"
                                        checked={data.is_critical}
                                        onChange={(e) => setData('is_critical', e.target.checked)}
                                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="is_critical" className="font-medium text-gray-700">
                                        Mark as Critical Value
                                    </label>
                                    <p className="text-gray-500">Check this if the result requires immediate physician notification</p>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                    Clinical Notes
                                </label>
                                <textarea
                                    id="notes"
                                    rows={4}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Any observations or comments about the test..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {processing ? 'Submitting...' : 'Submit Result'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
