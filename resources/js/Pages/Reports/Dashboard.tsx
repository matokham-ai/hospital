import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { DatePickerWithRange } from '@/Components/ui/date-range-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Badge } from '@/Components/ui/badge';
import {
    Users, Bed, Clock, Pill, DollarSign, Activity,
    TrendingUp, TrendingDown, AlertTriangle, Download,
    Filter, RefreshCw, BarChart2
} from 'lucide-react';
import axios from 'axios';
import {
    ResponsiveContainer, CartesianGrid, XAxis, YAxis,
    Tooltip, Legend, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface Ward { id: number; name: string; }
interface Department { id: number; name: string; }
interface User { id: number; name: string; email: string; }
interface DateRange { from: Date; to?: Date; }

interface KPICardProps {
    title: string; value: string | number; change?: number;
    icon: React.ComponentType<any>; color?: string;
}

interface ReportData { summary: any;[key: string]: any; }

interface Props {
    auth: { user: User };
    wards: Ward[];
    departments: Department[];
    currentDate: string;
}

export default function ReportsDashboard({ auth, wards = [], departments = [], currentDate }: Props) {
    console.log('Reports Dashboard Props:', { auth, wards, departments, currentDate });
    
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
    });
    const [selectedWard, setSelectedWard] = useState<string>('all');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const urlParams = new URLSearchParams(window.location.search);
    const [activeTab, setActiveTab] = useState<string>(urlParams.get('tab') || 'census');

    const [patientCensus, setPatientCensus] = useState<ReportData | null>(null);
    const [bedOccupancy, setBedOccupancy] = useState<ReportData | null>(null);
    const [labTAT, setLabTAT] = useState<ReportData | null>(null);
    const [pharmacyData, setPharmacyData] = useState<ReportData | null>(null);
    const [revenueData, setRevenueData] = useState<ReportData | null>(null);
    const [diseaseStats, setDiseaseStats] = useState<ReportData | null>(null);

    useEffect(() => { loadReportData(); }, [dateRange, selectedWard, selectedDepartment]);

    const loadReportData = async () => {
        setLoading(true);
        setApiError(null);

        const params = {
            start_date: dateRange.from.toISOString().split('T')[0],
            end_date: (dateRange.to || dateRange.from).toISOString().split('T')[0],
            ward_id: selectedWard === 'all' ? undefined : selectedWard,
            department_id: selectedDepartment === 'all' ? undefined : selectedDepartment
        };

        try {
            const axiosConfig = {
                params,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            const [census, occupancy, tat, pharmacy, revenue, disease] = await Promise.allSettled([
                axios.get('/api/reports/patient-census', axiosConfig),
                axios.get('/api/reports/bed-occupancy', axiosConfig),
                axios.get('/api/reports/lab-tat', axiosConfig),
                axios.get('/api/reports/pharmacy-consumption', axiosConfig),
                axios.get('/api/reports/revenue-department', axiosConfig),
                axios.get('/api/reports/disease-statistics', axiosConfig)
            ]);

            setPatientCensus(census.status === 'fulfilled' ? census.value.data : null);
            setBedOccupancy(occupancy.status === 'fulfilled' ? occupancy.value.data : null);
            setLabTAT(tat.status === 'fulfilled' ? tat.value.data : null);
            setPharmacyData(pharmacy.status === 'fulfilled' ? pharmacy.value.data : null);
            setRevenueData(revenue.status === 'fulfilled' ? revenue.value.data : null);
            setDiseaseStats(disease.status === 'fulfilled' ? disease.value.data : null);

            const failedApis = [];
            if (census.status === 'rejected') failedApis.push('Patient Census');
            if (occupancy.status === 'rejected') failedApis.push('Bed Occupancy');
            if (tat.status === 'rejected') failedApis.push('Lab TAT');
            if (pharmacy.status === 'rejected') failedApis.push('Pharmacy');
            if (revenue.status === 'rejected') failedApis.push('Revenue');
            if (disease.status === 'rejected') failedApis.push('Disease Stats');

            if (failedApis.length > 0) {
                console.warn('Failed to load data for:', failedApis.join(', '));
                setApiError(`Some report sections could not be loaded: ${failedApis.join(', ')}.`);
            }
        } catch (error: any) {
            console.error('Error loading reports:', error);
            setApiError('Some report sections could not be loaded. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (type: string, format: string) => {
        const params = {
            type,
            format,
            start_date: dateRange.from.toISOString().split('T')[0],
            end_date: (dateRange.to || dateRange.from).toISOString().split('T')[0],
            ward_id: selectedWard === 'all' ? undefined : selectedWard,
            department_id: selectedDepartment === 'all' ? undefined : selectedDepartment
        };

        const response = await axios.get(`/api/reports/export-${format}`, {
            params,
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `hms_report_${type}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const LoadingSkeleton = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-gray-200 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    const EmptyState: React.FC<{ message: string; icon?: React.ComponentType<any> }> = ({
        message,
        icon: Icon = AlertTriangle
    }) => (
        <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <Icon className="h-12 w-12 text-gray-400" />
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-600">{message}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        This may indicate that the API endpoint is not yet implemented or there's no data for the selected filters.
                    </p>
                </div>
                <Button onClick={loadReportData} variant="outline" className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </CardContent>
        </Card>
    );

    const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon, color = "blue" }) => (
        <Card className="transition-all hover:shadow-lg hover:-translate-y-1 duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
                <Icon className={`h-5 w-5 text-${color}-600`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value ?? '-'}</div>
                {change !== undefined && (
                    <p className="text-xs mt-1">
                        <span className={`inline-flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(change)}%
                        </span>
                        <span className="text-gray-500 ml-1">vs last period</span>
                    </p>
                )}
            </CardContent>
        </Card>
    );

    return (
        <HMSLayout>
            <Head title="Reports & Analytics Dashboard" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <header>
                        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics Dashboard</h1>
                        <p className="text-gray-600">Visual insights into hospital performance</p>
                        {apiError && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                {apiError}
                            </div>
                        )}
                    </header>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" /> Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-medium mb-2">Date Range</label>
                                    <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="block text-sm font-medium mb-2">Ward</label>
                                    <Select value={selectedWard} onValueChange={setSelectedWard}>
                                        <SelectTrigger><SelectValue placeholder="All Wards" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Wards</SelectItem>
                                            {wards.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="block text-sm font-medium mb-2">Department</label>
                                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                        <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Departments</SelectItem>
                                            {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={loadReportData} disabled={loading} className="flex items-center gap-2">
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-6">
                            <TabsTrigger value="census">Patient Census</TabsTrigger>
                            <TabsTrigger value="beds">Bed Occupancy</TabsTrigger>
                            <TabsTrigger value="lab">Lab TAT</TabsTrigger>
                            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
                            <TabsTrigger value="revenue">Revenue</TabsTrigger>
                            <TabsTrigger value="disease">Disease Stats</TabsTrigger>
                        </TabsList>

                        {/* Patient Census Tab */}
                        <TabsContent value="census">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : !patientCensus ? (
                                <EmptyState message="No patient census data available." icon={Users} />
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <KPICard title="Inpatients" value={patientCensus.summary?.total_inpatients || 0} icon={Users} />
                                        <KPICard title="Avg Daily Census" value={patientCensus.summary?.avg_daily_census || 0} icon={Activity} color="green" />
                                        <KPICard title="Admissions" value={patientCensus.summary?.total_admissions || 0} icon={TrendingUp} color="purple" />
                                        <KPICard title="Discharges" value={patientCensus.summary?.total_discharges || 0} icon={TrendingDown} color="orange" />
                                    </div>

                                    {patientCensus.daily_census && patientCensus.daily_census.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Daily Patient Census Trend</CardTitle>
                                                <CardDescription>Patient volume over time</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={patientCensus.daily_census}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="inpatients" stroke="#8884d8" name="Inpatients" />
                                                        <Line type="monotone" dataKey="outpatients" stroke="#82ca9d" name="Outpatients" />
                                                        <Line type="monotone" dataKey="emergency" stroke="#ff8042" name="Emergency" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {patientCensus.daily_census && patientCensus.daily_census.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Admissions vs Discharges</CardTitle>
                                                <CardDescription>Daily admission and discharge trends</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={patientCensus.daily_census}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="admissions" fill="#8884d8" name="Admissions" />
                                                        <Bar dataKey="discharges" fill="#82ca9d" name="Discharges" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {patientCensus.inpatients_by_ward && patientCensus.inpatients_by_ward.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Current Inpatients by Ward</CardTitle>
                                                <CardDescription>Distribution across wards</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={patientCensus.inpatients_by_ward}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="current_inpatients" fill="#0088FE" name="Current Inpatients" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* Bed Occupancy Tab */}
                        <TabsContent value="beds">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : !bedOccupancy ? (
                                <EmptyState message="No bed occupancy data available." icon={Bed} />
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <KPICard title="Total Beds" value={bedOccupancy.summary?.total_beds || 0} icon={Bed} />
                                        <KPICard title="Occupied" value={bedOccupancy.summary?.occupied_beds || 0} icon={Users} color="red" />
                                        <KPICard title="Available" value={bedOccupancy.summary?.available_beds || 0} icon={Bed} color="green" />
                                        <KPICard title="Occupancy Rate" value={`${bedOccupancy.summary?.current_occupancy_rate || 0}%`} icon={Activity} color="purple" />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {bedOccupancy.bed_status && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Current Bed Status</CardTitle>
                                                    <CardDescription>Distribution of bed availability</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Occupied', value: bedOccupancy.bed_status.occupied?.length || 0 },
                                                                    { name: 'Available', value: bedOccupancy.bed_status.available?.length || 0 },
                                                                    { name: 'Maintenance', value: bedOccupancy.bed_status.maintenance?.length || 0 }
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={false}
                                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                                outerRadius={80}
                                                                fill="#8884d8"
                                                                dataKey="value"
                                                            >
                                                                <Cell fill="#ef4444" />
                                                                <Cell fill="#22c55e" />
                                                                <Cell fill="#f59e0b" />
                                                            </Pie>
                                                            <Tooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {bedOccupancy.occupancy_trends && bedOccupancy.occupancy_trends.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Occupancy Rate Trend</CardTitle>
                                                    <CardDescription>Daily occupancy percentage</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <AreaChart data={bedOccupancy.occupancy_trends}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Area type="monotone" dataKey="occupancy_rate" stroke="#8884d8" fill="#8884d8" name="Occupancy %" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>

                                    {bedOccupancy.occupancy_by_ward && bedOccupancy.occupancy_by_ward.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Bed Occupancy by Ward</CardTitle>
                                                <CardDescription>Ward-wise bed utilization</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={bedOccupancy.occupancy_by_ward}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="ward_name" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="occupied_beds" fill="#ef4444" name="Occupied" />
                                                        <Bar dataKey="available_beds" fill="#22c55e" name="Available" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* Lab TAT Tab */}
                        <TabsContent value="lab">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : !labTAT ? (
                                <EmptyState message="No lab TAT data available." icon={Clock} />
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <KPICard title="Average TAT" value={`${labTAT.summary?.avg_tat_hours?.toFixed(1) || 0}h`} icon={Clock} />
                                        <KPICard title="Total Tests" value={labTAT.summary?.total_tests || 0} icon={Activity} color="green" />
                                        <KPICard title="Delayed Tests" value={labTAT.summary?.delayed_tests || 0} icon={AlertTriangle} color="red" />
                                        <KPICard title="Delay Rate" value={`${labTAT.summary?.delay_percentage?.toFixed(1) || 0}%`} icon={TrendingDown} color="orange" />
                                    </div>

                                    {labTAT.tat_by_category && labTAT.tat_by_category.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Turnaround Time by Test Category</CardTitle>
                                                <CardDescription>Average TAT across different test types</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={labTAT.tat_by_category}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="category" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="avg_tat_hours" fill="#8884d8" name="Avg TAT (hours)" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {labTAT.tat_by_category && labTAT.tat_by_category.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Test Volume by Category</CardTitle>
                                                    <CardDescription>Total tests performed</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={labTAT.tat_by_category}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={false}
                                                                label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                                                                outerRadius={80}
                                                                fill="#8884d8"
                                                                dataKey="total_tests"
                                                            >
                                                                {labTAT.tat_by_category.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {labTAT.tat_by_category && labTAT.tat_by_category.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Delayed Tests by Category</CardTitle>
                                                    <CardDescription>Tests exceeding target TAT</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <BarChart data={labTAT.tat_by_category}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="category" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="delayed_tests" fill="#ef4444" name="Delayed Tests" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Pharmacy Tab */}
                        <TabsContent value="pharmacy">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : !pharmacyData ? (
                                <EmptyState message="No pharmacy data available." icon={Pill} />
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <KPICard title="Drugs Dispensed" value={pharmacyData.summary?.total_drugs_dispensed || 0} icon={Pill} />
                                        <KPICard title="Total Value" value={`$${pharmacyData.summary?.total_value_dispensed?.toLocaleString() || 0}`} icon={DollarSign} color="green" />
                                        <KPICard title="Low Stock Items" value={pharmacyData.summary?.low_stock_items || 0} icon={AlertTriangle} color="red" />
                                        <KPICard title="Avg Daily Usage" value={pharmacyData.summary?.avg_daily_consumption || 0} icon={Activity} color="purple" />
                                    </div>

                                    {pharmacyData.top_drugs_by_quantity && pharmacyData.top_drugs_by_quantity.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Top 10 Drugs by Quantity Dispensed</CardTitle>
                                                <CardDescription>Most frequently dispensed medications</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={pharmacyData.top_drugs_by_quantity} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis type="number" />
                                                        <YAxis dataKey="drug.name" type="category" width={150} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="total_quantity" fill="#8884d8" name="Quantity Dispensed" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {pharmacyData.department_consumption && pharmacyData.department_consumption.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Drug Consumption by Department</CardTitle>
                                                <CardDescription>Department-wise medication usage</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={pharmacyData.department_consumption}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="department" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="total_quantity" fill="#0088FE" name="Quantity" />
                                                        <Bar dataKey="total_value" fill="#00C49F" name="Value ($)" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {pharmacyData.stock_alerts && pharmacyData.stock_alerts.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Stock Alerts</CardTitle>
                                                <CardDescription>Medications requiring attention</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {pharmacyData.stock_alerts.slice(0, 10).map((alert: any, index: number) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{alert.drug_name}</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        Current: {alert.current_stock} | Min: {alert.minimum_stock}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="destructive">{alert.days_of_supply} days left</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* Revenue Tab */}
                        <TabsContent value="revenue">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : !revenueData ? (
                                <EmptyState message="No revenue data available." icon={DollarSign} />
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <KPICard title="Total Revenue" value={`$${revenueData.summary?.total_revenue?.toLocaleString() || 0}`} icon={DollarSign} />
                                        <KPICard title="Avg Daily Revenue" value={`$${revenueData.summary?.avg_daily_revenue?.toLocaleString() || 0}`} icon={TrendingUp} color="green" />
                                        <KPICard title="Total Transactions" value={revenueData.summary?.total_transactions || 0} icon={Activity} color="purple" />
                                        <KPICard title="Unique Patients" value={revenueData.summary?.unique_patients || 0} icon={Users} color="orange" />
                                    </div>

                                    {revenueData.revenue_by_department && revenueData.revenue_by_department.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Revenue by Department</CardTitle>
                                                <CardDescription>Department-wise revenue breakdown</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={revenueData.revenue_by_department}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="department" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="total_revenue" fill="#0088FE" name="Revenue ($)" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {revenueData.daily_revenue_trend && revenueData.daily_revenue_trend.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Daily Revenue Trend</CardTitle>
                                                <CardDescription>Revenue over time</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <AreaChart data={revenueData.daily_revenue_trend}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Area type="monotone" dataKey="daily_revenue" stroke="#8884d8" fill="#8884d8" name="Daily Revenue ($)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {revenueData.top_billing_items && revenueData.top_billing_items.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Top Billing Items</CardTitle>
                                                    <CardDescription>Highest revenue generating services</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <PieChart>
                                                            <Pie
                                                                data={revenueData.top_billing_items}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={false}
                                                                label={({ item_name, percent }) => `${item_name}: ${(percent * 100).toFixed(0)}%`}
                                                                outerRadius={80}
                                                                fill="#8884d8"
                                                                dataKey="total_revenue"
                                                            >
                                                                {revenueData.top_billing_items.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {revenueData.revenue_by_payer && revenueData.revenue_by_payer.length > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Revenue by Payment Method</CardTitle>
                                                    <CardDescription>Payment method distribution</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <BarChart data={revenueData.revenue_by_payer}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="payer_type" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="total_revenue" fill="#00C49F" name="Revenue ($)" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Disease Statistics Tab */}
                        <TabsContent value="disease">
                            {loading ? (
                                <LoadingSkeleton />
                            ) : !diseaseStats ? (
                                <EmptyState message="No disease statistics available." icon={Activity} />
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <KPICard title="Total Diagnoses" value={diseaseStats.summary?.total_diagnoses || 0} icon={Activity} />
                                        <KPICard title="Unique Conditions" value={diseaseStats.summary?.unique_conditions || 0} icon={Users} color="green" />
                                        <KPICard title="Avg Daily Diagnoses" value={diseaseStats.summary?.avg_daily_diagnoses || 0} icon={TrendingUp} color="purple" />
                                        <KPICard title="Most Common" value={diseaseStats.summary?.most_common_diagnosis || 'N/A'} icon={AlertTriangle} color="orange" />
                                    </div>

                                    {diseaseStats.top_diagnoses && diseaseStats.top_diagnoses.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Top Diagnoses</CardTitle>
                                                <CardDescription>Most common conditions</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={diseaseStats.top_diagnoses} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis type="number" />
                                                        <YAxis dataKey="diagnosis" type="category" width={150} />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Bar dataKey="count" fill="#8884d8" name="Cases" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {diseaseStats.disease_categories && diseaseStats.disease_categories.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Disease Categories</CardTitle>
                                                <CardDescription>Distribution by category</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={diseaseStats.disease_categories}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="count"
                                                        >
                                                            {diseaseStats.disease_categories.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {diseaseStats.daily_trends && diseaseStats.daily_trends.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Daily Diagnosis Trends</CardTitle>
                                                <CardDescription>Diagnoses over time</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={diseaseStats.daily_trends}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="count" stroke="#8884d8" name="Diagnoses" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => exportReport(activeTab, 'pdf')}>
                            <Download className="h-4 w-4 mr-1" /> Export PDF
                        </Button>
                        <Button variant="outline" onClick={() => exportReport(activeTab, 'excel')}>
                            <Download className="h-4 w-4 mr-1" /> Export Excel
                        </Button>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
