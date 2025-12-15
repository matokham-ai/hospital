import React from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Activity, ArrowRight } from "lucide-react";

interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number | string;
  action: 'created' | 'updated' | 'deleted';
  user_name: string;
  created_at: string;
  created_at_human?: string;
  description?: string;
  summary?: string;
}

interface DashboardActivityFeedProps {
  activities: AuditLog[];
  loading?: boolean;
}

export default function DashboardActivityFeed({ activities, loading = false }: DashboardActivityFeedProps) {
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

  return (
    <Card data-testid="dashboard-activity-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system changes</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-6">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300 animate-pulse" />
            <p className="text-gray-500">Loading recent activity...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                    {activity.description || activity.summary || `${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} ${activity.entity_type.toLowerCase()}`}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>by {activity.user_name}</span>
                    <span>{activity.created_at_human || formatTimeAgo(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* View More Button */}
            <div className="pt-3 border-t">
              <Link href="/admin/audit">
                <Button variant="ghost" className="w-full justify-between text-sm">
                  <span>View all activity</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}