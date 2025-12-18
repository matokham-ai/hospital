export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
        message?: string;
    };
};

// OPD Management System Types
export interface Patient {
    id: number;
    medical_record_number: string;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'O';
    address: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    created_at: string;
    updated_at: string;
}

export interface Doctor {
    id: number;
    name: string;
    specialization: string;
    is_available: boolean;
}

export interface TimeSlot {
    id: string;
    time: string;
    is_available: boolean;
}

export interface OpdAppointment {
    id: number;
    appointment_number: string;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time?: string;
    appointment_type: 'SCHEDULED' | 'WALK_IN' | 'EMERGENCY';
    status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    chief_complaint?: string;
    notes?: string;
    queue_number: number;
    checked_in_at?: string;
    consultation_started_at?: string;
    consultation_completed_at?: string;
    patient?: Patient;
    doctor?: Doctor;
    created_at: string;
    updated_at: string;
}

export interface OpdSoapNote {
    id: number;
    appointment_id: number;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    vital_signs: {
        temperature?: number;
        blood_pressure_systolic?: number;
        blood_pressure_diastolic?: number;
        heart_rate?: number;
        respiratory_rate?: number;
        oxygen_saturation?: number;
        weight?: number;
        height?: number;
    };
    created_at: string;
    updated_at: string;
}

export interface Icd10Code {
    id: number;
    code: string;
    description: string;
    category: string;
    subcategory: string;
    usage_count: number;
}

export interface OpdDiagnosis {
    id: number;
    appointment_id: number;
    icd10_code_id: number;
    diagnosis_type: 'PRIMARY' | 'SECONDARY' | 'COMORBIDITY' | 'RULE_OUT';
    notes?: string;
    icd10_code?: Icd10Code;
    created_at: string;
    updated_at: string;
}

export interface QueueItem {
    id: number;
    patient_name: string;
    patient_id: string;
    queue_number?: number;
    status: string;
    waiting_time: number;
    doctor_name: string;
    chief_complaint?: string;
    appointment_number?: string;
    checked_in_at?: string;
    appointment_time?: string;
    type?: 'opd' | 'scheduled';
}

export interface DashboardStats {
    totalPatients: number;
    waitingPatients: number;
    inConsultation: number;
    completedToday: number;
}

export interface MedicalHistory {
    id: number;
    appointment_date: string;
    doctor_name: string;
    diagnosis: string;
    notes: string;
}

export interface SoapTemplate {
    id: number;
    name: string;
    subjective_template: string;
    objective_template: string;
    assessment_template: string;
    plan_template: string;
}

export interface EmergencyPatient {
    id: number;
    patient_id: number;
    temp_name?: string;
    temp_contact?: string;
    gender?: string;
    age?: number;
    chief_complaint: string;
    history_of_present_illness?: string;
    arrival_mode: string;
    arrival_time: string;
    status: 'WAITING' | 'IN_TRIAGE' | 'IN_TREATMENT' | 'ADMITTED' | 'DISCHARGED';
    assigned_to?: string;
    patient?: Patient;
    latest_triage?: TriageAssessment;
    created_at: string;
    updated_at: string;
}

export interface TriageAssessment {
    id: number;
    emergency_patient_id: number;
    triage_category: 'CRITICAL' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT';
    temperature?: number;
    blood_pressure?: string;
    heart_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    gcs_eye?: number;
    gcs_verbal?: number;
    gcs_motor?: number;
    gcs_total?: number;
    assessment_notes?: string;
    assessed_by?: number;
    assessed_at: string;
    created_at: string;
    updated_at: string;
}
