import { useState, useEffect, useCallback, useMemo } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import PatientAdvancedSearch from "@/Components/PatientAdvancedSearch";
import { calculateAge, getAgeGroup } from "@/utils/ageGroups";
import {
  Search,
  UserPlus,
  Phone,
  Eye,
  Edit,
  Trash2,
  Stethoscope,
  X,
  Loader2,
  User,
  MapPin,
  Heart,
  Shield,
  AlertCircle,
  Save,
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Patient {
  id: number | string;
  patient_number: string;
  name: string;
  gender: string;
  age: number | string;
  phone: string;
  email?: string;
  status: string;
  diagnosis?: string;
  admission_date?: string;
  bed_number?: string;
  is_admitted?: boolean;
  diagnoses?: Array<{
    description: string;
    icd10_code: string;
    type: string;
  }>;
  allergies?: string;
  chronic_conditions?: string;
  // Additional detailed fields
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  date_of_birth?: string;
  marital_status?: string;
  occupation?: string;
  nationality?: string;
  religion?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

interface PatientFormData {
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  nationality: string;
  religion: string;
  phone_number: string;
  email: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  allergies: string;
  chronic_conditions: string;
  insurance_provider: string;
  insurance_number: string;
  notes: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PatientsPageProps {
  patients: {
    data: Patient[];
    links: PaginationLink[];
    total: number;
    from: number;
    to: number;
  };
  statistics: {
    total_patients: number;
    new_this_month: number;
    new_this_week: number;
    gender_distribution: {
      male: number;
      female: number;
      other: number;
    };
    age_groups: {
      children: number;
      adults: number;
      seniors: number;
    };
    with_allergies: number;
    with_chronic_conditions: number;
    with_email: number;
  };
  filters: any;
  auth: { user: { name: string; email: string; role?: string } };
}

// Pagination Component
const ModernPagination = ({ links, from, to, total }: { links: PaginationLink[]; from: number; to: number; total: number }) => {
  const prevLink = links.find((link) => link.label.includes("Previous"));
  const nextLink = links.find((link) => link.label.includes("Next"));
  const pageLinks = links.filter(
    (link) =>
      !link.label.includes("Previous") &&
      !link.label.includes("Next") &&
      link.label !== "..."
  );

  const currentPage = pageLinks.find((link) => link.active);
  const totalPages = Math.ceil(total / 10);
  const currentPageNum = currentPage ? parseInt(currentPage.label) : 1;

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{from}</span> to{" "}
          <span className="font-medium">{to}</span> of{" "}
          <span className="font-medium">{total}</span> results
        </p>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {pageLinks.map((link) => (
              <Link
                key={link.label}
                href={link.url || "#"}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${link.active
                  ? "z-10 bg-teal-50 border-teal-500 text-teal-600"
                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

// Input Field
const InputField = ({
  label,
  name,
  type = "text",
  required = false,
  placeholder = "",
  options = null,
  rows = null,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[] | null;
  rows?: number | null;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 text-sm"
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : rows ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 text-sm resize-none"
        required={required}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 text-sm"
        required={required}
      />
    )}
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// Helper component for form fields with validation
const FormField = ({
  label,
  name,
  type = "text",
  required = false,
  placeholder = "",
  options = [],
  rows = 3,
  value,
  onChange,
  validationErrors,
  serverErrors
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  value: string;
  onChange: (value: string) => void;
  validationErrors: Record<string, string>;
  serverErrors: any;
}) => {
  const error = validationErrors[name] || serverErrors[name];
  const fieldId = `field-${name}`;

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          required={required}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          placeholder={placeholder}
          rows={rows}
          required={required}
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          placeholder={placeholder}
          required={required}
        />
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default function PatientsIndex({ patients, statistics, filters, auth }: PatientsPageProps) {
  const [search, setSearch] = useState(filters.search || "");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [exportLoading, setExportLoading] = useState<"pdf" | "excel" | null>(null);



  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchLoading(true);
      router.get("/patients", { search: searchTerm }, {
        preserveState: true,
        replace: true,
        only: ["patients", "filters"],
        onStart: () => setSearchLoading(true),
        onFinish: () => setSearchLoading(false),
        onError: () => setSearchLoading(false),
        preserveScroll: true,
      });
    }, 300),
    []
  );

  const handleAdvancedSearch = (filters: any) => {
    setLoading(true);
    router.get("/patients", filters, {
      preserveState: true,
      replace: true,
      only: ["patients", "filters"],
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
      onError: () => setLoading(false),
      preserveScroll: true, // Keep scroll position
    });
  };

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const handleViewPatient = (patient: Patient) => {
    // Navigate to patient detail page
    router.visit(`/patients/${patient.id}`);
  };

  const handleDeletePatient = (patient: Patient) => {
    if (confirm(`Are you sure you want to delete ${patient.name}?`)) {
      router.delete(`/patients/${patient.id}`, {
        onSuccess: () => {
          // Handle success
        },
      });
    }
  };



  const handleExport = async (format: "pdf" | "excel") => {
    try {
      setExportLoading(format);
      const response = await fetch(`/patients/export/${format}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patients.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(null);
    }
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title="Patients | MediCare HMS" />
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                🏥 Patient Management
              </h1>
              <p className="text-teal-100 text-sm">
                Manage, review, and monitor all registered patients.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Search */}
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                  searchLoading ? 'text-blue-500 animate-pulse' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Quick search patients..."
                  value={search}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearch(value);

                    // Use debounced search for better UX
                    if (value.length > 2 || value.length === 0) {
                      debouncedSearch(value);
                    }
                  }}
                  className="pl-10 pr-10 py-2 bg-white/90 border border-white/20 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white w-64 transition-all duration-200"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {search && !searchLoading && (
                  <button
                    onClick={() => {
                      setSearch("");
                      handleAdvancedSearch({ search: "" });
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {(auth.user.role === "Admin" || auth.user.role === "Receptionist") && (
                <Link
                  href="/patients/create"
                  className="inline-flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg font-medium shadow-md transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Add Patient
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Patients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_patients.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">All registered patients</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* New This Month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-teal-700">{statistics.new_this_month}</p>
                <p className="text-xs text-gray-500 mt-1">Monthly registrations</p>
              </div>
              <div className="p-3 bg-teal-50 rounded-lg">
                <UserPlus className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          {/* New This Week */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-green-700">{statistics.new_this_week}</p>
                <p className="text-xs text-gray-500 mt-1">Weekly registrations</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Conditions</p>
                <p className="text-2xl font-bold text-red-700">{statistics.with_chronic_conditions}</p>
                <p className="text-xs text-gray-500 mt-1">Chronic conditions</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Gender Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Male</p>
              <p className="text-xl font-bold text-blue-600">{statistics.gender_distribution.male}</p>
              <p className="text-xs text-gray-500">
                {statistics.total_patients > 0 ? Math.round((statistics.gender_distribution.male / statistics.total_patients) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="w-4 h-4 text-pink-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Female</p>
              <p className="text-xl font-bold text-pink-600">{statistics.gender_distribution.female}</p>
              <p className="text-xs text-gray-500">
                {statistics.total_patients > 0 ? Math.round((statistics.gender_distribution.female / statistics.total_patients) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Age Groups */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Children</p>
              <p className="text-xl font-bold text-purple-600">{statistics.age_groups.children}</p>
              <p className="text-xs text-gray-500">Under 18</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Stethoscope className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Adults</p>
              <p className="text-xl font-bold text-indigo-600">{statistics.age_groups.adults}</p>
              <p className="text-xs text-gray-500">18-64 years</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Seniors</p>
              <p className="text-xl font-bold text-orange-600">{statistics.age_groups.seniors}</p>
              <p className="text-xs text-gray-500">65+ years</p>
            </div>
          </div>

          {/* Medical & Contact Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Allergies</p>
              <p className="text-xl font-bold text-red-600">{statistics.with_allergies}</p>
              <p className="text-xs text-gray-500">Have allergies</p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Insights */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Patient Management Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span className="text-gray-600">
                    <strong>{statistics.with_email}</strong> patients have email contacts
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">
                    <strong>{statistics.with_chronic_conditions}</strong> have chronic conditions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">
                    <strong>{Math.round((statistics.new_this_month / (statistics.total_patients || 1)) * 100)}%</strong> growth this month
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-2xl font-bold text-teal-600">{statistics.total_patients}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </div>
            </div>
          </div>
        </div>

        <PatientAdvancedSearch filters={filters} onSearch={handleAdvancedSearch} loading={loading} />

        {/* Results count and Export buttons */}
        <div className="flex items-center justify-between">
          <motion.div
            key={`${patients.total}-${search}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-600"
          >
            {patients.data.length > 0 ? (
              <span>
                Showing {patients.from}-{patients.to} of {patients.total} patients
                {search && <span className="font-medium text-blue-600"> for "{search}"</span>}
              </span>
            ) : (
              <span>No patients found{search && <span className="font-medium text-red-600"> for "{search}"</span>}</span>
            )}
          </motion.div>

          {/* Export buttons */}
          {patients.data.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exportLoading === 'pdf'}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={exportLoading === 'excel'}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading === 'excel' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                Excel
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100 relative">
          {(loading || searchLoading) && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-lg">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">
                  {searchLoading ? 'Searching...' : 'Loading...'}
                </span>
              </div>
            </div>
          )}
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-700 text-sm uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Patient No</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Gender</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {patients.data.length > 0 ? (
                patients.data.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="hover:bg-teal-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-semibold text-gray-800">{patients.from + i}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{p.patient_number}</td>
                    <td className="px-6 py-3">{p.name}</td>
                    <td className="px-6 py-3">{p.gender}</td>
                    <td className="px-6 py-3">{p.phone || "-"}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${p.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewPatient(p)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(auth.user.role === "Admin" || auth.user.role === "Receptionist") && (
                          <Link
                            href={`/patients/${p.id}/edit`}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Patient"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}

                        {auth.user.role === "Admin" && (
                          <button
                            onClick={() => handleDeletePatient(p)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Patient"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {patients.total > 10 && (
          <div className="mt-6">
            <ModernPagination
              links={patients.links}
              from={patients.from}
              to={patients.to}
              total={patients.total}
            />
          </div>
        )}
      </div>
    </HMSLayout>
  );
}
