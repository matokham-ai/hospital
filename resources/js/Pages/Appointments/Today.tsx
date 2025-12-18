import HMSLayout from "@/Layouts/HMSLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Clock, User, Stethoscope, Search, Calendar, BarChart3, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface TodayAppointment {
  id: number;
  time: string;
  patient: string;
  doctor: string;
  status: string;
}

interface PaginationData {
  data: TodayAppointment[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface Filters {
  search: string;
  status: string;
  per_page: number;
}

interface Stats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  in_progress: number;
}

interface Props {
  appointments: PaginationData;
  filters: Filters;
  stats: Stats;
}

export default function Today({ appointments, filters, stats }: Props) {
  const { props } = usePage();
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || 'all');
  const [perPage, setPerPage] = useState(filters.per_page || 10);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialRender = useRef(true);

  // Handle immediate filter changes (status, perPage only)
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    performFilter(search, status, perPage);
  }, [status, perPage]);

  // Manual search function
  const handleSearch = () => {
    performFilter(search.trim(), status, perPage);
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearch('');
    // Automatically search with empty term to show all results
    performFilter('', status, perPage);
  };

  const performFilter = (searchTerm: string, statusFilter: string, itemsPerPage: number) => {
    setIsLoading(true);
    router.get('/appointments/today', {
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      per_page: itemsPerPage,
    }, {
      preserveState: true,
      replace: true,
      only: ['appointments', 'stats'],
      onFinish: () => setIsLoading(false),
      onError: () => setIsLoading(false),
    });
  };

  const handlePageChange = (page: number) => {
    setIsLoading(true);
    router.get('/appointments/today', {
      page,
      search: search || undefined,
      status: status !== 'all' ? status : undefined,
      per_page: perPage,
    }, {
      preserveState: true,
      only: ['appointments'],
      onFinish: () => setIsLoading(false),
      onError: () => setIsLoading(false),
    });
  };

  return (
    <HMSLayout user={{ name: "System Admin", email: "admin@example.com", role: "Administrator" }}>
      <Head title="Today's Appointments - MediCare HMS" />

      {/* Loading Progress Bar */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-blue-200">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 animate-progress"></div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-8 px-6 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="text-blue-600" />
              Today's Appointments
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Link
            href="/appointments/create"
            className="mt-4 sm:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            + Schedule New Appointment
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Today"
            value={stats.total}
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            title="Scheduled"
            value={stats.scheduled}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            color="bg-amber-50 border-amber-200"
          />
          <StatCard
            title="In Progress"
            value={stats.in_progress}
            icon={<Stethoscope className="w-5 h-5 text-purple-600" />}
            color="bg-purple-50 border-purple-200"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<User className="w-5 h-5 text-green-600" />}
            color="bg-green-50 border-green-200"
          />
          <StatCard
            title="Cancelled"
            value={stats.cancelled}
            icon={<Clock className="w-5 h-5 text-red-600" />}
            color="bg-red-50 border-red-200"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient name, doctor, or time..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    disabled={isLoading}
                  />
                  {search && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      disabled={isLoading}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isLoading}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            {/* Per Page */}
            <div className="sm:w-32">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                disabled={isLoading}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results Info */}
        {(search || status !== 'all') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                <span className="font-medium">Active filters:</span>
                {search && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Search: "{search}"</span>}
                {status !== 'all' && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Status: {status}</span>}
              </div>
              <button
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                  performFilter('', 'all', perPage);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Appointments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 transition-opacity duration-200">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            </div>
          )}
          
          <div className={`overflow-x-auto transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.data.length > 0 ? (
                  appointments.data.map((a: TodayAppointment, index) => (
                    <tr 
                      key={a.id} 
                      className="hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-[1.01] opacity-0 animate-fade-in"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{a.time}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{a.patient}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{a.doctor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                            a.status === "Scheduled"
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : a.status === "Completed"
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : a.status === "In_progress"
                              ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                              : a.status === "Cancelled"
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-6 bg-gray-200 rounded-full w-20 ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
                      <p className="text-lg font-medium">No appointments found</p>
                      <p className="text-sm">
                        {search || status !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'No appointments scheduled for today'
                        }
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {appointments.last_page > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {appointments.from} to {appointments.to} of {appointments.total} results
                </div>
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(appointments.current_page - 1)}
                    disabled={appointments.current_page === 1 || isLoading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, appointments.last_page) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isLoading}
                        className={`px-3 py-1 text-sm border rounded-md transition-all duration-200 transform hover:scale-105 ${
                          appointments.current_page === page
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(appointments.current_page + 1)}
                    disabled={appointments.current_page === appointments.last_page || isLoading}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
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
    <div className={`p-6 rounded-xl border ${color} transition-all duration-300 hover:shadow-lg hover:scale-105 transform`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 transition-all duration-300">{value}</p>
        </div>
        <div className="p-3 bg-white rounded-lg shadow-sm transition-all duration-300 hover:shadow-md">
          {icon}
        </div>
      </div>
    </div>
  );
}
