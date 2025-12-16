import React from "react";
import { Head } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { 
  Users, 
  Pill, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Stethoscope
} from "lucide-react";

interface DashboardProps {
  userName: string;
  userEmail: string;
  userRole: string;
  kpis: {
    assignedPatients: number;
    medicationsGiven: number;
    vitalsRecorded: number;
    pendingTasks: number;
  };
  todayPatients: Array<{
    id: number;
    name: string;
    room: string;
    condition: string;
    nextMedication: string;
    status: string;
  }>;
  nursingTasks: Array<{
    id: number;
    task: string;
    priority: string;
    time: string;
    count: number;
  }>;
}

export default function Dashboard({ 
  userName, 
  userEmail, 
  userRole, 
  kpis, 
  todayPatients, 
  nursingTasks 
}: DashboardProps) {
  return (
    <HMSLayout>
      <Head title={`${userRole} Dashboard - MediCare HMS`} />
      
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nursing Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userName}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned Patients</p>
                  <p className="text-2xl font-bold">{kpis.assignedPatients}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Medications Given</p>
                  <p className="text-2xl font-bold">{kpis.medicationsGiven}</p>
                </div>
                <Pill className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vitals Recorded</p>
                  <p className="text-2xl font-bold">{kpis.vitalsRecorded}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold">{kpis.pendingTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Today's Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.room}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={patient.condition === 'Stable' ? 'default' : 'secondary'}>
                        {patient.condition}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Next med: {patient.nextMedication}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Nursing Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Nursing Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nursingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{task.task}</p>
                        <p className="text-sm text-muted-foreground">{task.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{task.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Activity className="h-6 w-6" />
                Record Vitals
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Pill className="h-6 w-6" />
                Medication Round
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <AlertTriangle className="h-6 w-6" />
                Report Alert
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <CheckCircle className="h-6 w-6" />
                Complete Task
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
