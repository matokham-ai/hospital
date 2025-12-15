import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Stethoscope, Calendar, Users, Activity } from "lucide-react";

export default function NurseFacilityOPD() {
  const shortcuts = [
    {
      title: "Today's Appointments",
      description: "Review the outpatient schedule and manage arrivals.",
      href: "/nurse/opd/appointments",
      icon: Calendar,
    },
    {
      title: "Walk-in Queue",
      description: "Register and triage unscheduled visitors.",
      href: "/nurse/opd/walk-ins",
      icon: Users,
    },
    {
      title: "Triage Queue",
      description: "Track patients waiting for assessment and vitals.",
      href: "/nurse/opd/triage",
      icon: Activity,
    },
  ];

  return (
    <HMSLayout>
      <Head title="OPD Facility" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Outpatient Department</h1>
            <p className="text-sm text-slate-600">
              Manage appointments, triage, and consultations for OPD patients.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/nurse/opd/appointments">Open Schedule</Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              OPD Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-3">
            {shortcuts.map((item) => (
              <Card
                key={item.title}
                className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-100 p-3 text-teal-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" className="mt-6 justify-start px-0 text-teal-600">
                  <Link href={item.href}>Go to page</Link>
                </Button>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
