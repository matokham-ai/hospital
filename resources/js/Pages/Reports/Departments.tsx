import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ArrowRight, Building2, TrendingUp, Pill } from 'lucide-react';

interface Props {
    auth: any;
}

export default function DepartmentReports({ auth }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Department Reports" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Department Reports</h1>
                        <p className="text-gray-600">Department-wise performance and operational analytics</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-6 w-6" />
                                    Revenue by Department
                                </CardTitle>
                                <CardDescription>
                                    Financial performance analysis by department
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <p className="text-gray-600 mb-4">
                                        Track revenue trends, billing patterns, and financial KPIs 
                                        across all hospital departments.
                                    </p>
                                    <Button asChild>
                                        <a href="/reports?tab=revenue" className="flex items-center gap-2">
                                            View Revenue Reports
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Pill className="h-6 w-6" />
                                    Pharmacy Analytics
                                </CardTitle>
                                <CardDescription>
                                    Drug consumption and inventory by department
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <p className="text-gray-600 mb-4">
                                        Monitor medication usage, stock levels, and pharmacy 
                                        performance across departments.
                                    </p>
                                    <Button asChild>
                                        <a href="/pharmacy/reports" className="flex items-center gap-2">
                                            View Pharmacy Reports
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-6 w-6" />
                                    Lab TAT by Department
                                </CardTitle>
                                <CardDescription>
                                    Laboratory efficiency and turnaround times
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <p className="text-gray-600 mb-4">
                                        Analyze lab test processing times and efficiency 
                                        metrics by requesting department.
                                    </p>
                                    <Button asChild>
                                        <a href="/reports?tab=lab" className="flex items-center gap-2">
                                            View Lab Reports
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Comprehensive Department Analytics</CardTitle>
                            <CardDescription>
                                Access all department-related metrics in our unified dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-6">
                                <Building2 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Enhanced Department Reporting</h3>
                                <p className="text-gray-600 mb-6">
                                    Our new Reports & Analytics Dashboard provides comprehensive department-wise 
                                    insights with interactive filtering, real-time data, and export capabilities.
                                </p>
                                <div className="flex justify-center gap-4">
                                    <Button asChild>
                                        <a href="/reports" className="flex items-center gap-2">
                                            Go to Analytics Dashboard
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href="/reports/scheduled">Schedule Reports</a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
