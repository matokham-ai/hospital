import { Head, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { CalendarDays, CheckCircle, Clock, XCircle, List } from "lucide-react";

interface Stats {
  total: number;
  today: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

interface LatestAppointment {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  status: string;
}

interface Props {
  stats: Stats;
  latest: LatestAppointment[];
}

export default function AppointmentDashboard({ stats, latest }: Props) {
  return (
    <HMSLayout user={{ name: "System Admin", email: "admin@example.com", role: "Administrator" }}>
      <Head title="Appointments Dashboard - MediCare HMS" />

      <div className="max-w-7xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarDays className="text-blue-600" />
            Appointments Dashboard
          </h1>
          <Link
            href="/appointments/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            + Schedule Appointment
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Appointments"
            value={stats.total}
            icon={<List className="w-6 h-6 text-blue-600" />}
            color="from-blue-50 to-blue-100"
          />
          <StatCard
            title="Today"
            value={stats.today}
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            color="from-amber-50 to-amber-100"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            color="from-green-50 to-green-100"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            color="from-red-50 to-red-100"
          />
        </div>

        {/* Latest Appointments */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="text-blue-600" /> Recent Appointments
            </h2>
            <Link
              href="/appointments/today"
              className="text-blue-600 text-sm hover:underline"
            >
              View All →
            </Link>
          </div>

          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {latest.length > 0 ? (
                latest.map((a: LatestAppointment) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-900 font-medium">{a.patient}</td>
                    <td className="px-6 py-3 text-gray-800">{a.doctor}</td>
                    <td className="px-6 py-3 text-gray-700">{a.date}</td>
                    <td className="px-6 py-3 text-gray-700">{a.time}</td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          a.status === "Scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : a.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-500">
                    No recent appointments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HMSLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div
      className={`p-5 rounded-xl bg-gradient-to-br ${color} border border-gray-100 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-white rounded-lg shadow-sm">{icon}</div>
      </div>
    </div>
  );
}