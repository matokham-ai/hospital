import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { CalendarDays, ClipboardList, PlusCircle, User, Clock, FileText, Utensils, Droplets, X, CheckCircle, AlertCircle } from "lucide-react";

export default function CarePlans({ admission, plans }) {
  const [showForm, setShowForm] = useState(false);
  const { data, setData, post, processing, reset, errors } = useForm({
    plan_date: new Date().toISOString().split('T')[0], // Default to today
    shift: "",
    objectives: "",
    nursing_notes: "",
    doctor_notes: "",
    diet: "",
    hydration: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/inpatient/admissions/${admission.id}/care-plans`, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  };

  const getShiftIcon = (shift) => {
    switch (shift) {
      case 'MORNING': return '🌅';
      case 'EVENING': return '🌆';
      case 'NIGHT': return '🌙';
      default: return '⏰';
    }
  };

  const getShiftColor = (shift) => {
    switch (shift) {
      case 'MORNING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'EVENING': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'NIGHT': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <HMSLayout>
      <Head title={`Care Plan - ${admission?.patient?.name || 'Patient'}`} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                🏥 Care Plan Management
              </h1>
              <div className="flex items-center space-x-4 text-blue-100">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  <span className="font-medium">{admission?.patient?.name || 'Unknown Patient'}</span>
                </div>
                <div className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  <span>Admitted: {admission?.admission_datetime ? new Date(admission.admission_datetime).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              size="lg"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {showForm ? 'Cancel' : 'New Care Plan'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {showForm && (
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center text-blue-800">
                <FileText className="w-6 h-6 mr-3" />
                Create New Care Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date and Shift Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="plan_date" className="text-sm font-medium flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-blue-500" />
                      Plan Date
                    </Label>
                    <Input 
                      id="plan_date"
                      type="date" 
                      value={data.plan_date} 
                      onChange={(e) => setData("plan_date", e.target.value)}
                      className="w-full"
                      required
                    />
                    {errors.plan_date && <p className="text-sm text-red-600">{errors.plan_date}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shift" className="text-sm font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      Shift
                    </Label>
                    <Select value={data.shift} onValueChange={(value) => setData("shift", value)} required>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select shift period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MORNING">
                          <div className="flex items-center">
                            <span className="mr-2">🌅</span>
                            Morning Shift (6:00 AM - 2:00 PM)
                          </div>
                        </SelectItem>
                        <SelectItem value="EVENING">
                          <div className="flex items-center">
                            <span className="mr-2">🌆</span>
                            Evening Shift (2:00 PM - 10:00 PM)
                          </div>
                        </SelectItem>
                        <SelectItem value="NIGHT">
                          <div className="flex items-center">
                            <span className="mr-2">🌙</span>
                            Night Shift (10:00 PM - 6:00 AM)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.shift && <p className="text-sm text-red-600">{errors.shift}</p>}
                  </div>
                </div>

                {/* Objectives */}
                <div className="space-y-2">
                  <Label htmlFor="objectives" className="text-sm font-medium flex items-center">
                    <ClipboardList className="w-4 h-4 mr-2 text-blue-500" />
                    Care Objectives & Goals
                  </Label>
                  <Textarea 
                    id="objectives"
                    placeholder="Describe the main care objectives and goals for this shift..."
                    value={data.objectives} 
                    onChange={(e) => setData("objectives", e.target.value)}
                    className="min-h-[100px] resize-none"
                    required
                  />
                  {errors.objectives && <p className="text-sm text-red-600">{errors.objectives}</p>}
                </div>

                {/* Notes Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nursing_notes" className="text-sm font-medium flex items-center">
                      <User className="w-4 h-4 mr-2 text-green-500" />
                      Nursing Notes
                    </Label>
                    <Textarea 
                      id="nursing_notes"
                      placeholder="Nursing observations, interventions, and care notes..."
                      value={data.nursing_notes} 
                      onChange={(e) => setData("nursing_notes", e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="doctor_notes" className="text-sm font-medium flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-purple-500" />
                      Doctor Notes
                    </Label>
                    <Textarea 
                      id="doctor_notes"
                      placeholder="Doctor's instructions, medical notes, and orders..."
                      value={data.doctor_notes} 
                      onChange={(e) => setData("doctor_notes", e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>

                {/* Diet and Hydration Row */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="diet" className="text-sm font-medium flex items-center">
                      <Utensils className="w-4 h-4 mr-2 text-orange-500" />
                      Diet Plan
                    </Label>
                    <Input 
                      id="diet"
                      placeholder="e.g., Soft diet, NPO, Regular diet"
                      value={data.diet} 
                      onChange={(e) => setData("diet", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hydration" className="text-sm font-medium flex items-center">
                      <Droplets className="w-4 h-4 mr-2 text-cyan-500" />
                      Hydration Plan
                    </Label>
                    <Input 
                      id="hydration"
                      placeholder="e.g., IV RL 1L 8hrly, Oral fluids"
                      value={data.hydration} 
                      onChange={(e) => setData("hydration", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    disabled={processing}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Care Plan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Care Plans List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ClipboardList className="w-7 h-7 mr-3 text-blue-600" />
              Care Plans History
            </h2>
            <div className="text-sm text-gray-500">
              {plans?.length || 0} plan(s) recorded
            </div>
          </div>

          {plans && plans.length > 0 ? (
            <div className="grid gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getShiftColor(plan.shift)}`}>
                          <span className="mr-2">{getShiftIcon(plan.shift)}</span>
                          {plan.shift} Shift
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CalendarDays className="w-4 h-4 mr-2" />
                          <span className="font-medium">{new Date(plan.plan_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {plan.is_completed ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Objectives */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Care Objectives
                      </h4>
                      <p className="text-blue-700 leading-relaxed">{plan.objectives}</p>
                    </div>

                    {/* Notes Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {plan.nursing_notes && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Nursing Notes
                          </h4>
                          <p className="text-green-700 text-sm leading-relaxed whitespace-pre-line">{plan.nursing_notes}</p>
                        </div>
                      )}
                      
                      {plan.doctor_notes && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Doctor Notes
                          </h4>
                          <p className="text-purple-700 text-sm leading-relaxed whitespace-pre-line">{plan.doctor_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Diet and Hydration */}
                    {(plan.diet || plan.hydration) && (
                      <div className="grid md:grid-cols-2 gap-4">
                        {plan.diet && (
                          <div className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <Utensils className="w-5 h-5 text-orange-600 mr-3" />
                            <div>
                              <span className="text-sm font-medium text-orange-800">Diet:</span>
                              <span className="text-orange-700 ml-2">{plan.diet}</span>
                            </div>
                          </div>
                        )}
                        
                        {plan.hydration && (
                          <div className="flex items-center p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                            <Droplets className="w-5 h-5 text-cyan-600 mr-3" />
                            <div>
                              <span className="text-sm font-medium text-cyan-800">Hydration:</span>
                              <span className="text-cyan-700 ml-2">{plan.hydration}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
                      Created: {new Date(plan.created_at).toLocaleString()}
                      {plan.created_by && <span className="ml-4">By: Staff ID {plan.created_by}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Care Plans Yet</h3>
                <p className="text-gray-500 mb-6">
                  Start by creating the first care plan for {admission?.patient?.name || 'this patient'}.
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create First Care Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </HMSLayout>
  );
}
