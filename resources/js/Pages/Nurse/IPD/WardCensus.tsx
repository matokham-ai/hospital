import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bed,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  UserPlus,
  ArrowRightLeft,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ward {
  id: number;
  name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  patients: WardPatient[];
}

interface WardPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bed_number: string;
  admission_date: string;
  los: number; // Length of stay in days
  diagnosis: string;
  acuity: 'critical' | 'high-risk' | 'stable' | 'routine';
  alerts: number;
  pending_tasks: number;
}

interface WardCensusProps {
  wards: Ward[];
  summary: {
    total_beds: number;
    occupied_beds: number;
    available_beds: number;
    overall_occupancy: number;
    admissions_today: number;
    discharges_today: number;
    transfers_today: number;
  };
}

export default function WardCensus({ wards, summary }: WardCensusProps) {
  const [selectedWard, setSelectedWard] = useState<number | null>(null);

  const getAcuityColor = (acuity: string) => {
    switch (acuity) {
      case 'critical': return 'bg-red-500';
      case 'high-risk': return 'bg-orange-500';
      case 'stable': return 'bg-yellow-500';
      case 'routine': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 95) return 'text-red-600';
    if (rate >= 85) return 'text-orange-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <HMSLayout>
      <Head title="Ward Census - Nurse IPD" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ward Census</h1>
            <p className="text-slate-600">Real-time bed occupancy and patient distribution</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.visit('/nurse/ipd/beds')}>
              <Bed className="h-4 w-4 mr-2" />
              Bed Allocation
            </Button>
            <Button onClick={() => router.visit('/nurse/ipd/admissions')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Admissions
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-7 gap-4">
          <Card className="col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Overall Occupancy</div>
                  <div className={cn('text-3xl font-bold', getOccupancyColor(summary.overall_occupancy))}>
                    {summary.overall_occupancy}%
                  </div>
                </div>
                <BarChart3 className="h-10 w-10 text-slate-400" />
              </div>
              <div className="mt-3 text-xs text-slate-600">
                {summary.occupied_beds} / {summary.total_beds} beds occupied
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Total Beds</div>
              <div className="text-2xl font-bold text-slate-900">{summary.total_beds}</div>
              <div className="text-xs text-slate-500 mt-1">System-wide</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Occupied</div>
              <div className="text-2xl font-bold text-blue-600">{summary.occupied_beds}</div>
              <div className="text-xs text-slate-500 mt-1">Active patients</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Available</div>
              <div className="text-2xl font-bold text-green-600">{summary.available_beds}</div>
              <div className="text-xs text-slate-500 mt-1">Ready for use</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" />
                <div className="text-sm text-slate-600">Admissions</div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{summary.admissions_today}</div>
              <div className="text-xs text-slate-500 mt-1">Today</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-slate-600">Discharges</div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{summary.discharges_today}</div>
              <div className="text-xs text-slate-500 mt-1">Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Ward Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {wards.map((ward) => (
            <Card 
              key={ward.id}
              className={cn(
                'hover:shadow-lg transition-all cursor-pointer',
                selectedWard === ward.id && 'ring-2 ring-blue-500'
              )}
              onClick={() => setSelectedWard(selectedWard === ward.id ? null : ward.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bed className="h-5 w-5 text-blue-600" />
                    {ward.name}
                  </CardTitle>
                  <Badge className={cn(
                    'text-sm font-semibold',
                    ward.occupancy_rate >= 95 ? 'bg-red-500' :
                    ward.occupancy_rate >= 85 ? 'bg-orange-500' :
                    ward.occupancy_rate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  )}>
                    {ward.occupancy_rate}% Full
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bed Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900">{ward.total_beds}</div>
                    <div className="text-xs text-slate-600">Total Beds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{ward.occupied_beds}</div>
                    <div className="text-xs text-slate-600">Occupied</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{ward.available_beds}</div>
                    <div className="text-xs text-slate-600">Available</div>
                  </div>
                </div>

                {/* Bed Visualization */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {Array.from({ length: ward.total_beds }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-8 h-8 rounded flex items-center justify-center text-xs font-semibold',
                        index < ward.occupied_beds ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
                      )}
                      title={index < ward.occupied_beds ? 'Occupied' : 'Available'}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>

                {/* Patient List (when expanded) */}
                {selectedWard === ward.id && ward.patients.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    <h4 className="font-semibold text-sm text-slate-700 mb-2">Current Patients</h4>
                    {ward.patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('w-2 h-2 rounded-full', getAcuityColor(patient.acuity))} />
                          <div>
                            <div className="font-medium text-sm">{patient.name}</div>
                            <div className="text-xs text-slate-600">
                              Bed {patient.bed_number} • {patient.age}y, {patient.gender} • LOS: {patient.los}d
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patient.alerts > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {patient.alerts} alerts
                            </Badge>
                          )}
                          {patient.pending_tasks > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {patient.pending_tasks} tasks
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.visit(`/nurse/patients/${patient.id}`);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.visit(`/nurse/ipd/beds?ward=${ward.id}`);
                    }}
                  >
                    <Bed className="h-3 w-3 mr-1" />
                    Manage Beds
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.visit(`/nurse/patients?ward=${ward.id}`);
                    }}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    View Patients
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </HMSLayout>
  );
}
