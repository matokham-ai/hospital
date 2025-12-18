import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { 
    Building2, MapPin, Phone, Mail, Users, DollarSign, TrendingUp, TrendingDown,
    Bed, Activity, Calendar, FileText, AlertCircle, ArrowLeft, RefreshCw,
    UserCheck, Stethoscope, Pill, TestTube, Clock
} from 'lucide-react';
import { useState } from 'react';

interface Branch {
    id: number;
    branch_code: string;
    branch_name: string;
    location?: string;
    address?: string;
    phone?: string;
    email?: string;
    status: string;
    is_main_branch: boolean;
}

interface BranchStats {
    patients: {
        total: number;
        active: number;
        new_this_month: number;
        growth_rate: number;
    };
    financial: {
        today_revenue: number;
        month_revenue: number;
        outstanding: number;
        collection_rate: number;
        growth_rate: number;
    };
    operations: {
        appointments_today: number;
        appointments_pending: number;
        beds_total: number;
        beds_occupied: number;
        occupancy_rate: number;
    };
    staff: {
        total: number;
        doctors: number;
        nurses: number;
        active_today: number;
    };
    pharmacy: {
        prescriptions_today: number;
        prescriptions_month: number;
        low_stock_items: number;
    };
    laboratory: {
        tests_today: number;
        tests_pending: number;
        tests_completed: number;
    };
}

interface BranchDashboardProps {
    branch: Branch;
    stats: BranchStats;
}

export default function BranchDashboard({ branch, stats }: BranchDashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['stats'],
            onFinish: () => setIsRefreshing(false),
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    return (
        <AdminLayout>
            <Head title={`${branch.branch_name} - Branch Dashboard`} />

            <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50">
                <div className="container mx-auto px-4 py-6 space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/branches">
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-lg">
                                    <Building2 className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-bold text-gray-900">{branch.branch_name}</h1>
                                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                                            {branch.status}
                                        </Badge>
                                        {branch.is_main_branch && (
                                            <Badge variant="outline" className="bg-yellow-50 border-yellow-300">
                                                ⭐ Main Branch
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-gray-600 font-mono font-semibold">{branch.branch_code}</p>
                                    {branch.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{branch.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Financial Overview */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Performance</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="border-l-4 border-l-green-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <DollarSign className="h-5 w-5 text-green-600" />
                                        </div>
                                        {stats.financial.growth_rate >= 0 ? (
                                            <TrendingUp className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <TrendingDown className="h-5 w-5 text-red-600" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(stats.financial.today_revenue)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Month: {formatCurrency(stats.financial.month_revenue)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-teal-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-teal-100 rounded-lg">
                                            <TrendingUp className="h-5 w-5 text-teal-600" />
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {formatPercentage(stats.financial.growth_rate)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPercentage(Math.abs(stats.financial.growth_rate))}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">vs last month</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-orange-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <AlertCircle className="h-5 w-5 text-orange-600" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(stats.financial.outstanding)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Pending collection</p>
                                </CardContent>
                            </Card>

                            <Card className="border-l-4 border-l-emerald-500">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <Activity className="h-5 w-5 text-emerald-600" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPercentage(stats.financial.collection_rate)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Payment efficiency</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Patients & Operations */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Patient Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-teal-600" />
                                    Patient Statistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                                        <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                                        <p className="text-3xl font-bold text-teal-600">{stats.patients.total}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                        <p className="text-sm text-gray-600 mb-1">Active Patients</p>
                                        <p className="text-3xl font-bold text-emerald-600">{stats.patients.active}</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                        <p className="text-sm text-gray-600 mb-1">New This Month</p>
                                        <p className="text-3xl font-bold text-green-600">{stats.patients.new_this_month}</p>
                                    </div>
                                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                                        <p className="text-sm text-gray-600 mb-1">Growth Rate</p>
                                        <p className="text-3xl font-bold text-teal-600">
                                            {formatPercentage(stats.patients.growth_rate)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Operations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-emerald-600" />
                                    Operations Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border border-teal-100">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-teal-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Appointments Today</p>
                                            <p className="text-2xl font-bold">{stats.operations.appointments_today}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{stats.operations.appointments_pending} pending</Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <div className="flex items-center gap-3">
                                        <Bed className="h-5 w-5 text-emerald-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Bed Occupancy</p>
                                            <p className="text-2xl font-bold">
                                                {stats.operations.beds_occupied} / {stats.operations.beds_total}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-lg">
                                        {formatPercentage(stats.operations.occupancy_rate)}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Staff, Pharmacy & Laboratory */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Staff */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <UserCheck className="h-5 w-5 text-teal-600" />
                                    Staff
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Total Staff</span>
                                    <span className="text-xl font-bold">{stats.staff.total}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4 text-teal-600" />
                                        <span className="text-sm text-gray-600">Doctors</span>
                                    </div>
                                    <span className="text-lg font-semibold">{stats.staff.doctors}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm text-gray-600">Nurses</span>
                                    </div>
                                    <span className="text-lg font-semibold">{stats.staff.nurses}</span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Active Today</span>
                                        <Badge className="bg-teal-600">{stats.staff.active_today}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pharmacy */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Pill className="h-5 w-5 text-emerald-600" />
                                    Pharmacy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Today</span>
                                    <span className="text-xl font-bold">{stats.pharmacy.prescriptions_today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">This Month</span>
                                    <span className="text-lg font-semibold">{stats.pharmacy.prescriptions_month}</span>
                                </div>
                                <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Low Stock Items</span>
                                        <Badge variant={stats.pharmacy.low_stock_items > 0 ? 'destructive' : 'secondary'}>
                                            {stats.pharmacy.low_stock_items}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Laboratory */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TestTube className="h-5 w-5 text-teal-600" />
                                    Laboratory
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Tests Today</span>
                                    <span className="text-xl font-bold">{stats.laboratory.tests_today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm text-gray-600">Pending</span>
                                    </div>
                                    <Badge variant="secondary">{stats.laboratory.tests_pending}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Completed</span>
                                    <Badge className="bg-emerald-600">{stats.laboratory.tests_completed}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Manage branch operations and view detailed reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Button variant="outline" className="h-20 flex-col">
                                    <FileText className="h-6 w-6 mb-2" />
                                    <span>View Reports</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex-col">
                                    <Users className="h-6 w-6 mb-2" />
                                    <span>Manage Staff</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex-col">
                                    <Bed className="h-6 w-6 mb-2" />
                                    <span>Ward Management</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex-col">
                                    <Activity className="h-6 w-6 mb-2" />
                                    <span>Performance</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
