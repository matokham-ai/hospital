import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { 
    Users, Bed, Clock, Pill, DollarSign, Activity,
    TrendingUp, TrendingDown, AlertTriangle, Download,
    Calendar, Filter, RefreshCw
} from 'lucide-react';

interface Ward {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

interface Props {
    auth: any;
    wards: Ward[];
    departments: Department[];
    currentDate: string;
}

export default function ReportsDashboardSimple({ auth, wards, departments, currentDate }: Props) {
    const [loading, setLoading] = useState(false);

    const KPICard = ({ title, value, icon: Icon, color = "blue" }: any) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-4 w-4 text-${color}-600`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Reports & Analytics Dashboard" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics Dashboard</h1>
                        <p className="text-gray-600">Comprehensive hospital management insights and metrics</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <KPICard
                            title="Total Patients"
                            value="1,234"
                            icon={Users}
                            color="blue"
                        />
                        <KPICard
                            title="Bed Occupancy"
                            value="85%"
                            icon={Bed}
                            color="green"
                        />
                        <KPICard
                            title="Avg Lab TAT"
                            value="2.5h"
                            icon={Clock}
                            color="purple"
                        />
                        <KPICard
                            title="Revenue Today"
                            value="$12,450"
                            icon={DollarSign}
                            color="orange"
                        />
                    </div>

                    {/* Report Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Patient Census
                                </CardTitle>
                                <CardDescription>
                                    Monitor patient volume and admission trends
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Track inpatient, outpatient, and emergency visits with real-time data.
                                </p>
                                <Button className="w-full">View Patient Census</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bed className="h-5 w-5" />
                                    Bed Occupancy
                                </CardTitle>
                                <CardDescription>
                                    Real-time bed status and occupancy rates
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Monitor bed utilization, ALOS, and turnover intervals.
                                </p>
                                <Button className="w-full">View Bed Reports</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Lab TAT Analysis
                                </CardTitle>
                                <CardDescription>
                                    Laboratory turnaround time metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Analyze test processing times and identify delays.
                                </p>
                                <Button className="w-full">View Lab Reports</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Pill className="h-5 w-5" />
                                    Pharmacy Reports
                                </CardTitle>
                                <CardDescription>
                                    Drug consumption and inventory analysis
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Monitor medication usage, stock levels, and alerts.
                                </p>
                                <Button asChild className="w-full">
                                    <a href="/pharmacy/reports">View Pharmacy Reports</a>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Revenue Analysis
                                </CardTitle>
                                <CardDescription>
                                    Financial performance by department
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Track revenue trends and billing performance.
                                </p>
                                <Button className="w-full">View Revenue Reports</Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Disease Statistics
                                </CardTitle>
                                <CardDescription>
                                    Epidemiological insights and trends
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    Analyze diagnosis patterns and disease trends.
                                </p>
                                <Button className="w-full">View Disease Stats</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Common reporting tasks and exports
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Export Daily Report
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Schedule Reports
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Custom Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
