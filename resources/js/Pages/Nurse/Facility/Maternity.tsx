import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Baby, CalendarHeart, ClipboardSignature, Users } from "lucide-react";

export default function NurseFacilityMaternity() {
  const focusAreas = [
    {
      title: "Antenatal Schedule",
      description: "Review ANC visits and upcoming appointments.",
      href: "/nurse/opd/appointments",
      icon: CalendarHeart,
    },
    {
      title: "Labor Ward Tasks",
      description: "Track observations and partograph updates.",
      href: "/nurse/tasks",
      icon: ClipboardSignature,
    },
    {
      title: "Mother & Baby",
      description: "Monitor post-natal vitals and discharge readiness.",
      href: "/nurse/care-plans",
      icon: Users,
    },
  ];

  return (
    <HMSLayout>
      <Head title="Maternity Facility" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Maternity & Neonatal Care</h1>
            <p className="text-sm text-slate-600">
              Coordinate antenatal, intrapartum, and postnatal workflows for mothers and newborns.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/nurse/tasks">Open Care Tasks</Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Baby className="h-5 w-5 text-teal-600" />
              Maternity Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-1 lg:grid-cols-3">
            {focusAreas.map((item) => (
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
