import React, { useState, useEffect } from 'react';

interface BillingItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  item_type: string;
  status: string;
}

interface BillingSummaryProps {
  appointmentId: number;
  isConsultationCompleted: boolean;
}

interface BillingSummary {
  account_exists: boolean;
  account_no?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status?: string;
  items_count: number;
  items?: BillingItem[];
}

export default function BillingSummary({ appointmentId, isConsultationCompleted }: BillingSummaryProps) {
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchBillingSummary = async () => {
    if (!isConsultationCompleted) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/opd/appointments/${appointmentId}/billing-summary`);
      if (response.ok) {
        const data = await response.json();
        setBillingSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch billing summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingSummary();
  }, [appointmentId, isConsultationCompleted]);

  if (!isConsultationCompleted) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 text-lg">💰</span>
          <div>
            <h3 className="font-medium text-blue-900">Billing Information</h3>
            <p className="text-sm text-blue-700">
              Billing charges will be generated when the consultation is completed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading billing information...</span>
        </div>
      </div>
    );
  }

  if (!billingSummary?.account_exists) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <div>
            <h3 className="font-medium text-yellow-900">No Billing Account</h3>
            <p className="text-sm text-yellow-700">
              No billing account found for this consultation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">💰</span>
            <h3 className="font-semibold text-gray-900">Billing Summary</h3>
            {billingSummary.account_no && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {billingSummary.account_no}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total Amount
            </label>
            <p className="text-lg font-semibold text-gray-900">
              KES {billingSummary.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Amount Paid
            </label>
            <p className="text-lg font-semibold text-green-600">
              KES {billingSummary.amount_paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Balance Due
            </label>
            <p className={`text-lg font-semibold ${billingSummary.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              KES {billingSummary.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Items
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {billingSummary.items_count}
            </p>
          </div>
        </div>

        {showDetails && billingSummary.items && billingSummary.items.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Billing Items</h4>
            <div className="space-y-2">
              {billingSummary.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × KES {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {item.item_type}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      KES {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs ${item.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {billingSummary.balance > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">
              <strong>Payment Required:</strong> This consultation has an outstanding balance of KES {billingSummary.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}