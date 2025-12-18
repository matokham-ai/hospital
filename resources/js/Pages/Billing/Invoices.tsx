import { useState, useEffect, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import {
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface Invoice {
  id: number;
  patient_name: string;
  phone: string;
  encounter_number: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  created_at: string;
}

interface Stats {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  outstanding: number;
  by_status: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

interface InvoicesProps {
  invoices: {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  stats: Stats;
  filters: {
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  };
}

const statusConfig = {
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function Invoices({ invoices, stats, filters }: InvoicesProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    router.get('/invoices', {
      search: searchTerm,
      status: statusFilter,
      date_from: dateFrom,
      date_to: dateTo,
    }, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsSearching(false),
    });
  };

  // Debounced search function for real-time search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setIsSearching(true);
      router.get('/invoices', {
        search: term,
        status: statusFilter,
        date_from: dateFrom,
        date_to: dateTo,
      }, {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsSearching(false),
      });
    }, 500),
    [statusFilter, dateFrom, dateTo]
  );

  // Effect for real-time search
  useEffect(() => {
    if (searchTerm !== (filters.search || '')) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    router.get('/invoices');
  };

  const handleDownloadInvoicePDF = (invoiceId: number) => {
    // Option A: Navigate to invoice page and trigger PDF download automatically
    window.open(`/invoices/${invoiceId}?download=pdf`, '_blank');
  };


  return (
    <HMSLayout>
      <Head title="Invoices" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600">Manage patient invoices and billing</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by patient name, phone number, or encounter number... (Press Enter to search)"
                className="pl-10 pr-10 w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    router.get('/invoices', {
                      status: statusFilter,
                      date_from: dateFrom,
                      date_to: dateTo,
                    });
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_invoices}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  KSh {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.total_amount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  KSh {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.paid_amount)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  KSh {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.outstanding)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patients, encounters..."
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Search Results Info */}
        {(searchTerm || statusFilter || dateFrom || dateTo) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  {searchTerm && `Search: "${searchTerm}"`}
                  {statusFilter && ` • Status: ${statusFilter}`}
                  {(dateFrom || dateTo) && ` • Date range applied`}
                </span>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Invoices ({invoices.total})
            </h3>
            {invoices.total === 0 && (searchTerm || statusFilter || dateFrom || dateTo) && (
              <span className="text-sm text-gray-500">No results found</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Encounter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">No invoices found</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchTerm || statusFilter || dateFrom || dateTo
                              ? 'Try adjusting your search criteria or filters'
                              : 'No invoices have been created yet'}
                          </p>
                        </div>
                        {(searchTerm || statusFilter || dateFrom || dateTo) && (
                          <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.data.map((invoice) => {
                    const StatusIcon = statusConfig[invoice.status as keyof typeof statusConfig]?.icon || AlertCircle;
                    const statusStyle = statusConfig[invoice.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800';
                    const statusLabel = statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status;

                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.patient_name}
                            </div>
                            <div className="text-sm text-gray-500">{invoice.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.encounter_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          KSh {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          KSh {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.paid_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          KSh {new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(invoice.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="View invoice details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDownloadInvoicePDF(invoice.id)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {invoices.last_page > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {invoices.from} to {invoices.to} of {invoices.total} results
              </div>
              <div className="flex items-center space-x-2">
                {invoices.current_page > 1 && (
                  <Link
                    href={`/invoices?page=${invoices.current_page - 1}`}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-3 py-1 text-sm font-medium">
                  Page {invoices.current_page} of {invoices.last_page}
                </span>
                {invoices.current_page < invoices.last_page && (
                  <Link
                    href={`/invoices?page=${invoices.current_page + 1}`}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </HMSLayout>
  );
}
