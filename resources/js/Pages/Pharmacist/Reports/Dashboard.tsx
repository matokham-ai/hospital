import React from 'react';
import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { 
    Pill, 
    FileText, 
    Package, 
    AlertTriangle,
    TrendingUp,
    Calendar
} from 'lucide-react';

interface Stats {
    totalDispensed: number;
    pendingPrescriptions: number;
    lowStockItems: number;
    expiringSoon: number;
}

interface Props {
    stats: Stats;
}

export default function PharmacyReportsDashboard({ stats }: Props) {
    return (
        <HMSLayout>
            <Head title="Pharmacy Reports" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Reports</h1>
                        <p className="text-muted-foreground">
                            Monitor dispensing, inventory, and pharmacy operations
                        </p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Dispensed
                            </CardTitle>
                            <Pill className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalDispensed}</div>
                            <p className="text-xs text-muted-foreground">
                                All time prescriptions
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pending Prescriptions
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pendingPrescriptions}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting dispensing
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Low Stock Items
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
                            <p className="text-xs text-muted-foreground">
                                Below minimum level
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Expiring Soon
                            </CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.expiringSoon}</div>
                            <p className="text-xs text-muted-foreground">
                                Within 6 months
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Categories */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Dispensing Reports
                            </CardTitle>
                            <CardDescription>
                                Track prescription dispensing activities and patterns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <a href="/pharmacy/reports/dispensing">
                                    View Dispensing Report
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Stock Reports
                            </CardTitle>
                            <CardDescription>
                                Monitor inventory levels, stock movements, and availability
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <a href="/pharmacy/reports/stock">
                                    View Stock Report
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Expiry Reports
                            </CardTitle>
                            <CardDescription>
                                Track expiring medications and manage drug lifecycle
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full">
                                <a href="/pharmacy/reports/expiry">
                                    View Expiry Report
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription>
                            Common reporting tasks and exports
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Daily Summary
                            </Button>
                            <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                Export to Excel
                            </Button>
                            <Button variant="outline" size="sm">
                                <Package className="h-4 w-4 mr-2" />
                                Stock Alert Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HMSLayout>
    );
}