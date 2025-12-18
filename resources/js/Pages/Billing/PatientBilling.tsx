import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { 
  Search, 
  User, 
  FileText, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Eye,
  Plus,
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
}

interface BillingAccount {
  id: number;
  account_no: string;
  patient_id: string;
  encounter_id: number;
  status: 'open' | 'closed';
  total_amount: number;
  amount_paid: number;
  balance: number;
  created_at: string;
  updated_at: string;
  patient: Patient;
}

interface PatientBillingProps {
  billingAccounts: BillingAccount[];
  patients: Patient[];
  auth: any;
}

export default function PatientBilling({ billingAccounts, patients, auth }: PatientBillingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedPatient, setSelectedPatient] = useState<BillingAccount | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  // Filter billing accounts based on search and status
  const filteredAccounts = billingAccounts.filter(account => {
    const matchesSearch = searchTerm === '' || 
      account.patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.patient_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewBilling = (account: BillingAccount) => {
    router.visit(`/billing/encounters/${account.encounter_id}`);
  };

  const handleCreateNewBilling = (patientId: string) => {
    // This would typically create a new encounter and billing account
    router.post('/billing/create-account', { patient_id: patientId });
  };

  const getStatusColor = (status: string) => {
    return status === 'open' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800';
  };

  const getBalanceColor = (balance: number) => {
    return balance > 0 ? 'text-red-600' : 'text-green-600';
  };

  return (
    <HMSLayout user={auth.user}>
      <Head title="Patient Billing" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Patient Billing Management</h1>
                <p className="text-gray-600 mt-1">Manage patient billing accounts and view payment details</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPatientSearch(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Billing Account
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by patient name, account number, or patient ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Patient List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Active Patients ({filteredAccounts.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {filteredAccounts.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl mb-4">👥</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm ? 'Try adjusting your search criteria' : 'No billing accounts match your current filters'}
                      </p>
                      <button
                        onClick={() => setShowPatientSearch(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create New Billing Account
                      </button>
                    </div>
                  ) : (
                    filteredAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedPatient?.id === account.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedPatient(account)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {account.patient.first_name} {account.patient.last_name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>ID: {account.patient_id}</span>
                                <span>Account: {account.account_no}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                                  {account.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              KSh {new Intl.NumberFormat().format(account.total_amount)}
                            </div>
                            <div className={`text-sm font-medium ${getBalanceColor(account.balance)}`}>
                              Balance: KSh {new Intl.NumberFormat().format(account.balance)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(account.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Patient Details Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                {selectedPatient ? (
                  <>
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Patient Details</h3>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Patient Info */}
                      <div>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">
                              {selectedPatient.patient.first_name} {selectedPatient.patient.last_name}
                            </h4>
                            <p className="text-gray-600">Patient ID: {selectedPatient.patient_id}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{selectedPatient.patient.phone}</span>
                          </div>
                          {selectedPatient.patient.email && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Email:</span>
                              <span className="font-medium">{selectedPatient.patient.email}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">DOB:</span>
                            <span className="font-medium">
                              {new Date(selectedPatient.patient.date_of_birth).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Billing Summary */}
                      <div className="border-t pt-6">
                        <h5 className="font-semibold text-gray-900 mb-4">Billing Summary</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account No:</span>
                            <span className="font-medium font-mono">{selectedPatient.account_no}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-medium">KSh {new Intl.NumberFormat().format(selectedPatient.total_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount Paid:</span>
                            <span className="font-medium text-green-600">KSh {new Intl.NumberFormat().format(selectedPatient.amount_paid)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-3">
                            <span className="text-gray-600">Balance:</span>
                            <span className={`font-semibold ${getBalanceColor(selectedPatient.balance)}`}>
                              KSh {new Intl.NumberFormat().format(selectedPatient.balance)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t pt-6 space-y-3">
                        <button
                          onClick={() => handleViewBilling(selectedPatient)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Full Billing Details
                        </button>
                        
                        {selectedPatient.balance > 0 && (
                          <button
                            onClick={() => router.visit(`/billing/encounters/${selectedPatient.encounter_id}#payment`)}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CreditCard className="h-4 w-4" />
                            Process Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <div className="text-6xl mb-4">👆</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a patient</h3>
                    <p className="text-gray-600">
                      Choose a patient from the list to view their billing details and manage payments.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Search Modal */}
          {showPatientSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Create New Billing Account</h3>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search patients by name or ID..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        handleCreateNewBilling(patient.id);
                        setShowPatientSearch(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                          <p className="text-sm text-gray-600">ID: {patient.id} • {patient.phone}</p>
                        </div>
                        <Plus className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-4 mt-4 border-t">
                  <button
                    onClick={() => setShowPatientSearch(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
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
