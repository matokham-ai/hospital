import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bed,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  UserPlus,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BedInfo {
  id: number;
  bed_number: string;
  ward_id: number;
  ward_name: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning';
  patient?: {
    id: string;
    name: string;
    age: number;
    gender: string;
    admission_date: string;
    diagnosis: string;
    acuity: 'critical' | 'high-risk' | 'stable' | 'routine';
  };
}

interface PendingAdmission {
  id: number;
  patient_name: string;
  patient_id: string;
  age: number;
  gender: string;
  admission_type: string;
  diagnosis: string;
  priority: 'emergency' | 'urgent' | 'routine';
  waiting_since: string;
}

interface BedAllocationProps {
  beds: BedInfo[];
  pendingAdmissions: PendingAdmission[];
  wards: Array<{ id: number; name: string }>;
  stats: {
    total_beds: number;
    available: number;
    occupied: number;
    reserved: number;
    maintenance: number;
    pending_admissions: number;
  };
}

export default function BedAllocation({ beds, pendingAdmissions, wards, stats }: BedAllocationProps) {
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [selectedBed, setSelectedBed] = useState<BedInfo | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PendingAdmission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'reserved': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      case 'cleaning': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <User className="h-4 w-4" />;
      case 'reserved': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <XCircle className="h-4 w-4" />;
      case 'cleaning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bed className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'routine': return 'bg-green-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const handleAssignBed = () => {
    if (selectedBed && selectedPatient) {
      router.post('/nurse/ipd/beds/assign', {
        bed_id: selectedBed.id,
        patient_id: selectedPatient.patient_id,
        encounter_id: selectedPatient.id,
      }, {
        onSuccess: () => {
          setShowAssignModal(false);
          setSelectedBed(null);
          setSelectedPatient(null);
        },
      });
    }
  };

  const handleReleaseBed = (bedId: number) => {
    if (confirm('Are you sure you want to release this bed?')) {
      router.post(`/nurse/ipd/beds/${bedId}/release`, {}, {
        preserveScroll: true,
      });
    }
  };

  const filteredBeds = beds.filter(bed => {
    const matchesWard = !selectedWard || bed.ward_id === selectedWard;
    const matchesSearch = bed.bed_number.includes(searchQuery) ||
                         bed.ward_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (bed.patient?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesWard && matchesSearch;
  });

  return (
    <HMSLayout>
      <Head title="Bed Allocation - Nurse IPD" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bed Allocation Management</h1>
            <p className="text-slate-600">Assign and manage bed allocations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.visit('/nurse/ipd/census')}>
              Ward Census
            </Button>
            <Button onClick={() => setShowAssignModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Bed
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Total Beds</div>
              <div className="text-2xl font-bold text-slate-900">{stats.total_beds}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Available</div>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Occupied</div>
              <div className="text-2xl font-bold text-blue-600">{stats.occupied}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Reserved</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Maintenance</div>
              <div className="text-2xl font-bold text-red-600">{stats.maintenance}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Pending</div>
              <div className="text-2xl font-bold text-orange-600">{stats.pending_admissions}</div>
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
                  placeholder="Search by bed number, ward, or patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <select
                  value={selectedWard || ''}
                  onChange={(e) => setSelectedWard(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">All Wards</option>
                  {wards.map(ward => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-6">
          {/* Bed Grid */}
          <div className="col-span-2 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Bed Status</h2>
            {filteredBeds.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bed className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No beds found</p>
                </CardContent>
              </Card>
            ) : (
              filteredBeds.map((bed) => (
                <Card
                  key={bed.id}
                  className={cn(
                    'hover:shadow-md transition-all cursor-pointer',
                    selectedBed?.id === bed.id && 'ring-2 ring-blue-500'
                  )}
                  onClick={() => setSelectedBed(bed)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Bed Info */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center text-white',
                          getStatusColor(bed.status)
                        )}>
                          {getStatusIcon(bed.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">Bed {bed.bed_number}</h3>
                            <Badge variant="outline" className="text-xs">
                              {bed.ward_name}
                            </Badge>
                          </div>
                          {bed.patient ? (
                            <div className="text-sm text-slate-600 mt-1">
                              <p className="font-medium">{bed.patient.name}</p>
                              <p className="text-xs">
                                {bed.patient.age}y, {bed.patient.gender} • {bed.patient.diagnosis}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 mt-1">
                              {bed.status === 'available' ? 'Ready for patient' : bed.status.toUpperCase()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {bed.status === 'occupied' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.visit(`/nurse/patients/${bed.patient?.id}`);
                              }}
                            >
                              View Patient
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReleaseBed(bed.id);
                              }}
                            >
                              Release Bed
                            </Button>
                          </>
                        )}
                        {bed.status === 'available' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBed(bed);
                              setShowAssignModal(true);
                            }}
                          >
                            Assign Patient
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pending Admissions Sidebar */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Pending Admissions ({pendingAdmissions.length})
            </h2>
            {pendingAdmissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">No pending admissions</p>
                </CardContent>
              </Card>
            ) : (
              pendingAdmissions.map((patient) => (
                <Card
                  key={patient.id}
                  className={cn(
                    'hover:shadow-md transition-all cursor-pointer',
                    selectedPatient?.id === patient.id && 'ring-2 ring-blue-500'
                  )}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{patient.patient_name}</h4>
                      <Badge className={cn('text-xs', getPriorityColor(patient.priority))}>
                        {patient.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      {patient.age}y, {patient.gender} • {patient.admission_type}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{patient.diagnosis}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Waiting: {patient.waiting_since}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Assign Bed Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Assign Bed to Patient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Selected Bed</Label>
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                      {selectedBed ? (
                        <>
                          <p className="font-semibold">Bed {selectedBed.bed_number}</p>
                          <p className="text-sm text-slate-600">{selectedBed.ward_name}</p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">No bed selected</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Selected Patient</Label>
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                      {selectedPatient ? (
                        <>
                          <p className="font-semibold">{selectedPatient.patient_name}</p>
                          <p className="text-sm text-slate-600">
                            {selectedPatient.age}y, {selectedPatient.gender}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">No patient selected</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAssignBed}
                    disabled={!selectedBed || !selectedPatient}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Assignment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedBed(null);
                      setSelectedPatient(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </HMSLayout>
  );
}
