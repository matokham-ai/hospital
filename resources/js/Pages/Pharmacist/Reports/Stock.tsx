import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    ArrowLeft,
    Package,
    Download,
    AlertTriangle,
    CheckCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface Stock {
    id: number;
    drug: {
        name: string;
        generic_name: string;
        strength: string;
        form: string;
        unit_price: number;
    };
    quantity: number;
    min_level: number;
    max_level: number;
    batch_no: string;
    expiry_date: string;
    cost_price: number; // Added by backend for compatibility
}

interface Props {
    stocks: {
        data: Stock[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        meta: {
            total: number;
            per_page: number;
            from: number;
            to: number;
            current_page: number;
            last_page: number;
        };
    };
    filters?: {
        search?: string;
        status?: string;
        sort?: string;
        order?: string;
    };
}

export default function StockReport({ stocks, filters = {} }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [sortBy, setSortBy] = useState(filters.sort || 'quantity');
    const [sortOrder, setSortOrder] = useState(filters.order || 'asc');

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            router.get('/pharmacy/reports/stock', {
                search: searchTerm || undefined,
                status: statusFilter === 'all' ? undefined : statusFilter,
                sort: sortBy,
                order: sortOrder,
            }, {
                preserveState: true,
                replace: true,
            });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        router.get('/pharmacy/reports/stock', {
            search: searchTerm || undefined,
            status: status === 'all' ? undefined : status,
            sort: sortBy,
            order: sortOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSort = (field: string) => {
        const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newOrder);

        router.get('/pharmacy/reports/stock', {
            search: searchTerm || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            sort: field,
            order: newOrder,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setSortBy('quantity');
        setSortOrder('asc');

        router.get('/pharmacy/reports/stock', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const getStockStatus = (stock: Stock) => {
        if (stock.quantity <= stock.min_level) {
            return { status: 'low', color: 'destructive', icon: AlertTriangle };
        } else if (stock.quantity >= stock.max_level) {
            return { status: 'high', color: 'secondary', icon: Package };
        } else {
            return { status: 'normal', color: 'default', icon: CheckCircle };
        }
    };

    const getTotalValue = () => {
        if (!stocks?.data || !Array.isArray(stocks.data)) return 0;
        return stocks.data.reduce((total, stock) => {
            const quantity = stock.quantity || 0;
            const costPrice = stock.cost_price || 0;
            return total + (quantity * costPrice);
        }, 0);
    };

    return (
        <HMSLayout>
            <Head title="Stock Report" />

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
                            <h1 className="text-3xl font-bold tracking-tight">Stock Report</h1>
                            <p className="text-muted-foreground">
                                Monitor inventory levels and stock status
                            </p>
                        </div>
                    </div>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search by drug name, generic name, or batch number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Stock Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="low">Low Stock</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">High Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    onClick={() => handleSort('drug_name')}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowUpDown className="h-4 w-4" />
                                    Name
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleSort('quantity')}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowUpDown className="h-4 w-4" />
                                    Quantity
                                </Button>
                                {(searchTerm || (statusFilter && statusFilter !== 'all')) && (
                                    <Button
                                        variant="ghost"
                                        onClick={clearFilters}
                                        className="flex items-center gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stocks?.meta?.total || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">KES {getTotalValue().toLocaleString()}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stocks?.data?.filter(stock => stock.quantity <= stock.min_level).length || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stock List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Current Stock Levels
                            </div>
                            <div className="text-sm font-normal text-muted-foreground">
                                {stocks?.meta?.total || 0} items
                                {(searchTerm || (statusFilter && statusFilter !== 'all')) && (
                                    <span className="ml-2 text-blue-600">
                                        (filtered)
                                    </span>
                                )}
                            </div>
                        </CardTitle>
                        <CardDescription>
                            All inventory items with current quantities and status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stocks?.data?.map((stock) => {
                                const stockStatus = getStockStatus(stock);
                                const StatusIcon = stockStatus.icon;

                                return (
                                    <div key={stock.id} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold">
                                                        {stock.drug.generic_name}
                                                    </h3>
                                                    <Badge variant={stockStatus.color as any}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {stockStatus.status}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Brand</p>
                                                        <p className="font-medium">
                                                            {stock.drug.name && stock.drug.name !== 'N/A' ? stock.drug.name : 'Generic'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Strength</p>
                                                        <p className="font-medium">{stock.drug.strength}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Form</p>
                                                        <p className="font-medium">{stock.drug.form}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Batch No</p>
                                                        <p className="font-medium">{stock.batch_no}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right ml-3">
                                                <div className="mb-2">
                                                    <p className="text-2xl font-bold">{stock.quantity}</p>
                                                    <p className="text-sm text-muted-foreground">Current Stock</p>
                                                </div>

                                                <div className="text-sm space-y-1">
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-muted-foreground">Min:</span>
                                                        <span>{stock.min_level}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-muted-foreground">Max:</span>
                                                        <span>{stock.max_level}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-muted-foreground">Value:</span>
                                                        <span>KES {(stock.quantity * stock.cost_price).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-muted-foreground">Expires:</span>
                                                        <span>{format(new Date(stock.expiry_date), 'MMM yyyy')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {(!stocks?.data || stocks.data.length === 0) && (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        {(searchTerm || (statusFilter && statusFilter !== 'all'))
                                            ? 'No stock items match your filters'
                                            : 'No stock items found'
                                        }
                                    </p>
                                    {(searchTerm || (statusFilter && statusFilter !== 'all')) && (
                                        <Button
                                            variant="outline"
                                            onClick={clearFilters}
                                            className="mt-4"
                                        >
                                            Clear Filters
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {stocks?.meta && stocks.meta.total > stocks.meta.per_page && (
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {stocks.meta.from} to {stocks.meta.to} of {stocks.meta.total} results
                                </p>

                                <div className="flex items-center gap-2">
                                    {stocks?.links?.map((link, index) => {
                                        if (link.label === '&laquo; Previous') {
                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url)}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    Previous
                                                </Button>
                                            );
                                        }

                                        if (link.label === 'Next &raquo;') {
                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url)}
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            );
                                        }

                                        if (link.label !== '...' && !isNaN(Number(link.label))) {
                                            return (
                                                <Button
                                                    key={index}
                                                    variant={link.active ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => link.url && router.get(link.url)}
                                                >
                                                    {link.label}
                                                </Button>
                                            );
                                        }

                                        if (link.label === '...') {
                                            return (
                                                <span key={index} className="px-2 text-muted-foreground">
                                                    ...
                                                </span>
                                            );
                                        }

                                        return null;
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HMSLayout>
    );
}
