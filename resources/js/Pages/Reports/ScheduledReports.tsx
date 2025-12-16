import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from '@/Components/ui/dialog';
// import { 
//     Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
// } from '@/Components/ui/table';

// Simple table components for now
const Table = ({ children, ...props }: any) => <div className="relative w-full overflow-auto"><table className="w-full caption-bottom text-sm" {...props}>{children}</table></div>;
const TableHeader = ({ children, ...props }: any) => <thead className="[&_tr]:border-b" {...props}>{children}</thead>;
const TableBody = ({ children, ...props }: any) => <tbody className="[&_tr:last-child]:border-0" {...props}>{children}</tbody>;
const TableRow = ({ children, ...props }: any) => <tr className="border-b transition-colors hover:bg-muted/50" {...props}>{children}</tr>;
const TableHead = ({ children, ...props }: any) => <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" {...props}>{children}</th>;
const TableCell = ({ children, ...props }: any) => <td className="p-4 align-middle" {...props}>{children}</td>;
import {
    Plus, Calendar, Mail, FileText, Trash2,
    Clock
} from 'lucide-react';
import axios from 'axios';
// import { format } from 'date-fns';

interface ScheduledReport {
    id: number;
    name: string;
    type: string;
    frequency: string;
    format: string;
    recipients: string[];
    is_active: boolean;
    next_run_at: string;
    last_run_at: string | null;
    run_count: number;
    created_at: string;
}

interface Props {
    auth: any;
    scheduledReports: ScheduledReport[];
    wards: Array<{ id: number; name: string }>;
    departments: Array<{ id: number; name: string }>;
}

export default function ScheduledReports({
    auth,
    scheduledReports = [],
    wards = [],
    departments = []
}: Props) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        frequency: '',
        format: 'pdf',
        recipients: [''],
        department_id: 'all',
        ward_id: 'all',
        is_active: true
    });

    const reportTypes = [
        { value: 'patient_census', label: 'Patient Census' },
        { value: 'bed_occupancy', label: 'Bed Occupancy' },
        { value: 'lab_tat', label: 'Lab TAT' },
        { value: 'pharmacy_consumption', label: 'Pharmacy Consumption' },
        { value: 'revenue_department', label: 'Revenue by Department' },
        { value: 'disease_statistics', label: 'Disease Statistics' }
    ];

    const frequencies = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await axios.post('/reports/scheduled/create', {
                ...formData,
                recipients: formData.recipients.filter(email => email.trim() !== '')
            });

            router.reload();
            setIsCreateDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error creating scheduled report:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this scheduled report?')) {
            try {
                await axios.delete(`/reports/scheduled/${id}`);
                router.reload();
            } catch (error) {
                console.error('Error deleting scheduled report:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: '',
            frequency: '',
            format: 'pdf',
            recipients: [''],
            department_id: '',
            ward_id: '',
            is_active: true
        });
    };

    const addRecipient = () => {
        setFormData(prev => ({
            ...prev,
            recipients: [...prev.recipients, '']
        }));
    };

    const updateRecipient = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            recipients: prev.recipients.map((email, i) => i === index ? value : email)
        }));
    };

    const removeRecipient = (index: number) => {
        setFormData(prev => ({
            ...prev,
            recipients: prev.recipients.filter((_, i) => i !== index)
        }));
    };

    return (
        <HMSLayout
            user={auth?.user}
            breadcrumbs={[
                { name: 'Reports', href: '/reports/dashboard' },
                { name: 'Scheduled Reports' }
            ]}
        >
            <Head title="Scheduled Reports" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Scheduled Reports</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Automate report generation and delivery</p>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg">
                                <Plus className="h-4 w-4" />
                                Create Scheduled Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Create Scheduled Report</DialogTitle>
                                <DialogDescription>
                                    Set up automatic report generation and email delivery
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium">Report Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Daily Census Report"
                                            className="w-full"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-sm font-medium">Report Type</Label>
                                        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select report type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reportTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="frequency" className="text-sm font-medium flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Frequency
                                        </Label>
                                        <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select frequency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {frequencies.map(freq => (
                                                    <SelectItem key={freq.value} value={freq.value}>
                                                        {freq.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="format" className="text-sm font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Format
                                        </Label>
                                        <Select value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pdf">PDF</SelectItem>
                                                <SelectItem value="excel">Excel</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="department" className="text-sm font-medium">Department (Optional)</Label>
                                        <Select value={formData.department_id} onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="All Departments" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Departments</SelectItem>
                                                {departments?.map(dept => (
                                                    <SelectItem key={dept.id} value={dept.id?.toString() || ''}>
                                                        {dept.name}
                                                    </SelectItem>
                                                )) || []}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ward" className="text-sm font-medium">Ward (Optional)</Label>
                                        <Select value={formData.ward_id} onValueChange={(value) => setFormData(prev => ({ ...prev, ward_id: value }))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="All Wards" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Wards</SelectItem>
                                                {wards?.map(ward => (
                                                    <SelectItem key={ward.id} value={ward.id?.toString() || ''}>
                                                        {ward.name}
                                                    </SelectItem>
                                                )) || []}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email Recipients
                                    </Label>
                                    <div className="space-y-2">
                                        {formData.recipients.map((email, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => updateRecipient(index, e.target.value)}
                                                    placeholder="email@example.com"
                                                    className="flex-1"
                                                    required={index === 0}
                                                />
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => removeRecipient(index)}
                                                        className="shrink-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addRecipient}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Recipient
                                    </Button>
                                </div>

                                <DialogFooter className="gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                                        Create Scheduled Report
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Scheduled Reports Table */}
                <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            Scheduled Reports
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            Manage your automated report schedules
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {scheduledReports.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                    <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No scheduled reports</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                                    Create your first scheduled report to automate report generation and delivery
                                </p>
                                <Button 
                                    onClick={() => setIsCreateDialogOpen(true)}
                                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Scheduled Report
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                                            <TableHead className="font-semibold text-slate-900 dark:text-white">Name</TableHead>
                                            <TableHead className="font-semibold text-slate-900 dark:text-white">Type</TableHead>
                                            <TableHead className="font-semibold text-slate-900 dark:text-white">Frequency</TableHead>
                                            <TableHead className="font-semibold text-slate-900 dark:text-white">Recipients</TableHead>
                                            <TableHead className="font-semibold text-slate-900 dark:text-white">Next Run</TableHead>
                                            <TableHead className="font-semibold text-slate-900 dark:text-white">Status</TableHead>
                                            <TableHead className="font-semibold text-slate-900 dark:text-white text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {scheduledReports.map((report) => (
                                            <TableRow key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <TableCell className="font-medium text-slate-900 dark:text-white">{report.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                                                        {reportTypes.find(t => t.value === report.type)?.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                        <span className="capitalize">{report.frequency}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                                        <span>{report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-700 dark:text-slate-300">
                                                    {report.next_run_at ? new Date(report.next_run_at).toLocaleString() : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={report.is_active ? 'default' : 'secondary'} className={report.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' : ''}>
                                                        {report.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(report.id)}
                                                            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HMSLayout>
    );
}
