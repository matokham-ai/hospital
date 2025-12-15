import { PatientProfileData } from "../components/PatientProfile";

export function generateSamplePatientData(patientId: number, name: string, bedNumber: string, ward: string): PatientProfileData {
  const isCritical = Math.random() > 0.7;
  
  return {
    id: patientId,
    name,
    bedNumber,
    ward,
    age: 25 + Math.floor(Math.random() * 60),
    gender: Math.random() > 0.5 ? "M" : "F",
    diagnosis: isCritical ? "Acute respiratory distress" : "Post-operative recovery",
    admissionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: isCritical ? "critical" : Math.random() > 0.5 ? "stable" : "review",
    vitals: {
      hr: isCritical ? 110 + Math.floor(Math.random() * 20) : 70 + Math.floor(Math.random() * 20),
      bp: isCritical ? "90/60" : "120/80",
      temp: isCritical ? 38.5 + Math.random() * 1.5 : 36.5 + Math.random() * 1,
      spo2: isCritical ? 88 + Math.floor(Math.random() * 7) : 96 + Math.floor(Math.random() * 4),
      rr: isCritical ? 22 + Math.floor(Math.random() * 8) : 16 + Math.floor(Math.random() * 4),
      lastUpdated: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toLocaleString(),
    },
    medications: [
      {
        name: "Paracetamol",
        dosage: "500mg",
        frequency: "Every 6 hours",
        route: "Oral",
        nextDue: "14:00",
        status: "due",
      },
      {
        name: "Amoxicillin",
        dosage: "250mg",
        frequency: "Every 8 hours",
        route: "Oral",
        nextDue: "16:00",
        status: "given",
      },
      ...(isCritical ? [{
        name: "IV Antibiotics",
        dosage: "1g",
        frequency: "Every 12 hours",
        route: "IV",
        nextDue: "STAT",
        status: "overdue" as const,
      }] : []),
    ],
    progressNotes: [
      {
        id: "1",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
        author: "Dr. Sarah Johnson",
        type: "physician",
        content: isCritical 
          ? "Patient showing signs of respiratory distress. Increased oxygen support initiated. Monitoring closely."
          : "Patient recovering well post-surgery. Vital signs stable. Continue current treatment plan.",
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString(),
        author: "Nurse Maria Garcia",
        type: "nursing",
        content: "Medications administered as prescribed. Patient comfortable and resting well.",
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString(),
        author: "Physical Therapist John Smith",
        type: "therapy",
        content: "Mobility assessment completed. Patient able to walk short distances with assistance.",
      },
    ],
    diagnostics: [
      {
        id: "1",
        type: "Chest X-Ray",
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        result: isCritical ? "Bilateral infiltrates noted" : "Clear lung fields",
        status: "completed",
      },
      {
        id: "2",
        type: "ECG",
        date: new Date().toLocaleDateString(),
        result: "Normal sinus rhythm",
        status: "reviewed",
      },
      {
        id: "3",
        type: "CT Scan",
        date: new Date().toLocaleDateString(),
        result: "Pending radiologist review",
        status: "pending",
      },
    ],
    labResults: [
      {
        id: "1",
        test: "Complete Blood Count",
        value: isCritical ? "WBC: 15,000" : "WBC: 7,500",
        reference: "4,000-11,000",
        status: isCritical ? "abnormal" : "normal",
        date: new Date().toLocaleDateString(),
      },
      {
        id: "2",
        test: "Blood Glucose",
        value: "95 mg/dL",
        reference: "70-100 mg/dL",
        status: "normal",
        date: new Date().toLocaleDateString(),
      },
      {
        id: "3",
        test: "Creatinine",
        value: isCritical ? "2.1 mg/dL" : "1.0 mg/dL",
        reference: "0.6-1.2 mg/dL",
        status: isCritical ? "critical" : "normal",
        date: new Date().toLocaleDateString(),
      },
    ],
    nursingCharts: [
      {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
        vitals: {
          hr: isCritical ? 115 : 75,
          bp: isCritical ? "85/55" : "118/78",
          temp: isCritical ? 38.8 : 36.8,
          spo2: isCritical ? 89 : 98,
          rr: isCritical ? 24 : 18,
        },
        intake: 250,
        output: 180,
        notes: "Patient alert and oriented. No acute distress noted.",
      },
      {
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString(),
        vitals: {
          hr: isCritical ? 120 : 72,
          bp: isCritical ? "88/58" : "120/80",
          temp: isCritical ? 39.1 : 36.6,
          spo2: isCritical ? 87 : 97,
          rr: isCritical ? 26 : 16,
        },
        intake: 300,
        output: 200,
        notes: isCritical ? "Increased respiratory effort noted. O2 saturation monitoring." : "Stable condition maintained.",
      },
    ],
    diet: {
      type: isCritical ? "NPO (Nothing by mouth)" : "Regular diet",
      restrictions: isCritical ? ["NPO"] : ["Low sodium"],
      allergies: Math.random() > 0.7 ? ["Penicillin", "Shellfish"] : [],
      lastMeal: isCritical ? "N/A" : "Breakfast - 08:00",
    },
  };
}