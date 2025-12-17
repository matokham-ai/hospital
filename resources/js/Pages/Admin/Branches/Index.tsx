import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Building2, MapPin, Phone, Mail, Users, DollarSign, TrendingUp, Bed, Activity, ArrowRight, PlusCircle } from 'lucide-react';

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
    users_count: number;
    payments_count: number;
    invoices_count: number;
}

interface BranchesIndexProps {
    branches: Branch[];
}

function AddBranchModal() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        branch_code: '',
        branch_name: '',
        location: '',
        address: '',
        phone: '',
        email: '',
        status: 'active',
        is_main_branch: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/branches', form, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setForm({
                    branch_code: '',
                    branch_name: '',
                    location: '',
                    address: '',
                    phone: '',
                    email: '',
                    status: 'active',
                    is_main_branch: false,
                });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow hover:shadow-lg transition-all rounded-xl">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Branch
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl rounded-2xl border border-teal-100 shadow-xl bg-white/90 backdrop-blur-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-teal-600" />
                        Add New Branch
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Create a new hospital branch location. All fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Branch Code *</Label>
                            <Input
                                value={form.branch_code}
                                onChange={(e) => setForm({ ...form, branch_code: e.target.value })}
                                placeholder="e.g., MAIN, BR01"
                                required
                                maxLength={10}
                            />
                        </div>
                        <div>
                            <Label>Branch Name *</Label>
                            <Input
                                value={form.branch_name}
                                onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                                placeholder="e.g., Main Hospital, Downtown Clinic"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Location</Label>
                        <Input
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="e.g., Downtown, City Center"
                        />
                    </div>

                    <div>
                        <Label>Address</Label>
                        <Textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="Full street address"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Phone</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="e.g., +1 234 567 8900"
                                type="tel"
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="e.g., branch@hospital.com"
                                type="email"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Status *</Label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="is_main_branch"
                                checked={form.is_main_branch}
                                onChange={(e) => setForm({ ...form, is_main_branch: e.target.checked })}
                                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                            />
                            <Label htmlFor="is_main_branch" className="cursor-pointer">
                                Main Branch
                            </Label>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl shadow hover:shadow-lg transition-all"
                        >
                            Create Branch
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function BranchesIndex({ branches }: BranchesIndexProps) {
    const handleViewDashboard = (branchId: number) => {
        router.get(`/admin/branches/${branchId}/dashboard`);
    };

    const handleToggleStatus = (branchId: number) => {
        router.patch(`/admin/branches/${branchId}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Branch Management - Admin" />

            <div className="container mx-auto px-4 py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
                        <p className="text-gray-600 mt-1">Manage hospital branches and locations</p>
                    </div>
                    <AddBranchModal />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch) => (
                        <Card
                            key={branch.id}
                            className="hover:shadow-xl transition-all cursor-pointer group border-2 hover:border-teal-400"
                            onClick={() => handleViewDashboard(branch.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Building2 className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl group-hover:text-teal-600 transition-colors">
                                                {branch.branch_name}
                                            </CardTitle>
                                            <CardDescription className="font-mono font-semibold">
                                                {branch.branch_code}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                                            {branch.status}
                                        </Badge>
                                        {branch.is_main_branch && (
                                            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300">
                                                ⭐ Main
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Location Info */}
                                <div className="space-y-2">
                                    {branch.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span>{branch.location}</span>
                                        </div>
                                    )}
                                    {branch.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{branch.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="pt-3 border-t bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-4">
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div className="group-hover:scale-105 transition-transform">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <Users className="h-4 w-4 text-teal-600" />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{branch.users_count}</div>
                                            <div className="text-xs text-gray-600 font-medium">Staff</div>
                                        </div>
                                        <div className="group-hover:scale-105 transition-transform">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{branch.payments_count}</div>
                                            <div className="text-xs text-gray-600 font-medium">Payments</div>
                                        </div>
                                        <div className="group-hover:scale-105 transition-transform">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <Activity className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">{branch.invoices_count}</div>
                                            <div className="text-xs text-gray-600 font-medium">Invoices</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Button
                                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 group-hover:shadow-lg transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDashboard(branch.id);
                                    }}
                                >
                                    <span>View Dashboard</span>
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>

                                {/* Secondary Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Edit functionality
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStatus(branch.id);
                                        }}
                                    >
                                        {branch.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {branches.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No branches found</h3>
                            <p className="text-gray-600 mb-4">Get started by creating your first branch</p>
                            <AddBranchModal />
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
