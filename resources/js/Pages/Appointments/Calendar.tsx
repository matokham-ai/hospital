import HMSLayout from "@/Layouts/HMSLayout";
import { Head, usePage, router } from "@inertiajs/react";
import { Calendar as CalendarIcon, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import SOAPNotesModal from "@/Components/SOAPNotesModal";
import RealtimeStatus from "@/Components/RealtimeStatus";

export default function AppointmentCalendar() {
  const { props } = usePage();
  const user = props.auth?.user || { id: 1, name: "System Admin" };
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [soapModalOpen, setSoapModalOpen] = useState(false);
  const [consultationData, setConsultationData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // color mapping
  const colorMap: Record<string, string> = {
    confirmed: "#10b981",
    pending: "#f59e0b",
    cancelled: "#ef4444",
    followup: "#0284c7",
    default: "#14b8a6",
  };

  // fetch appointments
  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        const res = await axios.get("/appointments/calendar-events", { withCredentials: true });
        if (!isMounted) return;

        // 🟢 assign colors from map
        const mapped = res.data.map((ev: any) => ({
          ...ev,
          color: colorMap[ev.status?.toLowerCase()] || colorMap.default,
        }));

        setEvents(mapped);
        setLoading(false);
      } catch (error: any) {
        console.error("Failed to fetch calendar data:", error);
        setLoading(false);
      }
    };

    fetchEvents();

    // Set up real-time listeners
    const setupRealTimeListeners = () => {
      // Listen for appointment updates on the general appointments channel
      window.Echo.channel('appointments')
        .listen('.appointment.updated', (e: any) => {
          if (e.action === 'created') {
            // Add new appointment to calendar
            setEvents(prevEvents => [...prevEvents, e.appointment]);
          } else if (e.action === 'completed' || e.action === 'cancelled') {
            // Remove completed/cancelled appointments from calendar
            setEvents(prevEvents => prevEvents.filter(event => event.id !== e.appointment.id));
          } else {
            // Update existing appointment
            setEvents(prevEvents =>
              prevEvents.map(event =>
                event.id === e.appointment.id ? e.appointment : event
              )
            );
          }
        })
        .listen('.opd-appointment.updated', (e: any) => {

          if (e.action === 'created') {
            // Add new OPD appointment to calendar
            setEvents(prevEvents => [...prevEvents, e.appointment]);
          } else if (e.action === 'completed' || e.action === 'cancelled') {
            // Remove completed/cancelled appointments from calendar
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
    };

    // Set up listeners after initial fetch
    setupRealTimeListeners();

    // Fallback polling every 5 minutes (reduced from 1 minute since we have real-time updates)
    const interval = setInterval(fetchEvents, 300000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      // Clean up Echo listeners
      window.Echo.leaveChannel('appointments');
    };
  }, [user.id]);

  // modal close
  const closeModal = () => setSelectedEvent(null);

  // Start consultation
  const handleStartConsultation = async () => {
    if (!selectedEvent?.appointmentId) return;

    try {
      setActionLoading(true);
      const response = await axios.post(`/appointments/${selectedEvent.appointmentId}/start-consultation`);

      if (response.data.success) {
        // Update the event status in the calendar
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === selectedEvent.appointmentId
              ? { ...event, color: '#f59e0b' } // amber for IN_PROGRESS
              : event
          )
        );

        // Set consultation data and open SOAP modal
        setConsultationData(response.data.appointment);
        setSoapModalOpen(true);
        closeModal();
      }
    } catch (error) {
      console.error("Failed to start consultation:", error);
      alert("Failed to start consultation. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Complete consultation
  const handleCompleteConsultation = async () => {
    if (!selectedEvent?.appointmentId) return;

    try {
      setActionLoading(true);
      const response = await axios.post(`/appointments/${selectedEvent.appointmentId}/complete-consultation`);

      if (response.data.success) {
        // Update the event status in the calendar
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === selectedEvent.appointmentId
              ? { ...event, color: '#0284c7' } // sky for COMPLETED
              : event
          )
        );

        closeModal();
        alert("Consultation completed successfully!");
      }
    } catch (error) {
      console.error("Failed to complete consultation:", error);
      alert("Failed to complete consultation. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle SOAP modal completion
  const handleSOAPComplete = async () => {
    // Refresh events to get updated status
    try {
      const res = await axios.get("/appointments/calendar-events", { withCredentials: true });
      const mapped = res.data.map((ev: any) => ({
        ...ev,
        color: colorMap[ev.status?.toLowerCase()] || colorMap.default,
      }));
      setEvents(mapped);
    } catch (error) {
      console.error("Failed to refresh events:", error);
    }

    setSoapModalOpen(false);
    setConsultationData(null);
  };

  return (
    <HMSLayout user={{ name: user.name, email: (user as any).email || '', role: (user as any).role }}>
      <Head title="Appointments Calendar - MediCare HMS" />
      <div className="max-w-7xl mx-auto py-10 px-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-6">
          <CalendarIcon className="text-blue-600 w-7 h-7" />
          Appointments Calendar
        </h1>

        {/* legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-700">
          <LegendItem color="#10b981" label="Confirmed" />
          <LegendItem color="#f59e0b" label="Pending" />
          <LegendItem color="#ef4444" label="Cancelled" />
          <LegendItem color="#0284c7" label="Follow-up" />
          <LegendItem color="#14b8a6" label="General" />
        </div>



        {/* main calendar */}
        {loading ? (
          <div className="flex justify-center items-center py-16 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Loading appointments...
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={events}
              height="auto"
              nowIndicator={true}
              allDaySlot={false}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              eventDisplay="block"
              eventClick={(info) => {
                console.log('Event clicked:', info.event);
                console.log('Patient data:', info.event.extendedProps.patient);
                setSelectedEvent({
                  ...info.event.extendedProps,
                  start: info.event.start,
                  end: info.event.end,
                  title: info.event.title
                });
              }}
            />
          </div>
        )}

        {/* 🩺 modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative">
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {selectedEvent.patient?.full_name || "Unknown Patient"}
              </h2>

              <div className="space-y-3 text-gray-700">
                {/* Patient Details */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedEvent.patient?.full_name || "N/A"}</p>
                    <p><span className="font-medium">Gender:</span> {selectedEvent.patient?.gender || "N/A"}</p>
                    <p><span className="font-medium">DOB:</span> {selectedEvent.patient?.date_of_birth || "N/A"}</p>
                    <p><span className="font-medium">Phone:</span> {selectedEvent.patient?.phone || "N/A"}</p>
                  </div>
                </div>

                {/* Medical Alerts */}
                {(() => {
                  const hasAllergies = selectedEvent.patient?.allergies && (
                    Array.isArray(selectedEvent.patient.allergies) ? selectedEvent.patient.allergies.length > 0 : true
                  );
                  const hasConditions = selectedEvent.patient?.chronic_conditions && (
                    Array.isArray(selectedEvent.patient.chronic_conditions) ? selectedEvent.patient.chronic_conditions.length > 0 : true
                  );
                  const hasAlerts = selectedEvent.patient?.alerts && (
                    Array.isArray(selectedEvent.patient.alerts) ? selectedEvent.patient.alerts.length > 0 : true
                  );
                  return hasAllergies || hasConditions || hasAlerts;
                })() && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                        ⚠️ Medical Alerts
                      </h3>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const allergies = Array.isArray(selectedEvent.patient?.allergies)
                            ? selectedEvent.patient.allergies
                            : selectedEvent.patient?.allergies
                              ? [selectedEvent.patient.allergies]
                              : [];
                          return allergies.length > 0 && (
                            <div>
                              <span className="font-medium text-red-700">Allergies:</span>
                              <ul className="list-disc list-inside ml-2 text-red-600">
                                {allergies.map((allergy: string, index: number) => (
                                  <li key={index}>{allergy}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                        {(() => {
                          const conditions = Array.isArray(selectedEvent.patient?.chronic_conditions)
                            ? selectedEvent.patient.chronic_conditions
                            : selectedEvent.patient?.chronic_conditions
                              ? [selectedEvent.patient.chronic_conditions]
                              : [];
                          return conditions.length > 0 && (
                            <div>
                              <span className="font-medium text-red-700">Chronic Conditions:</span>
                              <ul className="list-disc list-inside ml-2 text-red-600">
                                {conditions.map((condition: string, index: number) => (
                                  <li key={index}>{condition}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                        {(() => {
                          const alerts = Array.isArray(selectedEvent.patient?.alerts)
                            ? selectedEvent.patient.alerts
                            : selectedEvent.patient?.alerts
                              ? [selectedEvent.patient.alerts]
                              : [];
                          return alerts.length > 0 && (
                            <div>
                              <span className="font-medium text-red-700">Alerts:</span>
                              <ul className="list-disc list-inside ml-2 text-red-600">
                                {alerts.map((alert: string, index: number) => (
                                  <li key={index}>{alert}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                {/* Appointment Details */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Appointment Details</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Chief Complaint:</span>{" "}
                      {selectedEvent.appointment?.chief_complaint || "General Consultation"}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className="px-2 py-1 text-xs rounded-full text-white ml-1"
                        style={{
                          backgroundColor:
                            colorMap[selectedEvent.appointment?.status?.toLowerCase()] || colorMap.default,
                        }}
                      >
                        {selectedEvent.appointment?.status || "N/A"}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {selectedEvent.start ? new Date(selectedEvent.start).toLocaleDateString() : selectedEvent.appointment?.date || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span>{" "}
                      {selectedEvent.start ? new Date(selectedEvent.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : selectedEvent.appointment?.time || "N/A"}
                      {selectedEvent.end && " – " + new Date(selectedEvent.end).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {selectedEvent.appointment?.notes && (
                      <p>
                        <span className="font-medium">Notes:</span>{" "}
                        {selectedEvent.appointment.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <div className="flex gap-2">
                  {selectedEvent.appointment?.status === 'SCHEDULED' && (
                    <button
                      onClick={handleStartConsultation}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Starting..." : "Start Consultation"}
                    </button>
                  )}
                  {selectedEvent.appointment?.status === 'IN_PROGRESS' && (
                    <button
                      onClick={handleCompleteConsultation}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Completing..." : "Complete"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (selectedEvent.patient?.id) {
                        // Open in new tab using window.open for better UX
                        const url = `/patients/${selectedEvent.patient.id}`;
                        window.open(url, '_blank');
                      }
                    }}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                    title="View full patient profile and medical history"
                  >
                    View Patient
                  </button>
                </div>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOAP Notes Modal */}
        {soapModalOpen && consultationData && (
          <SOAPNotesModal
            isOpen={soapModalOpen}
            onClose={() => {
              setSoapModalOpen(false);
              setConsultationData(null);
            }}
            onComplete={handleSOAPComplete}
            appointmentId={consultationData.id}
            patient={consultationData.patient}
            appointmentDetails={consultationData.appointment_details}
          />
        )}

        {/* Real-time connection status */}
        <RealtimeStatus />
      </div>
    </HMSLayout>
  );
}

// small color legend item
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3.5 h-3.5 rounded-full border border-gray-300"
        style={{ backgroundColor: color }}
      ></span>
      <span>{label}</span>
    </div>
  );
}
