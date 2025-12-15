import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { 
    User, Calendar, Phone, Mail, MapPin, Heart, AlertCircle, 
    Activity, Pill, TestTube, FileText, Bed, ChevronRight,
    Download, Edit, Clock, Stethoscope
} from 'lucide-react';
import type { PageProps } from '@/types';

interface PatientProfileProps extends PageProps {
    patient: any;
    appointments: any;
    encounters: any[];
    vitalSigns: any[];
    prescriptions: any[];
    labOrders: any[];
    imagingOrders: any[];
    diagnoses: any[];
    stats: any;
}

export default function PatientProfile({
    auth,
    patient,
    appointments,
    encounters,
    vitalSigns,
    prescriptions,
    labOrders,
    imagingOrders,
    diagnoses,
    stats
}: PatientProfileProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const allAppointments = [
        ...appointments.opd,
        ...appointments.regular
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'vitals', label: 'Vital Signs', icon: Activity },
        { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
        { id: 'labs', label: 'Lab Results', icon: TestTube },
        { id: 'imaging', label: 'Imaging', icon: FileText },
        { id: 'admissions', label: 'Admissions', icon: Bed },
        { id: 'diagnoses', label: 'Diagnoses', icon: Stethoscope },
    ];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'COMPLETED': 'bg-green-100 text-green-800',
            'WAITING': 'bg-yellow-100 text-yellow-800',
            'IN_PROGRESS': 'bg-blue-100 text-blue-800',
            'CANCELLED': 'bg-red-100 text-red-800',
            'active': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'completed': 'bg-blue-100 text-blue-800',
            'ACTIVE': 'bg-green-100 text-green-800',
            'DISCHARGED': 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title={`${patient.name} - Patient Profile`} />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
                            <p className="text-gray-600">MRN: {patient.medical_record_number}</p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={`/patients/${patient.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </Link>
                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Visits</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_visits}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Admissions</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_admissions}</p>
                                </div>
                                <Bed className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Active Prescriptions</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.active_prescriptions}</p>
                                </div>
                                <Pill className="w-8 h-8 text-purple-500" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Pending Labs</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pending_labs}</p>
                                </div>
                                <TestTube className="w-8 h-8 text-orange-500" />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Sidebar - Patient Info */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                                <div className="text-center mb-6">
                                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
                                    <p className="text-gray-600">{patient.age} years • {patient.gender}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Phone</p>
                                            <p className="text-gray-900">{patient.phone}</p>
                                        </div>
                                    </div>

                                    {patient.email && (
                                        <div className="flex items-start gap-3">
                                            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-600">Email</p>
                                                <p className="text-gray-900">{patient.email}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Address</p>
                                            <p className="text-gray-900">{patient.address}</p>
                                            <p className="text-gray-600 text-sm">{patient.city}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Heart className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Blood Group</p>
                                            <p className="text-gray-900">{patient.blood_group}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-600">Allergies</p>
                                            <p className="text-gray-900">{patient.allergies}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">Emergency Contact</p>
                                        <p className="text-gray-900 font-medium">{patient.emergency_contact_name}</p>
                                        <p className="text-gray-600">{patient.emergency_contact_phone}</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">Registered</p>
                                        <p className="text-gray-900">{patient.created_at}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Tabs */}
                        <div className="lg:col-span-2">
                            {/* Tabs */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                                <div className="flex overflow-x-auto">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                                                    activeTab === tab.id
                                                        ? 'border-blue-600 text-blue-600'
                                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                {/* Overview Tab */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                                            <div className="space-y-3">
                                                {allAppointments.slice(0, 5).map((apt) => (
                                                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-gray-900">{apt.type} Appointment</p>
                                                            <p className="text-sm text-gray-600">{apt.date} • {apt.doctor}</p>
                                                            <p className="text-sm text-gray-500">{apt.chief_complaint}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                                                            {apt.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {vitalSigns.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Vital Signs</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-blue-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Temperature</p>
                                                        <p className="text-xl font-bold text-gray-900">{vitalSigns[0].temperature}°C</p>
                                                    </div>
                                                    <div className="p-3 bg-green-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Blood Pressure</p>
                                                        <p className="text-xl font-bold text-gray-900">{vitalSigns[0].blood_pressure}</p>
                                                    </div>
                                                    <div className="p-3 bg-purple-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">Heart Rate</p>
                                                        <p className="text-xl font-bold text-gray-900">{vitalSigns[0].heart_rate} bpm</p>
                                                    </div>
                                                    <div className="p-3 bg-orange-50 rounded-lg">
                                                        <p className="text-sm text-gray-600">O2 Saturation</p>
                                                        <p className="text-xl font-bold text-gray-900">{vitalSigns[0].oxygen_saturation}%</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-2">Recorded: {vitalSigns[0].recorded_at}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Appointments Tab */}
                                {activeTab === 'appointments' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Appointments</h3>
                                        {allAppointments.map((apt) => (
                                            <div key={`${apt.type}-${apt.id}`} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                {apt.type}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(apt.status)}`}>
                                                                {apt.status}
                                                            </span>
                                                        </div>
                                                        <p className="font-medium text-gray-900">{apt.appointment_number}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <Clock className="w-4 h-4 inline mr-1" />
                                                            {apt.date} at {apt.time || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-600">Doctor: {apt.doctor}</p>
                                                        <p className="text-sm text-gray-700 mt-2">{apt.chief_complaint}</p>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                        ))}
                                        {allAppointments.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No appointments found</p>
                                        )}
                                    </div>
                                )}

                                {/* Vital Signs Tab */}
                                {activeTab === 'vitals' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs History</h3>
                                        {vitalSigns.map((vital) => (
                                            <div key={vital.id} className="p-4 border border-gray-200 rounded-lg">
                                                <p className="text-sm text-gray-600 mb-3">{vital.recorded_at}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-600">Temperature</p>
                                                        <p className="font-medium text-gray-900">{vital.temperature}°C</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">BP</p>
                                                        <p className="font-medium text-gray-900">{vital.blood_pressure}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Heart Rate</p>
                                                        <p className="font-medium text-gray-900">{vital.heart_rate} bpm</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">O2 Sat</p>
                                                        <p className="font-medium text-gray-900">{vital.oxygen_saturation}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {vitalSigns.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No vital signs recorded</p>
                                        )}
                                    </div>
                                )}

                                {/* Prescriptions Tab */}
                                {activeTab === 'prescriptions' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription History</h3>
                                        {prescriptions.map((rx) => (
                                            <div key={rx.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{rx.drug_name}</p>
                                                        <p className="text-sm text-gray-600">{rx.dosage} • {rx.frequency}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(rx.status)}`}>
                                                        {rx.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">Duration: {rx.duration} days • Quantity: {rx.quantity}</p>
                                                <p className="text-sm text-gray-500 mt-2">Prescribed by: {rx.prescribed_by} on {rx.created_at}</p>
                                            </div>
                                        ))}
                                        {prescriptions.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No prescriptions found</p>
                                        )}
                                    </div>
                                )}

                                {/* Lab Orders Tab */}
                                {activeTab === 'labs' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Laboratory Tests</h3>
                                        {labOrders.map((lab) => (
                                            <div key={lab.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{lab.test_name}</p>
                                                        <p className="text-sm text-gray-600">Ordered: {lab.ordered_at}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lab.status)}`}>
                                                        {lab.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-2">Result: {lab.result}</p>
                                            </div>
                                        ))}
                                        {labOrders.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No lab orders found</p>
                                        )}
                                    </div>
                                )}

                                {/* Imaging Tab */}
                                {activeTab === 'imaging' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Imaging Studies</h3>
                                        {imagingOrders.map((img) => (
                                            <div key={img.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{img.imaging_type}</p>
                                                        <p className="text-sm text-gray-600">Ordered: {img.ordered_at}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(img.status)}`}>
                                                        {img.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">Priority: {img.priority}</p>
                                            </div>
                                        ))}
                                        {imagingOrders.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No imaging orders found</p>
                                        )}
                                    </div>
                                )}

                                {/* Admissions Tab */}
                                {activeTab === 'admissions' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admission History</h3>
                                        {encounters.map((enc: any) => (
                                            <div key={enc.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-medium text-gray-900">{enc.encounter_number}</p>
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                {enc.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">Admitted: {enc.admission_date}</p>
                                                        {enc.discharge_date && (
                                                            <p className="text-sm text-gray-600">Discharged: {enc.discharge_date}</p>
                                                        )}
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(enc.status)}`}>
                                                        {enc.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-2">Ward: {enc.ward} • Bed: {enc.bed}</p>
                                                <p className="text-sm text-gray-600">Reason: {enc.admission_reason}</p>
                                                {enc.priority && enc.priority !== 'NORMAL' && (
                                                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                        Priority: {enc.priority}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {encounters.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No admission history</p>
                                        )}
                                    </div>
                                )}

                                {/* Diagnoses Tab */}
                                {activeTab === 'diagnoses' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnosis History</h3>
                                        {diagnoses.map((dx: any) => (
                                            <div key={dx.id} className="p-4 border border-gray-200 rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-medium text-gray-900">{dx.diagnosis_description}</p>
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                                {dx.source}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">ICD-10 Code: {dx.diagnosis_code}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                        {dx.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">Diagnosed: {dx.diagnosed_at}</p>
                                            </div>
                                        ))}
                                        {diagnoses.length === 0 && (
                                            <p className="text-center text-gray-500 py-8">No diagnoses recorded</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
