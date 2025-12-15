import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { CalendarClock, ClipboardCheck, ArrowLeft } from "lucide-react";

interface TaskDetails {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  completed_at: string | null;
  completion_notes: string | null;
  is_overdue: boolean;
  patient_id: number | null;
  encounter_id: number | null;
}

interface TaskShowProps {
  task: TaskDetails;
}

const priorityColor: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

export default function NurseTaskShow({ task }: TaskShowProps) {
  const priorityBadge = priorityColor[task.priority] ?? "bg-slate-100 text-slate-700";

  return (
    <HMSLayout>
      <Head title={task.title} />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Task Detail</h1>
            <p className="text-sm text-slate-600">Review the context and status of this nursing task.</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/nurse/tasks">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
            </Link>
          </Button>
        </div>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="flex flex-col gap-2 border-b border-slate-100">
            <CardTitle className="text-lg text-slate-900">{task.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={priorityBadge}>Priority: {task.priority}</Badge>
              <Badge variant="outline">Status: {task.status}</Badge>
              {task.is_overdue && <Badge className="bg-red-100 text-red-700">Overdue</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500">
                <ClipboardCheck className="h-4 w-4" /> Task Summary
              </h2>
              <p className="text-slate-700">{task.description || "No description provided."}</p>
            </section>

            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500">
                <CalendarClock className="h-4 w-4" /> Timeline
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="text-sm font-medium text-slate-800">{task.due_date}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="text-sm font-medium text-slate-800">
                    {task.completed_at ? task.completed_at : "Not yet completed"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase text-slate-500">
                Patient Context
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Patient ID</p>
                  <p className="text-sm font-medium text-slate-800">{task.patient_id ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Encounter ID</p>
                  <p className="text-sm font-medium text-slate-800">{task.encounter_id ?? "N/A"}</p>
                </div>
              </div>
            </section>

            {task.completion_notes && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold uppercase text-slate-500">Completion Notes</h2>
                <p className="text-sm text-slate-700">{task.completion_notes}</p>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
