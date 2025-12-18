import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ArrowRight, BarChart3, DollarSign } from 'lucide-react';

interface Props {
    auth: any;
}

export default function FinancialReports({ auth }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Financial Reports" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
                        <p className="text-gray-600">Access comprehensive financial analytics and reports</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-6 w-6" />
                                Financial Analytics Dashboard
                            </CardTitle>
                            <CardDescription>
                                This section has been integrated into our comprehensive Reports & Analytics Dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Enhanced Financial Reporting</h3>
                                <p className="text-gray-600 mb-6">
                                    Access revenue analysis, billing trends, and financial performance metrics 
                                    in our new unified dashboard with interactive charts and advanced filtering.
                                </p>
                                <Button asChild>
                                    <a href="/reports?tab=revenue" className="flex items-center gap-2">
                                        Go to Revenue Analytics
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
