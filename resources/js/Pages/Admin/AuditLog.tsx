import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/Components/ui/breadcrumb';
import ActivityFeed from '@/Components/Admin/ActivityFeed';
import AuditStats from '@/Components/Admin/AuditStats';
import ChangeHistory from '@/Components/Admin/ChangeHistory';
import { History, BarChart3, Activity, Search } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuditLogProps {
  user: User;
  permissions: string[];
}

const AuditLog: React.FC<AuditLogProps> = ({ user, permissions }) => {
  const [activeTab, setActiveTab] = useState('activity');
  const [selectedEntity, setSelectedEntity] = useState<{
    type: string;
    id: number;
    name?: string;
  } | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0], // today
  });

  const handleEntitySelect = (entityType: string, entityId: number, entityName?: string) => {
    setSelectedEntity({
      type: entityType,
      id: entityId,
      name: entityName,
    });
    setActiveTab('history');
  };

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <AdminLayout user={user}>
      <Head title="Audit Log - MediCare HMS" />

      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Header with Breadcrumbs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin/dashboard">Administration</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Audit Log</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              
              <div className="mt-2">
                <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
                <p className="text-gray-600 mt-1">
                  Track and analyze all system changes and user activities
                </p>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => handleDateRangeChange('from', e.target.value)}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Feed
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Entity History
              </TabsTrigger>
            </TabsList>

            {/* Activity Feed Tab */}
            <TabsContent value="activity" className="space-y-6">
              <ActivityFeed 
                limit={100}
                showFilters={true}
                showExport={true}
                autoRefresh={true}
                refreshInterval={30000}
              />
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-6">
              <AuditStats 
                dateRange={dateRange}
                showCharts={true}
                showExport={true}
              />
            </TabsContent>

            {/* Entity History Tab */}
            <TabsContent value="history" className="space-y-6">
              {selectedEntity ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Viewing History For
                      </CardTitle>
                      <CardDescription>
                        {selectedEntity.name || `${selectedEntity.type} #${selectedEntity.id}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="font-medium">Entity Type:</span> {selectedEntity.type}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Entity ID:</span> {selectedEntity.id}
                        </div>
                        <button
                          onClick={() => setSelectedEntity(null)}
                          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <ChangeHistory
                    entityType={selectedEntity.type}
                    entityId={selectedEntity.id}
                    entityName={selectedEntity.name}
                    limit={100}
                    showDetails={true}
                  />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Entity History Lookup
                    </CardTitle>
                    <CardDescription>
                      Select an entity from the activity feed or enter details manually to view its change history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Entity Type
                          </label>
                          <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            onChange={(e) => {
                              const entityType = e.target.value;
                              if (entityType) {
                                // You could add logic here to show a list of entities of this type
                                console.log('Selected entity type:', entityType);
                              }
                            }}
                          >
                            <option value="">Select entity type...</option>
                            <option value="departments">Departments</option>
                            <option value="wards">Wards</option>
                            <option value="beds">Beds</option>
                            <option value="test_catalogs">Test Catalogs</option>
                            <option value="drug_formulary">Drug Formulary</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Entity ID
                          </label>
                          <input
                            type="number"
                            placeholder="Enter entity ID..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => {
                              // Add logic to handle manual entity selection
                              console.log('Manual entity lookup');
                            }}
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View History
                          </button>
                        </div>
                      </div>

                      <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No Entity Selected</p>
                        <p className="text-sm">
                          Click on an entity from the activity feed or use the form above to view change history
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLog;