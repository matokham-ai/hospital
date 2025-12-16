import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import {
  Settings,
  Building2,
  Bed,
  TestTube,
  Pill,
  Activity,
  RefreshCw,
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
  Eye,
  ExternalLink
} from "lucide-react";

interface KPIs {
  todayAppointments: number;
  activeAdmissions: number;
  pendingBills: number;
  labsPending: number;
  bedOccupancy: number;
  totalRevenue: number;
  patientsToday: number;
  activeConsultations: number;
  urgentLabTests: number;
}

interface ActivityItem {
  id: number;
  type: string;
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'normal';
}

interface Alert {
  id: number;
  type: 'warning' | 'error' | 'info';
  message: string;
}

interface DepartmentWorkload {
  dept: string;
  load: number;
  color: string;
}

interface AdminDashboardProps {
  userName?: string;
  kpis?: KPIs;
  recentActivity?: ActivityItem[];
  alerts?: Alert[];
  departmentWorkload?: DepartmentWorkload[];
  lastUpdated?: string;
}



export default function AdminDashboard({
  userName = 'Admin',
  kpis = {
    todayAppointments: 0,
    activeAdmissions: 0,
    pendingBills: 0,
    labsPending: 0,
    bedOccupancy: 0,
    totalRevenue: 0,
    patientsToday: 0,
    activeConsultations: 0,
    urgentLabTests: 0
  },
  recentActivity = [],
  alerts = [],
  departmentWorkload = [],
  lastUpdated = new Date().toISOString()
}: AdminDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchModalData = async (endpoint: string) => {
    setModalLoading(true);
    setModalData([]);

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModalData(data.data || data.departments || data.wards || data.tests || data);
      } else {
        console.error('Failed to fetch data:', response.statusText);
        setModalData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <HMSLayout>
      <Head title="Admin Dashboard - MediCare HMS" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {userName}</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border flex items-center gap-2 ${getAlertBgColor(alert.type)}`}
            >
              {getAlertIcon(alert.type)}
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold">{kpis?.todayAppointments || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Admissions</p>
                <p className="text-2xl font-bold">{kpis?.activeAdmissions || 0}</p>
              </div>
              <Bed className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bed Occupancy</p>
                <p className="text-2xl font-bold">{kpis?.bedOccupancy || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis?.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                <p className="text-2xl font-bold">{kpis?.pendingBills || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Labs Pending</p>
                <p className="text-2xl font-bold">{kpis?.labsPending || 0}</p>
              </div>
              <TestTube className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Patients Today</p>
                <p className="text-2xl font-bold">{kpis?.patientsToday || 0}</p>
              </div>
              <Users className="h-8 w-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Consultations</p>
                <p className="text-2xl font-bold">{kpis?.activeConsultations || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 ${activity.priority === 'high' ? 'bg-red-500' :
                        activity.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions with Working Modals */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Department Workload
              </CardTitle>
              <CardDescription>Current department activity levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departmentWorkload && departmentWorkload.length > 0 ? (
                  departmentWorkload.map((dept) => (
                    <div key={dept.dept} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{dept.dept}</span>
                        <span className="text-gray-500">{dept.load}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-${dept.color}-500`}
                          style={{ width: `${Math.min(100, dept.load)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No department data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions with Working Modals */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Departments Modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => fetchModalData('/admin/departments')}
                    className="block w-full p-3 text-left rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="font-medium text-gray-900">Manage Departments</p>
                          <p className="text-sm text-gray-500">Configure hospital departments</p>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Department Management
                    </DialogTitle>
                    <DialogDescription>
                      View and manage hospital departments
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {modalLoading ? 'Loading...' : `${modalData.length} departments found`}
                      </p>
                      <Link href="/admin/departments">
                        <Button size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Full Management
                        </Button>
                      </Link>
                    </div>

                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {modalLoading ? (
                        <div className="p-8 text-center">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                          <p className="text-sm text-gray-500">Loading departments...</p>
                        </div>
                      ) : modalData.length > 0 ? (
                        modalData.map((item: any, index: number) => (
                          <div key={item.id || index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.name || 'Unknown'}</h4>
                                <p className="text-sm text-gray-500">
                                  {item.code && `Code: ${item.code}`}
                                  {item.head_of_department && ` • Head: ${item.head_of_department}`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {item.wards_count !== undefined && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.wards_count} wards
                                  </Badge>
                                )}
                                {item.status && (
                                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                    {item.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No departments found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Wards Modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => fetchModalData('/admin/wards')}
                    className="block w-full p-3 text-left rounded-lg border hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bed className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="font-medium text-gray-900">Manage Wards</p>
                          <p className="text-sm text-gray-500">Configure wards and beds</p>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 group-hover:text-green-600" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-green-600" />
                      Ward Management
                    </DialogTitle>
                    <DialogDescription>
                      View and manage hospital wards and beds
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {modalLoading ? 'Loading...' : `${modalData.length} wards found`}
                      </p>
                      <Link href="/admin/wards">
                        <Button size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Full Management
                        </Button>
                      </Link>
                    </div>

                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {modalLoading ? (
                        <div className="p-8 text-center">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-green-600" />
                          <p className="text-sm text-gray-500">Loading wards...</p>
                        </div>
                      ) : modalData.length > 0 ? (
                        modalData.map((item: any, index: number) => (
                          <div key={item.id || index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.name || 'Unknown Ward'}</h4>
                                <p className="text-sm text-gray-500">
                                  {item.department && `Department: ${item.department}`}
                                  {item.total_beds && ` • ${item.total_beds} beds`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {item.occupancy_rate !== undefined && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.occupancy_rate}% occupied
                                  </Badge>
                                )}
                                {item.status && (
                                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                    {item.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bed className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No wards found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Test Catalog Modal */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => fetchModalData('/admin/test-catalogs')}
                    className="block w-full p-3 text-left rounded-lg border hover:bg-purple-50 hover:border-purple-200 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TestTube className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="font-medium text-gray-900">Test Catalog</p>
                          <p className="text-sm text-gray-500">Manage laboratory tests</p>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-purple-600" />
                      Test Catalog Management
                    </DialogTitle>
                    <DialogDescription>
                      View and manage laboratory test catalog
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {modalLoading ? 'Loading...' : `${modalData.length} tests found`}
                      </p>
                      <Link href="/admin/test-catalogs">
                        <Button size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Full Catalog
                        </Button>
                      </Link>
                    </div>

                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {modalLoading ? (
                        <div className="p-8 text-center">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                          <p className="text-sm text-gray-500">Loading tests...</p>
                        </div>
                      ) : modalData.length > 0 ? (
                        modalData.map((item: any, index: number) => (
                          <div key={item.id || index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{item.name || 'Unknown Test'}</h4>
                                <p className="text-sm text-gray-500">
                                  {item.code && `Code: ${item.code}`}
                                  {item.category && ` • ${item.category}`}
                                  {item.turnaround_time && ` • ${item.turnaround_time}`}
                                </p>
                              </div>
                              <div className="text-right">
                                {item.price && (
                                  <div className="font-medium text-purple-600">
                                    {formatCurrency(item.price)}
                                  </div>
                                )}
                                {item.status && (
                                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                    {item.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <TestTube className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>No tests found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Coming Soon Items */}
              <div className="p-3 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 opacity-75">
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Drug Formulary</p>
                    <p className="text-sm text-orange-700">Advanced medication management coming soon</p>
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 opacity-75">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-indigo-900">Reports & Analytics</p>
                    <p className="text-sm text-indigo-700">Advanced reporting dashboard coming soon</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </div>
    </HMSLayout>
  );
}
