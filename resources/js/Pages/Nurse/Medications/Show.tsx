import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pill, ArrowLeft, Clock, AlertTriangle, CheckCircle, User, Calendar } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  gender: string;
  allergies?: string[];
}

interface Encounter {
  id: number;
  patient: Patient;
  status: string;
}

interface MedicationAdministration {
  id: number;
  medication_name: string;
  dosage: string;
  route: string;
  scheduled_time: string;
  status: string;
  notes?: string;
  administered_at?: string;
  administered_by?: string;
}

interface MedicationsShowProps {
  encounter: Encounter;
  patient: Patient;
  medications: MedicationAdministration[];
}

export default function MedicationsShow({ encounter, patient, medications }: MedicationsShowProps) {
  const [selectedMedication, setSelectedMedication] = useState<MedicationAdministration | null>(null);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    medication_id: '',
    notes: ''
  });

  const handleAdminister = (medication: MedicationAdministration) => {
    setSelectedMedication(medication);
    setData('medication_id', medication.id.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('nurse.medications.administer', encounter.id), {
      onSuccess: () => {
        reset();
        setSelectedMedication(null);
      }
    });
  };

  const getMedicationStatus = (medication: MedicationAdministration) => {
    const scheduledTime = new Date(medication.scheduled_time);
    const now = new Date();
    const isOverdue = scheduledTime < now && medication.status === 'due';
    
    return {
      isOverdue,
      timeStatus: isOverdue ? 'overdue' : scheduledTime > now ? 'upcoming' : 'due'
    };
  };

  const pendingMedications = medications.filter(med => med.status === 'due');
  const administeredMedications = medications.filter(med => med.status === 'given');

  return (
    <HMSLayout>
      <Head title={`Medications - ${patient.name} - Nurse Dashboard`} />
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/nurse/medications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Medications
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Medication Administration</h1>
            <p className="text-muted-foreground">Patient: {patient.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p>{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p>{patient.gender}</p>
                </div>
                {patient.allergies && patient.allergies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">⚠️ Allergies</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Pending Medications ({pendingMedications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingMedications.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No pending medications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingMedications.map((medication) => {
                    const { isOverdue, timeStatus } = getMedicationStatus(medication);
                    return (
                      <div key={medication.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{medication.medication_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {medication.dosage} - {medication.route}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            <Badge variant={isOverdue ? "destructive" : timeStatus === 'upcoming' ? "secondary" : "default"}>
                              {isOverdue ? 'Overdue' : timeStatus === 'upcoming' ? 'Upcoming' : 'Due'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Scheduled: {new Date(medication.scheduled_time).toLocaleString()}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleAdminister(medication)}
                          className="w-full"
                          variant={isOverdue ? "destructive" : "default"}
                        >
                          Administer Now
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recently Administered */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recently Administered
              </CardTitle>
            </CardHeader>
            <CardContent>
              {administeredMedications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No medications administered yet</p>
              ) : (
                <div className="space-y-3">
                  {administeredMedications.slice(0, 5).map((medication) => (
                    <div key={medication.id} className="p-3 border rounded-lg bg-green-50">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm">{medication.medication_name}</p>
                        <Badge variant="default" className="text-xs">Given</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {medication.dosage} - {medication.route}
                      </p>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {medication.administered_at && new Date(medication.administered_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Administration Form */}
        {selectedMedication && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Administer Medication: {selectedMedication.medication_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Medication</p>
                    <p className="font-medium">{selectedMedication.medication_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dosage & Route</p>
                    <p>{selectedMedication.dosage} - {selectedMedication.route}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled Time</p>
                    <p>{new Date(selectedMedication.scheduled_time).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Administration Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any observations, patient reactions, or additional notes..."
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    className={errors.notes ? 'border-red-500' : ''}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500">{errors.notes}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={processing} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {processing ? 'Recording...' : 'Confirm Administration'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setSelectedMedication(null);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </HMSLayout>
  );
}