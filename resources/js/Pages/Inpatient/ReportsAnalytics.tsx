import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';

interface AnalyticsData {
  occupancyRate: number;
  averageLengthOfStay: number;
  totalAdmissions: number;
  totalDischarges: number;
  revenue: number;
  commonDiagnoses: Array<{
    diagnosis: string;
    count: number;
    percentage: number;
  }>;
  wardOccupancy: Array<{
    ward: string;
    occupied: number;
    total: number;
    rate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    admissions: number;
    discharges: number;
    revenue: number;
  }>;
}

interface Props {
  analytics: AnalyticsData;
}

export default function ReportsAnalytics({ analytics }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('overview');

  const exportToPDF = () => {
    console.log('Exporting to PDF...');
  };

  const exportToExcel = () => {
    console.log('Exporting to Excel...');
  };

  return (
    <HMSLayout>
      <Head title="Reports & Analytics" />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-6 py-4 bg-white border-b">
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Reports & Analytics
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <div className="flex space-x-2">
            <button
              onClick={exportToPDF}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              📄 PDF
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              📊 Excel
            </button>
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.occupancyRate}%
              </div>
              <div className="text-gray-600">Occupancy Rate</div>
              <div className="text-sm text-green-600 mt-1">↑ 5% from last month</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.averageLengthOfStay}
              </div>
              <div className="text-gray-600">Avg Length of Stay</div>
              <div className="text-sm text-gray-500 mt-1">days</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-green-600">
                {analytics.totalAdmissions}
              </div>
              <div className="text-gray-600">Total Admissions</div>
              <div className="text-sm text-green-600 mt-1">↑ 12% from last month</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-600">
                {analytics.totalDischarges}
              </div>
              <div className="text-gray-600">Total Discharges</div>
              <div className="text-sm text-orange-600 mt-1">↑ 8% from last month</div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
              <div className="text-3xl font-bold text-emerald-600">
                ${analytics.revenue.toLocaleString()}
              </div>
              <div className="text-gray-600">Revenue</div>
              <div className="text-sm text-emerald-600 mt-1">↑ 15% from last month</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ward Occupancy */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Ward Occupancy</h3>
                <div className="space-y-4">
                  {analytics.wardOccupancy.map((ward, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{ward.ward}</span>
                        <span className="text-sm text-gray-600">
                          {ward.occupied}/{ward.total} ({ward.rate}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${ward.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Common Diagnoses */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Common Diagnoses</h3>
                <div className="space-y-3">
                  {analytics.commonDiagnoses.map((diagnosis, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium">{diagnosis.diagnosis}</div>
                        <div className="text-sm text-gray-600">{diagnosis.count} cases</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{diagnosis.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Discharges
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.monthlyTrends.map((trend, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trend.admissions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trend.discharges}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${trend.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            trend.admissions - trend.discharges > 0
                              ? 'bg-green-100 text-green-800'
                              : trend.admissions - trend.discharges < 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {trend.admissions - trend.discharges > 0 ? '+' : ''}
                            {trend.admissions - trend.discharges}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Report Templates */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">Daily Census Report</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Current patient census by ward
                  </div>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">Discharge Summary</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Patients discharged in selected period
                  </div>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">Financial Summary</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Revenue and billing analytics
                  </div>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">Length of Stay Analysis</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Average LOS by diagnosis
                  </div>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">Readmission Report</div>
                  <div className="text-sm text-gray-600 mt-1">
                    30-day readmission rates
                  </div>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">Quality Metrics</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Patient satisfaction and outcomes
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
