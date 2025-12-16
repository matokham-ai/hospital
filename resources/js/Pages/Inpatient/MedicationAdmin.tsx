import React, { useState, useEffect, useCallback } from "react";
import { Head, router, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Button } from "@/Components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/Components/ui/card";
import { QrCode, CalendarClock, LayoutGrid, Pill, Clock, CheckCircle2, XCircle } from "lucide-react";
import MedicationGrid from "./components/MedicationGrid";
import MedicationTimeline from "./components/MedicationTimeline";
import SimplePagination from "@/Components/SimplePagination";
// Using native select elements for better compatibility

interface MedicationSchedule {
  id: number;
  patientId: number;
  patientName: string;
  bedNumber: string;
  medication: string;
  dosage: string;
  time: string;
  status: "due" | "given" | "missed" | "pending";
  administeredBy?: string;
  administeredAt?: string;
  notes?: string;
}

interface PaginatedSchedules {
  data: MedicationSchedule[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface Props {
  schedules: PaginatedSchedules;
  allSchedules: Array<{id: number; status: string; time: string}>;
  availableTimes: string[];
  currentTime: string;
  filters: {
    time_filter: string;
    status_filter: string;
    per_page: number;
  };
}

export default function MedicationAdmin({ schedules, allSchedules, availableTimes, currentTime, filters }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationSchedule | null>(null);
  const [timeFilter, setTimeFilter] = useState(filters.time_filter);
  const [statusFilter, setStatusFilter] = useState(filters.status_filter);
  const [perPage, setPerPage] = useState(filters.per_page);

  // Ensure allSchedules is always an array
  const safeAllSchedules = Array.isArray(allSchedules) ? allSchedules : [];

  const handleMedicationGiven = (id: number) => {
    router.post(`/inpatient/medications/${id}/mark-given`);
  };

  const handleBarcodeVerification = (id: number) => {
    const medication = schedules.data.find((s) => s.id === id);
    setSelectedMedication(medication || null);
    setShowBarcodeScanner(true);
  };

  const handleFilterChange = useCallback(() => {
    router.get('/inpatient/medications', {
      time_filter: timeFilter,
      status_filter: statusFilter,
      per_page: perPage,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  }, [timeFilter, statusFilter, perPage]);

  // Auto-apply filters when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFilterChange();
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [handleFilterChange]);

  const handlePageChange = (page: number) => {
    router.get('/inpatient/medications', {
      page,
      time_filter: timeFilter,
      status_filter: statusFilter,
      per_page: perPage,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <HMSLayout>
      <Head title="Medication Administration" />

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 text-white px-8 py-5 shadow-md flex justify-between items-center rounded-b-2xl">
        <h2 className="text-2xl font-semibold">💊 Medication Administration</h2>
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === "grid" ? "secondary" : "outline"}
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" /> Grid
          </Button>
          <Button
            variant={viewMode === "timeline" ? "secondary" : "outline"}
            onClick={() => setViewMode("timeline")}
            className="flex items-center gap-2"
          >
            <CalendarClock className="w-4 h-4" /> Timeline
          </Button>
          <Button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <QrCode className="w-4 h-4" /> Scan
          </Button>
          <Link href="/inpatient/care-plans">
            <Button variant="outline" className="flex items-center gap-2">
              <Pill className="w-4 h-4" /> Manage Prescriptions
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">Due</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {safeAllSchedules.filter(s => s.status === 'due').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-800">Given</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {safeAllSchedules.filter(s => s.status === 'given').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-rose-50 border-rose-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-800">Missed</p>
                  <p className="text-2xl font-bold text-rose-900">
                    {safeAllSchedules.filter(s => s.status === 'missed').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-rose-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {safeAllSchedules.length}
                  </p>
                </div>
                <Pill className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 min-w-[40px]">Time:</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="min-w-[130px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Times</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 min-w-[45px]">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="min-w-[130px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="due">Due</option>
                  <option value="given">Given</option>
                  <option value="missed">Missed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 min-w-[65px]">Per Page:</label>
                <select
                  value={perPage.toString()}
                  onChange={(e) => setPerPage(parseInt(e.target.value))}
                  className="min-w-[80px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              <Button onClick={handleFilterChange} size="sm" className="ml-auto" variant="outline">
                Refresh
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{schedules.from || 0}</span> to <span className="font-medium">{schedules.to || 0}</span> of <span className="font-medium">{schedules.total}</span> medications
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "timeline")}>
          <TabsList className="flex justify-center mb-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <MedicationGrid
              schedules={schedules.data}
              onMedicationGiven={handleMedicationGiven}
              onBarcodeVerification={handleBarcodeVerification}
            />
            
            {/* Pagination Controls */}
            <div className="mt-6">
              <SimplePagination
                data={schedules}
                onPageChange={handlePageChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <MedicationTimeline
              schedules={schedules.data}
              onMedicationGiven={handleMedicationGiven}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Barcode Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-emerald-500">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Barcode Verification
              </h3>
              <div className="border-2 border-dashed border-gray-300 p-10 rounded-lg bg-gray-50">
                <QrCode className="w-12 h-12 text-emerald-500 mb-4" />
                <p className="text-gray-600">Scan medication barcode to verify</p>
                {selectedMedication && (
                  <div className="mt-4 text-left bg-white p-4 rounded-md shadow-sm border">
                    <p><strong>Patient:</strong> {selectedMedication.patientName}</p>
                    <p><strong>Medication:</strong> {selectedMedication.medication}</p>
                    <p><strong>Dosage:</strong> {selectedMedication.dosage}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(false)}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedMedication)
                      handleMedicationGiven(selectedMedication.id);
                    setShowBarcodeScanner(false);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  Confirm & Give
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </HMSLayout>
  );
}
