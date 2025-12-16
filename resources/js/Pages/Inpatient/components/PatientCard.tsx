import React from 'react';

interface Patient {
  id: number;
  name: string;
  bedNumber: string;
  ward: string;
  status: 'stable' | 'critical' | 'review';
  admissionDate: string;
  diagnosis?: string;
  age?: number;
  gender?: string;
}

interface Props {
  patient: Patient;
  onClick?: (patient: Patient) => void;
  onViewProfile?: (patient: Patient) => void;
  onViewVitals?: (patient: Patient) => void;
  showDetails?: boolean;
}

export default function PatientCard({ patient, onClick, onViewProfile, onViewVitals, showDetails = true }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-800 border-green-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'stable': return '✅';
      case 'critical': return '🚨';
      case 'review': return '⚠️';
      default: return '📋';
    }
  };

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}
      `}
      onClick={() => onClick && onClick(patient)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{patient.name}</h3>
          <p className="text-sm text-gray-600">
            Bed {patient.bedNumber} • {patient.ward}
          </p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(patient.status)}`}>
          <span className="mr-1">{getStatusIcon(patient.status)}</span>
          {patient.status}
        </span>
      </div>

      {/* Patient Details */}
      {showDetails && (
        <div className="space-y-2">
          {patient.age && patient.gender && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Age/Gender:</span>
              <span className="font-medium">{patient.age}y, {patient.gender}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Admitted:</span>
            <span className="font-medium">{patient.admissionDate}</span>
          </div>

          {patient.diagnosis && (
            <div className="text-sm">
              <span className="text-gray-600">Diagnosis:</span>
              <p className="font-medium text-gray-900 mt-1">{patient.diagnosis}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <div className="flex space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.(patient);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors"
          >
            View Profile
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewVitals?.(patient);
            }}
            className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline transition-colors"
          >
            Vitals
          </button>
        </div>
        <div className="text-xs text-gray-500">
          ID: {patient.id}
        </div>
      </div>
    </div>
  );
}
