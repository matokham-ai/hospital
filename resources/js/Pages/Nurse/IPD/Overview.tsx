import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Bed, ClipboardList, Activity, Droplets, Pill, AlertTriangle, UserCheck, TestTube } from "lucide-react";

export default function NurseIPDOverview() {
  const modules = [
    {
      title: "Ward Census",
      description: "Bed occupancy, patient acuity, and ward metrics.",
      href: "/nurse/ipd/census",
      icon: Bed,
    },
    {
      title: "Bed Allocation",
      description: "Assign, release, and manage bed availability.",
      href: "/nurse/ipd/beds",
      icon: ClipboardList,
    },
    {
      title: "Admission Tracker",
      description: "Follow up on admissions, transfers, and discharges.",
      href: "/nurse/ipd/admissions",
      icon: UserCheck,
    },
    {
      title: "Vitals & Monitoring",
      description: "Record vitals and monitor trends for inpatients.",
      href: "/nurse/vitals",
      icon: Activity,
    },
    {
      title: "Medication Rounds",
      description: "Document administered doses and pending meds.",
      href: "/nurse/medications",
      icon: Pill,
    },
    {
      title: "Intake & Output",
      description: "Maintain accurate fluid balance for patients.",
      href: "/nurse/ipd/intake-output",
      icon: Droplets,
    },
    {
      title: "Safety Alerts",
      description: "Respond to EWS, fall-risk, and sepsis alerts.",
      href: "/nurse/alerts",
      icon: AlertTriangle,
    },
    {
      title: "Lab Results",
      description: "Check outstanding investigations and trends.",
      href: "/nurse/lab-results",
      icon: TestTube,
    },
  ];

  return (
    <HMSLayout>
      <Head title="IPD Overview" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">IPD Overview</h1>
            <p className="text-sm text-slate-600">
              Launchpad for inpatient workflows, bed management, and care coordination.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/nurse/ipd/census">Open Ward Census</Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900">IPD Modules</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
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
