import React, { useState, useEffect, useMemo } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import AddNewTestModal from "@/Components/Inpatient/AddNewTestModal";
import { ChevronLeft, ChevronRight, FlaskConical, X, Search, FileText, Filter, Plus, Beaker, Clock, AlertCircle, CheckCircle, Zap, Calendar, User, TestTube, Sparkles, Play, Pause, Download, ArrowRight, Eye } from "lucide-react";

interface LabTest {
  id: number;
  patient_id: number;
  first_name: string;
  last_name: string;
  test_name: string;
  test_type?: string;
  category?: string;
  status: string;
  ordered_by?: string;
  ordered_at: string;
  collected_at?: string;
  completed_at?: string;
  priority: string | null;
  notes?: string;
  results?: LabResult[];
  // Additional possible fields from database
  name?: string;
  doctor?: string;
  created_at?: string;
  type?: string;

  // Computed properties for display
  patientName?: string;
  patientId?: string;
  testName?: string;
  orderedBy?: string;
  orderedAt?: string;
  bedNumber?: string;
}

interface LabResult {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  description?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  // Computed properties for display
  name?: string;
}

interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  next_page_url?: string;
  prev_page_url?: string;
  total: number;
}

interface AvailableTest {
  id: number;
  name: string;
  category: string;
  price: number;
  code?: string;
}

interface Props {
  tests: Pagination<LabTest>;
  availableTests: AvailableTest[];
  patients: Patient[];
  filters: {
    search?: string;
  };
}

export default function LabsDiagnostics({ tests, availableTests, patients, filters }: Props) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showResultsEntryModal, setShowResultsEntryModal] = useState(false);
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [testSearch, setTestSearch] = useState("");
  const [filteredTests, setFilteredTests] = useState<AvailableTest[]>([]);
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");
  const [resultsData, setResultsData] = useState<Array<{parameter: string; value: string; unit: string; reference_range: string; status: string; description: string}>>([
    { parameter: "", value: "", unit: "", reference_range: "", status: "normal", description: "" }
  ]);
  const [savingResults, setSavingResults] = useState(false);

  // Get lab test names and categories from database
  const commonLabTests = availableTests.map(test => test.name);
  const testCategories = [...new Set(availableTests.map(test => test.category))].sort();

  const { data, setData, post, processing, reset } = useForm({
    patient_id: "",
    test_name: "",
    priority: "routine",
  });

  const [selectedTestFromCatalog, setSelectedTestFromCatalog] = useState<AvailableTest | null>(null);

  // Helper function to get patient name from various possible field structures
  const getPatientName = (test: any) => {
    // Try different possible field combinations
    if (test.first_name && test.last_name) {
      return `${test.first_name} ${test.last_name}`.trim();
    }
    if (test.patient_first_name && test.patient_last_name) {
      return `${test.patient_first_name} ${test.patient_last_name}`.trim();
    }
    if (test.patient_name) {
      return test.patient_name;
    }
    if (test.name) {
      return test.name;
    }
    // Fallback to patient ID with a more descriptive label
    return `Patient ID: ${test.patient_id}`;
  };

  // Function to format lab results from database
  const formatLabResults = (results: any[]): LabResult[] => {
    if (!results || results.length === 0) {
      return [];
    }

    return results.map(result => ({
      parameter: result.parameter,
      value: result.value.toString(),
      unit: result.unit || '',
      referenceRange: result.referenceRange || '',
      status: result.status as 'normal' | 'abnormal' | 'critical',
      description: result.description || ''
    }));
  };

  // Transform database data for display
  const displayTests = useMemo(() => ({
    ...tests,
    data: tests.data.map(test => {
      const transformedTest = {
        ...test,
        patientName: getPatientName(test),
        patientId: test.patient_id?.toString() || 'N/A',
        testName: test.test_name || test.name || 'N/A',
        orderedBy: test.ordered_by || test.doctor || 'N/A',
        orderedAt: test.ordered_at || test.created_at || 'N/A',
        completedAt: test.completed_at || (test.status === 'completed' ? test.ordered_at : null),
        category: test.category || test.test_type || test.type || 'General',
        bedNumber: 'N/A', // Bed information not available in current schema
        results: test.results ? formatLabResults(test.results) : undefined
      };
      return transformedTest;
    })
  }), [tests]);

  // Helper function to get patient name for patient search
  const getPatientDisplayName = (patient: any) => {
    if (patient.first_name && patient.last_name) {
      return `${patient.first_name} ${patient.last_name}`.trim();
    }
    if (patient.name) {
      return patient.name;
    }
    return `Patient ${patient.id}`;
  };

  const displayPatients = useMemo(() =>
    patients?.map(patient => ({
      ...patient,
      name: getPatientDisplayName(patient)
    })) || [], [patients]
  );

  // Patient search effect
  useEffect(() => {
    if (patientSearch && patientSearch.length > 0) {
      const filtered = displayPatients.filter(patient => {
        const fullName = patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
        const searchTerm = patientSearch.toLowerCase();
        return fullName.toLowerCase().includes(searchTerm) ||
          patient.id.toLowerCase().includes(searchTerm) ||
          (patient.first_name && patient.first_name.toLowerCase().includes(searchTerm)) ||
          (patient.last_name && patient.last_name.toLowerCase().includes(searchTerm));
      });
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [patientSearch, displayPatients]);

  // Enhanced test search with category filtering
  useEffect(() => {
    let filtered = availableTests || [];

    // Apply category filter first
    if (selectedCategory && selectedCategory !== "") {
      filtered = filtered.filter(test =>
        test.category && test.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Then apply search filter - search in name, category, and test code if available
    if (testSearch && testSearch.length > 0) {
      const searchTerm = testSearch.toLowerCase().trim();
      filtered = filtered.filter(test => {
        const name = (test.name || '').toLowerCase();
        const category = (test.category || '').toLowerCase();
        const code = (test.code || '').toLowerCase();

        return name.includes(searchTerm) ||
               category.includes(searchTerm) ||
               code.includes(searchTerm) ||
               // Also search for partial matches in words
               name.split(' ').some(word => word.startsWith(searchTerm)) ||
               category.split(' ').some(word => word.startsWith(searchTerm));
      });
    }

    setFilteredTests(filtered);

    // Show dropdown if we have results, or if user is searching/filtering
    const shouldShowDropdown = (testSearch && testSearch.length > 0) ||
                              (selectedCategory && selectedCategory !== "") ||
                              (filtered.length > 0);

    setShowTestDropdown(shouldShowDropdown);
  }, [testSearch, selectedCategory, availableTests]);

  // Debounced search for table
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== (filters?.search || "")) {
        const searchParams = searchQuery ? { search: searchQuery } : {};
        router.get(
          route("inpatient.labs"),
          searchParams,
          {
            preserveState: true,
            replace: true,
            only: ['tests', 'filters']
          }
        );
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters?.search]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowTestDropdown(false);
        setFilteredPatients([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const resetModalState = () => {
    reset();
    setPatientSearch("");
    setSelectedPatient(null);
    setFilteredPatients([]);
    setTestSearch("");
    setFilteredTests([]);
    setShowTestDropdown(false);
    setSelectedCategory("");
    setSelectedTestFromCatalog(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }

    if (!data.test_name || data.test_name.trim() === '') {
      alert('Please select or enter a test name');
      return;
    }

    // Ensure patient_id is set correctly
    if (!data.patient_id) {
      setData("patient_id", selectedPatient.id);
    }

    console.log('Submitting form with data:', {
      patient_id: data.patient_id || selectedPatient.id,
      test_name: data.test_name.trim(),
      priority: data.priority
    });

    post(route("inpatient.labs.store"), {
      onSuccess: (response) => {
        console.log('Test ordered successfully:', response);
        setShowOrderModal(false);
        resetModalState();
        // Refresh the page data
        router.reload({ only: ['tests'] });
      },
      onError: (errors) => {
        console.error('Error ordering test:', errors);
        const errorMessage = Object.values(errors).flat().join('\n') || 'Error ordering test. Please check the form and try again.';
        alert(errorMessage);
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "ordered":
        return "bg-blue-100 text-blue-800";
      case "collected":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "abnormal":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white";
      case "stat":
        return "bg-red-500 text-white";
      case "urgent":
        return "bg-orange-500 text-white";
      case "asap":
        return "bg-yellow-500 text-white";
      case "routine":
        return "bg-gray-500 text-white";
      case "timed":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const handleViewResults = (test: LabTest) => {
    setSelectedTest(test);
    setShowResultsModal(true);
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setData("patient_id", patient.id);
    setPatientSearch(patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim());
    setFilteredPatients([]);
  };

  const handleTestSelect = (test: AvailableTest) => {
    setSelectedTestFromCatalog(test);
    setData("test_name", test.name);
    setTestSearch(test.name);
    setShowTestDropdown(false);
    setFilteredTests([]);
  };

  const handleTestInputChange = (value: string) => {
    setTestSearch(value);
    setData("test_name", value);

    // Clear selected test from catalog if user is typing custom test
    if (selectedTestFromCatalog && value !== selectedTestFromCatalog.name) {
      setSelectedTestFromCatalog(null);
    }

    // Show dropdown when user starts typing
    if (value.length > 0) {
      setShowTestDropdown(true);
    }
  };

  const getResultStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "text-red-600 font-bold";
      case "abnormal":
        return "text-orange-600 font-semibold";
      case "normal":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const updateTestStatus = async (testId: number, newStatus: string) => {
    try {
      const response = await fetch(route('inpatient.labs.updateStatus', testId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh the page data
        router.reload({ only: ['tests'] });
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      default:
        return null;
    }
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'Start Processing';
      case 'in_progress':
        return 'Mark Complete';
      default:
        return null;
    }
  };

  const getStatusButtonIcon = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return Play;
      case 'in_progress':
        return CheckCircle;
      default:
        return null;
    }
  };

  const generatePDF = (testId: number) => {
    // Download PDF directly
    window.location.href = route('inpatient.labs.pdf', testId);
  };

  const previewPDF = (testId: number) => {
    // Open PDF preview in new window
    window.open(route('inpatient.labs.pdf.preview', testId), '_blank');
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate results
    const validResults = resultsData.filter(r => r.parameter && r.value);
    if (validResults.length === 0) {
      alert('Please enter at least one result with parameter and value');
      return;
    }

    if (!selectedTest) {
      alert('No test selected');
      return;
    }

    setSavingResults(true);

    try {
      const response = await fetch(route('inpatient.labs.storeResults', selectedTest.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          results: validResults.map(r => ({
            parameter: r.parameter,
            value: r.value,
            unit: r.unit,
            reference_range: r.reference_range,
            status: r.status,
            description: r.description
          }))
        }),
      });

      if (response.ok) {
        setShowResultsEntryModal(false);
        alert('Results saved successfully!');
        router.reload({ only: ['tests'] });
      } else {
        const error = await response.json();
        alert(`Failed to save results: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Error saving results: ' + (error as any).message);
    } finally {
      setSavingResults(false);
    }
  };

  return (
    <HMSLayout>
      <Head title="Labs & Diagnostics" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6 py-4 bg-white border-b">
        <h2 className="font-semibold text-xl text-gray-800 leading-tight flex items-center gap-2">
          <FlaskConical className="text-blue-600 w-6 h-6" />
          Labs & Diagnostics
        </h2>
      </div>

      {/* Enhanced Search + Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, tests, or doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${showFilters
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowOrderModal(true);
                resetModalState();
              }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Order Test
            </button>
            <button
              onClick={() => setShowNewTestModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Add New Test
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">All Priorities</option>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="py-4">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            {[
              {
                label: "Pending",
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                icon: Clock,
                key: "pending"
              },
              {
                label: "In Progress",
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-200",
                icon: TestTube,
                key: "in_progress"
              },
              {
                label: "Processing",
                color: "text-purple-600",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
                icon: Beaker,
                key: "processing"
              },
              {
                label: "Completed",
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                icon: CheckCircle,
                key: "completed"
              },
              {
                label: "Abnormal",
                color: "text-red-600",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
                icon: AlertCircle,
                key: "abnormal"
              },
            ].map((item) => {
              const IconComponent = item.icon;
              const count = displayTests.data.filter((t) => t.status === item.key).length;
              return (
                <div
                  key={item.key}
                  className={`${item.bgColor} ${item.borderColor} border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <IconComponent className={`w-8 h-8 ${item.color}`} />
                    <div className={`text-3xl font-bold ${item.color}`}>
                      {count}
                    </div>
                  </div>
                  <div className="text-gray-700 font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {count === 1 ? 'test' : 'tests'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Table */}
          <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Lab Orders</h3>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    {displayTests.data.length} {displayTests.data.length === 1 ? 'order' : 'orders'}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "Patient",
                        "Test",
                        "Category",
                        "Priority",
                        "Status",
                        "Ordered By",
                        "Date",
                        "Actions",
                      ].map((head) => (
                        <th
                          key={head}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayTests.data.length > 0 ? (
                      displayTests.data.map((test) => (
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {test.patientName || `Patient ${test.patient_id}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {test.patientId || test.patient_id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {test.testName || test.test_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {test.category || test.test_type || 'General'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                                test.priority
                              )}`}
                            >
                              {test.priority?.toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                test.status
                              )}`}
                            >
                              {test.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {test.orderedBy || test.ordered_by || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {test.orderedAt || test.ordered_at}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {/* Status Progression Button */}
                              {getNextStatus(test.status) && (
                                <button
                                  onClick={() => updateTestStatus(test.id, getNextStatus(test.status)!)}
                                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${test.status === 'pending'
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                >
                                  {React.createElement(getStatusButtonIcon(test.status)!, { className: "w-3 h-3" })}
                                  {getStatusButtonText(test.status)}
                                </button>
                              )}

                              {/* Enter Results Button - For in_progress tests */}
                              {test.status === "in_progress" && (
                                <button
                                  onClick={() => {
                                    setSelectedTest(test);
                                    setResultsData([
                                      { parameter: "", value: "", unit: "", reference_range: "", status: "normal", description: "" }
                                    ]);
                                    setShowResultsEntryModal(true);
                                  }}
                                  className="text-purple-600 hover:text-purple-900 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                                >
                                  <Beaker className="w-4 h-4" />
                                  Enter Results
                                </button>
                              )}

                              {/* View Results Button */}
                              {test.status === "completed" && (
                                <button
                                  onClick={() => handleViewResults(test)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                  View Results
                                </button>
                              )}

                              {/* Pending/In Progress Status */}
                              {!["completed"].includes(test.status) && !getNextStatus(test.status) && (
                                <span className="text-gray-400 text-sm">
                                  {test.status === 'in_progress' ? 'Processing...' : 'Pending'}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No tests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <button
                  disabled={!tests.prev_page_url}
                  onClick={() => router.get(tests.prev_page_url!)}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>

                <span className="text-gray-600 text-sm">
                  Page {tests.current_page} of {tests.last_page}
                </span>

                <button
                  disabled={!tests.next_page_url}
                  onClick={() => router.get(tests.next_page_url!)}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40 flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modal with Animations */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative animate-slideUp">
            {/* Modal Header with Gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-5 rounded-t-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Order New Test</h3>
                    <p className="text-sm text-blue-100 mt-1">Select a patient and choose from our comprehensive test catalog</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    resetModalState();
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 group"
                >
                  <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className={`flex items-center gap-2 ${selectedPatient ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedPatient ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {selectedPatient ? <CheckCircle className="w-4 h-4" /> : <span className="font-semibold">1</span>}
                  </div>
                  <span className="font-medium">Patient</span>
                </div>
                <div className={`h-0.5 flex-1 mx-3 ${selectedPatient ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center gap-2 ${data.test_name ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${data.test_name ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {data.test_name ? <CheckCircle className="w-4 h-4" /> : <span className="font-semibold">2</span>}
                  </div>
                  <span className="font-medium">Test</span>
                </div>
                <div className={`h-0.5 flex-1 mx-3 ${data.priority ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center gap-2 ${data.priority ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${data.priority ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {data.priority ? <CheckCircle className="w-4 h-4" /> : <span className="font-semibold">3</span>}
                  </div>
                  <span className="font-medium">Priority</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient Selection */}
                <div className="relative dropdown-container">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                    <div className="bg-blue-100 p-1.5 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    Step 1: Select Patient
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-base"
                      placeholder="🔍 Type patient name or ID to search..."
                      required
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>

                  {patientSearch && patientSearch.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-72 overflow-hidden animate-slideDown">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-blue-100">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                          {filteredPatients.length > 0 ? `${filteredPatients.length} Patient${filteredPatients.length !== 1 ? 's' : ''} Found` : 'No Results'}
                        </p>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredPatients.length > 0 ? (
                          filteredPatients.map((patient, index) => (
                            <div
                              key={patient.id}
                              onClick={() => handlePatientSelect(patient)}
                              className="px-4 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200 group"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 group-hover:bg-blue-200 p-2 rounded-full transition-colors">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || `Patient ${patient.id}`}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <span className="font-mono">ID: {patient.id}</span>
                                  </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          ))
                        ) : patientSearch.length > 1 ? (
                          <div className="px-4 py-8 text-center">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <div className="text-gray-700 font-medium mb-1">No patients found</div>
                            <div className="text-sm text-gray-500">No matches for "{patientSearch}"</div>
                            <div className="text-xs text-gray-400 mt-2">Try searching by name or patient ID</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="mt-4 p-5 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border-2 border-green-300 shadow-md animate-slideDown">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 p-3 rounded-full shadow-sm">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Selected Patient</div>
                            <div className="font-bold text-gray-900 text-lg">
                              {selectedPatient.name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
                            </div>
                            <div className="text-sm text-gray-600 font-mono">Patient ID: {selectedPatient.id}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(null);
                            setPatientSearch("");
                            setData("patient_id", "");
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Clear selection"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Test Selection */}
                <div className="relative dropdown-container">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                    <div className="bg-purple-100 p-1.5 rounded-lg">
                      <TestTube className="w-4 h-4 text-purple-600" />
                    </div>
                    Step 2: Select Test
                    <span className="text-red-500">*</span>
                  </label>

                  {/* Category Filter */}
                  <div className="mb-5">
                    <label className="text-xs font-bold text-gray-700 mb-3 block uppercase tracking-wide">Filter by Category</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory("");
                          if (!testSearch) {
                            setFilteredTests(availableTests);
                            setShowTestDropdown(true);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === "" || !selectedCategory
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                          }`}
                      >
                        All ({availableTests.length})
                      </button>
                      {testCategories.slice(0, 5).map((category) => {
                        const categoryCount = availableTests.filter(test => test.category === category).length;
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category);
                              const categoryTests = availableTests.filter(test => test.category === category);
                              setFilteredTests(categoryTests);
                              setShowTestDropdown(true);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${selectedCategory === category
                              ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md"
                              }`}
                          >
                            {category} ({categoryCount})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative group">
                    <input
                      type="text"
                      value={testSearch}
                      onChange={(e) => handleTestInputChange(e.target.value)}
                      onFocus={() => {
                        const testsToShow = selectedCategory && selectedCategory !== ""
                          ? availableTests.filter(test => test.category === selectedCategory)
                          : availableTests;
                        setFilteredTests(testsToShow);
                        setShowTestDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowTestDropdown(false);
                        }
                      }}
                      className="w-full pl-12 pr-20 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md text-base"
                      placeholder={`🔬 Search ${availableTests.length} available tests...`}
                      required
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {testSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setTestSearch("");
                            setData("test_name", "");
                            setSelectedTestFromCatalog(null);
                            setShowTestDropdown(false);
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const testsToShow = selectedCategory && selectedCategory !== ""
                            ? availableTests.filter(test => test.category === selectedCategory)
                            : availableTests;
                          setFilteredTests(testsToShow);
                          setShowTestDropdown(true);
                        }}
                        className="text-gray-400 hover:text-purple-500 hover:bg-purple-50 p-2 rounded-lg transition-all"
                        title="Browse all tests"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Selected Test Display */}
                  {selectedTestFromCatalog && (
                    <div className="mt-4 p-5 bg-gradient-to-r from-purple-50 via-violet-50 to-indigo-50 rounded-xl border-2 border-purple-300 shadow-md animate-slideDown">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-purple-100 p-3 rounded-full shadow-sm">
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Selected Test</div>
                            <div className="font-bold text-gray-900 text-lg">{selectedTestFromCatalog.name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                              <span className="bg-purple-100 px-3 py-1 rounded-full text-xs font-semibold text-purple-700">
                                {selectedTestFromCatalog.category}
                              </span>
                              <span className="font-bold text-green-600 text-base">
                                KSh {selectedTestFromCatalog.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTestFromCatalog(null);
                            setTestSearch("");
                            setData("test_name", "");
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Clear selection"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick Search Suggestions */}
                  {showTestDropdown && !testSearch && !selectedCategory && (
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden animate-slideDown">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b border-purple-100">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-bold text-purple-700 uppercase tracking-wide">Popular Tests</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                          {['Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Lipid Panel', 'Thyroid Function Panel', 'Liver Function Panel', 'Urinalysis (Complete)']
                            .map(testName => {
                              const test = availableTests.find(t => t.name === testName);
                              return test ? (
                                <button
                                  key={test.id}
                                  type="button"
                                  onClick={() => handleTestSelect(test)}
                                  className="text-left p-3 text-sm font-medium text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-md group"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="truncate">{test.name}</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </button>
                              ) : null;
                            }).filter(Boolean)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Dropdown */}
                  {showTestDropdown && filteredTests.length > 0 && (testSearch || selectedCategory) && (
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-2xl max-h-96 overflow-hidden animate-slideDown">
                      <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Beaker className="w-5 h-5 text-purple-600" />
                            <div className="text-sm font-bold text-purple-700">
                              {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} found
                              {selectedCategory && selectedCategory !== "" && (
                                <span className="ml-2 text-indigo-600">in {selectedCategory}</span>
                              )}
                            </div>
                          </div>
                          {testSearch && (
                            <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full font-medium">
                              "{testSearch}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="p-3 space-y-2">
                          {filteredTests.map((test, index) => (
                            <div
                              key={test.id}
                              onClick={() => handleTestSelect(test)}
                              className="px-4 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 cursor-pointer rounded-xl transition-all border-2 border-transparent hover:border-purple-300 hover:shadow-lg group"
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-900 mb-2 group-hover:text-purple-700 transition-colors">
                                    {test.name}
                                  </div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 group-hover:bg-purple-200">
                                      {test.category}
                                    </span>
                                    {test.code && (
                                      <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                        {test.code}
                                      </span>
                                    )}
                                    <span className="text-base font-bold text-green-600 group-hover:text-green-700">
                                      KSh {test.price.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 flex-shrink-0 transition-all" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Test Indicator */}
                  {testSearch && !selectedTestFromCatalog && testSearch.length > 2 && filteredTests.length === 0 && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Sparkles className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-yellow-800">Custom Test</div>
                          <div className="text-sm text-yellow-700">
                            "{testSearch}" will be added as a custom test
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {((testSearch && testSearch.length > 0) || (selectedCategory && selectedCategory !== "")) &&
                   filteredTests.length === 0 && !selectedTestFromCatalog && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          No tests found
                        </div>
                        <div className="text-xs text-gray-500">
                          {testSearch && selectedCategory ?
                            `No tests matching "${testSearch}" in ${selectedCategory} category` :
                            testSearch ?
                            `No tests matching "${testSearch}"` :
                            `No tests in ${selectedCategory} category`
                          }
                        </div>
                        {testSearch && testSearch.length > 2 && (
                          <div className="mt-2 text-xs text-yellow-600">
                            "{testSearch}" will be added as a custom test
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Priority Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
                    <div className="bg-orange-100 p-1.5 rounded-lg">
                      <Zap className="w-4 h-4 text-orange-600" />
                    </div>
                    Step 3: Priority Level
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "routine", label: "Routine", color: "bg-gray-100 text-gray-700 border-gray-300", hoverColor: "hover:bg-gray-200 hover:border-gray-400", icon: Clock },
                      { value: "asap", label: "ASAP", color: "bg-yellow-100 text-yellow-800 border-yellow-300", hoverColor: "hover:bg-yellow-200 hover:border-yellow-400", icon: Clock },
                      { value: "urgent", label: "Urgent", color: "bg-orange-100 text-orange-800 border-orange-300", hoverColor: "hover:bg-orange-200 hover:border-orange-400", icon: AlertCircle },
                      { value: "stat", label: "STAT", color: "bg-red-100 text-red-800 border-red-300", hoverColor: "hover:bg-red-200 hover:border-red-400", icon: Zap },
                      { value: "critical", label: "Critical", color: "bg-red-200 text-red-900 border-red-400", hoverColor: "hover:bg-red-300 hover:border-red-500", icon: AlertCircle },
                      { value: "timed", label: "Timed", color: "bg-blue-100 text-blue-800 border-blue-300", hoverColor: "hover:bg-blue-200 hover:border-blue-400", icon: Calendar },
                    ].map((priority) => {
                      const IconComponent = priority.icon;
                      const isSelected = data.priority === priority.value;
                      return (
                        <button
                          key={priority.value}
                          type="button"
                          onClick={() => setData("priority", priority.value)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? priority.color + " ring-4 ring-offset-2 ring-blue-300 shadow-lg scale-105"
                              : "bg-white border-gray-200 hover:shadow-md " + priority.hoverColor
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <IconComponent className={`w-6 h-6 ${isSelected ? '' : 'opacity-60'}`} />
                            <span className={`font-bold text-sm ${isSelected ? '' : 'font-medium'}`}>{priority.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <span className="font-semibold">💡 Tip:</span> Select the appropriate priority level based on clinical urgency
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-between items-center space-x-4 pt-6 border-t-2 border-gray-200">
                  <div className="text-sm text-gray-600">
                    {!selectedPatient && <span className="text-orange-600 font-medium">⚠ Please select a patient</span>}
                    {selectedPatient && !data.test_name?.trim() && <span className="text-orange-600 font-medium">⚠ Please select a test</span>}
                    {selectedPatient && data.test_name?.trim() && <span className="text-green-600 font-medium">✓ Ready to submit</span>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrderModal(false);
                        resetModalState();
                      }}
                      className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold hover:shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processing || !selectedPatient || !data.test_name?.trim()}
                      className={`px-8 py-3 rounded-xl font-bold flex items-center gap-3 shadow-lg transition-all duration-200 ${
                        processing || !selectedPatient || !data.test_name?.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 hover:shadow-2xl hover:scale-105'
                      }`}
                    >
                      {processing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Ordering Test...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>
                            {!selectedPatient ? 'Select Patient First' :
                             !data.test_name?.trim() ? 'Select Test' :
                             'Order Test Now'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-4/5 max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowResultsModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Lab Results: {selectedTest.testName || selectedTest.test_name}
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded">
                <div><strong>Patient:</strong> {selectedTest.patientName || `Patient ${selectedTest.patient_id}`} ({selectedTest.patientId || selectedTest.patient_id})</div>
                <div><strong>Bed:</strong> {selectedTest.bedNumber || 'N/A'}</div>
                <div><strong>Ordered By:</strong> {selectedTest.orderedBy || selectedTest.ordered_by || 'N/A'}</div>
                <div><strong>Completed:</strong> {selectedTest.completed_at || 'N/A'}</div>
                <div><strong>Category:</strong> {selectedTest.category}</div>
                <div>
                  <strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTest.status)}`}>
                    {selectedTest.status}
                  </span>
                </div>
              </div>
            </div>

            {selectedTest.results && selectedTest.results.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Beaker className="w-5 h-5 text-blue-600" />
                    Test Results
                  </h4>
                  <div className="text-sm text-gray-500">
                    {selectedTest.results.length} parameter{selectedTest.results.length !== 1 ? 's' : ''} analyzed
                  </div>
                </div>

                {/* Results Cards */}
                <div className="grid gap-4">
                  {selectedTest.results.map((result, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 transition-all ${result.status === 'critical' ? 'bg-red-50 border-red-200' :
                      result.status === 'abnormal' ? 'bg-orange-50 border-orange-200' :
                        'bg-green-50 border-green-200'
                      }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">{result.parameter}</h5>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Value:</span>
                              <span className={`text-lg font-bold ${getResultStatusColor(result.status)}`}>
                                {result.value} {result.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Reference:</span>
                              <span className="text-sm text-gray-700">
                                {result.referenceRange} {result.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${result.status === 'critical' ? 'bg-red-100 text-red-800' :
                          result.status === 'abnormal' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                          {result.status.toUpperCase()}
                        </span>
                      </div>
                      {result.description && (
                        <div className="text-sm text-gray-700 bg-white bg-opacity-50 p-3 rounded border">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p>{result.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overall Assessment */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h5 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Overall Assessment
                  </h5>
                  <div className="space-y-2">
                    {selectedTest.results.every(r => r.status === 'normal') ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">All parameters within normal limits</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">
                          {selectedTest.results.filter(r => r.status !== 'normal').length} parameter(s) require attention
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-700 mt-2">
                      This {selectedTest.testName || selectedTest.test_name} was completed on{' '}
                      {selectedTest.completed_at || 'the same day'} and shows{' '}
                      {selectedTest.results.every(r => r.status === 'normal')
                        ? 'normal findings across all measured parameters.'
                        : 'some values that may require clinical correlation or follow-up.'}
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Clinical Recommendations
                  </h5>
                  <div className="text-sm text-gray-700 space-y-2">
                    {selectedTest.results.every(r => r.status === 'normal') ? (
                      <div>
                        <p className="text-green-700 font-medium">✓ No immediate action required</p>
                        <p>All parameters are within normal limits. Continue routine monitoring as clinically indicated.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-orange-700 font-medium">⚠ Clinical correlation recommended</p>
                        <p>Some parameters are outside normal ranges. Consider:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Review patient symptoms and clinical history</li>
                          <li>Consider repeat testing if clinically indicated</li>
                          <li>Correlate with other diagnostic findings</li>
                          <li>Follow institutional protocols for abnormal values</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No detailed results available for this test.</p>
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="flex gap-3">
                <button
                  onClick={() => previewPDF(selectedTest.id)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview PDF
                </button>
                <button
                  onClick={() => generatePDF(selectedTest.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Entry Modal */}
      {showResultsEntryModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Beaker className="w-6 h-6" />
                  <div>
                    <h3 className="text-xl font-bold">Enter Lab Results</h3>
                    <p className="text-sm text-purple-100">
                      {selectedTest.first_name} {selectedTest.last_name} - {selectedTest.test_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResultsEntryModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveResults} className="p-6 space-y-4">
              {/* Results Entries */}
              <div className="space-y-4">
                {resultsData.map((result, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {/* Parameter Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Parameter Name *
                        </label>
                        <input
                          type="text"
                          value={result.parameter}
                          onChange={(e) => {
                            const newResults = [...resultsData];
                            newResults[index].parameter = e.target.value;
                            setResultsData(newResults);
                          }}
                          placeholder="e.g., Hemoglobin"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Value */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Value *
                        </label>
                        <input
                          type="text"
                          value={result.value}
                          onChange={(e) => {
                            const newResults = [...resultsData];
                            newResults[index].value = e.target.value;
                            setResultsData(newResults);
                          }}
                          placeholder="e.g., 14.5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={result.unit}
                          onChange={(e) => {
                            const newResults = [...resultsData];
                            newResults[index].unit = e.target.value;
                            setResultsData(newResults);
                          }}
                          placeholder="e.g., g/dL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Reference Range */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Reference Range
                        </label>
                        <input
                          type="text"
                          value={result.reference_range}
                          onChange={(e) => {
                            const newResults = [...resultsData];
                            newResults[index].reference_range = e.target.value;
                            setResultsData(newResults);
                          }}
                          placeholder="e.g., 12.0-16.0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Status *
                        </label>
                        <select
                          value={result.status}
                          onChange={(e) => {
                            const newResults = [...resultsData];
                            newResults[index].status = e.target.value;
                            setResultsData(newResults);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      {/* Remove Button */}
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            const newResults = resultsData.filter((_, i) => i !== index);
                            setResultsData(newResults.length > 0 ? newResults : [{ parameter: "", value: "", unit: "", reference_range: "", status: "normal", description: "" }]);
                          }}
                          className="w-full px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors font-medium text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Description/Notes
                      </label>
                      <textarea
                        value={result.description}
                        onChange={(e) => {
                          const newResults = [...resultsData];
                          newResults[index].description = e.target.value;
                          setResultsData(newResults);
                        }}
                        placeholder="e.g., Normal hemoglobin level, no signs of anemia"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Results Button */}
              <button
                type="button"
                onClick={() => {
                  setResultsData([...resultsData, { parameter: "", value: "", unit: "", reference_range: "", status: "normal", description: "" }]);
                }}
                className="w-full px-4 py-2 border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
              >
                + Add Another Result
              </button>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowResultsEntryModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResults}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {savingResults ? 'Saving...' : 'Save Results & Complete Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Test Modal */}
      <AddNewTestModal
        isOpen={showNewTestModal}
        onClose={() => setShowNewTestModal(false)}
        onSuccess={() => {
          setShowNewTestModal(false);
        }}
      />
    </HMSLayout>
  );
}
