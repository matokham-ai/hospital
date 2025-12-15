import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserPlus,
  User,
  Phone,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalkInPatient {
  id: number;
  patient_name: string;
  patient_id: string;
  age: number;
  gender: string;
  phone: string;
  arrival_time: string;
  chief_complaint: string;
  status: 'waiting' | 'in-triage' | 'with-doctor' | 'completed';
  queue_number: number;
  is_new_patient: boolean;
}

interface WalkInsProps {
  patients: WalkInPatient[];
  stats: {
    total: number;
    waiting: number;
    inTriage: number;
    withDoctor: number;
    completed: number;
  };
  nextQueueNumber: number;
}

export default function WalkIns({ patients, stats, nextQueueNumber }: WalkInsProps) {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    first_name: '',
    last_name: '',
    age: '',
    gender: 'M',
    phone: '',
    chief_complaint: '',
    is_new_patient: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-triage': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'with-doctor': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleSearchPatient = () => {
    if (searchQuery) {
      // Search for existing patient
      router.get(`/nurse/opd/walk-ins/search?q=${searchQuery}`, {}, {
        preserveState: true,
        onSuccess: (page: any) => {
          if (page.props.patient) {
            setFormData({
              ...formData,
              patient_id: page.props.patient.id,
              first_name: page.props.patient.first_name,
              last_name: page.props.patient.last_name,
              age: page.props.patient.age,
              gender: page.props.patient.gender,
              phone: page.props.patient.phone,
              is_new_patient: false,
            });
          }
        },
      });
    }
  };

  const handleRegisterWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    router.post('/nurse/opd/walk-ins', formData, {
      onSuccess: () => {
        setShowRegistrationForm(false);
        setFormData({
          patient_id: '',
          first_name: '',
          last_name: '',
          age: '',
          gender: 'M',
          phone: '',
          chief_complaint: '',
          is_new_patient: false,
        });
        setSearchQuery('');
      },
    });
  };

  const filteredPatients = patients.filter(p =>
    p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient_id.includes(searchQuery)
  );

  return (
    <HMSLayout>
      <Head title="Walk-in Patients - Nurse OPD" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Walk-in Patients</h1>
            <p className="text-slate-600">Register and manage walk-in patients</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.visit('/nurse/opd/appointments')}>
              Appointments
            </Button>
            <Button variant="outline" onClick={() => router.visit('/nurse/opd/triage')}>
              Triage Queue
            </Button>
            <Button onClick={() => setShowRegistrationForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register Walk-in
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
              <div className="text-sm text-slate-600">Waiting</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">In Triage</div>
              <div className="text-2xl font-bold text-blue-600">{stats.inTriage}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">With Doctor</div>
              <div className="text-2xl font-bold text-purple-600">{stats.withDoctor}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Completed</div>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form Modal */}
        {showRegistrationForm && (
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Register Walk-in Patient
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRegistrationForm(false)}
                >
                  Cancel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterWalkIn} className="space-y-4">
                {/* Search Existing Patient */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Label className="text-sm font-semibold text-blue-900 mb-2 block">
                    Search Existing Patient (Optional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter patient ID, name, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleSearchPatient}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Search for returning patients to auto-fill their information
                  </p>
                </div>

                {/* Patient Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="chief_complaint">Chief Complaint *</Label>
                    <textarea
                      id="chief_complaint"
                      value={formData.chief_complaint}
                      onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                {/* New Patient Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_new_patient"
                    checked={formData.is_new_patient}
                    onChange={(e) => setFormData({ ...formData, is_new_patient: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_new_patient" className="cursor-pointer">
                    This is a new patient (first visit)
                  </Label>
                </div>

                {/* Queue Number Display */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">
                      Queue Number: {nextQueueNumber}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Patient will be assigned this queue number
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register & Add to Queue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Walk-in Queue */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No walk-in patients</p>
                <p className="text-sm text-slate-500 mt-1">
                  Click "Register Walk-in" to add a patient
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Queue Number & Patient Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                        {patient.queue_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg">{patient.patient_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {patient.patient_id}
                          </Badge>
                          {patient.is_new_patient && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                              New Patient
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                          <span>{patient.age}y, {patient.gender}</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Arrived: {patient.arrival_time}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mt-2">
                          <span className="font-medium">Chief Complaint:</span> {patient.chief_complaint}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <Badge className={cn('text-xs font-semibold', getStatusColor(patient.status))}>
                        {patient.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex flex-col gap-2">
                        {patient.status === 'waiting' && (
                          <Button
                            size="sm"
                            onClick={() => router.visit(`/nurse/opd/triage/${patient.id}`)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Start Triage
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.visit(`/nurse/patients/${patient.patient_id}`)}
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
