import React from 'react';

interface VitalReading {
  id: number;
  timestamp: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  recordedBy: string;
}

interface Props {
  vitals: VitalReading[];
  showChart?: boolean;
}

export default function VitalChart({ vitals, showChart = true }: Props) {
  // Get the latest vital signs
  const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'abnormal';
        return 'normal';
      case 'temperature':
        if (value < 97 || value > 99.5) return 'abnormal';
        return 'normal';
      case 'oxygenSaturation':
        if (value < 95) return 'abnormal';
        return 'normal';
      case 'bloodPressure':
        // Assuming systolic value is passed
        if (value < 90 || value > 140) return 'abnormal';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'normal' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    return status === 'normal' ? '✅' : '⚠️';
  };

  if (!latestVitals) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-6xl mb-4">📊</div>
        <p>No vital signs recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Latest Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
            <span className={getStatusColor(getVitalStatus('bloodPressure', latestVitals.bloodPressureSystolic))}>
              {getStatusIcon(getVitalStatus('bloodPressure', latestVitals.bloodPressureSystolic))}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
          </div>
          <div className="text-xs text-gray-500">mmHg</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Heart Rate</span>
            <span className={getStatusColor(getVitalStatus('heartRate', latestVitals.heartRate))}>
              {getStatusIcon(getVitalStatus('heartRate', latestVitals.heartRate))}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{latestVitals.heartRate}</div>
          <div className="text-xs text-gray-500">bpm</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Temperature</span>
            <span className={getStatusColor(getVitalStatus('temperature', latestVitals.temperature))}>
              {getStatusIcon(getVitalStatus('temperature', latestVitals.temperature))}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{latestVitals.temperature}°F</div>
          <div className="text-xs text-gray-500">Fahrenheit</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">SpO2</span>
            <span className={getStatusColor(getVitalStatus('oxygenSaturation', latestVitals.oxygenSaturation))}>
              {getStatusIcon(getVitalStatus('oxygenSaturation', latestVitals.oxygenSaturation))}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{latestVitals.oxygenSaturation}%</div>
          <div className="text-xs text-gray-500">Oxygen Saturation</div>
        </div>
      </div>

      {/* Chart Placeholder */}
      {showChart && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold mb-4">Vital Signs Trend (Last 24 Hours)</h4>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>Chart visualization would go here</p>
              <p className="text-sm">Integration with charting library needed</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Readings Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-semibold">Recent Vital Signs</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SpO2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vitals.slice(-10).reverse().map((vital) => (
                <tr key={vital.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vital.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStatusColor(getVitalStatus('bloodPressure', vital.bloodPressureSystolic))}>
                      {vital.bloodPressureSystolic}/{vital.bloodPressureDiastolic}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStatusColor(getVitalStatus('heartRate', vital.heartRate))}>
                      {vital.heartRate}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStatusColor(getVitalStatus('temperature', vital.temperature))}>
                      {vital.temperature}°F
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vital.respiratoryRate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={getStatusColor(getVitalStatus('oxygenSaturation', vital.oxygenSaturation))}>
                      {vital.oxygenSaturation}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vital.recordedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}