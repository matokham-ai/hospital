import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Shield,
  Calculator,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  FileText,
  Calendar,
  Receipt
} from 'lucide-react';

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

interface Payment {
  id: number;
  amount: number;
  method: string;
  reference_no: string;
  created_at: string;
}

interface PremiumPaymentInterfaceProps {
  invoice: Invoice;
  payments: Payment[];
  onClose: () => void;
}

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { id: 'bank', label: 'Bank Transfer', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
];

export default function PremiumPaymentInterface({ invoice, payments, onClose }: PremiumPaymentInterfaceProps) {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [amount, setAmount] = useState(invoice.balance.toString());
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const selectedMethodConfig = paymentMethods.find(m => m.id === selectedMethod);
  const SelectedIcon = selectedMethodConfig?.icon || CreditCard;

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setAmount(numericValue);
    
    // Clear amount error when user starts typing
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: null }));
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (invoice.balance * percentage / 100).toFixed(2);
    setAmount(quickAmount);
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount > invoice.balance) {
      newErrors.amount = 'Amount cannot exceed the balance due';
    }
    
    if (!referenceNo.trim()) {
      newErrors.referenceNo = 'Reference number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await router.post('/payments', {
        invoice_id: invoice.id,
        amount: parseFloat(amount),
        method: selectedMethod,
        reference_no: referenceNo,
        notes: notes,
        payment_date: new Date().toISOString().split('T')[0],
      }, {
        onSuccess: () => {
          onClose();
          // Refresh the page to show updated payment status
          window.location.reload();
        },
        onError: (errors) => {
          setErrors(errors);
        },
        onFinish: () => {
          setIsProcessing(false);
        }
      });
    } catch (error) {
      console.error('Payment submission error:', error);
      setIsProcessing(false);
    }
  };

  const generateReferenceNo = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const methodPrefix = selectedMethod.toUpperCase().substring(0, 3);
    setReferenceNo(`${methodPrefix}${timestamp}${random}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
              <p className="text-sm text-gray-500">Invoice #{invoice.id} - {invoice.patient_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Invoice Summary */}
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {invoice.patient_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{invoice.patient_name}</h4>
                    <p className="text-sm text-gray-600">{invoice.encounter_type} Visit</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{invoice.encounter_number}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{invoice.phone}</span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-gray-600" />
                  Payment Summary
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                  
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Balance Due:</span>
                      <span className="font-bold text-red-600 text-lg">{formatCurrency(invoice.balance)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Payment Progress</span>
                    <span>{((invoice.paid_amount / invoice.total_amount) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(invoice.paid_amount / invoice.total_amount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Previous Payments */}
              {payments.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-gray-600" />
                    Previous Payments
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">
                          {payment.method} - {new Date(payment.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Payment Form */}
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedMethod === method.id;
                      
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethod(method.id)}
                          className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `${method.border} ${method.bg} border-2`
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-white' : method.bg}`}>
                            <Icon className={`h-5 w-5 ${method.color}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className={`font-medium ${isSelected ? method.color : 'text-gray-900'}`}>
                              {method.label}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className={`h-5 w-5 ${method.color}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium ${
                        errors.amount ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.amount}
                    </p>
                  )}
                  
                  {/* Quick Amount Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(25)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(50)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(100)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Full Amount
                    </button>
                  </div>
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder="Enter reference number"
                      className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.referenceNo ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={generateReferenceNo}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                  {errors.referenceNo && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.referenceNo}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <SelectedIcon className="h-4 w-4" />
                        <span>Record Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
