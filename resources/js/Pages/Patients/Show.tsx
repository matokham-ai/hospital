import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Heart,
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  Activity,
  Stethoscope,
  Pill,
  TestTube,
  Camera,
  Trash2,
  Download,
  Printer as Print,
} from "lucide-react";
import { motion } from "framer-motion";

interface Patient {
  id: string;
  hospital_id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  age: number;
  age_group: string;
  gender: string;
  marital_status?: string;
  occupation?: string;
  nationality?: string;
  religion?: string;
  phone_number: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_number?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Medical history (if available)
  recent_visits?: Array<{
    id: string;
    date: string;
    type: string;
    diagnosis?: string;
    doctor: string;
  }>;
  medical_alerts?: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface ShowPatientProps {
  patient: Patient;
  auth: {
    user: {
      name: string;
      email: string;
      role?: string;
    };
  };
}

const InfoCard = ({ 
  title, 
  icon: Icon, 
  children, 
  className = "" 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-teal-100 rounded-lg">
        <Icon className="w-5 h-5 text-teal-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const AlertBadge = ({ 
  type, 
  message, 
  severity 
}: { 
  type: string; 
  message: string; 
  severity: 'low' | 'medium' | 'high';
}) => {
  const colors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${colors[severity]}`}>
      <AlertTriangle className="w-4 h-4" />
      <span className="font-semibold">{type}:</span>
      <span>{message}</span>
    </div>
  );
};

export default function ShowPatient({ patient, auth }: ShowPatientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${patient.first_name} ${patient.last_name}? This action cannot be undone.`)) {
      router.delete(`/patients/${patient.id}`, {
        onSuccess: () => {
          router.visit('/patients');
        }
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Export patient data as PDF
    window.open(`/patients/${patient.id}/export`, '_blank');
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "medical", label: "Medical Info", icon: Heart },
    { id: "history", label: "Visit History", icon: Clock },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  const getAgeGroupColor = (ageGroup: string) => {
    switch (ageGroup.toLowerCase()) {
      case 'infant': return 'bg-pink-100 text-pink-800';
      case 'child': return 'bg-blue-100 text-blue-800';
      case 'adolescent': return 'bg-purple-100 text-purple-800';
      case 'adult': return 'bg-green-100 text-green-800';
      case 'senior': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title={`${patient.first_name} ${patient.last_name} - Patient Profile | MediCare HMS`} />

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/patients"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {patient.first_name} {patient.middle_name} {patient.last_name}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAgeGroupColor(patient.age_group)}`}>
                    {patient.age_group}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-teal-100">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {patient.hospital_id}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {patient.age} years old
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {patient.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Print Profile"
              >
                <Print className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Export as PDF"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
              <Link
                href={`/patients/${patient.id}/edit`}
                className="inline-flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Patient
              </Link>
              {auth.user.role === "Admin" && (
                <button
                  onClick={handleDelete}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  title="Delete Patient"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Medical Alerts */}
      {patient.medical_alerts && patient.medical_alerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-yellow-800 font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Medical Alerts
            </h4>
            <div className="flex flex-wrap gap-2">
              {patient.medical_alerts.map((alert, index) => (
                <AlertBadge
                  key={index}
                  type={alert.type}
                  message={alert.message}
                  severity={alert.severity}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-teal-500 text-teal-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information */}
            <InfoCard title="Personal Information" icon={User}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{patient.first_name} {patient.middle_name} {patient.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{patient.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</span>
                </div>
                {patient.marital_status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marital Status:</span>
                    <span className="font-medium">{patient.marital_status}</span>
                  </div>
                )}
                {patient.occupation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupation:</span>
                    <span className="font-medium">{patient.occupation}</span>
                  </div>
                )}
                {patient.nationality && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nationality:</span>
                    <span className="font-medium">{patient.nationality}</span>
                  </div>
                )}
                {patient.religion && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Religion:</span>
                    <span className="font-medium">{patient.religion}</span>
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact Information" icon={Phone}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{patient.phone_number}</p>
                    <p className="text-sm text-gray-600">Primary Phone</p>
                  </div>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{patient.email}</p>
                      <p className="text-sm text-gray-600">Email Address</p>
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Emergency Contact</h4>
                  {patient.emergency_contact_name && (
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{patient.emergency_contact_name}</p>
                        <p className="text-sm text-gray-600">{patient.emergency_contact_relationship}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{patient.emergency_contact_phone}</p>
                      <p className="text-sm text-gray-600">Emergency Phone</p>
                    </div>
                  </div>
                </div>
              </div>
            </InfoCard>

            {/* Address Information */}
            <InfoCard title="Address Information" icon={MapPin}>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">{patient.address_line_1}</p>
                  {patient.address_line_2 && <p className="text-gray-600">{patient.address_line_2}</p>}
                  <p className="text-gray-600">
                    {patient.city}, {patient.state}
                    {patient.postal_code && ` ${patient.postal_code}`}
                  </p>
                  <p className="text-gray-600">{patient.country}</p>
                </div>
              </div>
            </InfoCard>
          </div>
        )}

        {/* Medical Info Tab */}
        {activeTab === "medical" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InfoCard title="Medical Conditions" icon={Heart}>
              <div className="space-y-4">
                {patient.allergies && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Allergies
                    </h4>
                    <p className="text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                      {patient.allergies}
                    </p>
                  </div>
                )}
                {patient.chronic_conditions && (
                  <div>
                    <h4 className="font-medium text-orange-700 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Chronic Conditions
                    </h4>
                    <p className="text-sm bg-orange-50 p-3 rounded-lg border border-orange-200">
                      {patient.chronic_conditions}
                    </p>
                  </div>
                )}
                {patient.current_medications && (
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Current Medications
                    </h4>
                    <p className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {patient.current_medications}
                    </p>
                  </div>
                )}
                {!patient.allergies && !patient.chronic_conditions && !patient.current_medications && (
                  <p className="text-gray-500 text-center py-8">No medical conditions recorded</p>
                )}
              </div>
            </InfoCard>

            <InfoCard title="Insurance Information" icon={Shield}>
              <div className="space-y-3">
                {patient.insurance_provider ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium">{patient.insurance_provider}</span>
                    </div>
                    {patient.insurance_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Policy Number:</span>
                        <span className="font-medium">{patient.insurance_number}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">No insurance information recorded</p>
                )}
              </div>
            </InfoCard>

            {patient.notes && (
              <div className="lg:col-span-2">
                <InfoCard title="Additional Notes" icon={FileText}>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.notes}</p>
                </InfoCard>
              </div>
            )}
          </div>
        )}

        {/* Visit History Tab */}
        {activeTab === "history" && (
          <InfoCard title="Recent Visits" icon={Clock}>
            {patient.recent_visits && patient.recent_visits.length > 0 ? (
              <div className="space-y-4">
                {patient.recent_visits.map((visit) => (
                  <div key={visit.id} className="border-l-4 border-teal-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{visit.type}</p>
                        <p className="text-sm text-gray-600">Dr. {visit.doctor}</p>
                        {visit.diagnosis && (
                          <p className="text-sm text-gray-700 mt-1">Diagnosis: {visit.diagnosis}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(visit.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No visit history available</p>
                <p className="text-sm text-gray-400">Patient visits will appear here once recorded</p>
              </div>
            )}
          </InfoCard>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <InfoCard title="Patient Documents" icon={FileText}>
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded</p>
              <p className="text-sm text-gray-400">Patient documents and reports will appear here</p>
              <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                <Camera className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          </InfoCard>
        )}
      </div>
    </HMSLayout>
  );
}