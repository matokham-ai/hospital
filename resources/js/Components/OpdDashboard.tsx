import { Users, Clock, UserCheck, CheckCircle, RefreshCw, X, Calendar, User, FileText, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import type { DashboardStats, QueueItem, OpdAppointment } from '@/types';

interface OpdDashboardProps {
  stats: DashboardStats;
  queue: QueueItem[];
  recentAppointments: OpdAppointment[];
  onRefresh: () => void;
  onViewPatient: (patientId: number) => void;
  onStartConsultation: (appointmentId: number) => void;
}

export default function OpdDashboard({
  stats,
  queue,
  recentAppointments,
  onRefresh,
  onViewPatient,
  onStartConsultation
}: OpdDashboardProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<OpdAppointment | null>(null);
  const statCards = [
    {
      title: 'Total Patients Today',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Waiting Patients',
      value: stats.waitingPatients,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'In Consultation',
      value: stats.inConsultation,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'WAITING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'checked_in': 'bg-yellow-100 text-yellow-800',
      'in_consultation': 'bg-blue-100 text-blue-800'
    };

    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  const handleViewQueue = () => {
    window.location.href = '/opd/queue';
  };

  const handleViewPrescriptions = () => {
    window.location.href = '/opd/prescriptions';
  };

  const handleRegisterPatient = () => {
    window.location.href = '/patients/create';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OPD Dashboard</h1>
          <p className="text-gray-600">Overview of today's outpatient activities</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Queue */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleViewQueue}
            >
              Current Queue
            </h2>
            <button
              onClick={handleViewQueue}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {queue.length > 0 ? (
              queue.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">#{item.queue_number}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.patient_name}</p>
                      <p className="text-sm text-gray-600">{item.doctor_name}</p>
                      <p className="text-xs text-gray-500">{item.chief_complaint}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-600">{formatWaitingTime(item.waiting_time)}</p>
                    {item.status === 'WAITING' && (
                      <button
                        onClick={() => onStartConsultation(item.id)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No patients in queue</p>
            )}
          </div>
          {queue.length > 5 && (
            <div className="mt-4 text-center">
              <a href="/opd/queue" className="text-blue-600 hover:text-blue-800 font-medium">
                View all ({queue.length} patients)
              </a>
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Appointments</h2>
          <div className="space-y-3">
            {recentAppointments.length > 0 ? (
              recentAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {appointment.patient?.first_name} {appointment.patient?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{appointment.appointment_number}</p>
                    <p className="text-sm text-gray-600">{appointment.chief_complaint}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                    <button
                      onClick={() => setSelectedAppointment(appointment)}
                      className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent appointments</p>
            )}
          </div>
          {recentAppointments.length > 5 && (
            <div className="mt-4 text-center">
              <a href="/opd/consultations" className="text-blue-600 hover:text-blue-800 font-medium">
                View all appointments
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={handleViewQueue}
            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Manage Queue</p>
              <p className="text-sm text-blue-600">View and manage patient queue</p>
            </div>
          </button>
          <button
            onClick={handleRegisterPatient}
            className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
          >
            <UserCheck className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Register Patient</p>
              <p className="text-sm text-green-600">Add new patient to system</p>
            </div>
          </button>
          <button
            onClick={() => window.location.href = '/opd/consultations'}
            className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
          >
            <CheckCircle className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">View Consultations</p>
              <p className="text-sm text-purple-600">Active and completed consultations</p>
            </div>
          </button>
          <button
            onClick={handleViewPrescriptions}
            className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
          >
            <CheckCircle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">View Prescriptions</p>
              <p className="text-sm text-orange-600">Manage patient prescriptions</p>
            </div>
          </button>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                <p className="text-sm text-gray-600">{selectedAppointment.appointment_number}</p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedAppointment.appointment_date} at {selectedAppointment.appointment_time}
                </span>
              </div>

              {/* Patient Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900 font-medium">
                      {selectedAppointment.patient?.first_name} {selectedAppointment.patient?.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Patient ID</label>
                    <p className="text-gray-900">{selectedAppointment.patient?.id}</p>
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              {selectedAppointment.doctor && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Doctor Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900 font-medium">{selectedAppointment.doctor.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Specialization</label>
                      <p className="text-gray-900">{selectedAppointment.doctor.specialization}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Chief Complaint</label>
                    <p className="text-gray-900">{selectedAppointment.chief_complaint}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date</label>
                      <p className="text-gray-900">{selectedAppointment.appointment_date}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Time</label>
                      <p className="text-gray-900">{selectedAppointment.appointment_time || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created At</label>
                      <p className="text-gray-900 text-sm">{selectedAppointment.created_at}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Updated At</label>
                      <p className="text-gray-900 text-sm">{selectedAppointment.updated_at}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.location.href = `/patients/${selectedAppointment.patient_id}`;
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Patient Profile
              </button>
              {selectedAppointment.status === 'COMPLETED' && (
                <button
                  onClick={() => {
                    window.location.href = `/opd/consultations/${selectedAppointment.id}/notes`;
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View SOAP Notes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}