import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Phone,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Appointment {
  id: number;
  patient_name: string;
  patient_id: string;
  age: number;
  gender: string;
  phone: string;
  appointment_time: string;
  doctor_name: string;
  department: string;
  status: 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  visit_type: 'new' | 'follow-up';
  chief_complaint?: string;
  room?: string;
}

interface AppointmentsProps {
  appointments: Appointment[];
  stats: {
    total: number;
    scheduled: number;
    checkedIn: number;
    inProgress: number;
    completed: number;
  };
  filters?: {
    date: string;
    status: string;
    search: string;
  };
}

export default function Appointments({ appointments, stats, filters }: AppointmentsProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [selectedStatus, setSelectedStatus] = useState(filters?.status || 'all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked-in': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'checked-in': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Stethoscope className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'no-show': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleCheckIn = (appointmentId: number) => {
    router.post(`/nurse/opd/appointments/${appointmentId}/check-in`, {}, {
      preserveScroll: true,
    });
  };

  const handleStartTriage = (appointmentId: number) => {
    router.visit(`/nurse/opd/triage/${appointmentId}`);
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         apt.patient_id.includes(searchQuery);
    const matchesStatus = selectedStatus === 'all' || apt.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <HMSLayout>
      <Head title="OPD Appointments - Nurse" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">OPD Appointments</h1>
            <p className="text-slate-600">Manage outpatient appointments and check-ins</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.visit('/nurse/opd/walk-ins')}>
              <User className="h-4 w-4 mr-2" />
              Walk-ins
            </Button>
            <Button onClick={() => router.visit('/nurse/opd/triage')}>
              <Stethoscope className="h-4 w-4 mr-2" />
              Triage Queue
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Total Today</div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Scheduled</div>
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Checked In</div>
              <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">In Progress</div>
              <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Completed</div>
              <div className="text-2xl font-bold text-slate-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by patient name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="checked-in">Checked In</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No appointments found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery ? `No results for "${searchQuery}"` : 'No appointments scheduled for today'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Left: Patient Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {appointment.patient_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">{appointment.patient_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {appointment.patient_id}
                          </Badge>
                          {appointment.visit_type === 'new' && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                              New Patient
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                          <span>{appointment.age}y, {appointment.gender}</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {appointment.phone}
                          </span>
                          {appointment.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {appointment.room}
                            </span>
                          )}
                        </div>
                        {appointment.chief_complaint && (
                          <p className="text-sm text-slate-600 mt-1">
                            <span className="font-medium">Chief Complaint:</span> {appointment.chief_complaint}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Center: Appointment Details */}
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <Clock className="h-4 w-4" />
                        {appointment.appointment_time}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        Dr. {appointment.doctor_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {appointment.department}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-3">
                      <Badge className={cn('flex items-center gap-1', getStatusColor(appointment.status))}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status.replace('-', ' ').toUpperCase()}
                      </Badge>

                      <div className="flex flex-col gap-2">
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(appointment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Check In
                          </Button>
                        )}
                        {appointment.status === 'checked-in' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartTriage(appointment.id)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Stethoscope className="h-4 w-4 mr-1" />
                            Start Triage
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.visit(`/nurse/patients/${appointment.patient_id}`)}
                        >
                          View Chart
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </HMSLayout>
  );
}
