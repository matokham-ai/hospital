import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Calendar,
  TrendingUp,
  X,
  Edit,
  CreditCard,
  Receipt,
  Activity,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  FileText,
  DollarSign,
  ChevronDown,
  Check,
  Loader2
} from 'lucide-react';

interface InsuranceClaim {
  id: number;
  invoice_id: number;
  patient_name: string;
  insurance_provider: string;
  policy_number: string;
  claim_number: string;
  claim_amount: number;
  approved_amount?: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submission_date: string;
  approval_date?: string;
  notes?: string;
  documents?: string[];
}

interface Invoice {
  id: number;
  patient_name: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  date: string;
  due_date: string;
}

interface Payment {
  id: number;
  invoice_id: number;
  patient_name: string;
  amount: number;
  method: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface PatientWithInsurance {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  insurance_provider: string;
  policy_number: string;
  policy_type: string;
  coverage_amount: number;
  deductible: number;
  copay: number;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
}

interface InsurancePageProps {
  claims: {
    data: InsuranceClaim[];
    current_page: number;
    last_page: number;
    total: number;
  };
  invoices: {
    data: Invoice[];
    total: number;
    outstanding: number;
    paid: number;
  };
  payments: {
    data: Payment[];
    total: number;
  };
  stats: {
    total_invoices: number;
    outstanding_amount: number;
    paid_amount: number;
    insurance_pending: number;
    settlement_rate: number;
    revenue_trend: number[];
  };
}

const Insurance: React.FC<InsurancePageProps> = ({
  claims = { data: [], current_page: 1, last_page: 1, total: 0 },
  invoices = { data: [], total: 0, outstanding: 0, paid: 0 },
  payments = { data: [], total: 0 },
  stats = {
    total_invoices: 0,
    outstanding_amount: 0,
    paid_amount: 0,
    insurance_pending: 0,
    settlement_rate: 0,
    revenue_trend: [0, 0, 0, 0, 0, 0, 0]
  }
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'claims'>('invoices');
  const [showModal, setShowModal] = useState<'payment' | 'claim' | 'invoice' | 'view' | null>(null);
  const [selectedItem, setSelectedItem] = useState<Invoice | Payment | InsuranceClaim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Modal states
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientWithInsurance | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset pagination when filters change
  React.useEffect(() => {
    setInvoicesPage(1);
    setClaimsPage(1);
  }, [searchTerm, statusFilter, dateFilter]);
  // State
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [claimsPage, setClaimsPage] = useState(1);
  const itemsPerPage = 10;

  // Filter functions
  const filterInvoices = (invoices: Invoice[]) => {
    if (!searchTerm && statusFilter === 'all' && dateFilter === 'all') return invoices;

    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm ||
        invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toString().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      const matchesDate = dateFilter === 'all' || (() => {
        const invoiceDate = new Date(invoice.date);
        const today = new Date();

        switch (dateFilter) {
          case 'today':
            return invoiceDate.toDateString() === today.toDateString();
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return invoiceDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return invoiceDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filterPayments = (payments: Payment[]) => {
    if (!searchTerm && statusFilter === 'all' && dateFilter === 'all') return payments;

    return payments.filter(payment => {
      const matchesSearch = !searchTerm ||
        payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toString().includes(searchTerm.toLowerCase()) ||
        payment.method.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

      const matchesDate = dateFilter === 'all' || (() => {
        const paymentDate = new Date(payment.date);
        const today = new Date();

        switch (dateFilter) {
          case 'today':
            return paymentDate.toDateString() === today.toDateString();
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paymentDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return paymentDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const filterClaims = (claims: InsuranceClaim[]) => {
    if (!searchTerm && statusFilter === 'all' && dateFilter === 'all') return claims;

    return claims.filter(claim => {
      const matchesSearch = !searchTerm ||
        claim.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id.toString().includes(searchTerm.toLowerCase()) ||
        claim.insurance_provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.policy_number.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;

      const matchesDate = dateFilter === 'all' || (() => {
        const claimDate = new Date(claim.submission_date);
        const today = new Date();

        switch (dateFilter) {
          case 'today':
            return claimDate.toDateString() === today.toDateString();
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return claimDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return claimDate >= monthAgo;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  // Apply filters to data
  const filteredInvoices = filterInvoices(invoices?.data || []);
  const filteredPayments = filterPayments(payments?.data || []);
  const filteredClaims = filterClaims(claims?.data || []);

  // Derived values for invoices pagination
  const totalInvoices = filteredInvoices.length;
  const totalInvoicesPages = Math.ceil(totalInvoices / itemsPerPage);
  const invoicesStartIndex = (invoicesPage - 1) * itemsPerPage;
  const invoicesEndIndex = invoicesStartIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(invoicesStartIndex, invoicesEndIndex);

  // Derived values for claims pagination
  const totalClaims = filteredClaims.length;
  const totalClaimsPages = Math.ceil(totalClaims / itemsPerPage);
  const claimsStartIndex = (claimsPage - 1) * itemsPerPage;
  const claimsEndIndex = claimsStartIndex + itemsPerPage;
  const paginatedClaims = filteredClaims.slice(claimsStartIndex, claimsEndIndex);

  // Mock data for patients with insurance
  const patientsWithInsurance: PatientWithInsurance[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+254 712 345 678",
      address: "123 Nairobi Street, Nairobi",
      insurance_provider: "NHIF",
      policy_number: "NHIF-2024-001",
      policy_type: "Comprehensive",
      coverage_amount: 500000,
      deductible: 10000,
      copay: 1000,
      status: "active"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@email.com",
      phone: "+254 723 456 789",
      address: "456 Mombasa Road, Nairobi",
      insurance_provider: "AAR Insurance",
      policy_number: "AAR-2024-002",
      policy_type: "Premium",
      coverage_amount: 1000000,
      deductible: 15000,
      copay: 2000,
      status: "active"
    },
    {
      id: 3,
      name: "Michael Johnson",
      email: "michael.j@email.com",
      phone: "+254 734 567 890",
      address: "789 Uhuru Highway, Nairobi",
      insurance_provider: "Jubilee Insurance",
      policy_number: "JUB-2024-003",
      policy_type: "Standard",
      coverage_amount: 750000,
      deductible: 12000,
      copay: 1500,
      status: "active"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      email: "sarah.wilson@email.com",
      phone: "+254 745 678 901",
      address: "321 Kenyatta Avenue, Nairobi",
      insurance_provider: "Madison Insurance",
      policy_number: "MAD-2024-004",
      policy_type: "Family",
      coverage_amount: 800000,
      deductible: 8000,
      copay: 1200,
      status: "active"
    },
    {
      id: 5,
      name: "David Brown",
      email: "david.brown@email.com",
      phone: "+254 756 789 012",
      address: "654 Tom Mboya Street, Nairobi",
      insurance_provider: "CIC Insurance",
      policy_number: "CIC-2024-005",
      policy_type: "Corporate",
      coverage_amount: 1200000,
      deductible: 20000,
      copay: 2500,
      status: "active"
    }
  ];

  // Filter patients based on search
  const filteredPatients = patientsWithInsurance.filter(patient =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.insurance_provider.toLowerCase().includes(patientSearch.toLowerCase()) ||
    patient.policy_number.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // Action handlers
  const handleViewItem = (item: Invoice | Payment | InsuranceClaim) => {
    setSelectedItem(item);
    setShowModal('view');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedItem(invoice);
    setShowModal('invoice');
  };

  const handleDownloadReceipt = (payment: Payment) => {
    // Simulate download - in real app, this would trigger a download
    console.log('Downloading receipt for payment:', payment.id);
    alert(`Downloading receipt for payment #${payment.id}`);
  };

  const handleSubmitClaim = (claim: InsuranceClaim) => {
    // Simulate claim submission - in real app, this would make an API call
    console.log('Submitting claim:', claim.id);
    alert(`Submitting insurance claim #${claim.id}`);
  };

  const handleCreateInvoice = () => {
    setSelectedItem(null);
    setSelectedPatient(null);
    setPatientSearch('');
    setShowModal('invoice');
  };

  const handleRecordPayment = () => {
    setSelectedItem(null);
    setSelectedPatient(null);
    setPatientSearch('');
    setShowModal('payment');
  };

  const handleSubmitNewClaim = () => {
    setSelectedItem(null);
    setSelectedPatient(null);
    setPatientSearch('');
    setShowModal('claim');
  };

  // Status color mapping for glassmorphic design
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-100/20 text-amber-700 border-amber-200/30',
      submitted: 'bg-blue-100/20 text-blue-700 border-blue-200/30',
      approved: 'bg-emerald-100/20 text-emerald-700 border-emerald-200/30',
      rejected: 'bg-red-100/20 text-red-700 border-red-200/30',
      paid: 'bg-green-100/20 text-green-700 border-green-200/30',
      overdue: 'bg-red-100/20 text-red-700 border-red-200/30',
      completed: 'bg-green-100/20 text-green-700 border-green-200/30',
      failed: 'bg-red-100/20 text-red-700 border-red-200/30'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100/20 text-gray-700 border-gray-200/30';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      submitted: Send,
      approved: CheckCircle,
      rejected: XCircle,
      paid: CheckCircle,
      overdue: AlertTriangle,
      completed: CheckCircle,
      failed: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <HMSLayout>
      <Head title="Billing & Insurance" />

      {/* Glassmorphic Background */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-50">

        {/* Header Section */}
        <div className="backdrop-blur-sm bg-white/30 border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Billing & Insurance
                </h1>
                <p className="text-gray-600 mt-2">Professional. Transparent. Effortless.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCreateInvoice}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                >
                  <Plus className="w-5 h-5" />
                  New Invoice
                </button>
                <button
                  onClick={handleRecordPayment}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-gray-700 rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                >
                  <CreditCard className="w-5 h-5" />
                  Record Payment
                </button>
                <button
                  onClick={handleSubmitNewClaim}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-gray-700 rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                >
                  <Shield className="w-5 h-5" />
                  Submit Claim
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <Calendar className="w-4 h-4 text-gray-600" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-700"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30 flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  placeholder="Search patients, invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 w-full"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    title="Clear search"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Clear All Filters */}
              {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100/20 text-red-700 rounded-xl border border-red-200/30 hover:bg-red-100/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Invoices */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.total_invoices || 0}</p>
                </div>
                <div className="p-3 bg-blue-100/30 rounded-xl">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Outstanding */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">KES {(stats?.outstanding_amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-100/30 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Paid */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Paid</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">KES {(stats?.paid_amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Insurance Pending */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Insurance Pending</p>
                  <p className="text-2xl font-bold text-teal-600 mt-1">{stats?.insurance_pending || 0}</p>
                </div>
                <div className="p-3 bg-teal-100/30 rounded-xl">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Section with Tabs */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-white/20">
              {[
                { key: 'invoices', label: 'Invoices', icon: Receipt, count: filteredInvoices.length },
                { key: 'payments', label: 'Payments', icon: CreditCard, count: filteredPayments.length },
                { key: 'claims', label: 'Insurance Claims', icon: Shield, count: filteredClaims.length }
              ].map(({ key, label, icon: Icon, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-300 ${activeTab === key
                    ? 'bg-white/30 text-blue-600 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:bg-white/10'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${activeTab === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter Results Info */}
            {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
              <div className="px-6 py-3 bg-blue-50/50 border-b border-white/20">
                <p className="text-sm text-blue-700">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Showing filtered results
                  {searchTerm && <span className="ml-1">for "{searchTerm}"</span>}
                  {statusFilter !== 'all' && <span className="ml-1">• Status: {statusFilter}</span>}
                  {dateFilter !== 'all' && <span className="ml-1">• Period: {dateFilter}</span>}
                </p>
              </div>
            )}

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'invoices' && (
                <InvoicesTab
                  invoices={paginatedInvoices}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  onView={handleViewItem}
                  onEdit={handleEditInvoice}
                  pagination={{
                    page: invoicesPage,
                    setPage: setInvoicesPage,
                    totalPages: totalInvoicesPages,
                    totalInvoices,
                    startIndex: invoicesStartIndex,
                    endIndex: invoicesEndIndex
                  }}
                />
              )}
              {activeTab === 'payments' && (
                <PaymentsTab
                  payments={filteredPayments}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  onView={handleViewItem}
                  onDownload={handleDownloadReceipt}
                />
              )}
              {activeTab === 'claims' && (
                <ClaimsTab
                  claims={paginatedClaims}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  onView={handleViewItem}
                  onSubmit={handleSubmitClaim}
                  pagination={{
                    page: claimsPage,
                    setPage: setClaimsPage,
                    totalPages: totalClaimsPages,
                    totalClaims,
                    startIndex: claimsStartIndex,
                    endIndex: claimsEndIndex
                  }}
                />
              )}
            </div>
          </div>

          {/* Footer Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Revenue Trend */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="h-32 flex items-end justify-between gap-2">
                {(stats?.revenue_trend || []).map((value, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-blue-500 to-teal-500 rounded-t-lg flex-1"
                    style={{ height: `${Math.max(...(stats?.revenue_trend || [1])) > 0 ? (value / Math.max(...(stats?.revenue_trend || [1]))) * 100 : 0}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Settlement Rate */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Insurance Settlement Rate</h3>
                <Activity className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex items-center justify-center h-32">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${stats?.settlement_rate || 0}, 100`}
                      className="text-teal-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-800">{stats?.settlement_rate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showModal && (
          <Modal
            type={showModal}
            selectedItem={selectedItem}
            onClose={() => {
              setShowModal(null);
              setSelectedItem(null);
              setPatientSearch('');
              setSelectedPatient(null);
              setShowPatientDropdown(false);
            }}
            patientSearch={patientSearch}
            setPatientSearch={setPatientSearch}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            showPatientDropdown={showPatientDropdown}
            setShowPatientDropdown={setShowPatientDropdown}
            filteredPatients={filteredPatients}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>
    </HMSLayout>
  );
};

// Tab Components
const InvoicesTab: React.FC<{
  invoices: Invoice[];
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  pagination: {
    page: number;
    setPage: (page: number | ((prev: number) => number)) => void;
    totalPages: number;
    totalInvoices: number;
    startIndex: number;
    endIndex: number;
  };
}> = ({ invoices, getStatusColor, getStatusIcon, onView, onEdit, pagination }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/20">
          <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
              No invoices found
            </td>
          </tr>
        ) : (
          invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-white/10 hover:bg-white/10 transition-colors">
              <td className="py-4 px-4 font-medium text-gray-800">{invoice.patient_name}</td>
              <td className="py-4 px-4 text-gray-700">KES {invoice.amount.toLocaleString()}</td>
              <td className="py-4 px-4 text-gray-600">{invoice.date}</td>
              <td className="py-4 px-4 text-gray-600">{invoice.due_date}</td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  {invoice.status}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(invoice)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="View Invoice"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => onEdit(invoice)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Edit Invoice"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    {/* Pagination Footer */}
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3 px-4">
      {/* Left: Info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{pagination.startIndex + 1}</span>–
        <span className="font-medium">{Math.min(pagination.endIndex, pagination.totalInvoices)}</span> of{" "}
        <span className="font-medium">{pagination.totalInvoices}</span> invoices
      </div>

      {/* Right: Page Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => pagination.setPage((prev: number) => Math.max(prev - 1, 1))}
          disabled={pagination.page === 1}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-1 transition-all ${pagination.page === 1
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
        >
          ◀ Prev
        </button>

        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => pagination.setPage(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${pagination.page === p
              ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => pagination.setPage((prev: number) => Math.min(prev + 1, pagination.totalPages))}
          disabled={pagination.page === pagination.totalPages}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-1 transition-all ${pagination.page === pagination.totalPages
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
        >
          Next ▶
        </button>
      </div>
    </div>
  </div>
);

const PaymentsTab: React.FC<{
  payments: Payment[];
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
  onView: (payment: Payment) => void;
  onDownload: (payment: Payment) => void;
}> = ({ payments, getStatusColor, getStatusIcon, onView, onDownload }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/20">
          <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {payments.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
              No payments found
            </td>
          </tr>
        ) : (
          payments.map((payment) => (
            <tr key={payment.id} className="border-b border-white/10 hover:bg-white/10 transition-colors">
              <td className="py-4 px-4 font-medium text-gray-800">{payment.patient_name}</td>
              <td className="py-4 px-4 text-gray-700">KES {payment.amount.toLocaleString()}</td>
              <td className="py-4 px-4 text-gray-600">{payment.method}</td>
              <td className="py-4 px-4 text-gray-600">{payment.date}</td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                  {getStatusIcon(payment.status)}
                  {payment.status}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(payment)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="View Payment Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => onDownload(payment)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Download Receipt"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const ClaimsTab: React.FC<{
  claims: InsuranceClaim[];
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
  onView: (claim: InsuranceClaim) => void;
  onSubmit: (claim: InsuranceClaim) => void;
  pagination: {
    page: number;
    setPage: (page: number | ((prev: number) => number)) => void;
    totalPages: number;
    totalClaims: number;
    startIndex: number;
    endIndex: number;
  };
}> = ({ claims, getStatusColor, getStatusIcon, onView, onSubmit, pagination }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/20">
          <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Provider</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Claim Amount</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Approved</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
        </tr>
      </thead>
      <tbody>
        {claims.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
              No insurance claims found
            </td>
          </tr>
        ) : (
          claims.map((claim) => (
            <tr key={claim.id} className="border-b border-white/10 hover:bg-white/10 transition-colors">
              <td className="py-4 px-4 font-medium text-gray-800">{claim.patient_name}</td>
              <td className="py-4 px-4 text-gray-700">{claim.insurance_provider}</td>
              <td className="py-4 px-4 text-gray-700">KES {claim.claim_amount.toLocaleString()}</td>
              <td className="py-4 px-4 text-gray-700">
                {claim.approved_amount ? `${claim.approved_amount.toLocaleString()}` : '-'}
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(claim.status)}`}>
                  {getStatusIcon(claim.status)}
                  {claim.status}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(claim)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="View Claim Details"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => onSubmit(claim)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Submit Claim"
                  >
                    <Send className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    {/* Pagination Footer */}
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3 px-4">
      {/* Left: Info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{pagination.startIndex + 1}</span>–
        <span className="font-medium">{Math.min(pagination.endIndex, pagination.totalClaims)}</span> of{" "}
        <span className="font-medium">{pagination.totalClaims}</span> claims
      </div>

      {/* Right: Page Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => pagination.setPage((prev: number) => Math.max(prev - 1, 1))}
          disabled={pagination.page === 1}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-1 transition-all ${pagination.page === 1
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
        >
          ◀ Prev
        </button>

        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => pagination.setPage(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${pagination.page === p
              ? "bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => pagination.setPage((prev: number) => Math.min(prev + 1, pagination.totalPages))}
          disabled={pagination.page === pagination.totalPages}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-1 transition-all ${pagination.page === pagination.totalPages
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
        >
          Next ▶
        </button>
      </div>
    </div>
  </div>
);


// Modal Component
// Enhanced Modal Component with Patient Search
const Modal: React.FC<{
  type: 'payment' | 'claim' | 'invoice' | 'view';
  selectedItem?: Invoice | Payment | InsuranceClaim | null;
  onClose: () => void;
  patientSearch: string;
  setPatientSearch: (search: string) => void;
  selectedPatient: PatientWithInsurance | null;
  setSelectedPatient: (patient: PatientWithInsurance | null) => void;
  showPatientDropdown: boolean;
  setShowPatientDropdown: (show: boolean) => void;
  filteredPatients: PatientWithInsurance[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}> = ({
  type,
  selectedItem,
  onClose,
  patientSearch,
  setPatientSearch,
  selectedPatient,
  setSelectedPatient,
  showPatientDropdown,
  setShowPatientDropdown,
  filteredPatients,
  isLoading,
  setIsLoading
}) => {
    const [formData, setFormData] = useState({
      amount: '',
      description: '',
      paymentMethod: 'cash',
      claimType: 'medical',
      notes: ''
    });

    const getModalTitle = () => {
      switch (type) {
        case 'payment': return selectedItem ? 'Edit Payment' : 'Record New Payment';
        case 'claim': return selectedItem ? 'Edit Insurance Claim' : 'Submit New Insurance Claim';
        case 'invoice': return selectedItem ? 'Edit Invoice' : 'Create New Invoice';
        case 'view': return 'View Details';
        default: return 'Modal';
      }
    };

    const getModalIcon = () => {
      switch (type) {
        case 'payment': return <CreditCard className="w-6 h-6 text-blue-600" />;
        case 'claim': return <Shield className="w-6 h-6 text-teal-600" />;
        case 'invoice': return <Receipt className="w-6 h-6 text-purple-600" />;
        case 'view': return <Eye className="w-6 h-6 text-gray-600" />;
        default: return <FileText className="w-6 h-6 text-gray-600" />;
      }
    };

    const handlePatientSelect = (patient: PatientWithInsurance) => {
      setSelectedPatient(patient);
      setPatientSearch(patient.name);
      setShowPatientDropdown(false);
    };

    const handleSubmit = async () => {
      if (!selectedPatient && type !== 'view') {
        alert('Please select a patient with insurance');
        return;
      }

      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        alert(`${getModalTitle()} completed successfully!`);
        onClose();
      }, 2000);
    };

    if (type === 'view' && selectedItem) {
      return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getModalIcon()}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{getModalTitle()}</h3>
                    <p className="text-gray-600">#{selectedItem.id}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Info */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Patient Information</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900 font-medium">{selectedItem.patient_name}</p>
                    </div>
                    {'insurance_provider' in selectedItem && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Insurance Provider</label>
                        <p className="text-gray-900">{selectedItem.insurance_provider}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Info */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-800">Financial Details</h4>
                  </div>
                  <div className="space-y-3">
                    {'amount' in selectedItem && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Amount</label>
                        <p className="text-2xl font-bold text-green-600">KES {selectedItem.amount.toLocaleString()}</p>
                      </div>
                    )}
                    {'claim_amount' in selectedItem && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Claim Amount</label>
                        <p className="text-2xl font-bold text-green-600">KES {selectedItem.claim_amount.toLocaleString()}</p>
                      </div>
                    )}
                    {'method' in selectedItem && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Payment Method</label>
                        <p className="text-gray-900 capitalize">{selectedItem.method}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Dates */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-800">Status & Timeline</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${selectedItem.status === 'paid' || selectedItem.status === 'completed' || selectedItem.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : selectedItem.status === 'pending' || selectedItem.status === 'submitted'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    {'date' in selectedItem && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Date</label>
                        <p className="text-gray-900">{selectedItem.date}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-800">Additional Information</h4>
                  </div>
                  <div className="space-y-3">
                    {'policy_number' in selectedItem && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Policy Number</label>
                        <p className="text-gray-900 font-mono">{selectedItem.policy_number}</p>
                      </div>
                    )}
                    {'due_date' in selectedItem && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Due Date</label>
                        <p className="text-gray-900">{selectedItem.due_date}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getModalIcon()}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{getModalTitle()}</h3>
                  <p className="text-gray-600">Fill in the details below</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              {/* Patient Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <User className="w-4 h-4 inline mr-2" />
                  Select Patient with Insurance
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                      placeholder="Search patients by name, insurance provider, or policy number..."
                    />
                    {selectedPatient && (
                      <button
                        onClick={() => {
                          setSelectedPatient(null);
                          setPatientSearch('');
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Patient Dropdown */}
                  {showPatientDropdown && patientSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-10 max-h-80 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <button
                            key={patient.id}
                            onClick={() => handlePatientSelect(patient)}
                            className="w-full p-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {patient.name.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-gray-800">{patient.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {patient.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {patient.insurance_provider}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    {patient.policy_number}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {patient.phone}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    Coverage: KES {patient.coverage_amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No patients found with insurance coverage</p>
                          <p className="text-sm mt-1">Try searching with different keywords</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Patient Info */}
                {selectedPatient && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {selectedPatient.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg">{selectedPatient.name}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                          <div>
                            <span className="text-gray-600">Insurance:</span>
                            <span className="ml-2 font-medium text-blue-700">{selectedPatient.insurance_provider}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Policy:</span>
                            <span className="ml-2 font-mono text-gray-800">{selectedPatient.policy_number}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Coverage:</span>
                            <span className="ml-2 font-medium text-green-600">KES {selectedPatient.coverage_amount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Deductible:</span>
                            <span className="ml-2 font-medium text-orange-600">KES {selectedPatient.deductible.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="0.00"
                  />
                </div>

                {/* Payment Method / Claim Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {type === 'payment' ? (
                      <>
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Payment Method
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 inline mr-2" />
                        Claim Type
                      </>
                    )}
                  </label>
                  <div className="relative">
                    <select
                      value={type === 'payment' ? formData.paymentMethod : formData.claimType}
                      onChange={(e) => setFormData({
                        ...formData,
                        [type === 'payment' ? 'paymentMethod' : 'claimType']: e.target.value
                      })}
                      className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                    >
                      {type === 'payment' ? (
                        <>
                          <option value="cash">Cash</option>
                          <option value="card">Credit/Debit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="mobile_money">Mobile Money</option>
                          <option value="insurance">Insurance</option>
                        </>
                      ) : (
                        <>
                          <option value="medical">Medical Treatment</option>
                          <option value="emergency">Emergency Care</option>
                          <option value="surgery">Surgery</option>
                          <option value="medication">Medication</option>
                          <option value="diagnostic">Diagnostic Tests</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder={`Enter ${type} description...`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Edit className="w-4 h-4 inline mr-2" />
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                  placeholder="Add any additional notes or comments..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white text-gray-700 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedPatient || isLoading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-2xl hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {type === 'payment' ? 'Record Payment' : type === 'claim' ? 'Submit Claim' : 'Create Invoice'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default Insurance;
