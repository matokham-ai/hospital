import { Head, Link, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Banknote,
  Smartphone,
  Building2,
  Shield,
  Settings,
  X
} from 'lucide-react';
import PremiumPaymentInterface from '@/Components/Payment/PremiumPaymentInterface';

interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  method: string;
  reference_no: string;
  payment_date: string;
  notes?: string;
  status: string;
  created_at: string;
  invoice?: {
    id: number;
    patient_name: string;
    encounter_number: string;
  };
}

interface Invoice {
  id: number;
  patient_name: string;
  phone: string;
  email: string;
  encounter_number: string;
  encounter_type: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  discount: number;
  status: string;
}

interface PaymentsPageProps {
  payments: {
    data: Payment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats: {
    total_payments: number;
    total_amount: number;
    today_payments: number;
    today_amount: number;
    by_method: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
  };
  filters: {
    search?: string;
    method?: string;
    date_from?: string;
    date_to?: string;
  };
  invoices?: Invoice[];
}

const methodConfig = {
  cash: { label: 'Cash', icon: Banknote, color: 'text-green-600', bg: 'bg-green-100' },
  card: { label: 'Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
  mpesa: { label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  bank: { label: 'Bank Transfer', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
};

const statusConfig = {
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  reversed: { label: 'Reversed', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

export default function Payments({ payments, stats, filters, invoices = [] }: PaymentsPageProps) {
  const [showPaymentInterface, setShowPaymentInterface] = useState(false);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedMethod, setSelectedMethod] = useState(filters.method || '');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleSearch = () => {
    router.get('/payments', {
      search: searchTerm,
      method: selectedMethod,
      date_from: filters.date_from,
      date_to: filters.date_to,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleNewPayment = () => {
    if (invoices.length > 0) {
      setShowInvoiceSelection(true);
    } else {
      alert('No unpaid invoices found. Please create an invoice first.');
    }
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceSelection(false);
    setShowPaymentInterface(true);
  };

  const handleViewPayment = async (paymentId: number) => {
    setLoadingPayment(true);
    try {
      const response = await fetch(`/payments/${paymentId}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedPayment(data.payment);
        setShowPaymentDetails(true);
      } else {
        alert('Failed to load payment details');
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      alert('Error loading payment details');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleDownloadReceipt = (paymentId: number) => {
    window.open(`/payments/${paymentId}/receipt`, '_blank');
  };

  // Check for pre-selected invoice from URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice_id');
    
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id.toString() === invoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
        setShowPaymentInterface(true);
        // Clean up URL
        window.history.replaceState({}, document.title, '/payments');
      }
    }
  }, [invoices]);

  return (
    <HMSLayout>
      <Head title="Payments Management" />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600 mt-1">Manage and track all payment transactions</p>
          </div>
          <button
            onClick={handleNewPayment}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Payment Count */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700">Payment Transactions</p>
                </div>
                <p className="text-3xl font-bold text-blue-900">{stats.total_payments.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">📊 Total count (all time)</p>
              </div>
              <div className="w-14 h-14 bg-blue-200 rounded-xl flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-blue-700" />
              </div>
            </div>
          </div>

          {/* Total Revenue Amount */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700">Total Revenue</p>
                </div>
                <p className="text-3xl font-bold text-green-900">{formatCurrency(stats.total_amount)}</p>
                <p className="text-xs text-green-600 mt-1">💰 All payments received</p>
              </div>
              <div className="w-14 h-14 bg-green-200 rounded-xl flex items-center justify-center">
                <Banknote className="h-7 w-7 text-green-700" />
              </div>
            </div>
          </div>

          {/* Today's Transaction Count */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <p className="text-sm font-medium text-purple-700">Today's Transactions</p>
                </div>
                <p className="text-3xl font-bold text-purple-900">{stats.today_payments}</p>
                <p className="text-xs text-purple-600 mt-1">📅 {new Date().toLocaleDateString()} count</p>
              </div>
              <div className="w-14 h-14 bg-purple-200 rounded-xl flex items-center justify-center">
                <Clock className="h-7 w-7 text-purple-700" />
              </div>
            </div>
          </div>

          {/* Today's Revenue Amount */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-700">Today's Revenue</p>
                </div>
                <p className="text-3xl font-bold text-emerald-900">{formatCurrency(stats.today_amount)}</p>
                <p className="text-xs text-emerald-600 mt-1">💵 {new Date().toLocaleDateString()} total</p>
              </div>
              <div className="w-14 h-14 bg-emerald-200 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-emerald-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.by_method.map((method) => {
              const config = methodConfig[method.method as keyof typeof methodConfig];
              const Icon = config?.icon || CreditCard;
              
              return (
                <div key={method.method} className="text-center">
                  <div className={`w-12 h-12 ${config?.bg || 'bg-gray-100'} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`h-6 w-6 ${config?.color || 'text-gray-600'}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{config?.label || method.method}</p>
                  <p className="text-xs text-gray-500">{method.count} payments</p>
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(method.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by reference, patient..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                {Object.entries(methodConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => router.get('/payments', { ...filters, date_from: e.target.value }, { preserveState: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient/Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.data.map((payment) => {
                  const methodConf = methodConfig[payment.method as keyof typeof methodConfig];
                  const statusConf = statusConfig[payment.status as keyof typeof statusConfig];
                  const MethodIcon = methodConf?.icon || CreditCard;
                  const StatusIcon = statusConf?.icon || Clock;

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{payment.id}</div>
                          <div className="text-sm text-gray-500">{payment.reference_no}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.invoice?.patient_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Invoice #{payment.invoice_id} • {payment.invoice?.encounter_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${methodConf?.bg || 'bg-gray-100'}`}>
                            <MethodIcon className={`h-4 w-4 ${methodConf?.color || 'text-gray-600'}`} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {methodConf?.label || payment.method}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{new Date(payment.payment_date).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(payment.created_at).toLocaleTimeString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPayment(payment.id)}
                            disabled={loadingPayment}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(payment.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {payments.last_page > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((payments.current_page - 1) * payments.per_page) + 1} to{' '}
                  {Math.min(payments.current_page * payments.per_page, payments.total)} of{' '}
                  {payments.total} results
                </div>
                <div className="flex items-center space-x-2">
                  {payments.current_page > 1 && (
                    <button
                      onClick={() => router.get('/payments', { ...filters, page: payments.current_page - 1 })}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  {payments.current_page < payments.last_page && (
                    <button
                      onClick={() => router.get('/payments', { ...filters, page: payments.current_page + 1 })}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Selection Modal */}
        {showInvoiceSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Select Invoice for Payment</h3>
                <button
                  onClick={() => setShowInvoiceSelection(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                <div className="grid gap-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      onClick={() => handleInvoiceSelect(invoice)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {invoice.patient_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Invoice #{invoice.id} • {invoice.encounter_number} • {invoice.encounter_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(invoice.balance)}
                          </p>
                          <p className="text-sm text-gray-500">Balance Due</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {invoices.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No unpaid invoices found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Details Modal */}
        {showPaymentDetails && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                <button
                  onClick={() => {
                    setShowPaymentDetails(false);
                    setSelectedPayment(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment ID:</span>
                        <span className="font-medium">#{selectedPayment.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-medium">{selectedPayment.reference_no}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium capitalize">{selectedPayment.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date(selectedPayment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Patient & Invoice</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient:</span>
                        <span className="font-medium">{selectedPayment.patient_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Encounter:</span>
                        <span className="font-medium">{selectedPayment.encounter_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Invoice ID:</span>
                        <span className="font-medium">#{selectedPayment.invoice_id}</span>
                      </div>
                      {selectedPayment.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{selectedPayment.phone}</span>
                        </div>
                      )}
                      {selectedPayment.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{selectedPayment.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedPayment.notes && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedPayment.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleDownloadReceipt(selectedPayment.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Receipt</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentDetails(false);
                      setSelectedPayment(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Payment Interface */}
        {showPaymentInterface && selectedInvoice && (
          <PremiumPaymentInterface
            invoice={selectedInvoice}
            payments={[]} // We'll load payments for the specific invoice if needed
            onClose={() => {
              setShowPaymentInterface(false);
              setSelectedInvoice(null);
            }}
          />
        )}
      </div>
    </HMSLayout>
  );
}
