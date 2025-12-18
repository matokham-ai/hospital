import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { FileText, Clock, User, ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface CarePlan {
  id: number;
  patient_name: string;
  patient_id: string;
  plan_date: string;
  priority: string;
  goals: string[];
  interventions: string[];
  status: string;
}

interface CarePlansIndexProps {
  carePlans: CarePlan[];
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

export default function CarePlansIndex({ carePlans, pagination, filters }: CarePlansIndexProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== (filters?.search || "")) {
        router.get(route('nurse.care-plans'), {
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
    router.get(route('nurse.care-plans'), {
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
          Showing {pagination.from} to {pagination.to} of {pagination.total} care plans
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
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <HMSLayout>
      <Head title="Care Plans - Nurse Dashboard" />
      
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/nurse/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Care Plans</h1>
            <p className="text-muted-foreground">Manage patient care plans and nursing interventions</p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Care Plans
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search care plans by patient, priority, goals, or interventions..."
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
                {pagination ? `Found ${pagination.total} care plans` : `Found ${carePlans.length} care plans`} matching "{searchQuery}"
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Today's Care Plans {pagination && `(${pagination.total})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carePlans.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <>
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No care plans found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No care plans for today</p>
                    <p className="text-sm text-muted-foreground mt-1">All care plans are up to date</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {carePlans.map((plan) => (
                  <div key={plan.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{plan.patient_name}</p>
                          <Badge variant={getPriorityColor(plan.priority)}>
                            {plan.priority.toUpperCase()}
                          </Badge>
                          <Badge variant={getStatusColor(plan.status)}>
                            {plan.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <strong>Goals:</strong> {plan.goals.join(', ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Interventions:</strong> {plan.interventions.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Plan Date: {new Date(plan.plan_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/nurse/patients/${plan.patient_id}`}>
                        <Button size="sm" variant="outline">View Patient</Button>
                      </Link>
                      <Button size="sm">Update Plan</Button>
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
