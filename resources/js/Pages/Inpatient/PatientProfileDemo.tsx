import React, { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { User, BedDouble, Stethoscope, RefreshCw, Wifi, WifiOff } from "lucide-react";
import PatientProfile, { PatientProfileData } from "./components/PatientProfile";

interface LivePatientData {
  id: number;
  name: string;
  bedNumber: string;
  ward: string;
  age: number;
  gender: "M" | "F";
  diagnosis: string;
  admissionDate: string;
  status: "stable" | "critical" | "review" | "isolation";
  doctor: string;
  vitals: {
    hr: number;
    bp: string;
    temp: number;
    spo2: number;
    rr: number;
    lastUpdated: string;
  };
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    nextDue: string;
    status: "due" | "given" | "overdue";
  }>;
  progressNotes: Array<{
    id: string;
    timestamp: string;
    author: string;
    type: "nursing" | "physician" | "therapy";
    content: string;
  }>;
  diagnostics: Array<{
    id: string;
    type: string;
    date: string;
    result: string;
    status: "pending" | "completed" | "reviewed";
  }>;
  labResults: Array<{
    id: string;
    test: string;
    value: string;
    reference: string;
    status: "normal" | "abnormal" | "critical";
    date: string;
  }>;
  nursingCharts: Array<{
    timestamp: string;
    vitals: {
      hr: number;
      bp: string;
      temp: number;
      spo2: number;
      rr: number;
    };
    intake: number;
    output: number;
    notes: string;
  }>;
  diet: {
    type: string;
    restrictions: string[];
    allergies: string[];
    lastMeal: string;
  };
}

export default function PatientProfileDemo() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfileData | null>(null);
  const [livePatients, setLivePatients] = useState<LivePatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/inpatient/api/live-patient-profiles');
      if (!response.ok) {
        throw new Error('Failed to fetch patient data');
      }
      const data = await response.json();
      setLivePatients(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient data');
      console.error('Error fetching live patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleViewProfile = (patientData: LivePatientData) => {
    // Convert LivePatientData to PatientProfileData format
    const profileData: PatientProfileData = {
      id: patientData.id,
      name: patientData.name,
      bedNumber: patientData.bedNumber,
      ward: patientData.ward,
      age: patientData.age,
      gender: patientData.gender,
      diagnosis: patientData.diagnosis,
      admissionDate: patientData.admissionDate,
      status: patientData.status,
      vitals: patientData.vitals,
      medications: patientData.medications,
      progressNotes: patientData.progressNotes,
      diagnostics: patientData.diagnostics,
      labResults: patientData.labResults,
      nursingCharts: patientData.nursingCharts,
      diet: patientData.diet,
    };
    
    setSelectedPatient(profileData);
    setProfileOpen(true);
  };

  return (
    <HMSLayout>
      <Head title="Patient Profile Demo" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6 py-4 bg-white border-b">
        <h2 className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
          👩‍⚕️ Patient Profile & Care Plan Demo
        </h2>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
                Live Patient Care Management
              </h1>
              <p className="text-gray-600 mb-4">
                Real-time patient profiles with comprehensive care data from your hospital database.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchLiveData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <div className="flex items-center gap-2 text-sm">
                {error ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <WifiOff className="w-4 h-4" />
                    Connection Error
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    Live Data
                  </div>
                )}
                {lastUpdated && (
                  <span className="text-gray-500">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Live Database</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✓ Auto-refresh</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">✓ Real-time Vitals</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">✓ Comprehensive Care Plans</span>
          </div>
        </div>
      </div>

      <div className="py-10 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Demo Patients Grid */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Live Patient Data</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {loading ? 'Loading patient data...' : 
                     error ? 'Unable to load patient data' :
                     `${livePatients.length} active patients • Click to view comprehensive profiles`}
                  </p>
                </div>
                {!loading && !error && (
                  <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    Auto-refreshes every 30s
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading live patient data...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Unable to load live data</p>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <button
                      onClick={fetchLiveData}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : livePatients.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No active patients found</p>
                    <p className="text-sm text-gray-500">Check back later or refresh the data</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {livePatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      onViewProfile={handleViewProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features Overview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🔄"
              title="Live Database Integration"
              description="Real-time data from your hospital's patient management system with automatic updates."
            />
            <FeatureCard
              icon="📊"
              title="Interactive Vitals Charts"
              description="24-hour trend visualization for heart rate, blood pressure, and other vital signs."
            />
            <FeatureCard
              icon="💊"
              title="Medication Tracking"
              description="Live medication schedules with administration status and due alerts."
            />
            <FeatureCard
              icon="📝"
              title="Multi-disciplinary Notes"
              description="Real-time progress notes from physicians, nurses, and therapists."
            />
            <FeatureCard
              icon="🔬"
              title="Lab & Diagnostics"
              description="Live lab results and diagnostic reports with status indicators."
            />
            <FeatureCard
              icon="📋"
              title="Comprehensive Care Plans"
              description="Complete patient care documentation including nursing charts and diet management."
            />
          </div>
        </div>
      </div>

      {/* Patient Profile Modal */}
      <PatientProfile
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        patient={selectedPatient}
      />
    </HMSLayout>
  );
}

interface PatientCardProps {
  patient: LivePatientData;
  onViewProfile: (patient: LivePatientData) => void;
}

function PatientCard({ patient, onViewProfile }: PatientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "isolation": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical": return "🚨";
      case "review": return "⚠️";
      case "isolation": return "🔒";
      default: return "✅";
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      onClick={() => onViewProfile(patient)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{patient.name}</h4>
            <p className="text-sm text-gray-600">{patient.age}y, {patient.gender}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(patient.status)}`}>
          <span className="mr-1">{getStatusIcon(patient.status)}</span>
          {patient.status}
        </span>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BedDouble className="w-4 h-4" />
          <span>Bed {patient.bedNumber} • {patient.ward}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Stethoscope className="w-4 h-4" />
          <span className="truncate">{patient.diagnosis}</span>
        </div>
      </div>

      {/* Live vitals preview */}
      <div className="bg-white rounded-lg p-2 mb-3 border border-gray-100">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">HR:</span>
            <span className="font-medium ml-1">{patient.vitals.hr} bpm</span>
          </div>
          <div>
            <span className="text-gray-500">BP:</span>
            <span className="font-medium ml-1">{patient.vitals.bp}</span>
          </div>
          <div>
            <span className="text-gray-500">Temp:</span>
            <span className="font-medium ml-1">{patient.vitals.temp.toFixed(1)}°C</span>
          </div>
          <div>
            <span className="text-gray-500">SpO₂:</span>
            <span className="font-medium ml-1">{patient.vitals.spo2}%</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors group-hover:shadow-md">
          View Full Profile
        </button>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}