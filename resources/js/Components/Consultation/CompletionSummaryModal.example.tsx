import React, { useState } from 'react';
import CompletionSummaryModal from './CompletionSummaryModal';
import { Button } from '@/Components/ui/button';

/**
 * Example usage of CompletionSummaryModal component
 * 
 * This demonstrates how to integrate the completion modal into a consultation workflow.
 */
export default function CompletionSummaryModalExample() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    // Example prescriptions data
    const examplePrescriptions = [
        {
            id: 1,
            drug_id: 101,
            drug_name: 'Amoxicillin 500mg',
            dosage: '500mg',
            frequency: 'Three times daily',
            duration: 7,
            quantity: 21,
            instant_dispensing: true,
        },
        {
            id: 2,
            drug_id: 102,
            drug_name: 'Ibuprofen 400mg',
            dosage: '400mg',
            frequency: 'As needed',
            duration: 5,
            quantity: 15,
            instant_dispensing: false,
        },
        {
            id: 3,
            drug_id: 103,
            drug_name: 'Paracetamol 500mg',
            dosage: '500mg',
            frequency: 'Four times daily',
            duration: 3,
            quantity: 12,
            instant_dispensing: true,
        },
    ];

    // Example lab orders data
    const exampleLabOrders = [
        {
            id: 1,
            test_id: 201,
            test_name: 'Complete Blood Count (CBC)',
            priority: 'urgent' as const,
            clinical_notes: 'Patient presents with fever and fatigue',
        },
        {
            id: 2,
            test_id: 202,
            test_name: 'Blood Glucose (Fasting)',
            priority: 'fast' as const,
            clinical_notes: 'Follow-up for diabetes management',
        },
        {
            id: 3,
            test_id: 203,
            test_name: 'Lipid Profile',
            priority: 'normal' as const,
        },
    ];

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleConfirmCompletion = async () => {
        setIsCompleting(true);
        
        // Simulate API call to complete consultation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        setIsCompleting(false);
        setIsModalOpen(false);
        
        alert('Consultation completed successfully!');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Consultation Completion Modal Example
                </h1>
                
                <p className="text-gray-600 mb-6">
                    This example demonstrates the CompletionSummaryModal component with sample prescriptions and lab orders.
                </p>

                <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Sample Data:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• {examplePrescriptions.length} prescriptions ({examplePrescriptions.filter(p => p.instant_dispensing).length} instant dispensing)</li>
                            <li>• {exampleLabOrders.length} lab orders ({exampleLabOrders.filter(l => l.priority === 'urgent').length} urgent)</li>
                        </ul>
                    </div>
                </div>

                <Button
                    onClick={handleOpenModal}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    Complete Consultation
                </Button>

                <CompletionSummaryModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onConfirm={handleConfirmCompletion}
                    prescriptions={examplePrescriptions}
                    labOrders={exampleLabOrders}
                    isLoading={isCompleting}
                />
            </div>
        </div>
    );
}
