import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
import { CalendarDays, ClipboardList, PlusCircle } from "lucide-react";
import { Select } from "@/Components/ui/select";

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    age?: number;
    gender?: string;
}

interface Encounter {
    id: number;
    encounter_number: string;
    admission_datetime: string;
    patient: Patient;
}

interface CarePlan {
    id: number;
    plan_date: string;
    shift: string;
    objectives: string;
    nursing_notes?: string;
    doctor_notes?: string;
    diet?: string;
    hydration?: string;
    is_completed?: boolean;
}

interface Props {
    Encounter: Encounter;
    plans: CarePlan[];
}

export default function CarePlansIndex({ Encounter, plans }: Props) {
    const [showForm, setShowForm] = useState(false);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatShift = (shift: string) => {
        return shift.charAt(0).toUpperCase() + shift.slice(1).toLowerCase();
    };
    const { data, setData, post, processing, reset } = useForm({
        plan_date: new Date().toISOString().split('T')[0],
        shift: "",
        objectives: "",
        nursing_notes: "",
        doctor_notes: "",
        diet: "",
        hydration: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!data.plan_date || !data.shift || !data.objectives.trim()) {
            alert('Please fill in the required fields: Plan Date, Shift, and Objectives');
            return;
        }

        post(`/inpatient/admissions/${Encounter.id}/care-plans`, {
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
        });
    };

    return (
        <HMSLayout>
            <Head title="Inpatient Care Plan" />
            <div className="max-w-5xl mx-auto py-8 space-y-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Care Plan — {Encounter.patient.first_name} {Encounter.patient.last_name}</h2>
                </div>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Daily Care Plans</h3>
                    <Button onClick={() => {
                        if (!showForm) {
                            reset();
                            setData('plan_date', new Date().toISOString().split('T')[0]);
                        }
                        setShowForm(!showForm);
                    }}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        New Plan
                    </Button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Date</label>
                                <Input type="date" value={data.plan_date} onChange={(e) => setData("plan_date", e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                <Select
                                    value={data.shift}
                                    onChange={(e) => setData("shift", e.target.value)}
                                    placeholder="Select Shift"
                                >
                                    <option value="MORNING">Morning</option>
                                    <option value="EVENING">Evening</option>
                                    <option value="NIGHT">Night</option>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Objectives / Goals *</label>
                            <Textarea placeholder="Describe the care objectives and goals for this shift..." value={data.objectives} onChange={(e) => setData("objectives", e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nursing Notes</label>
                            <Textarea placeholder="Nursing observations and notes..." value={data.nursing_notes} onChange={(e) => setData("nursing_notes", e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Notes</label>
                            <Textarea placeholder="Doctor's instructions and notes..." value={data.doctor_notes} onChange={(e) => setData("doctor_notes", e.target.value)} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
                                <Input placeholder="e.g. Soft diet, NPO, Regular" value={data.diet} onChange={(e) => setData("diet", e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hydration</label>
                                <Input placeholder="e.g. IV RL 1L 8hrly, PO fluids" value={data.hydration} onChange={(e) => setData("hydration", e.target.value)} />
                            </div>
                        </div>

                        <Button type="submit" disabled={processing} className="w-full mt-4">
                            {processing ? "Saving..." : "Save Plan"}
                        </Button>
                    </form>
                )}

                {plans.length ? (
                    plans.map((plan: CarePlan) => (
                        <Card key={plan.id} className="border-gray-200">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2 text-gray-700 font-semibold">
                                        <CalendarDays className="w-4 h-4 text-blue-500" />
                                        {formatDate(plan.plan_date)} — {formatShift(plan.shift)}
                                    </div>
                                    {plan.is_completed ? (
                                        <span className="text-green-600 text-sm font-medium">✔ Completed</span>
                                    ) : (
                                        <span className="text-yellow-600 text-sm font-medium">In Progress</span>
                                    )}
                                </div>

                                <p className="text-gray-700 mb-2">
                                    <ClipboardList className="w-4 h-4 inline text-gray-400 mr-1" />
                                    <span className="font-semibold">Objectives:</span> {plan.objectives}
                                </p>
                                <p className="text-sm text-gray-600 whitespace-pre-line">
                                    <span className="font-semibold text-gray-700">Nursing Notes:</span> {plan.nursing_notes}
                                </p>
                                <p className="text-sm text-gray-600 whitespace-pre-line mt-2">
                                    <span className="font-semibold text-gray-700">Doctor Notes:</span> {plan.doctor_notes}
                                </p>
                                <div className="text-sm text-gray-500 mt-3">
                                    Diet: {plan.diet || "—"} | Hydration: {plan.hydration || "—"}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-gray-500 text-center py-10">No care plans recorded yet.</div>
                )}
            </div>
        </HMSLayout>
    );
}
