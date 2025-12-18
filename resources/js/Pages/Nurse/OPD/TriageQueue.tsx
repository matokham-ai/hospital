import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
  Activity,
  AlertTriangle,
  Clock,
  User,
  Thermometer,
  Heart,
  Wind,
  Droplet,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TriagePatient {
  id: number;
  patient_name: string;
  patient_id: string;
  age: number;
  gender: string;
  arrival_time: string;
  wait_time: string;
  chief_complaint: string;
  priority: 'emergency' | 'urgent' | 'semi-urgent' | 'non-urgent';
  vitals_taken: boolean;
  last_vitals?: {
    bp: string;
    hr: number;
    temp: number;
    spo2: number;
    rr: number;
  };
}

interface TriageQueueProps {
  patients: TriagePatient[];
  stats: {
    total: number;
    emergency: number;
    urgent: number;
    semiUrgent: number;
    nonUrgent: number;
    avgWaitTime: string;
  };
}

export default function TriageQueue({ patients, stats }: TriageQueueProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'semi-urgent': return 'bg-yellow-500 text-white';
      case 'non-urgent': return 'bg-green-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'emergency': return '🔴 Emergency';
      case 'urgent': return '🟠 Urgent';
      case 'semi-urgent': return '🟡 Semi-Urgent';
      case 'non-urgent': return '🟢 Non-Urgent';
      default: return 'Unknown';
    }
  };

  const handleStartTriage = (patientId: number) => {
    router.visit(`/nurse/opd/triage/${patientId}`);
  };

  // Sort by priority (emergency first) and wait time
  const sortedPatients = [...patients].sort((a, b) => {
    const priorityOrder = { emergency: 0, urgent: 1, 'semi-urgent': 2, 'non-urgent': 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <HMSLayout>
      <Head title="Triage Queue - Nurse OPD" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Triage Queue</h1>
            <p className="text-slate-600">Prioritize and assess patients waiting for care</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.visit('/nurse/opd/appointments')}>
              Appointments
            </Button>
            <Button variant="outline" onClick={() => router.visit('/nurse/opd/walk-ins')}>
              Walk-ins
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Total Queue</div>
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Emergency</div>
              <div className="text-2xl font-bold text-red-600">{stats.emergency}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Urgent</div>
              <div className="text-2xl font-bold text-orange-600">{stats.urgent}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Semi-Urgent</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.semiUrgent}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Non-Urgent</div>
              <div className="text-2xl font-bold text-green-600">{stats.nonUrgent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600">Avg Wait</div>
              <div className="text-2xl font-bold text-slate-900">{stats.avgWaitTime}</div>
            </CardContent>
          </Card>
        </div>

        {/* Triage Queue */}
        <div className="space-y-3">
          {sortedPatients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No patients in triage queue</p>
                <p className="text-sm text-slate-500 mt-1">All patients have been triaged</p>
              </CardContent>
            </Card>
          ) : (
            sortedPatients.map((patient, index) => (
              <Card 
                key={patient.id} 
                className={cn(
                  'hover:shadow-lg transition-all',
                  patient.priority === 'emergency' && 'border-l-4 border-l-red-500 bg-red-50/30',
                  patient.priority === 'urgent' && 'border-l-4 border-l-orange-500 bg-orange-50/30',
                  patient.priority === 'semi-urgent' && 'border-l-4 border-l-yellow-500',
                  patient.priority === 'non-urgent' && 'border-l-4 border-l-green-500'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Queue Number */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>

                      {/* Patient Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-lg">{patient.patient_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {patient.patient_id}
                          </Badge>
                          <Badge className={cn('text-xs font-semibold', getPriorityColor(patient.priority))}>
                            {getPriorityLabel(patient.priority)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                          <span>{patient.age}y, {patient.gender}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Arrived: {patient.arrival_time}
                          </span>
                          <span className={cn(
                            'flex items-center gap-1 font-semibold',
                            parseInt(patient.wait_time) > 30 ? 'text-red-600' : 'text-slate-600'
                          )}>
                            <AlertTriangle className="h-3 w-3" />
                            Wait: {patient.wait_time}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mt-2">
                          <span className="font-medium">Chief Complaint:</span> {patient.chief_complaint}
                        </p>
                      </div>
                    </div>

                    {/* Vitals & Actions */}
                    <div className="flex items-center gap-4">
                      {/* Vitals Preview */}
                      {patient.vitals_taken && patient.last_vitals ? (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="text-xs text-slate-600 mb-2 font-semibold">Last Vitals</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span>{patient.last_vitals.bp}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-blue-500" />
                              <span>{patient.last_vitals.hr} bpm</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-orange-500" />
                              <span>{patient.last_vitals.temp}°C</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wind className="h-3 w-3 text-cyan-500" />
                              <span>{patient.last_vitals.spo2}%</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-amber-800 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">No vitals recorded</span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleStartTriage(patient.id)}
                          className={cn(
                            'min-w-[140px]',
                            patient.priority === 'emergency' && 'bg-red-600 hover:bg-red-700',
                            patient.priority === 'urgent' && 'bg-orange-600 hover:bg-orange-700'
                          )}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Start Triage
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
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
