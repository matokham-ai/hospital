import { useState, useMemo, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Pill, Clock, AlertTriangle, Search, ArrowLeft, Calendar, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Medication {
  id: number;
  encounter_id: number;
  patient_name: string;
  room: string;
  medication_name: string;
  dosage: string;
  route: string;
  scheduled_time: string;
  status: string;
  is_overdue: boolean;
}

interface MedicationsIndexProps {
  medications: Medication[];
  pagination?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  filters?: {
    search?: string;
  };
}

export default function MedicationsIndex({ medications, pagination, filters }: MedicationsIndexProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== (filters?.search || "")) {
        router.get(route('nurse.medications'), {
          search: searchQuery
        }, {
          preserveState: true,
          replace: true
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    router.get(route('nurse.medications'), {
      search: searchQuery,
      page: page
    }, {
      preserveState: true,
      replace: true
    });
  };

  // Pagination component
  const PaginationControls = () => {
    if (!pagination || pagination.last_page <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.from} to {pagination.to} of {pagination.total} medications
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page >= pagination.last_page}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Filter and search medications
  const filteredMedications = useMemo(() => {
    return medications.filter((medication) => {
      const matchesSearch = 
        medication.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medication.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medication.room.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "overdue" && medication.is_overdue) ||
        (statusFilter === "due" && !medication.is_overdue);

      const matchesPriority = priorityFilter === "all" ||
        (priorityFilter === "high" && medication.is_overdue) ||
        (priorityFilter === "normal" && !medication.is_overdue);

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [medications, searchQuery, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = medications.length;
    const overdue = medications.filter(m => m.is_overdue).length;
    const due = medications.filter(m => !m.is_overdue).length;
    
    return { total, overdue, due };
  }, [medications]);

  return (
    <HMSLayout>
      <Head title="Medication Administration - Nurse Dashboard" />
      
      <div className="space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-6">
            <Link href="/nurse/dashboard">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" size="lg" className="shadow-md">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </motion.div>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Medication Administration
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Manage and administer patient medications
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Time</p>
            <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Medications</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Pill className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Due Now</p>
                  <p className="text-3xl font-bold text-amber-900">{stats.due}</p>
                </div>
                <div className="p-3 bg-amber-200 rounded-full">
                  <Clock className="h-6 w-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Overdue</p>
                  <p className="text-3xl font-bold text-red-900">{stats.overdue}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Search className="h-5 w-5" />
                </div>
                Search & Filter Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Search Medications</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by patient, medication, or room..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status Filter</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-12 border-gray-300 focus:border-green-500">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Medications</SelectItem>
                      <SelectItem value="due">Due Now</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Priority Filter</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-12 border-gray-300 focus:border-green-500">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Priority (Overdue)</SelectItem>
                      <SelectItem value="normal">Normal Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Showing {filteredMedications.length} of {pagination?.total || medications.length} medications</span>
                  {(searchQuery || statusFilter !== "all" || priorityFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                      }}
                      className="h-8"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Pill className="h-6 w-6" />
                </div>
                Medication Queue ({pagination?.total || filteredMedications.length})
                <div className="ml-auto flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <Calendar className="h-4 w-4" />
                  {new Date().toLocaleDateString()}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {filteredMedications.length === 0 ? (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {searchQuery || statusFilter !== "all" || priorityFilter !== "all" ? (
                    <>
                      <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-xl font-semibold text-muted-foreground mb-2">No medications found</p>
                      <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <p className="text-xl font-semibold text-muted-foreground mb-2">All caught up!</p>
                      <p className="text-muted-foreground">No pending medications at this time</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredMedications.map((medication, index) => (
                      <motion.div 
                        key={medication.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                          medication.is_overdue 
                            ? 'border-red-200 bg-gradient-to-r from-red-50 to-red-100 hover:border-red-300' 
                            : 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              medication.is_overdue ? 'bg-red-200' : 'bg-green-200'
                            }`}>
                              <Pill className={`h-6 w-6 ${
                                medication.is_overdue ? 'text-red-700' : 'text-green-700'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{medication.patient_name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {medication.room}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">{medication.medication_name}</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-600">{medication.dosage}</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-600">{medication.route}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>Scheduled: {new Date(medication.scheduled_time).toLocaleString()}</span>
                                  {medication.is_overdue && (
                                    <>
                                      <span className="text-red-500">•</span>
                                      <span className="text-red-600 font-medium">
                                        {Math.floor((Date.now() - new Date(medication.scheduled_time).getTime()) / (1000 * 60))} min overdue
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {medication.is_overdue && (
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                              </motion.div>
                            )}
                            <Badge 
                              variant={medication.is_overdue ? "destructive" : "secondary"}
                              className="text-sm px-3 py-1"
                            >
                              {medication.is_overdue ? "OVERDUE" : "DUE"}
                            </Badge>
                            <Link href={`/nurse/medications/${medication.encounter_id}`}>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button 
                                  size="lg" 
                                  className={`px-6 ${
                                    medication.is_overdue 
                                      ? 'bg-red-600 hover:bg-red-700' 
                                      : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                >
                                  Administer Now
                                </Button>
                              </motion.div>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <PaginationControls />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </HMSLayout>
  );
}
