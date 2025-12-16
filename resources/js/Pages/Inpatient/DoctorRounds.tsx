import React, { useState, useEffect } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { 
  Stethoscope, Clock, CheckCircle, AlertTriangle, Calendar, 
  Plus, User, FileText, Edit3, Save, X, MessageSquare, 
  Activity, Heart, Thermometer, Eye, Play, Pause, 
  Users, TrendingUp, AlertCircle, Filter, Search
} from "lucide-react";

interface DoctorRound {
  id: number;
  patient_id: string;
  doctor_id: number;
  round_date: string;
  start_time?: string;
  end_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'late';
  notes?: string;
  assessment?: string;
  plan?: string;
  vital_signs?: any;
  electronic_signature?: string;
  signed_at?: string;
  first_name: string;
  last_name: string;
  hospital_id: string;
  doctor_name: string;
  created_at: string;
  updated_at: string;
}

interface RoundNote {
  id: number;
  round_id: number;
  note: string;
  type: 'observation' | 'assessment' | 'plan' | 'medication' | 'vital_signs' | 'general';
  created_by: number;
  created_by_name: string;
  created_at: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  hospital_id: string;
  bed_number?: string;
  ward_name?: string;
}

interface Props {
  rounds: DoctorRound[];
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    late: number;
  };
  assignedPatients: Patient[];
  currentDate: string;
  filters: {
    date: string;
    status?: string;
  };
}

export default function DoctorRounds({ rounds, stats, assignedPatients, currentDate, filters }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRound, setSelectedRound] = useState<DoctorRound | null>(null);
  const [roundNotes, setRoundNotes] = useState<RoundNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const { data, setData, post, processing, reset } = useForm({
    patient_id: "",
    round_date: currentDate,
    notes: "",
  });

  const { data: noteData, setData: setNoteData, post: postNote, reset: resetNote } = useForm({
    note: "",
    type: "general" as RoundNote['type'],
  });

  // Debug logging
  console.log('DoctorRounds props:', { rounds: rounds?.length, stats, assignedPatients: assignedPatients?.length, filters });

  const updateRoundStatus = async (roundId: number, newStatus: string) => {
    try {
      const response = await fetch(route('inpatient.rounds.updateStatus', roundId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.reload({ only: ['rounds', 'stats'] });
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const fetchNotes = async (roundId: number) => {
    try {
      const response = await fetch(route('inpatient.rounds.notes', roundId));
      if (response.ok) {
        const notes = await response.json();
        setRoundNotes(notes);
      } else {
        console.error('Failed to fetch notes');
        setRoundNotes([]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setRoundNotes([]);
    }
  };

  const handleAddNote = async (roundId: number) => {
    try {
      const response = await fetch(route('inpatient.rounds.addNote', roundId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          note: noteData.note,
          type: noteData.type,
        }),
      });

      if (response.ok) {
        resetNote();
        fetchNotes(roundId);
      } else {
        alert('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Error adding note');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('inpatient.rounds.store'), {
      onSuccess: () => {
        reset();
        setShowAddModal(false);
      },
      onError: (errors) => {
        console.error('Error creating round:', errors);
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'late':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'in_progress':
        return Play;
      case 'completed':
        return CheckCircle;
      case 'late':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
      case 'late':
        return 'in_progress';
      case 'in_progress':
        return 'completed';
      default:
        return null;
    }
  };

  const getActionButtonText = (status: string) => {
    switch (status) {
      case 'pending':
      case 'late':
        return 'Start Round';
      case 'in_progress':
        return 'Complete Round';
      default:
        return null;
    }
  };

  const filteredRounds = rounds.filter(round => {
    const matchesSearch = searchQuery === "" || 
      `${round.first_name} ${round.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      round.hospital_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "" || round.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter for date changes
  useEffect(() => {
    if (selectedDate !== currentDate) {
      router.get(route('inpatient.rounds'), { date: selectedDate }, { preserveState: true });
    }
  }, [selectedDate]);

  return (
    <HMSLayout>
      <Head title="Doctor Rounds" />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-8 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Doctor Rounds</h1>
                <p className="text-blue-100 mt-1">Manage your daily patient rounds and clinical notes</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 rounded-lg text-gray-900 border-0 focus:ring-2 focus:ring-white"
              />
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Round
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[
            { label: "Total", value: stats.total, color: "text-gray-600", bgColor: "bg-gray-50", icon: Users },
            { label: "Pending", value: stats.pending, color: "text-yellow-600", bgColor: "bg-yellow-50", icon: Clock },
            { label: "In Progress", value: stats.in_progress, color: "text-blue-600", bgColor: "bg-blue-50", icon: Play },
            { label: "Completed", value: stats.completed, color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle },
            { label: "Late", value: stats.late, color: "text-red-600", bgColor: "bg-red-50", icon: AlertTriangle },
          ].map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.label} className={`${stat.bgColor} rounded-xl p-6 border-2 border-opacity-20`}>
                <div className="flex items-center justify-between mb-3">
                  <IconComponent className={`w-8 h-8 ${stat.color}`} />
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
                <div className="text-gray-700 font-medium">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>

        {/* Rounds List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              Patient Rounds - {new Date(currentDate).toLocaleDateString()}
            </h2>
          </div>

          {filteredRounds.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredRounds.map((round) => {
                const StatusIcon = getStatusIcon(round.status);
                const nextStatus = getNextStatus(round.status);
                
                return (
                  <div key={round.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {round.first_name} {round.last_name}
                          </h3>
                          <p className="text-gray-600">ID: {round.hospital_id}</p>
                          {round.start_time && (
                            <p className="text-sm text-gray-500">
                              Started: {round.start_time}
                              {round.end_time && ` • Ended: ${round.end_time}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(round.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                          {round.status.replace('_', ' ').toUpperCase()}
                        </span>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {nextStatus && (
                            <button
                              onClick={() => updateRoundStatus(round.id, nextStatus)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                round.status === 'pending' || round.status === 'late'
                                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {round.status === 'pending' || round.status === 'late' ? (
                                <Play className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              {getActionButtonText(round.status)}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedRound(round);
                              setShowNotesModal(true);
                              fetchNotes(round.id);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Notes
                          </button>
                        </div>
                      </div>
                    </div>

                    {round.notes && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-gray-700">{round.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rounds scheduled</h3>
              <p className="text-gray-600 mb-4">Start by adding a new round for your patients.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Round
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Round Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Add New Round</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient
                </label>
                <select
                  value={data.patient_id}
                  onChange={(e) => setData("patient_id", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a patient...</option>
                  {assignedPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.hospital_id})
                      {patient.bed_number && ` - Bed ${patient.bed_number}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Notes (Optional)
                </label>
                <textarea
                  value={data.notes}
                  onChange={(e) => setData("notes", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any initial notes for this round..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {processing ? 'Adding...' : 'Add Round'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedRound && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Round Notes - {selectedRound.first_name} {selectedRound.last_name}
                  </h3>
                  <p className="text-gray-600">Patient ID: {selectedRound.hospital_id}</p>
                </div>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Add Note Form */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Add New Note</h4>
                <div className="space-y-3">
                  <div>
                    <select
                      value={noteData.type}
                      onChange={(e) => setNoteData("type", e.target.value as RoundNote['type'])}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="observation">Observation</option>
                      <option value="assessment">Assessment</option>
                      <option value="plan">Plan</option>
                      <option value="medication">Medication</option>
                      <option value="vital_signs">Vital Signs</option>
                    </select>
                  </div>
                  <div>
                    <textarea
                      value={noteData.note}
                      onChange={(e) => setNoteData("note", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter your note..."
                      required
                    />
                  </div>
                  <button
                    onClick={() => handleAddNote(selectedRound.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Previous Notes</h4>
                {roundNotes.length > 0 ? (
                  roundNotes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          note.type === 'observation' ? 'bg-blue-100 text-blue-800' :
                          note.type === 'assessment' ? 'bg-green-100 text-green-800' :
                          note.type === 'plan' ? 'bg-purple-100 text-purple-800' :
                          note.type === 'medication' ? 'bg-orange-100 text-orange-800' :
                          note.type === 'vital_signs' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {note.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="text-sm text-gray-500">
                          {note.created_by_name} • {new Date(note.created_at).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-gray-700">{note.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No notes added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </HMSLayout>
  );
}
