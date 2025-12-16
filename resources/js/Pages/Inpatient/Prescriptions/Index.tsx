import React, { useState, useEffect } from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent, CardHeader } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { PlusCircle, Pill, Calendar, User, Clock, ArrowLeft, Search } from "lucide-react";
import axios from "axios";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface Encounter {
  id: number;
  encounter_number: string;
  patient: Patient;
}

interface Prescription {
  id: number;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: number;
  quantity: number;
  status: string;
  notes?: string;
  created_at: string;
  has_schedules?: boolean;
  physician?: {
    name: string;
  };
}

interface Props {
  encounter: Encounter;
  prescriptions: Prescription[];
}

interface DrugFormulary {
  id: number;
  name: string;
  generic_name: string;
  brand_name?: string;
  display_name: string;
  strength: string;
  form: string;
  formulation?: string;
  full_name: string;
  suggested_dosage: string;
  suggested_frequency: string;
  suggested_duration: number;
  suggested_quantity: number;
  unit_price: number;
  stock_quantity: number;
  in_stock: boolean;
  contraindications: string[];
  side_effects: string[];
  notes?: string;
}

export default function PrescriptionsIndex({ encounter, prescriptions }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [drugSearch, setDrugSearch] = useState("");
  const [drugSuggestions, setDrugSuggestions] = useState<DrugFormulary[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugFormulary | null>(null);
  
  const { data, setData, post, processing, reset, errors } = useForm({
    drug_name: "",
    dosage: "",
    frequency: "Once daily",
    duration: 7,
    quantity: 30,
    notes: "",
    start_date: new Date().toISOString().split('T')[0],
    generate_schedule: true
  });

  // Search for drugs in formulary
  useEffect(() => {
    const searchDrugs = async () => {
      if (drugSearch.length >= 2) {
        try {
          const response = await axios.get(`/inpatient/api/search-formulary-drugs?q=${encodeURIComponent(drugSearch)}`);
          setDrugSuggestions(response.data);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error searching drugs:', error);
          setDrugSuggestions([]);
        }
      } else {
        setDrugSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(searchDrugs, 300);
    return () => clearTimeout(timeoutId);
  }, [drugSearch]);

  const handleDrugSelect = (drug: DrugFormulary) => {
    setSelectedDrug(drug);
    setDrugSearch(drug.display_name);
    setData({
      ...data,
      drug_name: drug.full_name,
      dosage: drug.suggested_dosage,
      frequency: drug.suggested_frequency,
      duration: drug.suggested_duration,
      quantity: drug.suggested_quantity,
      notes: drug.notes || ""
    });
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/inpatient/admissions/${encounter.id}/prescriptions`, {
      onSuccess: () => {
        reset();
        setShowForm(false);
        setDrugSearch("");
        setSelectedDrug(null);
      },
    });
  };

  const { post: postSchedule, processing: scheduleProcessing } = useForm({
    start_date: new Date().toISOString().split('T')[0]
  });

  const generateSchedule = (prescriptionId: number) => {
    postSchedule(`/inpatient/prescriptions/${prescriptionId}/generate-schedule`, {
      onSuccess: () => {
        // The page will reload automatically showing the updated status
      },
      onError: (errors) => {
        console.error('Failed to generate schedule:', errors);
        alert('Failed to generate medication schedule. Please try again.');
      }
    });
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    dispensed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <HMSLayout>
      <Head title={`Prescriptions - ${encounter.patient.first_name} ${encounter.patient.last_name}`} />
      
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/inpatient/care-plans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patients
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Prescriptions - {encounter.patient.first_name} {encounter.patient.last_name}
              </h2>
              <p className="text-gray-600">Encounter #{encounter.encounter_number}</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            New Prescription
          </Button>
        </div>

        {/* Add Prescription Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Add New Prescription</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Medication *
                    </label>
                    <div className="relative">
                      <Input
                        value={drugSearch}
                        onChange={(e) => setDrugSearch(e.target.value)}
                        placeholder="Start typing medication name..."
                        className="pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    
                    {/* Drug Suggestions Dropdown */}
                    {showSuggestions && drugSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {drugSuggestions.map((drug) => (
                          <div
                            key={drug.id}
                            onClick={() => handleDrugSelect(drug)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{drug.display_name}</div>
                                <div className="text-sm text-gray-600">{drug.strength} • {drug.form}</div>
                                {drug.generic_name !== drug.name && (
                                  <div className="text-xs text-gray-500">Generic: {drug.generic_name}</div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className={`text-xs px-2 py-1 rounded ${drug.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {drug.in_stock ? `${drug.stock_quantity} in stock` : 'Out of stock'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">KES {drug.unit_price}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Selected Drug Info */}
                    {selectedDrug && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-blue-900">{selectedDrug.display_name}</div>
                            <div className="text-sm text-blue-700">{selectedDrug.strength} • {selectedDrug.form}</div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDrug(null);
                              setDrugSearch("");
                              setData("drug_name", "");
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Name (Auto-filled) *
                    </label>
                    <Input
                      value={data.drug_name}
                      onChange={(e) => setData("drug_name", e.target.value)}
                      placeholder="Will be auto-filled from selection"
                      className={errors.drug_name ? "border-red-500" : ""}
                      readOnly={!!selectedDrug}
                    />
                    {errors.drug_name && <p className="text-red-500 text-sm mt-1">{errors.drug_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage {selectedDrug && <span className="text-blue-600">(Auto-filled)</span>} *
                    </label>
                    <Input
                      value={data.dosage}
                      onChange={(e) => setData("dosage", e.target.value)}
                      placeholder="e.g., 10mg"
                      className={errors.dosage ? "border-red-500" : ""}
                    />
                    {errors.dosage && <p className="text-red-500 text-sm mt-1">{errors.dosage}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency {selectedDrug && <span className="text-blue-600">(Auto-filled)</span>} *
                    </label>
                    <select
                      value={data.frequency}
                      onChange={(e) => setData("frequency", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="Every 4 hours">Every 4 hours</option>
                      <option value="Every 6 hours">Every 6 hours</option>
                      <option value="Every 8 hours">Every 8 hours</option>
                      <option value="As needed">As needed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days) {selectedDrug && <span className="text-blue-600">(Auto-filled)</span>} *
                    </label>
                    <Input
                      type="number"
                      value={data.duration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value);
                        setData("duration", newDuration);
                        // Auto-update quantity when duration changes
                        if (selectedDrug) {
                          const timesPerDay = selectedDrug.suggested_frequency.includes('twice') ? 2 :
                                            selectedDrug.suggested_frequency.includes('three') ? 3 :
                                            selectedDrug.suggested_frequency.includes('four') ? 4 : 1;
                          setData("quantity", timesPerDay * newDuration);
                        }
                      }}
                      min="1"
                      className={errors.duration ? "border-red-500" : ""}
                    />
                    {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity {selectedDrug && <span className="text-blue-600">(Auto-calculated)</span>} *
                    </label>
                    <Input
                      type="number"
                      value={data.quantity}
                      onChange={(e) => setData("quantity", parseInt(e.target.value))}
                      min="1"
                      className={errors.quantity ? "border-red-500" : ""}
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                    {selectedDrug && (
                      <p className="text-xs text-gray-500 mt-1">
                        Based on {data.frequency.toLowerCase()} for {data.duration} days
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={data.start_date}
                      onChange={(e) => setData("start_date", e.target.value)}
                      className={errors.start_date ? "border-red-500" : ""}
                    />
                    {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes {selectedDrug && selectedDrug.notes && <span className="text-blue-600">(Pre-filled from formulary)</span>}
                  </label>
                  <Textarea
                    value={data.notes}
                    onChange={(e) => setData("notes", e.target.value)}
                    placeholder="Additional instructions or notes..."
                    rows={3}
                  />
                </div>

                {/* Drug Information Display */}
                {selectedDrug && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">Drug Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Stock Available:</span>
                        <span className={`ml-2 ${selectedDrug.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedDrug.stock_quantity} units
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Unit Price:</span>
                        <span className="ml-2 text-gray-900">KES {selectedDrug.unit_price}</span>
                      </div>
                      {selectedDrug.contraindications.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-red-700">Contraindications:</span>
                          <ul className="ml-2 text-red-600 text-xs">
                            {selectedDrug.contraindications.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedDrug.side_effects.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-orange-700">Common Side Effects:</span>
                          <ul className="ml-2 text-orange-600 text-xs">
                            {selectedDrug.side_effects.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="generate_schedule"
                    checked={data.generate_schedule}
                    onChange={(e) => setData("generate_schedule", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="generate_schedule" className="text-sm text-gray-700">
                    Automatically generate medication administration schedule
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={processing}>
                    {processing ? "Adding..." : "Add Prescription"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Prescriptions List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Current Prescriptions</h3>
          
          {prescriptions.length > 0 ? (
            prescriptions.map((prescription) => (
              <Card key={prescription.id} className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Pill className="w-5 h-5 text-blue-500" />
                        <h4 className="text-lg font-semibold text-gray-800">
                          {prescription.drug_name}
                        </h4>
                        <Badge className={`${statusColors[prescription.status as keyof typeof statusColors]} border`}>
                          {prescription.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Dosage:</span> {prescription.dosage}
                        </div>
                        <div>
                          <span className="font-medium">Frequency:</span> {prescription.frequency}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {prescription.duration} days
                        </div>
                        <div>
                          <span className="font-medium">Quantity:</span> {prescription.quantity}
                        </div>
                      </div>

                      {prescription.notes && (
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Notes:</span> {prescription.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Added: {new Date(prescription.created_at).toLocaleDateString()}</span>
                        </div>
                        {prescription.physician && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>By: {prescription.physician.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {prescription.status === 'pending' && !prescription.has_schedules && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateSchedule(prescription.id)}
                          disabled={scheduleProcessing}
                          className="flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          {scheduleProcessing ? 'Generating...' : 'Generate Schedule'}
                        </Button>
                      )}
                      {prescription.has_schedules && (
                        <Badge className="bg-green-100 text-green-800 border border-green-200">
                          ✅ Schedule Created
                        </Badge>
                      )}
                      <Link href="/inpatient/medications">
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Pill className="w-3 h-3" />
                          View in Med Admin
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Pill className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Prescriptions</h3>
              <p className="text-gray-500">No prescriptions have been added for this patient yet.</p>
            </div>
          )}
        </div>
      </div>
    </HMSLayout>
  );
}
