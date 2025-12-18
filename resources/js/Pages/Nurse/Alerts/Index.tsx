import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { AlertTriangle, Clock, User, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Alert {
  id: number;
  patient_name: string;
  patient_id: number;
  type: string;
  priority: string;
  message: string;
  created_at: string;
  status: string;
}

interface AlertsIndexProps {
  alerts: Alert[];
  pagination?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  filters?: {
    search?: string;
  };
}

export default function AlertsIndex({ alerts, pagination, filters }: AlertsIndexProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== (filters?.search || "")) {
        router.get(route('nurse.alerts'), {
          search: searchQuery
        }, {
          preserveState: true,
          replace: true
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    router.get(route('nurse.alerts'), {
      search: searchQuery,
      page: page
    }, {
      preserveState: true,
      replace: true
    });
  };

  // Pagination component
  const PaginationControls = () => {
    if (!pagination || pagination.last_page <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.from} to {pagination.to} of {pagination.total} alerts
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page >= pagination.last_page}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <HMSLayout>
      <Head title="Alerts - Nurse Dashboard" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Patient Alerts</h1>
            <p className="text-muted-foreground">Monitor and manage patient alerts</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Alert
            </Button>
            <Link href="/nurse/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Alerts
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts by patient, type, priority, or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </Button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-muted-foreground">
                {pagination ? `Found ${pagination.total} alerts` : `Found ${alerts.length} alerts`} matching "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts {pagination && `(${pagination.total})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No alerts found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No active alerts</p>
                    <p className="text-sm text-muted-foreground mt-1">All patients are stable</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        alert.priority === 'critical' ? 'bg-red-100' :
                        alert.priority === 'high' ? 'bg-orange-100' :
                        alert.priority === 'medium' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        <AlertTriangle className={`h-5 w-5 ${
                          alert.priority === 'critical' ? 'text-red-600' :
                          alert.priority === 'high' ? 'text-orange-600' :
                          alert.priority === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{alert.patient_name}</p>
                          <Badge variant={getPriorityColor(alert.priority)}>
                            {alert.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{alert.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/nurse/patients/${alert.patient_id}`}>
                        <Button size="sm" variant="outline">View Patient</Button>
                      </Link>
                      <Button size="sm">Resolve</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <PaginationControls />
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
