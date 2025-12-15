import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Activity, Filter, Download, RefreshCw } from "lucide-react";

interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: 'created' | 'updated' | 'deleted';
  user_name: string;
  changes: Record<string, any>;
  created_at: string;
  description?: string;
  created_at_human?: string;
}

interface ActivityFeedProps {
  limit?: number;
  showFilters?: boolean;
  showExport?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function ActivityFeed({
  limit = 10,
  showFilters = false,
  showExport = false,
  autoRefresh = false,
  refreshInterval = 60000
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    entity_type: '',
    action: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/admin/dashboard/activity?${params}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      } else {
        console.error('❌ Failed to fetch activities:', response.status, response.statusText);
        setActivities([]);
      }
    } catch (error) {
      console.error('⚠️ Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [limit, filters]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)));
      const response = await fetch(`/admin/export-audit-data?${params}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-feed-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('⚠️ Failed to export data:', error);
    }
  };

  return (
    <Card data-testid="activity-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system changes and updates</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            <Select
              value={filters.entity_type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, entity_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Ward">Ward</SelectItem>
                  <SelectItem value="Bed">Bed</SelectItem>
                  <SelectItem value="TestCatalog">Test Catalog</SelectItem>
                  <SelectItem value="DrugFormulary">Drug Formulary</SelectItem>
                </SelectContent>
            </Select>

            <Select
              value={filters.action}
              onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>

            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            />
            <Button
              variant="outline"
              onClick={() => setFilters({
                entity_type: 'all',
                action: 'all',
                user_id: '',
                date_from: '',
                date_to: ''
              })}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>

          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity found
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <span className="text-lg">{getActionIcon(activity.action)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(activity.action)}>
                      {activity.action}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {activity.entity_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      #{activity.entity_id}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-1">
                    {activity.description || `${activity.action} ${activity.entity_type.toLowerCase()}`}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>by {activity.user_name}</span>
                    <span>{activity.created_at_human || formatTimeAgo(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
