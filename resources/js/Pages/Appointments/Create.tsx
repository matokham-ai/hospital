import { Head, Link, useForm } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar, Clock, User, Stethoscope, FileText, ArrowLeft } from "lucide-react";
import axios from "axios";
import RealtimeStatus from "@/Components/RealtimeStatus";

interface Patient {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Department {
  id: string;
  name: string;
}

interface Props {
  patients: Patient[];
  doctors: Doctor[];
  departments: Department[];
}

export default function AppointmentCreate({ patients, doctors, departments }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    patient_id: "",
    doctor_id: "",
    department_id: "",
    date: "",
    time: "",
    notes: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const calendarRef = useRef(null);



  // Fetch appointments when doctor changes
  useEffect(() => {
    if (data.doctor_id) {
      fetchDoctorSchedule(data.doctor_id);
      
      // Set up real-time listener for this specific doctor
      const doctorChannel = `doctor-schedule.${data.doctor_id}`;
      
      window.Echo.channel(doctorChannel)
        .listen('.appointment.updated', (e: any) => {
          if (e.action === 'created') {
            // Add new appointment to doctor's schedule
            setEvents(prevEvents => [...prevEvents, e.appointment]);
          } else if (e.action === 'completed' || e.action === 'cancelled') {
            // Remove completed/cancelled appointments from schedule
            setEvents(prevEvents => prevEvents.filter(event => event.id !== e.appointment.id));
          } else {
            // Update existing appointment
            setEvents(prevEvents => 
              prevEvents.map(event => 
                event.id === e.appointment.id ? e.appointment : event
              )
            );
          }
        });

      // Cleanup function
      return () => {
        window.Echo.leaveChannel(doctorChannel);
      };
    }
  }, [data.doctor_id]);

  const fetchDoctorSchedule = async (doctorId: string) => {
    try {
      setLoadingEvents(true);
      const response = await axios.get(`/appointments/doctor/${doctorId}/events`);
      setEvents(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch doctor schedule:", err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDateClick = (info: any) => {
    const date = new Date(info.dateStr);
    const formattedDate = date.toISOString().split("T")[0];
    const formattedTime = date.toTimeString().substring(0, 5);
    setData("date", formattedDate);
    setData("time", formattedTime);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/appointments", {
      onSuccess: () => setSubmitted(true),
    });
  };

  return (
    <HMSLayout user={{ name: "System Admin", email: "", role: "Administrator" }}>
      <Head title="Book Appointment - MediCare HMS" />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="text-blue-600" />
              Book Appointment
            </h1>
            <Link
              href="/appointments"
              className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Appointments
            </Link>
          </div>

          {!submitted ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Appointment Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Select Patient
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={data.patient_id}
                    onChange={(e) => setData("patient_id", e.target.value)}
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients?.map((p: Patient) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {errors.patient_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.patient_id}</p>
                  )}
                </div>

                {/* Doctor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                    Select Doctor
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={data.doctor_id}
                    onChange={(e) => setData("doctor_id", e.target.value)}
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors?.map((d: Doctor) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Department
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={data.department_id}
                    onChange={(e) => setData("department_id", e.target.value)}
                  >
                    <option value="">-- Select Department --</option>
                    {departments?.map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date / Time */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                      value={data.date}
                      onChange={(e) => setData("date", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Appointment Time
                    </label>
                    <input
                      type="time"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                      value={data.time}
                      onChange={(e) => setData("time", e.target.value)}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Notes / Reason
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={data.notes}
                    onChange={(e) => setData("notes", e.target.value)}
                    placeholder="Describe the patient's symptoms or reason..."
                  ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                  <Link
                    href="/appointments"
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    {processing ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              </form>

              {/* FullCalendar */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Doctor's Schedule
                </h3>

                {loadingEvents ? (
                  <div className="text-center py-20 text-gray-500 animate-pulse">
                    Loading calendar...
                  </div>
                ) : (
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "timeGridWeek,dayGridMonth",
                    }}
                    events={events}
                    dateClick={handleDateClick}
                    height="auto"
                    slotMinTime="00:00:00"
                    slotMaxTime="24:00:00"
                    eventColor="#60a5fa"
                    nowIndicator={true}
                    selectable={true}
                    selectMirror={true}
                    allDaySlot={false}

                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Appointment Scheduled Successfully
              </h2>
              <p className="text-gray-600 mb-6">
                The patient has been booked with the selected doctor.
              </p>
              <Link
                href="/appointments"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition"
              >
                Back to Appointments
              </Link>
            </div>
          )}
        </div>

        {/* Real-time connection status */}
        <RealtimeStatus />
      </div>
    </HMSLayout>
  );
}
