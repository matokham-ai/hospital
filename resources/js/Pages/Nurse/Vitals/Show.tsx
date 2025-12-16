import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { Activity, ArrowLeft, Thermometer, Heart, Gauge, Wind, Droplets, Save, User, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Patient {
  id: string;
  name: string;
  date_of_birth: string;
  gender: string;
}

interface Encounter {
  id: number;
  patient: Patient;
  status: string;
}

interface VitalSign {
  id: number;
  temperature: number;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  respiratory_rate: number;
  oxygen_saturation: number;
  notes?: string;
  recorded_at: string;
}

interface VitalsShowProps {
  encounter: Encounter;
  patient: Patient;
  recentVitals: VitalSign[];
}

export default function VitalsShow({ encounter, patient, recentVitals }: VitalsShowProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    temperature: '',
    heart_rate: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('nurse.vitals.store', encounter.id), {
      onSuccess: () => {
        setShowSuccess(true);
        reset();
        setTimeout(() => setShowSuccess(false), 3000);
      },
      onError: (errors) => {
        console.error('Validation errors:', errors);
      }
    });
  };

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case 'temperature':
        if (value < 36.1 || value > 37.2) return 'abnormal';
        return 'normal';
      case 'heart_rate':
        if (value < 60 || value > 100) return 'abnormal';
        return 'normal';
      case 'blood_pressure_systolic':
        if (value < 90 || value > 140) return 'abnormal';
        return 'normal';
      case 'blood_pressure_diastolic':
        if (value < 60 || value > 90) return 'abnormal';
        return 'normal';
      case 'respiratory_rate':
        if (value < 12 || value > 20) return 'abnormal';
        return 'normal';
      case 'oxygen_saturation':
        if (value < 95) return 'abnormal';
        return 'normal';
      default:
        return 'normal';
    }
  };

  return (
    <HMSLayout>
      <Head title={`Record Vitals - ${patient.name} - Nurse Dashboard`} />
      
      <div className="space-y-8">
        <motion.div 
          className="flex items-center gap-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/nurse/vitals">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" size="lg" className="shadow-md">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Vitals
              </Button>
            </motion.div>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Record Vital Signs
            </h1>
            <p className="text-lg text-muted-foreground mt-1">
              Patient: <span className="font-semibold text-gray-700">{patient.name}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Time</p>
            <p className="text-lg font-semibold">{new Date().toLocaleTimeString()}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <User className="h-5 w-5" />
                  </div>
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p>{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p>{patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Encounter Status</p>
                  <Badge variant="default">{encounter.status}</Badge>
                </div>
              </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Vitals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                  Recent Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
              {recentVitals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent vital signs recorded</p>
              ) : (
                <div className="space-y-4">
                  {recentVitals.slice(0, 3).map((vital, index) => (
                    <motion.div 
                      key={vital.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm font-semibold text-green-700">
                          {new Date(vital.recorded_at).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          #{vital.id}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span>{vital.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span>{vital.heart_rate} bpm</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-blue-500" />
                          <span>{vital.systolic_bp}/{vital.diastolic_bp}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-emerald-500" />
                          <span>{vital.oxygen_saturation}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Vital signs recorded successfully!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Vital Signs Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Activity className="h-6 w-6" />
                </div>
                Record New Vital Signs
                <div className="ml-auto flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4" />
                  {new Date().toLocaleTimeString()}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Temperature */}
                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="temperature" className="flex items-center gap-2 text-base font-semibold">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Thermometer className="h-5 w-5 text-red-600" />
                    </div>
                    Temperature (°C)
                  </Label>
                  <div className="relative">
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="30"
                      max="45"
                      placeholder="36.5"
                      value={data.temperature}
                      onChange={(e) => setData('temperature', e.target.value)}
                      className={`h-12 text-lg font-medium transition-all duration-200 ${
                        errors.temperature 
                          ? 'border-red-500 bg-red-50' 
                          : data.temperature 
                            ? getVitalStatus('temperature', parseFloat(data.temperature)) === 'normal'
                              ? 'border-green-500 bg-green-50'
                              : 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-blue-400 focus:border-blue-500'
                      }`}
                    />
                    {data.temperature && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getVitalStatus('temperature', parseFloat(data.temperature)) === 'normal' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.temperature && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.temperature}
                    </motion.p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Normal: 36.1-37.2°C</span>
                    {data.temperature && (
                      <Badge variant={getVitalStatus('temperature', parseFloat(data.temperature)) === 'normal' ? 'default' : 'secondary'}>
                        {getVitalStatus('temperature', parseFloat(data.temperature)) === 'normal' ? 'Normal' : 'Abnormal'}
                      </Badge>
                    )}
                  </div>
                </motion.div>

                {/* Heart Rate */}
                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="heart_rate" className="flex items-center gap-2 text-base font-semibold">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Heart className="h-5 w-5 text-pink-600" />
                    </div>
                    Heart Rate (bpm)
                  </Label>
                  <div className="relative">
                    <Input
                      id="heart_rate"
                      type="number"
                      min="30"
                      max="200"
                      placeholder="72"
                      value={data.heart_rate}
                      onChange={(e) => setData('heart_rate', e.target.value)}
                      className={`h-12 text-lg font-medium transition-all duration-200 ${
                        errors.heart_rate 
                          ? 'border-red-500 bg-red-50' 
                          : data.heart_rate 
                            ? getVitalStatus('heart_rate', parseFloat(data.heart_rate)) === 'normal'
                              ? 'border-green-500 bg-green-50'
                              : 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-blue-400 focus:border-blue-500'
                      }`}
                    />
                    {data.heart_rate && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getVitalStatus('heart_rate', parseFloat(data.heart_rate)) === 'normal' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.heart_rate && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.heart_rate}
                    </motion.p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Normal: 60-100 bpm</span>
                    {data.heart_rate && (
                      <Badge variant={getVitalStatus('heart_rate', parseFloat(data.heart_rate)) === 'normal' ? 'default' : 'secondary'}>
                        {getVitalStatus('heart_rate', parseFloat(data.heart_rate)) === 'normal' ? 'Normal' : 'Abnormal'}
                      </Badge>
                    )}
                  </div>
                </motion.div>

                {/* Blood Pressure Combined */}
                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Gauge className="h-5 w-5 text-blue-600" />
                    </div>
                    Blood Pressure (mmHg)
                  </Label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        id="blood_pressure_systolic"
                        type="number"
                        min="70"
                        max="250"
                        placeholder="120"
                        value={data.blood_pressure_systolic}
                        onChange={(e) => setData('blood_pressure_systolic', e.target.value)}
                        className={`h-12 text-lg font-medium transition-all duration-200 ${
                          errors.blood_pressure_systolic 
                            ? 'border-red-500 bg-red-50' 
                            : data.blood_pressure_systolic 
                              ? getVitalStatus('blood_pressure_systolic', parseFloat(data.blood_pressure_systolic)) === 'normal'
                                ? 'border-green-500 bg-green-50'
                                : 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-blue-400 focus:border-blue-500'
                        }`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Systolic</p>
                    </div>
                    <div className="flex items-center text-2xl font-bold text-muted-foreground">/</div>
                    <div className="flex-1">
                      <Input
                        id="blood_pressure_diastolic"
                        type="number"
                        min="40"
                        max="150"
                        placeholder="80"
                        value={data.blood_pressure_diastolic}
                        onChange={(e) => setData('blood_pressure_diastolic', e.target.value)}
                        className={`h-12 text-lg font-medium transition-all duration-200 ${
                          errors.blood_pressure_diastolic 
                            ? 'border-red-500 bg-red-50' 
                            : data.blood_pressure_diastolic 
                              ? getVitalStatus('blood_pressure_diastolic', parseFloat(data.blood_pressure_diastolic)) === 'normal'
                                ? 'border-green-500 bg-green-50'
                                : 'border-amber-500 bg-amber-50'
                              : 'border-gray-200 hover:border-blue-400 focus:border-blue-500'
                        }`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Diastolic</p>
                    </div>
                  </div>
                  {(errors.blood_pressure_systolic || errors.blood_pressure_diastolic) && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.blood_pressure_systolic || errors.blood_pressure_diastolic}
                    </motion.p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Normal: 90-140 / 60-90 mmHg</span>
                    {data.blood_pressure_systolic && data.blood_pressure_diastolic && (
                      <Badge variant="default">
                        {data.blood_pressure_systolic}/{data.blood_pressure_diastolic}
                      </Badge>
                    )}
                  </div>
                </motion.div>


              </div>

              {/* Second Row - Respiratory Rate and Oxygen Saturation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Respiratory Rate */}
                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="respiratory_rate" className="flex items-center gap-2 text-base font-semibold">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Wind className="h-5 w-5 text-cyan-600" />
                    </div>
                    Respiratory Rate (/min)
                  </Label>
                  <div className="relative">
                    <Input
                      id="respiratory_rate"
                      type="number"
                      min="8"
                      max="40"
                      placeholder="16"
                      value={data.respiratory_rate}
                      onChange={(e) => setData('respiratory_rate', e.target.value)}
                      className={`h-12 text-lg font-medium transition-all duration-200 ${
                        errors.respiratory_rate 
                          ? 'border-red-500 bg-red-50' 
                          : data.respiratory_rate 
                            ? getVitalStatus('respiratory_rate', parseFloat(data.respiratory_rate)) === 'normal'
                              ? 'border-green-500 bg-green-50'
                              : 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-blue-400 focus:border-blue-500'
                      }`}
                    />
                    {data.respiratory_rate && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getVitalStatus('respiratory_rate', parseFloat(data.respiratory_rate)) === 'normal' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.respiratory_rate && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.respiratory_rate}
                    </motion.p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Normal: 12-20 /min</span>
                    {data.respiratory_rate && (
                      <Badge variant={getVitalStatus('respiratory_rate', parseFloat(data.respiratory_rate)) === 'normal' ? 'default' : 'secondary'}>
                        {getVitalStatus('respiratory_rate', parseFloat(data.respiratory_rate)) === 'normal' ? 'Normal' : 'Abnormal'}
                      </Badge>
                    )}
                  </div>
                </motion.div>

                {/* Oxygen Saturation */}
                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="oxygen_saturation" className="flex items-center gap-2 text-base font-semibold">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Droplets className="h-5 w-5 text-emerald-600" />
                    </div>
                    Oxygen Saturation (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="oxygen_saturation"
                      type="number"
                      min="70"
                      max="100"
                      placeholder="98"
                      value={data.oxygen_saturation}
                      onChange={(e) => setData('oxygen_saturation', e.target.value)}
                      className={`h-12 text-lg font-medium transition-all duration-200 ${
                        errors.oxygen_saturation 
                          ? 'border-red-500 bg-red-50' 
                          : data.oxygen_saturation 
                            ? getVitalStatus('oxygen_saturation', parseFloat(data.oxygen_saturation)) === 'normal'
                              ? 'border-green-500 bg-green-50'
                              : 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-blue-400 focus:border-blue-500'
                      }`}
                    />
                    {data.oxygen_saturation && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {getVitalStatus('oxygen_saturation', parseFloat(data.oxygen_saturation)) === 'normal' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.oxygen_saturation && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.oxygen_saturation}
                    </motion.p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Normal: ≥95%</span>
                    {data.oxygen_saturation && (
                      <Badge variant={getVitalStatus('oxygen_saturation', parseFloat(data.oxygen_saturation)) === 'normal' ? 'default' : 'secondary'}>
                        {getVitalStatus('oxygen_saturation', parseFloat(data.oxygen_saturation)) === 'normal' ? 'Normal' : 'Abnormal'}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Notes */}
              <motion.div 
                className="space-y-3"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Label htmlFor="notes" className="text-base font-semibold">Clinical Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional observations, patient reactions, or clinical notes..."
                  value={data.notes}
                  onChange={(e) => setData('notes', e.target.value)}
                  className={`min-h-[100px] transition-all duration-200 ${
                    errors.notes ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-blue-400 focus:border-blue-500'
                  }`}
                />
                {errors.notes && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {errors.notes}
                  </motion.p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.div 
                className="flex gap-4 pt-4 border-t border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1"
                >
                  <Button 
                    type="submit" 
                    disabled={processing} 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-200"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Recording Vital Signs...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-3" />
                        Record Vital Signs
                      </>
                    )}
                  </Button>
                </motion.div>
                <Link href="/nurse/vitals">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button type="button" variant="outline" className="h-14 px-8 text-lg">
                      Cancel
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </HMSLayout>
  );
}
