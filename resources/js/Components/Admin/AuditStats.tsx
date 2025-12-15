import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { BarChart3, TrendingUp, Users, Calendar, Download, RefreshCw } from "lucide-react";

interface AuditStatsData {
  totalActions: number;
  todayActions: number;
  activeUsers: number;
  topEntities: Array<{ entity_type: string; count: number }>;
  actionBreakdown: Array<{ action: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
  userActivity: Array<{ user_name: string; count: number }>;
}

interface AuditStatsProps {
  showCharts?: boolean;
  showExport?: boolean;
}

export default function AuditStats({ showCharts = true, showExport = false }: AuditStatsProps) {
  const [stats, setStats] = useState<AuditStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7'); // days

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date_from: new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0]
      });
      
      const response = await fetch(`/admin/audit-stats?${params}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch audit stats:', response.status, response.statusText);
        // Set mock data for development
        setStats({
          totalActions: 1247,
          todayActions: 23,
          activeUsers: 15,
          topEntities: [
            { entity_type: 'Department', count: 45 },
            { entity_type: 'Ward', count: 32 },
            { entity_type: 'Bed', count: 28 },
            { entity_type: 'TestCatalog', count: 19 },
            { entity_type: 'DrugFormulary', count: 12 }
          ],
          actionBreakdown: [
            { action: 'updated', count: 67 },
            { action: 'created', count: 23 },
            { action: 'deleted', count: 8 }
          ],
          dailyActivity: [
            { date: '2024-01-01', count: 12 },
            { date: '2024-01-02', count: 18 },
            { date: '2024-01-03', count: 15 },
            { date: '2024-01-04', count: 22 },
            { date: '2024-01-05', count: 19 },
            { date: '2024-01-06', count: 25 },
            { date: '2024-01-07', count: 23 }
          ],
          userActivity: [
            { user_name: 'Dr. Smith', count: 34 },
            { user_name: 'Admin User', count: 28 },
            { user_name: 'Nurse Johnson', count: 19 },
            { user_name: 'Dr. Brown', count: 15 },
            { user_name: 'Receptionist', count: 12 }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
      // Set mock data for development
      setStats({
        totalActions: 1247,
        todayActions: 23,
        activeUsers: 15,
        topEntities: [
          { entity_type: 'Department', count: 45 },
          { entity_type: 'Ward', count: 32 },
          { entity_type: 'Bed', count: 28 },
          { entity_type: 'TestCatalog', count: 19 },
          { entity_type: 'DrugFormulary', count: 12 }
        ],
        actionBreakdown: [
          { action: 'updated', count: 67 },
          { action: 'created', count: 23 },
          { action: 'deleted', count: 8 }
        ],
        dailyActivity: [
          { date: '2024-01-01', count: 12 },
          { date: '2024-01-02', count: 18 },
          { date: '2024-01-03', count: 15 },
          { date: '2024-01-04', count: 22 },
          { date: '2024-01-05', count: 19 },
          { date: '2024-01-06', count: 25 },
          { date: '2024-01-07', count: 23 }
        ],
        userActivity: [
          { user_name: 'Dr. Smith', count: 34 },
          { user_name: 'Admin User', count: 28 },
          { user_name: 'Nurse Johnson', count: 19 },
          { user_name: 'Dr. Brown', count: 15 },
          { user_name: 'Receptionist', count: 12 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const SimpleBarChart = ({ data, title }: { data: Array<{ name?: string; entity_type?: string; user_name?: string; count: number }>, title: string }) => {
    const maxCount = Math.max(...data.map(item => item.count));
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="space-y-2">
          {data.slice(0, 5).map((item, index) => {
            const name = item.name || item.entity_type || item.user_name || 'Unknown';
            const percentage = (item.count / maxCount) * 100;
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-sm text-gray-600 truncate">{name}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-8 text-sm font-medium text-gray-900">{item.count}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SimpleLineChart = ({ data }: { data: Array<{ date: string; count: number }> }) => {
    const maxCount = Math.max(...data.map(item => item.count));
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Daily Activity Trend</h4>
        <div className="flex items-end justify-between h-32 gap-1">
          {data.map((item, index) => {
            const height = (item.count / maxCount) * 100;
            const date = new Date(item.date);
            
            return (
              <div key={index} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end h-24">
                  <div 
                    className="bg-blue-600 rounded-t w-full min-w-[8px] transition-all duration-300 hover:bg-blue-700"
                    style={{ height: `${height}%` }}
                    title={`${item.count} actions on ${date.toLocaleDateString()}`}
                  />
                </div>
                <div className="text-xs text-gray-500 rotate-45 origin-left">
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading statistics...</span>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-gray-500">
          Failed to load audit statistics
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold">{stats.totalActions.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Actions</p>
                <p className="text-2xl font-bold">{stats.todayActions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Date Range</p>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Action Breakdown</CardTitle>
              <CardDescription>Distribution of different action types</CardDescription>
            </div>
            {showExport && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {stats.actionBreakdown.map((item, index) => (
              <Badge key={index} className={getActionColor(item.action)}>
                {item.action}: {item.count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Entities</CardTitle>
              <CardDescription>Most frequently modified entities</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={stats.topEntities} title="Entity Activity" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Users</CardTitle>
              <CardDescription>Most active users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={stats.userActivity} title="User Activity" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity Trend</CardTitle>
              <CardDescription>Daily activity over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={stats.dailyActivity} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}