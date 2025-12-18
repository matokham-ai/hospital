import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Bed, ClipboardList, Droplets, Pill } from "lucide-react";

export default function NurseFacilityIPD() {
  const workflows = [
    {
      title: "Ward Census",
      description: "Check bed occupancy and patient assignments.",
      href: "/nurse/ipd/census",
      icon: Bed,
    },
    {
      title: "Nursing Tasks",
      description: "Review rounds, tasks, and assessments for the shift.",
      href: "/nurse/tasks",
      icon: ClipboardList,
    },
    {
      title: "Intake & Output",
      description: "Log fluid balance for inpatients in your care.",
      href: "/nurse/ipd/intake-output",
      icon: Droplets,
    },
    {
      title: "Medication Administration",
      description: "Confirm scheduled doses and record administrations.",
      href: "/nurse/medications",
      icon: Pill,
    },
  ];

  return (
    <HMSLayout>
      <Head title="IPD Facility" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inpatient Department</h1>
            <p className="text-sm text-slate-600">
              Monitor ward activity, bed allocation, and patient care tasks across the IPD.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/nurse/ipd/census">View Ward Census</Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900">IPD Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflows.map((item) => (
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
