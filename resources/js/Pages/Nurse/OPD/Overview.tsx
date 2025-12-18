import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { CalendarCheck, Users, Activity, Stethoscope, Syringe, Pill, TestTube } from "lucide-react";

export default function NurseOPDOverview() {
  const modules = [
    {
      title: "Appointments",
      description: "Manage today's booked patients and check-ins.",
      href: "/nurse/opd/appointments",
      icon: CalendarCheck,
    },
    {
      title: "Walk-in Queue",
      description: "Register new visitors and keep the queue flowing.",
      href: "/nurse/opd/walk-ins",
      icon: Users,
    },
    {
      title: "Triage",
      description: "Capture vitals and assign priorities from triage.",
      href: "/nurse/opd/triage",
      icon: Activity,
    },
    {
      title: "Consultations",
      description: "Track in-progress consults and follow-ups.",
      href: "/nurse/opd/consultations",
      icon: Stethoscope,
    },
    {
      title: "Procedures",
      description: "Document minor OPD procedures and outcomes.",
      href: "/nurse/opd/procedures",
      icon: Syringe,
    },
    {
      title: "Prescriptions",
      description: "Review and print outpatient prescriptions.",
      href: "/nurse/opd/prescriptions",
      icon: Pill,
    },
    {
      title: "Labs & Imaging",
      description: "Monitor diagnostic orders that need follow-up.",
      href: "/nurse/opd/orders",
      icon: TestTube,
    },
  ];

  return (
    <HMSLayout>
      <Head title="OPD Overview" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">OPD Overview</h1>
            <p className="text-sm text-slate-600">
              A consolidated launchpad for outpatient nursing workflows.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/nurse/opd/appointments">View Today's List</Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900">OPD Modules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card
                key={module.title}
                className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-100 p-3 text-teal-600">
                    <module.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{module.title}</h3>
                    <p className="text-sm text-slate-600">{module.description}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" className="mt-6 justify-start px-0 text-teal-600">
                  <Link href={module.href}>Go to page</Link>
                </Button>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
