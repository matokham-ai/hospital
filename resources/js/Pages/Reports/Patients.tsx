import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ArrowRight, Users, Activity } from 'lucide-react';

interface Props {
    auth: any;
}

export default function PatientReports({ auth }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Patient Reports" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Patient Reports</h1>
                        <p className="text-gray-600">Comprehensive patient analytics and census reports</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-6 w-6" />
                                    Patient Census Analytics
                                </CardTitle>
                                <CardDescription>
                                    Monitor patient volume, admissions, and discharge trends
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <p className="text-gray-600 mb-4">
                                        Track inpatient, outpatient, and emergency visit patterns with 
                                        real-time census data and trend analysis.
                                    </p>
                                    <Button asChild>
                                        <a href="/reports?tab=census" className="flex items-center gap-2">
                                            View Patient Census
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-6 w-6" />
                                    Disease Statistics
                                </CardTitle>
                                <CardDescription>
                                    Epidemiological insights and diagnosis patterns
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <p className="text-gray-600 mb-4">
                                        Analyze disease trends, ICD-10 statistics, and patient demographics 
                                        for public health insights.
                                    </p>
                                    <Button asChild>
                                        <a href="/reports?tab=disease" className="flex items-center gap-2">
                                            View Disease Statistics
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Additional Patient Analytics</CardTitle>
                            <CardDescription>
                                Access more patient-related reports in our comprehensive dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Button variant="outline" asChild>
                                    <a href="/reports?tab=beds">Bed Occupancy</a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="/reports?tab=lab">Lab TAT Analysis</a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="/inpatient/reports">Inpatient Reports</a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="/reports">All Reports</a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
