import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Progress } from "@/Components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { ArrowLeft, BedDouble } from "lucide-react";

type UnitPatient = {
  id: number;
  name: string;
  age: number;
  gender: string;
  bed_number: string;
  admission_date: string;
  los: number;
  diagnosis: string;
  acuity: string;
};

type UnitDetails = {
  id: number;
  name: string;
  type: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  patients: UnitPatient[];
};

interface UnitShowProps {
  unit: UnitDetails;
}

const acuityColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  "high-risk": "bg-amber-100 text-amber-700",
  stable: "bg-emerald-100 text-emerald-700",
};

export default function NurseUnitShow({ unit }: UnitShowProps) {
  const occupancy = Math.min(Math.max(unit.occupancy_rate, 0), 100);

  return (
    <HMSLayout>
      <Head title={`${unit.name} Overview`} />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{unit.name}</h1>
            <p className="text-sm text-slate-600">
              Bed and patient overview for this {unit.type?.toLowerCase()} unit.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/nurse/facility">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Facility Switcher
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-slate-600">Total Beds</p>
                <p className="text-2xl font-semibold text-slate-900">{unit.total_beds}</p>
              </div>
              <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                <BedDouble className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">Occupied Beds</p>
              <p className="text-2xl font-semibold text-slate-900">{unit.occupied_beds}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">Available Beds</p>
              <p className="text-2xl font-semibold text-slate-900">{unit.available_beds}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">Occupancy Rate</p>
              <Progress value={occupancy} className="mt-3 h-2" />
              <p className="mt-2 text-lg font-semibold text-slate-900">{occupancy}%</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900">
              Current Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Admission</TableHead>
                  <TableHead>Length of Stay</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Acuity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unit.patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{patient.name}</span>
                        <span className="text-xs text-slate-500">
                          {patient.gender} • {patient.age} yrs
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{patient.bed_number}</TableCell>
                    <TableCell>{patient.admission_date}</TableCell>
                    <TableCell>{patient.los} days</TableCell>
                    <TableCell>{patient.diagnosis}</TableCell>
                    <TableCell>
                      <Badge className={acuityColor[patient.acuity] ?? "bg-slate-100 text-slate-700"}>
                        {patient.acuity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {unit.patients.length === 0 && (
                <TableCaption>No active patients assigned to this unit.</TableCaption>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
