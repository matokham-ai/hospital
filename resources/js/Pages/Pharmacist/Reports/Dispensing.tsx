import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { 
    ArrowLeft,
    FileText,
    Download,
    Search
} from 'lucide-react';
import { format } from 'date-fns';

interface Prescription {
    id: number;
    patient_id: string;
    physician_id: string;
    patient?: {
        id: number;
        first_name: string;
        last_name: string;
        patient_id: string;
    };
    physician?: {
        id: number;
        name: string;
    };
    items: Array<{
        id: number;
        drug: {
            generic_name: string;
            brand_name: string;
            strength: string;
        };
        quantity: number;
        dosage: string;
        frequency: string;
    }>;
    updated_at: string;
}

interface Props {
    prescriptions: {
        data: Prescription[];
        links?: any[];
        meta?: {
            total: number;
            per_page: number;
            from: number;
            to: number;
        };
    };
    filters: {
        date_from?: string;
        date_to?: string;
    };
}

export default function DispensingReport({ prescriptions, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get('/pharmacy/reports/dispensing', {
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        router.get('/pharmacy/reports/dispensing');
    };

    return (
        <HMSLayout>
            <Head title="Dispensing Report" />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <a href="/pharmacy/reports">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Reports
                            </a>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Dispensing Report</h1>
                            <p className="text-muted-foreground">
                                Track prescription dispensing activities
                            </p>
                        </div>
                    </div>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <Label htmlFor="date_from">From Date</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="date_to">To Date</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilter}>
                                    Apply Filters
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Dispensed Prescriptions
                        </CardTitle>
                        <CardDescription>
                            Total: {prescriptions.meta?.total || prescriptions.data.length} prescriptions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {prescriptions.data.map((prescription) => (
                                <div key={prescription.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold">
                                                {prescription.patient ? 
                                                    `${prescription.patient.first_name} ${prescription.patient.last_name}` : 
                                                    `Patient ID: ${prescription.patient_id}`
                                                }
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                ID: {prescription.patient?.patient_id || prescription.patient_id}  
                                                Physician: {prescription.physician?.name || prescription.physician_id}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">
                                                Prescription #{prescription.id}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(prescription.updated_at), 'MMM dd, yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {prescription.items.map((item, index) => (
                                            <div key={index} className="bg-gray-50 rounded p-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">
                                                            {item.drug.generic_name}
                                                            {item.drug.brand_name && ` (${item.drug.brand_name})`}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.drug.strength} | {item.dosage} | {item.frequency}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {prescriptions.data.length === 0 && (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No dispensed prescriptions found</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination would go here */}
                        {prescriptions.meta && prescriptions.meta.total > prescriptions.meta.per_page && (
                            <div className="mt-6 flex justify-center">
                                <p className="text-sm text-muted-foreground">
                                    Showing {prescriptions.meta.from} to {prescriptions.meta.to} of {prescriptions.meta.total} results
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HMSLayout>
    );
}
