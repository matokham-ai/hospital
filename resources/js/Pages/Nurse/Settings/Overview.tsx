import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { UserCog, SlidersHorizontal, Bell } from "lucide-react";

export default function NurseSettingsOverview() {
  const sections = [
    {
      title: "Profile",
      description: "Update your contact details and role information.",
      href: "/nurse/settings/profile",
      icon: UserCog,
    },
    {
      title: "Preferences",
      description: "Configure theme, default dashboards, and language.",
      href: "/nurse/settings/preferences",
      icon: SlidersHorizontal,
    },
    {
      title: "Notifications",
      description: "Manage alert delivery settings for critical events.",
      href: "/nurse/settings/notifications",
      icon: Bell,
    },
  ];

  return (
    <HMSLayout>
      <Head title="Settings" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-600">
              Personalize your nurse workspace and notification preferences.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/nurse/settings/profile">Edit Profile</Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900">Configuration Areas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-1 lg:grid-cols-3">
            {sections.map((section) => (
              <Card
                key={section.title}
                className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-teal-200 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-100 p-3 text-teal-600">
                    <section.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
                    <p className="text-sm text-slate-600">{section.description}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" className="mt-6 justify-start px-0 text-teal-600">
                  <Link href={section.href}>Go to page</Link>
                </Button>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
