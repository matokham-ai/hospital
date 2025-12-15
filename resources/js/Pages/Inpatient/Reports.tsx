import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface Ward {
    id: number;
    name: string;
}

interface Props {
    wards: Ward[];
    currentDate: string;
}

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color, trend }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`text-4xl ${color.replace('border-l-', 'text-')}`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
            </div>
        )}
    </div>
);

export default function Reports({ wards, currentDate }: Props) {
    const [dateRange, setDateRange] = useState({
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: currentDate,
    });
    const [selectedWard, setSelectedWard] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('occupancy');

    // Data states
    const [occupancyData, setOccupancyData] = useState<any>(null);
    const [alosData, setAlosData] = useState<any>(null);
    const [flowData, setFlowData] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any>(null);

    // Fetch data based on filters
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                ...dateRange,
                ward_id: selectedWard || undefined,
            };

            const [occupancy, alos, flow, revenue] = await Promise.all([
                axios.get('/inpatient/api/reports/bed-occupancy', { params }),
                axios.get('/inpatient/api/reports/average-stay', { params }),
                axios.get('/inpatient/api/reports/patient-flow', { params }),
                axios.get('/inpatient/api/reports/revenue-analysis', { params }),
            ]);

            setOccupancyData(occupancy.data);
            setAlosData(alos.data);
            setFlowData(flow.data);
            setRevenueData(revenue.data);
        } catch (error) {
            console.error('Error fetching reports data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange, selectedWard]);

    // Chart configurations
    const occupancyChartData = {
        labels: occupancyData?.data?.map((d: any) => d.date) || [],
        datasets: [
            {
                label: 'Occupancy Rate (%)',
                data: occupancyData?.data?.map((d: any) => d.occupancy_rate) || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const flowChartData = {
        labels: flowData?.data?.map((d: any) => d.date) || [],
        datasets: [
            {
                label: 'Admissions',
                data: flowData?.data?.map((d: any) => d.admissions) || [],
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
            },
            {
                label: 'Discharges',
                data: flowData?.data?.map((d: any) => d.discharges) || [],
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
            },
        ],
    };
    const handleExport = async (format: 'pdf' | 'excel') => {
        try {
            const params = {
                type: activeTab, // dynamically export based on current report tab
                start_date: dateRange.start_date,
                end_date: dateRange.end_date,
                ward_id: selectedWard || undefined,
            };

            const endpoint =
                format === 'pdf'
                    ? '/inpatient/api/reports/export-pdf'
                    : '/inpatient/api/reports/export-excel';

            const response = await axios.post(endpoint, params, {
                responseType: 'blob', // Important for file downloads
            });

            // Create blob and trigger download
            const blob = new Blob([response.data], {
                type: format === 'pdf' ? 'application/pdf' : 'application/vnd.ms-excel',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `${activeTab}_report_${dateRange.start_date}_to_${dateRange.end_date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('⚠️ Failed to export report. Please try again.');
        }
    };

    return (
        <HMSLayout>
            <Head title="Inpatient Reports & Analytics" />

            {/* Header */}
            <div className="bg-white shadow-sm border-b px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">📊 Inpatient Reports & Analytics</h1>
                        <p className="text-gray-600 mt-1">Comprehensive insights into inpatient operations</p>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                        >
                            <span>📄</span>
                            <span>Export PDF</span>
                        </button>

                        <button
                            onClick={() => handleExport('excel')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                        >
                            <span>📊</span>
                            <span>Export Excel</span>
                        </button>
                    </div>

                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Filters & Date Range</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.start_date}
                                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={dateRange.end_date}
                                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
                            <select
                                value={selectedWard}
                                onChange={(e) => setSelectedWard(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Wards</option>
                                {wards.map((ward) => (
                                    <option key={ward.id} value={ward.id}>
                                        {ward.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                            >
                                {loading ? '🔄 Loading...' : '🔍 Apply Filters'}
                            </button>
                        </div>
                    </div>
                </div>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Current Bed Occupancy"
                        value={`${occupancyData?.summary?.current_occupancy || 0}%`}
                        subtitle={`${occupancyData?.summary?.available_beds || 0} beds available`}
                        icon="🏥"
                        color="border-l-blue-500"
                    />
                    <KPICard
                        title="Average Length of Stay"
                        value={`${alosData?.summary?.overall_alos || 0} days`}
                        subtitle={`${alosData?.summary?.total_discharges || 0} discharges`}
                        icon="⏱️"
                        color="border-l-green-500"
                    />
                    <KPICard
                        title="Daily Admissions"
                        value={flowData?.summary?.avg_daily_admissions || 0}
                        subtitle="Average per day"
                        icon="📥"
                        color="border-l-purple-500"
                    />
                    <KPICard
                        title="Total Revenue"
                        value={`KES ${(revenueData?.summary?.total_revenue || 0).toLocaleString('en-KE')}`}
                        subtitle="Current period"
                        icon="💰"
                        color="border-l-yellow-500"
                    />
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                { id: 'occupancy', label: '🏥 Bed Occupancy', icon: '📈' },
                                { id: 'alos', label: '⏱️ Length of Stay', icon: '📊' },
                                { id: 'flow', label: '🔄 Patient Flow', icon: '📋' },
                                { id: 'revenue', label: '💰 Revenue Analysis', icon: '💹' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="flex items-center space-x-2">
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-600 mt-4">Loading analytics data...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Bed Occupancy Tab */}
                                {activeTab === 'occupancy' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Occupancy Trend</h3>
                                                <div className="h-80">
                                                    <Line
                                                        data={occupancyChartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: { position: 'top' as const },
                                                                title: { display: true, text: 'Bed Occupancy Rate Over Time' },
                                                            },
                                                            scales: {
                                                                y: { beginAtZero: true, max: 100 },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <h4 className="font-semibold text-blue-900">📊 Occupancy Summary</h4>
                                                    <div className="mt-3 space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700">Current Rate:</span>
                                                            <span className="font-semibold text-blue-900">{occupancyData?.summary?.current_occupancy}%</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700">Average Rate:</span>
                                                            <span className="font-semibold text-blue-900">{occupancyData?.summary?.avg_occupancy}%</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700">Total Beds:</span>
                                                            <span className="font-semibold text-blue-900">{occupancyData?.summary?.total_beds}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-blue-700">Available:</span>
                                                            <span className="font-semibold text-blue-900">{occupancyData?.summary?.available_beds}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Average Length of Stay Tab */}
                                {activeTab === 'alos' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-green-50 rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-green-900 mb-4">⏱️ ALOS Metrics</h3>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-green-700">Overall ALOS:</span>
                                                        <span className="text-2xl font-bold text-green-900">{alosData?.summary?.overall_alos} days</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-green-700">Median Stay:</span>
                                                        <span className="font-semibold text-green-900">{alosData?.summary?.median_stay} days</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-green-700">Shortest Stay:</span>
                                                        <span className="font-semibold text-green-900">{alosData?.summary?.min_stay} days</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-green-700">Longest Stay:</span>
                                                        <span className="font-semibold text-green-900">{alosData?.summary?.max_stay} days</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-green-700">Total Discharges:</span>
                                                        <span className="font-semibold text-green-900">{alosData?.summary?.total_discharges}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white border rounded-lg p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">📋 ALOS Insights</h4>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex items-start space-x-2">
                                                        <span className="text-green-500">✓</span>
                                                        <span>Efficient patient turnover indicates good care coordination</span>
                                                    </div>
                                                    <div className="flex items-start space-x-2">
                                                        <span className="text-blue-500">ℹ</span>
                                                        <span>ALOS varies by medical specialty and patient complexity</span>
                                                    </div>
                                                    <div className="flex items-start space-x-2">
                                                        <span className="text-yellow-500">⚠</span>
                                                        <span>Monitor trends to identify potential bottlenecks</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Patient Flow Tab */}
                                {activeTab === 'flow' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 Daily Patient Flow</h3>
                                                <div className="h-80">
                                                    <Bar
                                                        data={flowChartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: { position: 'top' as const },
                                                                title: { display: true, text: 'Admissions vs Discharges' },
                                                            },
                                                            scales: {
                                                                y: { beginAtZero: true },
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="bg-purple-50 rounded-lg p-4">
                                                    <h4 className="font-semibold text-purple-900">📊 Flow Summary</h4>
                                                    <div className="mt-3 space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-purple-700">Total Admissions:</span>
                                                            <span className="font-semibold text-purple-900">{flowData?.summary?.total_admissions}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-purple-700">Total Discharges:</span>
                                                            <span className="font-semibold text-purple-900">{flowData?.summary?.total_discharges}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-purple-700">Net Flow:</span>
                                                            <span className={`font-semibold ${flowData?.summary?.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {flowData?.summary?.net_flow >= 0 ? '+' : ''}{flowData?.summary?.net_flow}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-purple-700">Avg Daily Admissions:</span>
                                                            <span className="font-semibold text-purple-900">{flowData?.summary?.avg_daily_admissions}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Revenue Analysis Tab */}
                                {activeTab === 'revenue' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-yellow-50 rounded-lg p-6">
                                                <h3 className="text-lg font-semibold text-yellow-900 mb-4">💰 Revenue Summary</h3>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-yellow-700">Total Revenue:</span>
                                                        <span className="text-2xl font-bold text-yellow-900">
                                                            KES {(revenueData?.summary?.total_revenue || 0).toLocaleString('en-KE')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-yellow-700">Avg Daily Revenue:</span>
                                                        <span className="font-semibold text-yellow-900">
                                                            KES {(revenueData?.summary?.avg_daily_revenue || 0).toLocaleString('en-KE')}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-yellow-700">Items Billed:</span>
                                                        <span className="font-semibold text-yellow-900">{revenueData?.summary?.total_items_billed}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-yellow-700">Patients Billed:</span>
                                                        <span className="font-semibold text-yellow-900">{revenueData?.summary?.patients_with_bills}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-white border rounded-lg p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">📊 Revenue by Category</h4>
                                                <div className="space-y-3">
                                                    {revenueData?.revenue_by_category?.map((category: any, index: number) => (
                                                        <div key={index} className="flex justify-between items-center">
                                                            <span className="text-gray-700">{category.item_type}:</span>
                                                            <span className="font-semibold text-gray-900">
                                                                KES {parseFloat(category.total_revenue).toLocaleString('en-KE')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}