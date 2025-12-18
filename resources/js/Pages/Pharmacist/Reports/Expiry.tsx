import { Head } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { 
    ArrowLeft,
    Calendar,
    Download,
    AlertTriangle,
    Clock,
    XCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface ExpiringStock {
    id: number;
    drug: {
        generic_name: string;
        brand_name: string;
        strength: string;
        formulation: string;
    };
    quantity: number;
    batch_no: string;
    expiry_date: string;
}

interface Props {
    expiringStocks: {
        data: ExpiringStock[];
        links?: any[];
        meta?: {
            total: number;
            per_page: number;
            from: number;
            to: number;
        };
    };
}

export default function ExpiryReport({ expiringStocks }: Props) {
    const getExpiryStatus = (expiryDate: string) => {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = differenceInDays(expiry, today);

        if (daysUntilExpiry < 0) {
            return { 
                status: 'expired', 
                color: 'destructive', 
                icon: XCircle, 
                text: 'Expired',
                days: Math.abs(daysUntilExpiry)
            };
        } else if (daysUntilExpiry <= 30) {
            return { 
                status: 'critical', 
                color: 'destructive', 
                icon: AlertTriangle, 
                text: 'Critical',
                days: daysUntilExpiry
            };
        } else if (daysUntilExpiry <= 90) {
            return { 
                status: 'warning', 
                color: 'secondary', 
                icon: Clock, 
                text: 'Warning',
                days: daysUntilExpiry
            };
        } else {
            return { 
                status: 'normal', 
                color: 'default', 
                icon: Calendar, 
                text: 'Normal',
                days: daysUntilExpiry
            };
        }
    };

    const getStatusCounts = () => {
        const counts = {
            expired: 0,
            critical: 0,
            warning: 0,
            normal: 0
        };

        expiringStocks.data.forEach(stock => {
            const status = getExpiryStatus(stock.expiry_date);
            counts[status.status as keyof typeof counts]++;
        });

        return counts;
    };

    const statusCounts = getStatusCounts();

    return (
        <HMSLayout>
            <Head title="Expiry Report" />
            
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
                            <h1 className="text-3xl font-bold tracking-tight">Expiry Report</h1>
                            <p className="text-muted-foreground">
                                Monitor drug expiration dates and manage inventory
                            </p>
                        </div>
                    </div>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-600">Expired</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{statusCounts.expired}</div>
                            <p className="text-xs text-muted-foreground">Items past expiry</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-600">Critical (≤30 days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{statusCounts.critical}</div>
                            <p className="text-xs text-muted-foreground">Expiring soon</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-yellow-600">Warning (≤90 days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{statusCounts.warning}</div>
                            <p className="text-xs text-muted-foreground">Monitor closely</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{expiringStocks.meta?.total || expiringStocks.data.length}</div>
                            <p className="text-xs text-muted-foreground">In next 6 months</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Expiring Items List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Expiring Inventory
                        </CardTitle>
                        <CardDescription>
                            Items expiring within the next 6 months, sorted by expiry date
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expiringStocks.data.map((stock) => {
                                const expiryStatus = getExpiryStatus(stock.expiry_date);
                                const StatusIcon = expiryStatus.icon;
                                
                                return (
                                    <div key={stock.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold">
                                                        {stock.drug.generic_name}
                                                    </h3>
                                                    <Badge variant={expiryStatus.color as any}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {expiryStatus.text}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Brand</p>
                                                        <p className="font-medium">
                                                            {stock.drug.brand_name || 'Generic'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Strength</p>
                                                        <p className="font-medium">{stock.drug.strength}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Formulation</p>
                                                        <p className="font-medium">{stock.drug.formulation}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Batch No</p>
                                                        <p className="font-medium">{stock.batch_no}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right ml-4">
                                                <div className="mb-2">
                                                    <p className="text-2xl font-bold">{stock.quantity}</p>
                                                    <p className="text-sm text-muted-foreground">Units</p>
                                                </div>
                                                
                                                <div className="text-sm space-y-1">
                                                    <div>
                                                        <p className="font-medium">
                                                            {format(new Date(stock.expiry_date), 'MMM dd, yyyy')}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            {expiryStatus.status === 'expired' 
                                                                ? `${expiryStatus.days} days ago`
                                                                : `${expiryStatus.days} days left`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action recommendations */}
                                        {expiryStatus.status === 'expired' && (
                                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                                                <strong>Action Required:</strong> Remove from inventory immediately. Do not dispense.
                                            </div>
                                        )}
                                        {expiryStatus.status === 'critical' && (
                                            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                                                <strong>Urgent:</strong> Prioritize dispensing or consider return to supplier.
                                            </div>
                                        )}
                                        {expiryStatus.status === 'warning' && (
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                                <strong>Monitor:</strong> Plan usage or consider promotional pricing.
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {expiringStocks.data.length === 0 && (
                                <div className="text-center py-8">
                                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No items expiring in the next 6 months</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {expiringStocks.meta && expiringStocks.meta.total > expiringStocks.meta.per_page && (
                            <div className="mt-6 flex justify-center">
                                <p className="text-sm text-muted-foreground">
                                    Showing {expiringStocks.meta.from} to {expiringStocks.meta.to} of {expiringStocks.meta.total} results
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HMSLayout>
    );
}
