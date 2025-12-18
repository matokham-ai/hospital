import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import HMSLayout from '@/Layouts/HMSLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
  Droplets,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Save,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IORecord {
  id: number;
  time: string;
  type: 'intake' | 'output';
  category: string;
  amount: number;
  route: string;
  notes?: string;
}

interface IntakeOutputProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    bed: string;
    ward: string;
  };
  encounter_id: number;
  records: IORecord[];
  summary: {
    total_intake_24h: number;
    total_output_24h: number;
    balance_24h: number;
    total_intake_shift: number;
    total_output_shift: number;
    balance_shift: number;
  };
  shift: {
    start: string;
    current: string;
  };
}

export default function IntakeOutput({ patient, encounter_id, records, summary, shift }: IntakeOutputProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'intake' as 'intake' | 'output',
    category: '',
    amount: '',
    route: '',
    notes: '',
    time: new Date().toTimeString().slice(0, 5),
  });

  const intakeCategories = [
    'IV Fluids',
    'Oral Fluids',
    'Tube Feeding',
    'Blood Products',
    'Medications',
    'Other',
  ];

  const outputCategories = [
    'Urine',
    'Stool',
    'Vomit',
    'Drain',
    'NG Tube',
    'Wound',
    'Other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(`/nurse/ipd/intake-output/${encounter_id}`, formData, {
      onSuccess: () => {
        setShowAddForm(false);
        setFormData({
          type: 'intake',
          category: '',
          amount: '',
          route: '',
          notes: '',
          time: new Date().toTimeString().slice(0, 5),
        });
      },
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 500) return 'text-blue-600';
    if (balance < -500) return 'text-red-600';
    return 'text-green-600';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="h-5 w-5" />;
    if (balance < 0) return <TrendingDown className="h-5 w-5" />;
    return <BarChart3 className="h-5 w-5" />;
  };

  // Group records by shift periods
  const currentShiftRecords = records.filter(r => r.time >= shift.start);
  const intakeRecords = currentShiftRecords.filter(r => r.type === 'intake');
  const outputRecords = currentShiftRecords.filter(r => r.type === 'output');

  return (
    <HMSLayout>
      <Head title={`Intake/Output - ${patient.name}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Intake & Output Chart</h1>
            <p className="text-slate-600">
              {patient.name} • {patient.age}y, {patient.gender} • {patient.ward} - Bed {patient.bed}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.visit(`/nurse/patients/${patient.id}`)}>
              Back to Patient
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-6">
          {/* 24-Hour Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">24-Hour Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Intake</span>
                  <span className="text-xl font-bold text-blue-600">{summary.total_intake_24h} mL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Output</span>
                  <span className="text-xl font-bold text-orange-600">{summary.total_output_24h} mL</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Balance</span>
                    <div className={cn('flex items-center gap-2 text-xl font-bold', getBalanceColor(summary.balance_24h))}>
                      {getBalanceIcon(summary.balance_24h)}
                      <span>{summary.balance_24h > 0 ? '+' : ''}{summary.balance_24h} mL</span>
                    </div>
                  </div>
                  {Math.abs(summary.balance_24h) > 500 && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Significant fluid imbalance detected</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Shift Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Shift Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Shift Intake</span>
                  <span className="text-xl font-bold text-blue-600">{summary.total_intake_shift} mL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Shift Output</span>
                  <span className="text-xl font-bold text-orange-600">{summary.total_output_shift} mL</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Balance</span>
                    <div className={cn('flex items-center gap-2 text-xl font-bold', getBalanceColor(summary.balance_shift))}>
                      {getBalanceIcon(summary.balance_shift)}
                      <span>{summary.balance_shift > 0 ? '+' : ''}{summary.balance_shift} mL</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Shift started: {shift.start}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Record Form */}
        {showAddForm && (
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Intake/Output Record
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'intake' | 'output', category: '' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="intake">Intake</option>
                      <option value="output">Output</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    >
                      <option value="">Select category...</option>
                      {(formData.type === 'intake' ? intakeCategories : outputCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (mL) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="route">Route/Method *</Label>
                    <Input
                      id="route"
                      value={formData.route}
                      onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                      placeholder="e.g., IV, PO, Foley catheter"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      rows={2}
                      placeholder="Additional observations..."
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Record
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Records Table */}
        <div className="grid grid-cols-2 gap-6">
          {/* Intake Records */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                Intake Records (Current Shift)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {intakeRecords.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No intake records this shift</p>
              ) : (
                <div className="space-y-2">
                  {intakeRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-slate-600" />
                          <span className="text-sm font-semibold">{record.time}</span>
                          <Badge variant="outline" className="text-xs">{record.category}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{record.route}</p>
                        {record.notes && (
                          <p className="text-xs text-slate-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{record.amount} mL</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Shift Total</span>
                      <span className="text-blue-600">{summary.total_intake_shift} mL</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Records */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5 text-orange-600" />
                Output Records (Current Shift)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {outputRecords.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No output records this shift</p>
              ) : (
                <div className="space-y-2">
                  {outputRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-slate-600" />
                          <span className="text-sm font-semibold">{record.time}</span>
                          <Badge variant="outline" className="text-xs">{record.category}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{record.route}</p>
                        {record.notes && (
                          <p className="text-xs text-slate-500 mt-1">{record.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">{record.amount} mL</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Shift Total</span>
                      <span className="text-orange-600">{summary.total_output_shift} mL</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </HMSLayout>
  );
}
