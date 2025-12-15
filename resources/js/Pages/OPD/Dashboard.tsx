import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import OpdDashboard from '@/Components/OpdDashboard';
import OpdRegistration from '@/Components/OpdRegistration';
import SoapNotesForm from '@/Components/SoapNotesForm';
import Icd10Search from '@/Components/Icd10Search';
import Modal from '@/Components/Modal';
import type { 
    PageProps, 
    DashboardStats, 
    QueueItem, 
    OpdAppointment, 
    Doctor, 
    TimeSlot, 
    Icd10Code, 
    OpdDiagnosis,
    MedicalHistory,
    SoapTemplate
} from '@/types';

interface OpdDashboardPageProps extends PageProps {
    stats: DashboardStats;
    queue: QueueItem[];
    recentAppointments: OpdAppointment[];
    doctors: Doctor[];
    availableSlots: TimeSlot[];
    popularCodes: Icd10Code[];
}

export default function OpdDashboardPage({ 
    auth, 
    stats, 
    queue, 
    recentAppointments, 
    doctors, 
    availableSlots, 
    popularCodes 
}: OpdDashboardPageProps) {
    const [showRegistration, setShowRegistration] = useState(false);
    const [showSoapNotes, setShowSoapNotes] = useState(false);
    const [showDiagnosisSearch, setShowDiagnosisSearch] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<OpdAppointment | null>(null);
    const [selectedDiagnoses, setSelectedDiagnoses] = useState<OpdDiagnosis[]>([]);

    // Mock data for demonstration
    const mockPatientHistory: MedicalHistory[] = [
        {
            id: 1,
            appointment_date: '2024-01-15',
            doctor_name: 'Dr. Smith',
            diagnosis: 'Hypertension',
            notes: 'Blood pressure controlled with medication'
        }
    ];

    const mockSoapTemplates: SoapTemplate[] = [
        {
            id: 1,
            name: 'General Consultation',
            subjective_template: 'Chief complaint:\nHistory of present illness:\nReview of systems:',
            objective_template: 'Vital signs:\nPhysical examination:\nGeneral appearance:',
            assessment_template: 'Clinical impression:\nDifferential diagnosis:',
            plan_template: 'Treatment plan:\nMedications:\nFollow-up:'
        }
    ];

    const handleRefresh = () => {
        // In a real application, this would refetch data from the server
        window.location.reload();
    };

    const handleViewPatient = (patientId: number) => {
        // Navigate to patient details page
        console.log('View patient:', patientId);
    };

    const handleStartConsultation = (appointmentId: number) => {
        // Find the appointment and start consultation
        const appointment = recentAppointments.find(apt => apt.id === appointmentId);
        if (appointment) {
            setSelectedAppointment(appointment);
            setShowSoapNotes(true);
        }
    };

    const handlePatientRegistered = (appointment: OpdAppointment) => {
        console.log('Patient registered:', appointment);
        setShowRegistration(false);
        handleRefresh();
    };

    const handleSoapNotesSave = (notes: any) => {
        console.log('SOAP notes saved:', notes);
    };

    const handleSoapNotesComplete = (notes: any) => {
        console.log('SOAP notes completed:', notes);
        setShowSoapNotes(false);
        setShowDiagnosisSearch(true);
    };

    const handleCodeSelect = (code: Icd10Code, type: 'PRIMARY' | 'SECONDARY' | 'COMORBIDITY' | 'RULE_OUT') => {
        const newDiagnosis: OpdDiagnosis = {
            id: Date.now(), // Mock ID
            appointment_id: selectedAppointment?.id || 0,
            icd10_code_id: code.id,
            diagnosis_type: type,
            icd10_code: code,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        setSelectedDiagnoses(prev => [...prev, newDiagnosis]);
    };

    const handleRemoveCode = (diagnosisId: number) => {
        setSelectedDiagnoses(prev => prev.filter(d => d.id !== diagnosisId));
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="OPD Dashboard" />
            
            <div className="p-6">
                {/* Action Buttons */}
                <div className="mb-6 flex gap-4">
                    <button
                        onClick={() => setShowRegistration(true)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Register Patient
                    </button>
                    <button
                        onClick={() => setShowDiagnosisSearch(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Search Diagnoses
                    </button>
                </div>

                {/* Main Dashboard */}
                <OpdDashboard
                    stats={stats}
                    queue={queue}
                    recentAppointments={recentAppointments}
                    onRefresh={handleRefresh}
                    onViewPatient={handleViewPatient}
                    onStartConsultation={handleStartConsultation}
                />
            </div>

            {/* Registration Modal */}
            <Modal show={showRegistration} onClose={() => setShowRegistration(false)} maxWidth="2xl">
                <OpdRegistration
                    doctors={doctors}
                    availableSlots={availableSlots}
                    onPatientRegistered={handlePatientRegistered}
                    onClose={() => setShowRegistration(false)}
                />
            </Modal>

            {/* SOAP Notes Modal */}
            <Modal show={showSoapNotes} onClose={() => setShowSoapNotes(false)} maxWidth="2xl">
                {selectedAppointment && (
                    <SoapNotesForm
                        appointment={selectedAppointment}
                        patientHistory={mockPatientHistory}
                        templates={mockSoapTemplates}
                        onSave={handleSoapNotesSave}
                        onComplete={handleSoapNotesComplete}
                    />
                )}
            </Modal>

            {/* Diagnosis Search Modal */}
            <Modal show={showDiagnosisSearch} onClose={() => setShowDiagnosisSearch(false)} maxWidth="2xl">
                <Icd10Search
                    onCodeSelect={handleCodeSelect}
                    selectedCodes={selectedDiagnoses}
                    popularCodes={popularCodes}
                    onRemoveCode={handleRemoveCode}
                />
            </Modal>
        </HMSLayout>
    );
}