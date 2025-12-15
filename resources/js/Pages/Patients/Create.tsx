import { useState, useEffect } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import DuplicatePatientWarning from "@/Components/DuplicatePatientWarning";
import {
  User,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  AlertCircle,
  UserPlus,
  Heart,
  Shield,
  FileText,
  CheckCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePatientProps {
  auth: {
    user: {
      name: string;
      email: string;
      role?: string;
    };
  };
  flash?: {
    success?: string;
    error?: string;
  };
  potential_duplicates?: Array<{
    id: string;
    hospital_id: string;
    name: string;
    date_of_birth: string;
    age: number;
    phone_number?: string;
    address: string;
    similarity_score: number;
    matching_fields: string[];
  }>;
}

interface PatientFormData {
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  nationality: string;
  religion: string;
  phone_number: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  allergies: string;
  chronic_conditions: string;
  current_medications: string;
  insurance_provider: string;
  insurance_number: string;
  notes: string;
}

// InputField component moved outside to prevent re-creation on each render
const InputField = ({ 
  label, 
  name, 
  type = "text", 
  required = false, 
  placeholder = "", 
  options = null,
  rows = null,
  value,
  onChange,
  error
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[] | null;
  rows?: number | null;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : rows ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors resize-none"
        required={required}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        required={required}
      />
    )}
    {error && (
      <p className="text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />
        {error}
      </p>
    )}
  </div>
);

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: -50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -50, scale: 0.9 }}
    className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg border ${
      type === 'success' 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}
  >
    {type === 'success' ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-600" />
    )}
    <span className="font-medium">{message}</span>
    <button
      onClick={onClose}
      className="ml-2 text-gray-400 hover:text-gray-600"
    >
      <X className="w-4 h-4" />
    </button>
  </motion.div>
);

// Confirmation modal component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'success';
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            {type === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-600" />}
            {type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
            {type === 'info' && <AlertCircle className="w-6 h-6 text-blue-600" />}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="text-gray-600 mb-6 whitespace-pre-line">{message}</div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                type === 'warning' 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function CreatePatient({ auth, flash, potential_duplicates }: CreatePatientProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Check if there's saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('patient_registration_draft');
    if (savedData) {
      setHasSavedData(true);
      setToastMessage('Previous form data has been restored. You can continue where you left off.');
      setToastType('success');
      setShowToast(true);
    }
  }, []);

  // Load saved form data from localStorage on mount
  const loadSavedFormData = () => {
    try {
      const savedData = localStorage.getItem('patient_registration_draft');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load saved form data:', error);
    }
    return null;
  };

  const savedFormData = loadSavedFormData();

  const { data, setData, post, processing, errors, reset } = useForm<PatientFormData>({
    first_name: savedFormData?.first_name || "",
    last_name: savedFormData?.last_name || "",
    middle_name: savedFormData?.middle_name || "",
    date_of_birth: savedFormData?.date_of_birth || "",
    gender: savedFormData?.gender || "", // Will be set by user selection
    marital_status: savedFormData?.marital_status || "",
    occupation: savedFormData?.occupation || "",
    nationality: savedFormData?.nationality || "Kenyan",
    religion: savedFormData?.religion || "",
    phone_number: savedFormData?.phone_number || "",
    email: savedFormData?.email || "",
    emergency_contact_name: savedFormData?.emergency_contact_name || "",
    emergency_contact_phone: savedFormData?.emergency_contact_phone || "",
    emergency_contact_relationship: savedFormData?.emergency_contact_relationship || "",
    address_line_1: savedFormData?.address_line_1|| "",
    address_line_2: savedFormData?.address_line_2 || "",
    city: savedFormData?.city || "",
    state: savedFormData?.state || "",
    postal_code: savedFormData?.postal_code || "",
    country: savedFormData?.country || "Kenya",
    allergies: savedFormData?.allergies || "",
    chronic_conditions: savedFormData?.chronic_conditions || "",
    current_medications: savedFormData?.current_medications || "",
    insurance_provider: savedFormData?.insurance_provider || "",
    insurance_number: savedFormData?.insurance_number || "",
    notes: savedFormData?.notes || "",
  });

  // Auto-save form data to localStorage
  useEffect(() => {
    const saveFormData = () => {
      try {
        localStorage.setItem('patient_registration_draft', JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save form data:', error);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveFormData, 1000);
    return () => clearTimeout(timeoutId);
  }, [data]);

  // Keep session alive and refresh CSRF token periodically
  useEffect(() => {
    // Refresh CSRF token every 5 minutes to prevent expiration
    const refreshToken = () => {
      fetch('/sanctum/csrf-cookie', {
        credentials: 'same-origin'
      }).then(() => {
        console.log('CSRF token refreshed');
      }).catch((error) => {
        console.error('Failed to refresh CSRF token:', error);
      });
    };

    // Initial token refresh on mount
    refreshToken();

    // Set up periodic refresh (every 5 minutes)
    const tokenRefreshInterval = setInterval(refreshToken, 5 * 60 * 1000);

    // Keep session alive by pinging server every 3 minutes
    const keepAliveInterval = setInterval(() => {
      fetch('/api/keep-alive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        credentials: 'same-origin'
      }).catch(() => {
        // Silently fail - not critical
      });
    }, 3 * 60 * 1000);

    return () => {
      clearInterval(tokenRefreshInterval);
      clearInterval(keepAliveInterval);
    };
  }, []);

  // Show toast notifications for flash messages
  useEffect(() => {
    if (flash?.success) {
      setToastMessage(flash.success);
      setToastType('success');
      setShowToast(true);
      // Clear saved form data on success
      localStorage.removeItem('patient_registration_draft');
      // Auto-close toast and redirect to patients list
      setTimeout(() => {
        setShowToast(false);
        setTimeout(() => {
          router.visit('/patients');
        }, 300); // Small delay for smooth transition
      }, 2000);
    }
    if (flash?.error) {
      setToastMessage(flash.error);
      setToastType('error');
      setShowToast(true);
      // Auto-close error toast after 5 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 5000);
    }
  }, [flash]);

  // Auto-close toast when manually triggered
  useEffect(() => {
    if (showToast && !flash?.success && !flash?.error) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast, flash]);

  const validateCurrentStep = () => {
    const requiredFields = {
      1: ['first_name', 'last_name', 'date_of_birth', 'gender'],
      2: ['phone_number', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship', 'address_line_1', 'city', 'state', 'country'],
      3: [], // No required fields in medical info
      4: [], // No required fields in insurance
    };

    const currentRequiredFields = requiredFields[currentStep as keyof typeof requiredFields] || [];
    const missingFields = currentRequiredFields.filter(field => !data[field as keyof PatientFormData]);

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => {
        return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }).join(', ');
      setValidationMessage(`Please fill in the following required fields: ${fieldNames}`);
      setShowValidationModal(true);
      return false;
    }

    // Additional validation for date of birth
    if (currentStep === 1 && data.date_of_birth) {
      const birthDate = new Date(data.date_of_birth);
      const today = new Date();
      if (birthDate >= today) {
        setValidationMessage('Date of birth must be in the past.');
        setShowValidationModal(true);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
    
    // Check for potential duplicates first (in a real app, this would be an API call)
    if (potential_duplicates && potential_duplicates.length > 0) {
      setShowDuplicateWarning(true);
      return;
    }
    
    submitForm();
  };

  const submitForm = () => {
    // Get fresh CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    console.log('Submitting patient registration...');
    
    post("/patients", {
      headers: {
        'X-CSRF-TOKEN': csrfToken || '',
        'X-Requested-With': 'XMLHttpRequest',
      },
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        console.log('✅ Patient registered successfully');
        // Success will be handled by the useEffect above
      },
      onError: (errors) => {
        console.error('Registration failed:', errors);
        
        // Handle 419 CSRF token mismatch specifically
        if (errors && typeof errors === 'object' && 'message' in errors) {
          const errorMessage = String(errors.message);
          if (errorMessage.includes('419') || errorMessage.includes('CSRF') || errorMessage.includes('token mismatch')) {
            setToastMessage('Your session has expired. Please try submitting again.');
            setToastType('error');
            setShowToast(true);
            
            // Refresh CSRF token
            fetch('/sanctum/csrf-cookie', {
              credentials: 'same-origin'
            }).then(() => {
              // Update meta tag with new token
              const newToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
              if (newToken) {
                console.log('CSRF token refreshed');
              }
            });
            return;
          }
        }
        
        setToastMessage('Failed to register patient. Please check the form and try again.');
        setToastType('error');
        setShowToast(true);
      }
    });
  };

  const handleDuplicateProceed = () => {
    setShowDuplicateWarning(false);
    submitForm();
  };

  const handleViewPatient = (patientId: string) => {
    window.open(`/patients/${patientId}`, '_blank');
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: "Personal Info", icon: User },
    { number: 2, title: "Contact & Address", icon: Phone },
    { number: 3, title: "Medical Info", icon: Heart },
    { number: 4, title: "Insurance & Notes", icon: Shield },
  ];

  return (
    <HMSLayout user={auth.user}>
      <Head title="New Patient | MediCare HMS" />

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/patients"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <UserPlus className="w-8 h-8" />
                  Register New Patient
                </h1>
                <p className="text-teal-100">Add a new patient to the system</p>
              </div>
            </div>
            {hasSavedData && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear the saved draft? This cannot be undone.')) {
                    localStorage.removeItem('patient_registration_draft');
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Draft
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep >= step.number
                      ? "bg-white text-teal-600 border-white"
                      : "bg-transparent text-white border-white/50"
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      currentStep >= step.number ? "text-white" : "text-teal-200"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      currentStep > step.number ? "bg-white" : "bg-white/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>

      {/* Validation Modal */}
      <ConfirmationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        onConfirm={() => setShowValidationModal(false)}
        title="Validation Error"
        message={validationMessage}
        confirmText="OK"
        cancelText=""
        type="warning"
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
        title="Confirm Patient Registration"
        message={`Are you sure you want to register this patient?

Name: ${data.first_name} ${data.last_name}
Date of Birth: ${data.date_of_birth}
Phone: ${data.phone_number}
Emergency Contact: ${data.emergency_contact_name}`}
        confirmText="Register Patient"
        cancelText="Cancel"
        type="success"
      />

      {/* Duplicate Patient Warning */}
      {potential_duplicates && (
        <DuplicatePatientWarning
          isOpen={showDuplicateWarning}
          onClose={() => setShowDuplicateWarning(false)}
          onProceed={handleDuplicateProceed}
          onViewPatient={handleViewPatient}
          duplicates={potential_duplicates}
          newPatientData={{
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            phone_number: data.phone_number,
          }}
        />
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-30 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Registering Patient</h3>
                <p className="text-gray-600">Please wait while we save the patient information...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
          >
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <User className="w-6 h-6 text-teal-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="First Name"
                    name="first_name"
                    required
                    placeholder="Enter first name"
                    value={data.first_name}
                    onChange={(value) => setData('first_name', value)}
                    error={errors.first_name}
                  />
                  <InputField
                    label="Last Name"
                    name="last_name"
                    required
                    placeholder="Enter last name"
                    value={data.last_name}
                    onChange={(value) => setData('last_name', value)}
                    error={errors.last_name}
                  />
                  <InputField
                    label="Middle Name"
                    name="middle_name"
                    placeholder="Enter middle name (optional)"
                    value={data.middle_name}
                    onChange={(value) => setData('middle_name', value)}
                    error={errors.middle_name}
                  />
                  <InputField
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    required
                    value={data.date_of_birth}
                    onChange={(value) => setData('date_of_birth', value)}
                    error={errors.date_of_birth}
                  />
                  <InputField
                    label="Gender"
                    name="gender"
                    required
                    value={data.gender}
                    onChange={(value) => setData('gender', value)}
                    error={errors.gender}
                    options={[
                      { value: "M", label: "Male" },
                      { value: "F", label: "Female" },
                      { value: "O", label: "Other" },
                    ]}
                  />
                  <InputField
                    label="Marital Status"
                    name="marital_status"
                    value={data.marital_status}
                    onChange={(value) => setData('marital_status', value)}
                    error={errors.marital_status}
                    options={[
                      { value: "single", label: "Single" },
                      { value: "married", label: "Married" },
                      { value: "divorced", label: "Divorced" },
                      { value: "widowed", label: "Widowed" },
                    ]}
                  />
                  <InputField
                    label="Occupation"
                    name="occupation"
                    placeholder="Enter occupation"
                    value={data.occupation}
                    onChange={(value) => setData('occupation', value)}
                    error={errors.occupation}
                  />
                  <InputField
                    label="Nationality"
                    name="nationality"
                    placeholder="Enter nationality"
                    value={data.nationality}
                    onChange={(value) => setData('nationality', value)}
                    error={errors.nationality}
                  />
                  <InputField
                    label="Religion"
                    name="religion"
                    placeholder="Enter religion (optional)"
                    value={data.religion}
                    onChange={(value) => setData('religion', value)}
                    error={errors.religion}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact & Address */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Contact & Address Information</h2>
                </div>

                <div className="space-y-8">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Phone Number"
                        name="phone_number"
                        type="tel"
                        required
                        placeholder="+254 700 000 000"
                        value={data.phone_number}
                        onChange={(value) => setData('phone_number', value)}
                        error={errors.phone_number}
                      />
                      <InputField
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="patient@email.com"
                        value={data.email}
                        onChange={(value) => setData('email', value)}
                        error={errors.email}
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <InputField
                        label="Emergency Contact Name"
                        name="emergency_contact_name"
                        required
                        placeholder="Full name"
                        value={data.emergency_contact_name}
                        onChange={(value) => setData('emergency_contact_name', value)}
                        error={errors.emergency_contact_name}
                      />
                      <InputField
                        label="Emergency Contact Phone"
                        name="emergency_contact_phone"
                        type="tel"
                        required
                        placeholder="+254 700 000 000"
                        value={data.emergency_contact_phone}
                        onChange={(value) => setData('emergency_contact_phone', value)}
                        error={errors.emergency_contact_phone}
                      />
                      <InputField
                        label="Relationship"
                        name="emergency_contact_relationship"
                        required
                        value={data.emergency_contact_relationship}
                        onChange={(value) => setData('emergency_contact_relationship', value)}
                        error={errors.emergency_contact_relationship}
                        options={[
                          { value: "spouse", label: "Spouse" },
                          { value: "parent", label: "Parent" },
                          { value: "child", label: "Child" },
                          { value: "sibling", label: "Sibling" },
                          { value: "friend", label: "Friend" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Address Line 1"
                        name="address_line_1"
                        required
                        placeholder="Street address"
                        value={data.address_line_1}
                        onChange={(value) => setData('address_line_1', value)}
                        error={errors.address_line_1}
                      />
                      <InputField
                        label="Address Line 2"
                        name="address_line_2"
                        placeholder="Apartment, suite, etc. (optional)"
                        value={data.address_line_2}
                        onChange={(value) => setData('address_line_2', value)}
                        error={errors.address_line_2}
                      />
                      <InputField
                        label="City"
                        name="city"
                        required
                        placeholder="City"
                        value={data.city}
                        onChange={(value) => setData('city', value)}
                        error={errors.city}
                      />
                      <InputField
                        label="State/County"
                        name="state"
                        required
                        placeholder="State or County"
                        value={data.state}
                        onChange={(value) => setData('state', value)}
                        error={errors.state}
                      />
                      <InputField
                        label="Postal Code"
                        name="postal_code"
                        placeholder="Postal code"
                        value={data.postal_code}
                        onChange={(value) => setData('postal_code', value)}
                        error={errors.postal_code}
                      />
                      <InputField
                        label="Country"
                        name="country"
                        required
                        placeholder="Country"
                        value={data.country}
                        onChange={(value) => setData('country', value)}
                        error={errors.country}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Medical Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Medical Information</h2>
                </div>

                <div className="space-y-6">
                  <InputField
                    label="Known Allergies"
                    name="allergies"
                    rows={3}
                    placeholder="List any known allergies (medications, food, environmental, etc.)"
                    value={data.allergies}
                    onChange={(value) => setData('allergies', value)}
                    error={errors.allergies}
                  />
                  <InputField
                    label="Chronic Conditions"
                    name="chronic_conditions"
                    rows={3}
                    placeholder="List any chronic medical conditions (diabetes, hypertension, etc.)"
                    value={data.chronic_conditions}
                    onChange={(value) => setData('chronic_conditions', value)}
                    error={errors.chronic_conditions}
                  />
                  <InputField
                    label="Current Medications"
                    name="current_medications"
                    rows={3}
                    placeholder="List current medications and dosages"
                    value={data.current_medications}
                    onChange={(value) => setData('current_medications', value)}
                    error={errors.current_medications}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Insurance & Notes */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Insurance & Additional Notes</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Insurance Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Insurance Provider"
                        name="insurance_provider"
                        placeholder="Insurance company name"
                        value={data.insurance_provider}
                        onChange={(value) => setData('insurance_provider', value)}
                        error={errors.insurance_provider}
                      />
                      <InputField
                        label="Insurance Number"
                        name="insurance_number"
                        placeholder="Policy/Member number"
                        value={data.insurance_number}
                        onChange={(value) => setData('insurance_number', value)}
                        error={errors.insurance_number}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Additional Notes
                    </h3>
                    <InputField
                      label="Notes"
                      name="notes"
                      rows={4}
                      placeholder="Any additional information about the patient..."
                      value={data.notes}
                      onChange={(value) => setData('notes', value)}
                      error={errors.notes}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </div>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={processing}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
              >
                Next
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={processing}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering Patient...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Register Patient
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </HMSLayout>
  );
}