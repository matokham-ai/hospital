import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Receipt,
  Banknote,
  Shield,
  TrendingUp,
  BarChart3,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  User,
  CreditCard,
  Calendar
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

interface KPI {
  value: number;
  label: string;
  format: string;
  icon: string;
  color: string;
  subValue?: number;
  subFormat?: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  deposits: number;
}

interface PaymentMethod {
  method: string;
  total: number;
  count: number;
}

interface Transaction {
  id: number;
  patient_id: number;
  invoice_id: number;
  patient_name: string;
  amount: number;
  method: string;
  received_by: string;
  reference_no: string;
  created_at: string;
}

interface Bill {
  id: number;
  account_no: string;
  patient_id: number;
  patient_name: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  created_at: string;
}

interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface InsuranceClaims {
  total_claims: number;
  total_value: number;
  by_status: Array<{
    status: string;
    count: number;
  }>;
}

interface CashierActivity {
  cashier_name: string;
  transaction_count: number;
  total_collected: number;
  avg_transaction: number;
  first_transaction: string;
  last_transaction: string;
  working_hours: number;
}

interface DashboardProps {
  kpis: Record<string, KPI>;
  revenueChart: RevenueData[];
  paymentMethods: PaymentMethod[];
  recentTransactions: PaginatedData<Transaction>;
  outstandingBills: PaginatedData<Bill>;
  insuranceClaims: InsuranceClaims;
  cashierActivity: CashierActivity[];
}

const iconMap: Record<string, any> = {
  CurrencyDollarIcon: DollarSign,
  DocumentTextIcon: FileText,
  ExclamationTriangleIcon: AlertTriangle,
  ReceiptPercentIcon: Receipt,
  BanknotesIcon: Banknote,
  ShieldCheckIcon: Shield,
  TrendingUpIcon: TrendingUp,
  ChartBarIcon: BarChart3,
  ClockIcon: Clock,
  UserGroupIcon: Users
};

const colorMap: Record<string, string> = {
  green: 'bg-gradient-to-r from-green-500 to-emerald-400',
  blue: 'bg-gradient-to-r from-blue-500 to-sky-400',
  red: 'bg-gradient-to-r from-red-500 to-rose-400',
  purple: 'bg-gradient-to-r from-purple-500 to-indigo-400',
  teal: 'bg-gradient-to-r from-teal-500 to-cyan-400',
  yellow: 'bg-gradient-to-r from-yellow-500 to-amber-400',
  gray: 'bg-gradient-to-r from-gray-500 to-gray-400'
};

// --- KPI Card ---
function KPICard({ kpi }: { kpi: KPI }) {
  const Icon = iconMap[kpi.icon] || BarChart3;
  const bgColor = colorMap[kpi.color] || 'bg-gradient-to-r from-gray-400 to-gray-500';

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0
      }).format(value);
    }
    return new Intl.NumberFormat().format(value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatValue(kpi.value, kpi.format)}
          </p>
          {kpi.subValue && (
            <p className="text-sm text-gray-400">
              / {formatValue(kpi.subValue, kpi.subFormat || 'number')}
            </p>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-xl shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// --- Revenue Chart ---
// --- Revenue Chart ---
function RevenueChart({ data }: { data: RevenueData[] }) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        tension: 0.3,
        fill: true,
        borderWidth: 2,
      },
      {
        label: 'Deposits',
        data: data.map(item => item.deposits),
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.08)',
        tension: 0.3,
        fill: true,
        borderWidth: 2,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#374151', usePointStyle: true, boxWidth: 10, font: { size: 11 } },
      },
      title: {
        display: true,
        text: 'Revenue Trend (Last 30 Days)',
        color: '#111827',
        font: { size: 14, weight: 'bold' as const },
        padding: { bottom: 10 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#6b7280',
          callback: (value: any) => 'KSh ' + new Intl.NumberFormat().format(value),
          font: { size: 10 },
        },
        grid: { color: '#f3f4f6' },
      },
      x: {
        ticks: { color: '#6b7280', font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
}

// --- Payment Methods Chart ---
function PaymentMethodsChart({ data }: { data: PaymentMethod[] }) {
  const total = data.reduce((sum, item) => sum + item.total, 0);

  const chartData = {
    labels: data.map(item => item.method),
    datasets: [
      {
        data: data.map(item => item.total),
        backgroundColor: ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 11 } } },
      title: {
        display: true,
        text: 'Payment Methods (Today)',
        color: '#111827',
        font: { size: 14, weight: 'bold' as const },
        padding: { bottom: 10 },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: KSh ${new Intl.NumberFormat().format(context.parsed)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-[300px] flex items-center justify-center">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}


// --- Modal Component ---
function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Transaction Details Modal Content ---
function TransactionDetails({ transaction }: { transaction: Transaction }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Patient Name</p>
              <p className="font-medium text-gray-900">{transaction.patient_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="font-medium text-gray-900">
                KSh {new Intl.NumberFormat().format(transaction.amount)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium text-gray-900">{transaction.method}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Reference Number</p>
              <p className="font-medium text-gray-900 font-mono text-sm">{transaction.reference_no}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-500">Transaction Date</p>
              <p className="font-medium text-gray-900">
                {new Date(transaction.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-teal-600" />
            <div>
              <p className="text-sm text-gray-500">Received By</p>
              <p className="font-medium text-gray-900">{transaction.received_by}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Transaction Summary</h3>
        <p className="text-sm text-blue-700">
          Payment of <strong>KSh {new Intl.NumberFormat().format(transaction.amount)}</strong> 
          was received from <strong>{transaction.patient_name}</strong> via <strong>{transaction.method}</strong> 
          on {new Date(transaction.created_at).toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
}

// --- Bill Details Modal Content ---
function BillDetails({ bill }: { bill: Bill }) {
  const daysOutstanding = Math.round((new Date().getTime() - new Date(bill.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const paymentProgress = ((bill.total_amount - bill.balance) / bill.total_amount) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Patient Name</p>
              <p className="font-medium text-gray-900">{bill.patient_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-medium text-gray-900 font-mono">{bill.account_no}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-500">Bill Date</p>
              <p className="font-medium text-gray-900">
                {new Date(bill.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium text-gray-900">
                KSh {new Intl.NumberFormat().format(bill.total_amount)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="font-medium text-gray-900">
                KSh {new Intl.NumberFormat().format(bill.amount_paid)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p className="font-medium text-red-600">
                KSh {new Intl.NumberFormat().format(bill.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Payment Progress</span>
          <span className="font-medium">{paymentProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${paymentProgress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="font-medium text-red-900 mb-2">Outstanding Bill Alert</h3>
        <p className="text-sm text-red-700">
          This bill has been outstanding for <strong>{daysOutstanding} days</strong>. 
          The remaining balance of <strong>KSh {new Intl.NumberFormat().format(bill.balance)}</strong> 
          needs to be collected from <strong>{bill.patient_name}</strong>.
        </p>
      </div>
    </div>
  );
}

// --- Pagination Component ---
function Pagination({ 
  currentPage, 
  lastPage, 
  total, 
  from, 
  to, 
  onPageChange 
}: {
  currentPage: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Showing {from} to {to} of {total} results
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <span className="px-3 py-1 text-sm font-medium text-gray-700">
          Page {currentPage} of {lastPage}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// --- Reusable Table Container ---
const TableCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

export default function BillingDashboard({
  kpis,
  revenueChart,
  paymentMethods,
  recentTransactions,
  outstandingBills,
  insuranceClaims,
  cashierActivity
}: DashboardProps) {
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleBillClick = (bill: Bill) => {
    setSelectedBill(bill);
  };

  const handleTransactionPageChange = (page: number) => {
    router.visit('/billing/dashboard', {
      data: { transactions_page: page },
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleBillPageChange = (page: number) => {
    router.visit('/billing/dashboard', {
      data: { bills_page: page },
      preserveState: true,
      preserveScroll: true,
    });
  };

  return (
    <HMSLayout>
      <Head title="Billing Dashboard" />

      {/* Transaction Details Modal */}
      <Modal
        isOpen={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Details"
      >
        {selectedTransaction && <TransactionDetails transaction={selectedTransaction} />}
      </Modal>

      {/* Bill Details Modal */}
      <Modal
        isOpen={selectedBill !== null}
        onClose={() => setSelectedBill(null)}
        title="Outstanding Bill Details"
      >
        {selectedBill && <BillDetails bill={selectedBill} />}
      </Modal>

      <div className="space-y-8 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(kpis).map((kpi, index) => (
            <KPICard key={index} kpi={kpi} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={revenueChart} />
          <PaymentMethodsChart data={paymentMethods} />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableCard title="Recent Transactions">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Patient</th>
                    <th className="px-6 py-3 text-left">Amount</th>
                    <th className="px-6 py-3 text-left">Method</th>
                    <th className="px-6 py-3 text-left">Reference</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <Receipt className="h-8 w-8 text-gray-300" />
                          <p>No recent transactions found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.data.map(t => (
                    <tr 
                      key={t.id} 
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => handleTransactionClick(t)}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{t.patient_name}</td>
                      <td className="px-6 py-3 text-gray-800">KSh {new Intl.NumberFormat().format(t.amount)}</td>
                      <td className="px-6 py-3 text-gray-700">{t.method}</td>
                      <td className="px-6 py-3 text-gray-700 font-mono text-xs">{t.reference_no}</td>
                      <td className="px-6 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransactionClick(t);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="View transaction details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={recentTransactions.current_page}
              lastPage={recentTransactions.last_page}
              total={recentTransactions.total}
              from={recentTransactions.from}
              to={recentTransactions.to}
              onPageChange={handleTransactionPageChange}
            />
          </TableCard>

          <TableCard title="Outstanding Bills">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Account No</th>
                    <th className="px-6 py-3 text-left">Patient</th>
                    <th className="px-6 py-3 text-left">Total</th>
                    <th className="px-6 py-3 text-left">Balance</th>
                    <th className="px-6 py-3 text-left">Days</th>
                    <th className="px-6 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {outstandingBills.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <AlertTriangle className="h-8 w-8 text-gray-300" />
                          <p>No outstanding bills found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    outstandingBills.data.map(bill => (
                    <tr 
                      key={bill.id} 
                      className="hover:bg-red-50 cursor-pointer transition-colors"
                      onClick={() => handleBillClick(bill)}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{bill.account_no}</td>
                      <td className="px-6 py-3 text-gray-800">{bill.patient_name}</td>
                      <td className="px-6 py-3 text-gray-800">
                        KSh {new Intl.NumberFormat().format(bill.total_amount)}
                      </td>
                      <td className="px-6 py-3 font-semibold text-red-600">
                        KSh {new Intl.NumberFormat().format(bill.balance)}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {Math.round((new Date().getTime() - new Date(bill.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                      </td>
                      <td className="px-6 py-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBillClick(bill);
                          }}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                          title="View bill details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={outstandingBills.current_page}
              lastPage={outstandingBills.last_page}
              total={outstandingBills.total}
              from={outstandingBills.from}
              to={outstandingBills.to}
              onPageChange={handleBillPageChange}
            />
          </TableCard>
        </div>

        {/* Insurance Claims */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏥 Insurance Claims Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-sky-600">{insuranceClaims.total_claims}</p>
              <p className="text-sm text-gray-500">Total Claims</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-600">
                KSh {new Intl.NumberFormat().format(insuranceClaims.total_value)}
              </p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
            <div className="space-y-1">
              {insuranceClaims.by_status.map((s, i) => (
                <p key={i} className="flex justify-between text-sm text-gray-600">
                  <span className="capitalize">{s.status}</span>
                  <span className="font-medium">{s.count} claims</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Cashier Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">👥 Cashier Performance (Today)</h3>
              <p className="text-sm text-gray-500 mt-1">Daily transaction summary by cashier</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Cashiers Active</p>
              <p className="text-2xl font-bold text-blue-600">{cashierActivity.length}</p>
            </div>
          </div>
          
          {cashierActivity.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No cashier activity recorded today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Cashier Name</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4" />
                        <span>Transactions</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Total Collected</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Avg per Transaction</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cashierActivity
                    .sort((a, b) => b.total_collected - a.total_collected)
                    .map((c, i) => {
                      const isTopPerformer = i === 0 && cashierActivity.length > 1;
                      const performanceScore = Math.min(100, (c.total_collected / Math.max(...cashierActivity.map(ca => ca.total_collected))) * 100);
                      
                      return (
                        <tr key={i} className={`hover:bg-blue-50 transition-colors ${isTopPerformer ? 'bg-green-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                isTopPerformer ? 'bg-green-500' : 'bg-blue-500'
                              }`}>
                                {c.cashier_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{c.cashier_name}</p>
                                {isTopPerformer && (
                                  <p className="text-xs text-green-600 font-medium">🏆 Top Performer</p>
                                )}
                                {c.first_transaction && (
                                  <p className="text-xs text-gray-400">
                                    {new Date(c.first_transaction).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(c.last_transaction).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl font-bold text-blue-600">{c.transaction_count}</span>
                              <span className="text-xs text-gray-500">txns</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-green-600">
                                KSh {new Intl.NumberFormat().format(c.total_collected)}
                              </span>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{((c.total_collected / cashierActivity.reduce((sum, ca) => sum + ca.total_collected, 0)) * 100).toFixed(1)}% of total</span>
                                {c.working_hours > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{Math.round(c.working_hours)}h active</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900">
                              KSh {new Intl.NumberFormat().format(c.avg_transaction)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${isTopPerformer ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${performanceScore}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{performanceScore.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              
              {/* Summary Stats */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-xl font-bold text-blue-600">
                    {cashierActivity.reduce((sum, c) => sum + c.transaction_count, 0)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Collected</p>
                  <p className="text-xl font-bold text-green-600">
                    KSh {new Intl.NumberFormat().format(cashierActivity.reduce((sum, c) => sum + c.total_collected, 0))}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Overall Average</p>
                  <p className="text-xl font-bold text-purple-600">
                    KSh {new Intl.NumberFormat().format(
                      cashierActivity.reduce((sum, c) => sum + c.total_collected, 0) / 
                      cashierActivity.reduce((sum, c) => sum + c.transaction_count, 0) || 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </HMSLayout>
  );
}
