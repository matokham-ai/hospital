import React, { useEffect, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Activity, Pill, AlertTriangle, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  gender: string;
  allergies?: string[];
  chronic_conditions?: string[];
}

interface Encounter {
  id: number;
  status: string;
  admission_date: string;
}

interface Alert {
  id: number;
  type: string;
  priority: string;
  message: string;
  status: string;
}

interface PatientShowProps {
  patient: Patient;
  activeEncounter?: Encounter;
  alerts: Alert[];
  nursingNotes: NursingNoteDisplay[];
}

type AlertFormData = {
  patient_id: string;
  type: "medical" | "safety" | "medication" | "vital_signs" | "other";
  priority: "low" | "medium" | "high" | "critical";
  message: string;
  notes: string;
};

type NursingNoteFormData = {
  patient_id: string;
  note_type: "progress" | "shift" | "admission" | "discharge";
  content: string;
};

interface NursingNoteDisplay {
  id: number;
  note_type: string;
  content: string;
  note_datetime: string | null;
  author?: string | null;
}

export default function PatientShow({ patient, activeEncounter, alerts, nursingNotes }: PatientShowProps) {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);

  const alertForm = useForm<AlertFormData>({
    patient_id: patient.id,
    type: "medical",
    priority: "medium",
    message: "",
    notes: "",
  });

  const noteForm = useForm<NursingNoteFormData>({
    patient_id: patient.id,
    note_type: "progress",
    content: "",
  });

  useEffect(() => {
    alertForm.setData("patient_id", patient.id);
    noteForm.setData("patient_id", patient.id);
  }, [patient.id]);

  const handleAlertDialogChange = (open: boolean) => {
    setIsAlertDialogOpen(open);
    if (!open) {
      alertForm.clearErrors();
    }
  };

  const handleNoteDialogChange = (open: boolean) => {
    setIsNoteDialogOpen(open);
    if (!open) {
      noteForm.clearErrors();
    }
  };

  const handleAlertSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alertForm.post(route("nurse.alerts.store"), {
      preserveScroll: true,
      onSuccess: () => {
        alertForm.reset("message", "notes");
        setIsAlertDialogOpen(false);
      },
    });
  };

  const handleNoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    noteForm.post(route("nurse.documentation.note"), {
      preserveScroll: true,
      onSuccess: () => {
        noteForm.reset("content");
        setIsNoteDialogOpen(false);
      },
    });
  };

  return (
    <HMSLayout>
      <Head title={`Patient: ${patient.name} - Nurse Dashboard`} />

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Patient: {patient.name}</h1>
            <p className="text-muted-foreground">Patient information and nursing care</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
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
                    <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chronic Conditions</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.chronic_conditions.map((condition, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          alert.priority === 'critical' ? 'destructive' :
                          alert.priority === 'high' ? 'destructive' :
                          alert.priority === 'medium' ? 'secondary' :
                          'outline'
                        }>
                          {alert.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{alert.type}</Badge>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeEncounter && (
                <>
                  <Link href={`/nurse/vitals/${activeEncounter.id}`}>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Activity className="h-6 w-6" />
                      Record Vitals
                    </Button>
                  </Link>
                  <Link href={`/nurse/medications/${activeEncounter.id}`}>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Pill className="h-6 w-6" />
                      Medications
                    </Button>
                  </Link>
                </>
              )}
              <Dialog open={isAlertDialogOpen} onOpenChange={handleAlertDialogChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <AlertTriangle className="h-6 w-6" />
                    Create Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Patient Alert</DialogTitle>
                    <DialogDescription>
                      Share critical information with the care team. Alerts remain active until resolved.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAlertSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="alert-type">Alert Type</Label>
                      <Select
                        value={alertForm.data.type}
                        onValueChange={(value) => alertForm.setData("type", value as typeof alertForm.data.type)}
                      >
                        <SelectTrigger id="alert-type">
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="vital_signs">Vital Signs</SelectItem>
                          <SelectItem value="medication">Medication</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {alertForm.errors.type && (
                        <p className="text-sm text-destructive">{alertForm.errors.type}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alert-priority">Priority</Label>
                      <Select
                        value={alertForm.data.priority}
                        onValueChange={(value) => alertForm.setData("priority", value as typeof alertForm.data.priority)}
                      >
                        <SelectTrigger id="alert-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      {alertForm.errors.priority && (
                        <p className="text-sm text-destructive">{alertForm.errors.priority}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alert-message">Message</Label>
                      <Textarea
                        id="alert-message"
                        value={alertForm.data.message}
                        onChange={(event) => alertForm.setData("message", event.target.value)}
                        placeholder="Describe the situation and required action"
                        rows={4}
                      />
                      {alertForm.errors.message && (
                        <p className="text-sm text-destructive">{alertForm.errors.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alert-notes">Additional Notes (optional)</Label>
                      <Textarea
                        id="alert-notes"
                        value={alertForm.data.notes}
                        onChange={(event) => alertForm.setData("notes", event.target.value)}
                        placeholder="Context, recent interventions, or follow-up instructions"
                        rows={3}
                      />
                      {alertForm.errors.notes && (
                        <p className="text-sm text-destructive">{alertForm.errors.notes}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleAlertDialogChange(false)}
                        disabled={alertForm.processing}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={alertForm.processing}>
                        {alertForm.processing ? "Saving..." : "Save Alert"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isNoteDialogOpen} onOpenChange={handleNoteDialogChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    Nursing Notes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Record Nursing Note</DialogTitle>
                    <DialogDescription>
                      Capture shift updates, assessments, or care plans for this patient.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleNoteSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="note-type">Note Type</Label>
                      <Select
                        value={noteForm.data.note_type}
                        onValueChange={(value) => noteForm.setData("note_type", value as typeof noteForm.data.note_type)}
                      >
                        <SelectTrigger id="note-type">
                          <SelectValue placeholder="Select note type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="progress">Progress</SelectItem>
                          <SelectItem value="shift">Shift Handover</SelectItem>
                          <SelectItem value="admission">Admission</SelectItem>
                          <SelectItem value="discharge">Discharge</SelectItem>
                        </SelectContent>
                      </Select>
                      {noteForm.errors.note_type && (
                        <p className="text-sm text-destructive">{noteForm.errors.note_type}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="note-content">Details</Label>
                      <Textarea
                        id="note-content"
                        value={noteForm.data.content}
                        onChange={(event) => noteForm.setData("content", event.target.value)}
                        placeholder="Document observations, interventions, and follow-up plans"
                        rows={6}
                      />
                      {noteForm.errors.content && (
                        <p className="text-sm text-destructive">{noteForm.errors.content}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleNoteDialogChange(false)}
                        disabled={noteForm.processing}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={noteForm.processing}>
                        {noteForm.processing ? "Saving..." : "Save Note"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Current Encounter */}
        {activeEncounter && (
          <Card>
            <CardHeader>
              <CardTitle>Current Encounter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant="default">{activeEncounter.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admission Date</p>
                  <p>{activeEncounter.admission_date ? new Date(activeEncounter.admission_date).toLocaleDateString() : 'Not recorded'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Nursing Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {nursingNotes.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No nursing notes recorded yet.
              </div>
            ) : (
              <div className="space-y-4">
                {nursingNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline" className="uppercase tracking-wide text-xs">
                        {note.note_type.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {note.note_datetime ? new Date(note.note_datetime).toLocaleString() : ""}
                        {note.author ? ` • ${note.author}` : ""}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
