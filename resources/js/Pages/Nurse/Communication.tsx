import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { MessageSquare, PhoneCall, BellRing, ClipboardCheck } from "lucide-react";

export default function NurseCommunication() {
  const channels = [
    {
      title: "Secure Messages",
      description: "Chat with physicians, allied teams, and fellow nurses.",
      href: "/nurse/messages",
      icon: MessageSquare,
    },
    {
      title: "Consult Requests",
      description: "Escalate to on-call specialists with clinical context.",
      href: "/nurse/consults",
      icon: PhoneCall,
    },
    {
      title: "Task Assignments",
      description: "Review delegated tasks and acknowledge completion.",
      href: "/nurse/task-assignments",
      icon: ClipboardCheck,
    },
    {
      title: "Broadcast Alerts",
      description: "Monitor broadcast announcements and critical alerts.",
      href: "/nurse/notifications",
      icon: BellRing,
    },
  ];

  return (
    <HMSLayout>
      <Head title="Communication Hub" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Communication Hub</h1>
            <p className="text-sm text-slate-600">
              Coordinate handovers, consults, and team updates from one place.
            </p>
          </div>
          <Button asChild className="rounded-xl">
            <Link href="/nurse/messages">Start New Message</Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900">Team Channels</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((item) => (
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
