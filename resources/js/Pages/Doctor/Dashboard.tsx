import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { X, Plus, Calendar, Pill, TestTube, Users, ChevronLeft, ChevronRight, Check, User, Phone, Heart, AlertCircle, Search } from 'lucide-react';
import PermissionsOverview from '@/Components/Doctor/PermissionsOverview';
import MedicineBrowser from '@/Components/Doctor/MedicineBrowser';
import MedicalRecordsBrowser from '@/Components/Doctor/MedicalRecordsBrowser';
import DashboardStatus from '@/Components/Doctor/DashboardStatus';
import { PermissionGuard } from '@/hooks/usePermissions';
import { doctorRoutes } from '@/utils/navigation';



export default function DoctorDashboard({
    userName,
    userEmail,
    userRole,
    kpis,
    todaySchedule,
    pendingTasks
}: {
    userName?: string;
    userEmail?: string;
    userRole?: string;
    kpis?: any;
    todaySchedule?: any[];
    pendingTasks?: any[];
}) {

    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showLabOrderModal, setShowLabOrderModal] = useState(false);
    const [showMedicineBrowser, setShowMedicineBrowser] = useState(false);
    const [showMedicalRecords, setShowMedicalRecords] = useState(false);

    return (
        <HMSLayout
            user={{ name: userName || 'Doctor', email: userEmail || '', role: userRole || 'Doctor' }}
            breadcrumbs={[
                { name: 'Dashboard' }
            ]}
        >
            <Head title="Doctor Dashboard - MediCare HMS" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <span className="text-3xl">👨‍⚕️</span>
                                Doctor Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">Welcome, Dr. {userName}! Manage your patients and appointments.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={doctorRoutes.inpatient.rounds}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                Doctor Rounds
                            </Link>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Link
                            href={doctorRoutes.inpatient.rounds}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer block"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Today's Rounds</p>
                                    <p className="text-2xl font-bold text-blue-600">{kpis?.todayAppointments || 8}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-blue-50">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </Link>

                        <Link
                            href={doctorRoutes.patients.list}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all cursor-pointer block"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">My Patients</p>
                                    <p className="text-2xl font-bold text-green-600">{kpis?.completedToday || 15}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-green-50">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </Link>

                        <Link
                            href={doctorRoutes.inpatient.labs}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-orange-300 transition-all cursor-pointer block"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Lab Results</p>
                                    <p className="text-2xl font-bold text-orange-600">{kpis?.pendingReviews || 5}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-orange-50">
                                    <TestTube className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </Link>

                        <button
                            onClick={() => setShowMedicineBrowser(true)}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer w-full text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                                    <p className="text-2xl font-bold text-purple-600">{kpis?.activePrescriptions || 12}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-purple-50">
                                    <Pill className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Today's Schedule */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                📅 Today's Schedule
                            </h3>
                            <div className="space-y-4">
                                {(todaySchedule || []).map((appointment) => (
                                    <div key={appointment.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                        <div className="text-sm font-mono text-gray-600 w-16">
                                            {appointment.time}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{appointment.patient}</p>
                                            <p className="text-sm text-gray-600">{appointment.type}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            appointment.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {appointment.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <Link
                                    href={doctorRoutes.inpatient.rounds}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View all rounds →
                                </Link>
                            </div>
                        </div>

                        {/* Pending Tasks */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                📋 Pending Tasks
                            </h3>
                            <div className="space-y-4">
                                {(pendingTasks || []).map((task) => (
                                    <div key={task.id} className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                        <div className={`p-1 rounded-full mt-1 ${task.priority === 'high' ? 'bg-red-100' :
                                            task.priority === 'medium' ? 'bg-yellow-100' :
                                                'bg-blue-100'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' :
                                                task.priority === 'medium' ? 'bg-yellow-500' :
                                                    'bg-blue-500'
                                                }`}></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{task.task}</p>
                                            <p className="text-xs text-gray-500 mt-1">{task.time}</p>
                                        </div>
                                        <Link
                                            href={doctorRoutes.inpatient.labs}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Review
                                        </Link>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <Link
                                    href={doctorRoutes.inpatient.labs}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View all lab results →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            ⚡ Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <PermissionGuard module="patients" action="edit">
                                <Link
                                    href={doctorRoutes.patients.list}
                                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                                >
                                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                                        <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">Patient</h4>
                                    <p className="text-sm text-gray-600">view patient</p>
                               </Link>
                            </PermissionGuard>

                            <PermissionGuard module="prescriptions" action="browse_medicines">
                                <button
                                    onClick={() => setShowMedicineBrowser(true)}
                                    className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left"
                                >
                                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3">
                                        <Pill className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">Browse Medicines</h4>
                                    <p className="text-sm text-gray-600">View & prescribe medications</p>
                                </button>
                            </PermissionGuard>

                            <PermissionGuard module="medical_records" action="browse">
                                <button
                                    onClick={() => setShowMedicalRecords(true)}
                                    className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                                >
                                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
                                        <Search className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">Medical Records</h4>
                                    <p className="text-sm text-gray-600">Browse patient history</p>
                                </button>
                            </PermissionGuard>

                            <PermissionGuard module="labs" action="order">
                                <button
                                    onClick={() => setShowLabOrderModal(true)}
                                    className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                                >
                                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3">
                                        <TestTube className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">Order Lab</h4>
                                    <p className="text-sm text-gray-600">Request lab tests</p>
                                </button>
                            </PermissionGuard>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Doctor Permissions Overview */}
                        <PermissionsOverview userRole={userRole || 'Doctor'} showDetails={false} />

                        {/* Dashboard Status */}
                        <DashboardStatus />
                    </div>

                    {/* Medicine Browser */}
                    {showMedicineBrowser && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Medicine Browser</h3>
                                    <button
                                        onClick={() => setShowMedicineBrowser(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <div className="overflow-y-auto max-h-[80vh]">
                                    <MedicineBrowser
                                        showPrescribeButton={true}
                                        onPrescribe={(medicine, dosage, duration) => {
                                            console.log('Prescribing:', medicine.name, dosage, duration);
                                            // Handle prescription logic here
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Medical Records Browser */}
                    {showMedicalRecords && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Medical Records</h3>
                                    <button
                                        onClick={() => setShowMedicalRecords(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <div className="overflow-y-auto max-h-[80vh]">
                                    <MedicalRecordsBrowser
                                        onSelectRecord={(record) => {
                                            console.log('Selected record:', record);
                                            // Handle record selection logic here
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>


            {/* Prescription Modal */}
            {showPrescriptionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">Create Prescription</h3>
                                <button
                                    onClick={() => setShowPrescriptionModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Patient
                                </label>
                                <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                    <option>Choose a patient...</option>
                                    <option>John Smith - #12345</option>
                                    <option>Mary Johnson - #12346</option>
                                    <option>Robert Brown - #12347</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Medication
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Enter medication name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Dosage
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="e.g., 500mg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Frequency
                                    </label>
                                    <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                                        <option>Once daily</option>
                                        <option>Twice daily</option>
                                        <option>Three times daily</option>
                                        <option>As needed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowPrescriptionModal(false)}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPrescriptionModal(false);
                                        setShowMedicineBrowser(true);
                                    }}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Browse Medicines
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lab Order Modal */}
            {showLabOrderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-900">Order Lab Tests</h3>
                                <button
                                    onClick={() => setShowLabOrderModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Patient
                                </label>
                                <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                    <option>Choose a patient...</option>
                                    <option>John Smith - #12345</option>
                                    <option>Mary Johnson - #12346</option>
                                    <option>Robert Brown - #12347</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lab Tests
                                </label>
                                <div className="space-y-2">
                                    {['Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Lipid Panel', 'Thyroid Function Tests'].map((test) => (
                                        <label key={test} className="flex items-center gap-3">
                                            <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                            <span className="text-sm text-gray-700">{test}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority
                                </label>
                                <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                    <option>Routine</option>
                                    <option>Urgent</option>
                                    <option>STAT</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowLabOrderModal(false)}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLabOrderModal(false);
                                        alert('Lab order submitted successfully!');
                                    }}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Submit Lab Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </HMSLayout>
    );
}
