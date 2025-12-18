import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/Components/ui/breadcrumb";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import ActivityFeed from "@/Components/Admin/ActivityFeed";
import DashboardActivityFeed from "@/Components/Admin/DashboardActivityFeed";
import AuditStats from "@/Components/Admin/AuditStats";
import { 
  Settings, 
  Database, 
  BarChart3, 
  Building2, 
  Bed, 
  TestTube, 
  Pill, 
  Activity, 
  RefreshCw,
  Users,
  Calendar,
  AlertCircle
} from "lucide-react";

// Types for the admin dashboard
interface MasterDataStats {
  departments: number;
  wards: number;
  beds: number;
  tests: number;
  drugs: number;
}

interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: 'created' | 'updated' | 'deleted';
  user_name: string;
  changes: Record<string, any>;
  created_at: string;
}

interface FinancialSummary {
  today: {
    revenue: number;
    payments_count: number;
    discounts: number;
    avg_payment: number;
  };
  month: {
    revenue: number;
    invoiced: number;
    discounts: number;
    net: number;
    discount_percentage: number;
    collection_rate: number;
  };
  outstanding: number;
  growth: {
    revenue_growth: number;
    trend: 'up' | 'down';
  };
}

interface BranchPerformance {
  id: number;
  name: string;
  code: string;
  location: string;
  revenue: number;
  transactions: number;
  discounts: number;
  outstanding: number;
  invoiced: number;
  avg_transaction: number;
  discount_rate: number;
}

interface DiscountSummary {
  today: {
    total: number;
    count: number;
    average: number;
  };
  month: {
    total: number;
    count: number;
    average: number;
  };
  by_type: Array<{ type: string; count: number; total: number }>;
  top_approvers: Array<{ name: string; count: number; total: number }>;
  compliance: {
    total: number;
    approved: number;
    approval_rate: number;
  };
}

interface PaymentAnalytics {
  today: {
    total: number;
    count: number;
    average: number;
  };
  month: {
    total: number;
    count: number;
    average: number;
  };
  by_method: Array<{ method: string; count: number; total: number }>;
  top_cashiers: Array<{ cashier: string; transactions: number; total: number; average: number }>;
}

interface Branch {
  id: number;
  name: string;
  code: string;
  location?: string;
}

interface AdminDashboardProps {
  permissions: string[];
  masterDataStats: MasterDataStats;
  recentActivity: AuditLog[];
  systemStats?: {
    totalUsers: number;
    activeUsers: number;
    todayAppointments: number;
    pendingBills: number;
    systemHealth: 'good' | 'warning' | 'critical';
    totalPatients?: number;
  };
  financialSummary?: FinancialSummary;
  branchPerformance?: BranchPerformance[];
  discountSummary?: DiscountSummary;
  paymentAnalytics?: PaymentAnalytics;
  branches?: Branch[];
  selectedBranch?: number | null;
}

export default function AdminDashboard({ 
  permissions, 
  masterDataStats, 
  recentActivity,
  systemStats,
  financialSummary,
  branchPerformance,
  discountSummary,
  paymentAnalytics,
  branches,
  selectedBranch
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Get active tab from URL hash or default to master-data
    const hash = window.location.hash.replace('#', '');
    return ['master-data', 'system-config', 'reporting'].includes(hash) ? hash : 'master-data';
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentBranch, setCurrentBranch] = useState<string>(selectedBranch?.toString() || 'all');
  
  // Simple permission check function
  const can = (permission: string) => {
    return permissions?.includes(permission) || false;
  };

  // Update URL hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['master-data', 'system-config', 'reporting'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh the page data
      router.reload({ 
        only: ['masterDataStats', 'recentActivity', 'systemStats', 'financialSummary', 'branchPerformance', 'discountSummary', 'paymentAnalytics'] 
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBranchChange = (value: string) => {
    setCurrentBranch(value);
    setIsRefreshing(true);
    
    // Reload page with branch filter
    const branchId = value === 'all' ? null : value;
    router.get(
      '/admin/dashboard',
      { branch_id: branchId },
      {
        preserveState: true,
        preserveScroll: true,
        only: ['masterDataStats', 'systemStats', 'financialSummary', 'branchPerformance', 'discountSummary', 'paymentAnalytics', 'selectedBranch'],
        onFinish: () => {
          setIsRefreshing(false);
          setLastUpdated(new Date());
        }
      }
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return '➕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const { auth } = usePage().props as any; // or better: use a type
  const user = auth?.user;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout user={user}>
      <Head title="Admin Dashboard - MediCare HMS" />

      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-4 py-6 space-y-6">
          
          {/* Header with Breadcrumbs */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Administration</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              <div className="mt-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Administration Panel</h1>
                  {branches && branches.length > 0 && (
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      {currentBranch === 'all' 
                        ? 'All Branches' 
                        : branches.find(b => b.id.toString() === currentBranch)?.code || 'Unknown'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm lg:text-base text-gray-600 mt-1">
                  Manage system configuration, master data, and generate reports
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {branches && branches.length > 0 && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <Select value={currentBranch} onValueChange={handleBranchChange}>
                    <SelectTrigger className="w-[200px] bg-white">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()}>
                          {branch.code} - {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">↻</span>
              </Button>
            </div>
          </div>

          {/* Financial Summary */}
          {financialSummary && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Financial Summary</h2>
                {branches && branches.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Showing data for: <span className="font-semibold">
                      {currentBranch === 'all' 
                        ? 'All Branches' 
                        : branches.find(b => b.id.toString() === currentBranch)?.name || 'Unknown Branch'}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(financialSummary.today.revenue)}</p>
                        <p className="text-xs text-gray-500 mt-1">{financialSummary.today.payments_count} payments</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(financialSummary.month.revenue)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {financialSummary.growth.trend === 'up' ? '↑' : '↓'} {Math.abs(financialSummary.growth.revenue_growth)}%
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Discounts (Month)</p>
                        <p className="text-2xl font-bold">{formatCurrency(financialSummary.month.discounts)}</p>
                        <p className="text-xs text-gray-500 mt-1">{financialSummary.month.discount_percentage}% of invoiced</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Outstanding</p>
                        <p className="text-2xl font-bold">{formatCurrency(financialSummary.outstanding)}</p>
                        <p className="text-xs text-gray-500 mt-1">Collection: {financialSummary.month.collection_rate}%</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* System Status Overview */}
          {systemStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Patients</p>
                      <p className="text-2xl font-bold">{systemStats.totalPatients || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                  <Link 
                    href="/patients/create"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <span>+ Add New Patient</span>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Today</p>
                      <p className="text-2xl font-bold">{systemStats.activeUsers}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Appointments</p>
                      <p className="text-2xl font-bold">{systemStats.todayAppointments}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Health</p>
                      <Badge 
                        variant={systemStats.systemHealth === 'good' ? 'default' : 
                                systemStats.systemHealth === 'warning' ? 'secondary' : 'destructive'}
                      >
                        {systemStats.systemHealth.toUpperCase()}
                      </Badge>
                    </div>
                    <AlertCircle className={`h-8 w-8 ${
                      systemStats.systemHealth === 'good' ? 'text-green-600' :
                      systemStats.systemHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="master-data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Master Data
              </TabsTrigger>
              <TabsTrigger value="system-config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Config
              </TabsTrigger>
              <TabsTrigger value="reporting" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reporting & Analytics
              </TabsTrigger>
            </TabsList>

            {/* Master Data Tab */}
            <TabsContent value="master-data" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Master Data Management Cards */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Master Data Management</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Departments Card */}
                    <>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Departments</CardTitle>
                                <CardDescription>Manage hospital departments</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary">{masterDataStats.departments}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Link 
                            href="/admin/departments"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Manage Departments →
                          </Link>
                        </CardContent>
                      </Card>
                    </>

                    {/* Wards & Beds Card */}
                    <>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Bed className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Wards & Beds</CardTitle>
                                <CardDescription>Manage wards and bed allocation</CardDescription>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">{masterDataStats.wards}</Badge>
                              <div className="text-xs text-gray-500 mt-1">{masterDataStats.beds} beds</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Link 
                            href="/admin/wards"
                            className="text-sm text-green-600 hover:text-green-800 font-medium"
                          >
                            Manage Wards & Beds →
                          </Link>
                        </CardContent>
                      </Card>
                    </>

                    {/* Test Catalogs Card */}
                    <>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <TestTube className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Test Catalogs</CardTitle>
                                <CardDescription>Manage laboratory tests</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary">{masterDataStats.tests}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Link 
                            href="/admin/test-catalogs"
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Manage Test Catalogs →
                          </Link>
                        </CardContent>
                      </Card>
                    </>

                    {/* Drug Formulary Card */}
                    <>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <Pill className="h-6 w-6 text-orange-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Drug Formulary</CardTitle>
                                <CardDescription>Manage medication catalog</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary">{masterDataStats.drugs}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Link 
                            href="/admin/drug-formulary"
                            className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                          >
                            Manage Drug Formulary →
                          </Link>
                        </CardContent>
                      </Card>
                    </>

                    {/* Physicians Card */}
                    <>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <Users className="h-6 w-6 text-emerald-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Physicians</CardTitle>
                                <CardDescription>Manage hospital physicians</CardDescription>
                              </div>
                            </div>
                            <Badge variant="secondary">👨‍⚕️</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Link 
                            href="/admin/physicians"
                            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Manage Physicians →
                          </Link>
                        </CardContent>
                      </Card>
                    </>
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <>
                  <div>
                    <DashboardActivityFeed activities={recentActivity} />
                  </div>
                </>
              </div>
            </TabsContent>

            {/* System Configuration Tab */}
            <TabsContent value="system-config" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>
                    Configure system settings, user management, and security options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/admin/branches">
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <h3 className="font-medium">Branch Management</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Manage hospital branches and locations</p>
                        <Button variant="outline" size="sm">Manage Branches →</Button>
                      </div>
                    </Link>

                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">User Management</h3>
                      <p className="text-sm text-gray-600 mb-3">Manage users, roles, and permissions</p>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">System Settings</h3>
                      <p className="text-sm text-gray-600 mb-3">General system configuration</p>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">Security</h3>
                      <p className="text-sm text-gray-600 mb-3">Security policies and audit logs</p>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reporting & Analytics Tab */}
            <TabsContent value="reporting" className="space-y-6">
              {/* Audit Statistics */}
              <>
                <AuditStats 
                  showCharts={true}
                  showExport={can("export master data")}
                />
              </>
              
              {/* Full Activity Feed */}
              <>
                <ActivityFeed 
                  limit={50}
                  showFilters={true}
                  showExport={can("export master data")}
                  autoRefresh={false}
                />
              </>
              
              <Card>
                <CardHeader>
                  <CardTitle>Additional Reports</CardTitle>
                  <CardDescription>
                    Generate additional reports and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">Master Data Reports</h3>
                      <p className="text-sm text-gray-600 mb-3">Export and analyze master data</p>
                      <Button variant="outline" size="sm">Generate</Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">System Analytics</h3>
                      <p className="text-sm text-gray-600 mb-3">View system usage and performance</p>
                      <Button variant="outline" size="sm">View Analytics</Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="font-medium mb-2">User Activity Reports</h3>
                      <p className="text-sm text-gray-600 mb-3">Review user activity and audit trails</p>
                      <Button variant="outline" size="sm">View Reports</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
