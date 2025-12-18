import HMSLayout from '@/Layouts/HMSLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Pill, 
    Package, 
    DollarSign, 
    AlertTriangle, 
    FileText,
    Building2,
    Calendar,
    Thermometer,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Search,
    X
} from 'lucide-react';

interface DrugFormData {
    // Section 1: Basic Identification
    name: string;
    generic_name: string;
    brand_name: string;
    manufacturer: string;
    requires_prescription: boolean;
    status: 'active' | 'discontinued';
    
    // Section 2: Classification & Strength
    atc_code: string;
    therapeutic_class: string;
    strength: string;
    form: string;
    formulation: string;
    dosage_form_details: string;
    
    // Section 3: Stock & Pricing
    stock_quantity: number;
    reorder_level: number;
    unit_price: number;
    cost_price: number;
    batch_number: string;
    expiry_date: string;
    storage_conditions: string;
    
    // Section 4: Safety & Clinical
    contraindications: string;
    side_effects: string;
    notes: string;
}

interface Manufacturer {
    name: string;
    count: number;
}

interface SimilarDrug {
    id: number;
    name: string;
    generic_name: string;
    strength: string;
    form: string;
}

const DRUG_FORMS = [
    { value: 'tablet', label: 'Tablet', icon: '💊' },
    { value: 'capsule', label: 'Capsule', icon: '💊' },
    { value: 'syrup', label: 'Syrup', icon: '🧴' },
    { value: 'injection', label: 'Injection', icon: '💉' },
    { value: 'cream', label: 'Cream', icon: '🧴' },
    { value: 'ointment', label: 'Ointment', icon: '🧴' },
    { value: 'drops', label: 'Drops', icon: '💧' },
    { value: 'inhaler', label: 'Inhaler', icon: '🌬️' },
    { value: 'powder', label: 'Powder', icon: '⚗️' },
    { value: 'suppository', label: 'Suppository', icon: '💊' },
];

export default function DrugWizard({ auth, manufacturers = [], atcCodes = [] }: any) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<DrugFormData>({
        name: '',
        generic_name: '',
        brand_name: '',
        manufacturer: '',
        requires_prescription: false,
        status: 'active',
        atc_code: '',
        therapeutic_class: '',
        strength: '',
        form: '',
        formulation: '',
        dosage_form_details: '',
        stock_quantity: 0,
        reorder_level: 0,
        unit_price: 0,
        cost_price: 0,
        batch_number: '',
        expiry_date: '',
        storage_conditions: '',
        contraindications: '',
        side_effects: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [similarDrugs, setSimilarDrugs] = useState<SimilarDrug[]>([]);
    const [showSimilarDrugs, setShowSimilarDrugs] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check for similar drugs when name or generic name changes
    useEffect(() => {
        const checkSimilar = async () => {
            if (formData.generic_name.length > 2 || formData.name.length > 2) {
                try {
                    const response = await fetch(`/api/drugs/check-similar?name=${formData.name}&generic=${formData.generic_name}`);
                    const data = await response.json();
                    if (data.length > 0) {
                        setSimilarDrugs(data);
                        setShowSimilarDrugs(true);
                    } else {
                        setSimilarDrugs([]);
                        setShowSimilarDrugs(false);
                    }
                } catch (error) {
                    console.error('Error checking similar drugs:', error);
                }
            }
        };

        const timeout = setTimeout(checkSimilar, 500);
        return () => clearTimeout(timeout);
    }, [formData.generic_name, formData.name]);

    const updateField = (field: keyof DrugFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.name.trim()) newErrors.name = 'Drug name is required';
            if (!formData.generic_name.trim()) newErrors.generic_name = 'Generic name is required';
        } else if (step === 2) {
            if (!formData.strength.trim()) newErrors.strength = 'Strength is required';
            if (!formData.form) newErrors.form = 'Form is required';
        } else if (step === 3) {
            if (formData.stock_quantity < 0) newErrors.stock_quantity = 'Stock quantity cannot be negative';
            if (formData.unit_price <= 0) newErrors.unit_price = 'Unit price must be greater than 0';
            if (formData.cost_price < 0) newErrors.cost_price = 'Cost price cannot be negative';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setIsSubmitting(true);
        try {
            router.post('/pharmacy/drugs', formData as any, {
                onSuccess: () => {
                    router.visit('/pharmacy/formulary');
                },
                onError: (errors: any) => {
                    setErrors(errors);
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Error submitting drug:', error);
            setIsSubmitting(false);
        }
    };

    const calculateMargin = () => {
        if (formData.unit_price > 0 && formData.cost_price > 0) {
            const margin = formData.unit_price - formData.cost_price;
            const percentage = ((margin / formData.cost_price) * 100).toFixed(2);
            return { margin, percentage };
        }
        return null;
    };

    const getExpiryWarning = () => {
        if (!formData.expiry_date) return null;
        
        const expiry = new Date(formData.expiry_date);
        const today = new Date();
        const monthsDiff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

        if (monthsDiff < 0) {
            return { color: 'red', message: 'Expired!', icon: '🚫' };
        } else if (monthsDiff < 2) {
            return { color: 'red', message: `Expires in ${Math.ceil(monthsDiff * 30)} days`, icon: '⚠️' };
        } else if (monthsDiff < 6) {
            return { color: 'yellow', message: `Expires in ${Math.ceil(monthsDiff)} months`, icon: '⚠️' };
        }
        return null;
    };

    const steps = [
        { number: 1, title: 'Basic Info', icon: Pill },
        { number: 2, title: 'Classification', icon: Package },
        { number: 3, title: 'Stock & Pricing', icon: DollarSign },
        { number: 4, title: 'Safety & Notes', icon: AlertTriangle },
    ];

    return (
        <HMSLayout user={auth.user}>
            <Head title="Add New Drug - Pharmacy" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.visit('/pharmacy/formulary')}
                            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Formulary
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Add New Drug</h1>
                        <p className="text-gray-600 mt-2">Complete all sections to add a new medication to the formulary</p>
                    </div>

                    {/* Stepper */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = currentStep === step.number;
                                const isCompleted = currentStep > step.number;
                                
                                return (
                                    <div key={step.number} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center flex-1">
                                            <div className={`
                                                w-12 h-12 rounded-full flex items-center justify-center transition-all
                                                ${isActive ? 'bg-blue-500 text-white shadow-lg scale-110' : ''}
                                                ${isCompleted ? 'bg-green-500 text-white' : ''}
                                                ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                                            `}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="w-6 h-6" />
                                                ) : (
                                                    <Icon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <div className="mt-2 text-center">
                                                <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                                                    {step.title}
                                                </div>
                                            </div>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className={`h-1 flex-1 mx-4 rounded transition-all ${
                                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Similar Drugs Warning */}
                    {showSimilarDrugs && similarDrugs.length > 0 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-yellow-800">Similar drugs found</h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p className="mb-2">The following similar drugs already exist:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            {similarDrugs.map(drug => (
                                                <li key={drug.id}>
                                                    {drug.generic_name} - {drug.strength} {drug.form}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSimilarDrugs(false)}
                                    className="text-yellow-400 hover:text-yellow-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

                        {/* SECTION 1: Basic Drug Identification */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Pill className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Basic Drug Identification</h2>
                                        <p className="text-sm text-gray-600">Essential information about the medication</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Drug Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Pill className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => updateField('name', e.target.value)}
                                                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.name ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="e.g., Paracetamol"
                                            />
                                        </div>
                                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    {/* Generic Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Generic Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FileText className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.generic_name}
                                                onChange={(e) => updateField('generic_name', e.target.value)}
                                                className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.generic_name ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="e.g., Acetaminophen"
                                            />
                                        </div>
                                        {errors.generic_name && <p className="mt-1 text-sm text-red-600">{errors.generic_name}</p>}
                                    </div>

                                    {/* Brand Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Brand Name <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.brand_name}
                                            onChange={(e) => updateField('brand_name', e.target.value)}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Tylenol"
                                        />
                                    </div>

                                    {/* Manufacturer */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Manufacturer <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Building2 className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.manufacturer}
                                                onChange={(e) => updateField('manufacturer', e.target.value)}
                                                list="manufacturers"
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Select or type manufacturer"
                                            />
                                            <datalist id="manufacturers">
                                                {manufacturers.map((m: Manufacturer) => (
                                                    <option key={m.name} value={m.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>

                                {/* Prescription & Status */}
                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <label className="text-sm font-medium text-gray-900">Requires Prescription</label>
                                            <p className="text-xs text-gray-500">Is this a prescription-only medication?</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.requires_prescription}
                                                onChange={(e) => updateField('requires_prescription', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => updateField('status', e.target.value)}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="active">Active</option>
                                            <option value="discontinued">Discontinued</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Rx Badge Preview */}
                                {formData.requires_prescription && (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                                            Rx Only
                                        </span>
                                        <span className="text-sm text-blue-700">This medication requires a prescription</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTION 2: Classification & Strength */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Package className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Classification & Strength</h2>
                                        <p className="text-sm text-gray-600">Medical classification and dosage information</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* ATC Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ATC Code <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.atc_code}
                                            onChange={(e) => updateField('atc_code', e.target.value.toUpperCase())}
                                            list="atc-codes"
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                            placeholder="e.g., N02BE01"
                                        />
                                        <datalist id="atc-codes">
                                            {atcCodes.map((code: string) => (
                                                <option key={code} value={code} />
                                            ))}
                                        </datalist>
                                    </div>

                                    {/* Therapeutic Class */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Therapeutic Class <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.therapeutic_class}
                                            onChange={(e) => updateField('therapeutic_class', e.target.value)}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Analgesic, Antibiotic"
                                        />
                                    </div>

                                    {/* Strength */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Strength <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.strength}
                                            onChange={(e) => updateField('strength', e.target.value)}
                                            className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.strength ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="e.g., 500mg, 250mg/5ml"
                                        />
                                        {errors.strength && <p className="mt-1 text-sm text-red-600">{errors.strength}</p>}
                                    </div>

                                    {/* Form */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Form <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.form}
                                            onChange={(e) => updateField('form', e.target.value)}
                                            className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.form ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        >
                                            <option value="">Select form...</option>
                                            {DRUG_FORMS.map(form => (
                                                <option key={form.value} value={form.value}>
                                                    {form.icon} {form.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.form && <p className="mt-1 text-sm text-red-600">{errors.form}</p>}
                                    </div>

                                    {/* Formulation */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Formulation <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.formulation}
                                            onChange={(e) => updateField('formulation', e.target.value)}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Extended Release, Immediate Release"
                                        />
                                    </div>

                                    {/* Dosage Form Details */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dosage Form Details <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={formData.dosage_form_details}
                                            onChange={(e) => updateField('dosage_form_details', e.target.value)}
                                            rows={3}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Additional details about the dosage form..."
                                        />
                                    </div>
                                </div>

                                {/* Visual Preview */}
                                {formData.strength && formData.form && (
                                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">
                                                {DRUG_FORMS.find(f => f.value === formData.form)?.icon}
                                            </span>
                                            <div>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {formData.strength} {DRUG_FORMS.find(f => f.value === formData.form)?.label}
                                                </p>
                                                {formData.formulation && (
                                                    <p className="text-sm text-gray-600">{formData.formulation}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTION 3: Stock & Pricing */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Stock & Pricing</h2>
                                        <p className="text-sm text-gray-600">Inventory and financial information</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Stock Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Stock Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.stock_quantity}
                                            onChange={(e) => updateField('stock_quantity', parseInt(e.target.value) || 0)}
                                            className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                errors.stock_quantity ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="0"
                                        />
                                        {errors.stock_quantity && <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>}
                                    </div>

                                    {/* Reorder Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Reorder Level
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.reorder_level}
                                            onChange={(e) => updateField('reorder_level', parseInt(e.target.value) || 0)}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Alert when stock falls below this level</p>
                                    </div>

                                    {/* Unit Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Unit Price (Selling) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500">KES</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.unit_price}
                                                onChange={(e) => updateField('unit_price', parseFloat(e.target.value) || 0)}
                                                className={`block w-full pl-14 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.unit_price ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.unit_price && <p className="mt-1 text-sm text-red-600">{errors.unit_price}</p>}
                                    </div>

                                    {/* Cost Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Cost Price (Purchase)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500">KES</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.cost_price}
                                                onChange={(e) => updateField('cost_price', parseFloat(e.target.value) || 0)}
                                                className={`block w-full pl-14 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                    errors.cost_price ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {errors.cost_price && <p className="mt-1 text-sm text-red-600">{errors.cost_price}</p>}
                                    </div>

                                    {/* Batch Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Batch Number <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.batch_number}
                                            onChange={(e) => updateField('batch_number', e.target.value)}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                            placeholder="e.g., BN-2024-001"
                                        />
                                    </div>

                                    {/* Expiry Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Expiry Date <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="date"
                                                value={formData.expiry_date}
                                                onChange={(e) => updateField('expiry_date', e.target.value)}
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Storage Conditions */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Storage Conditions <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute top-3 left-3 pointer-events-none">
                                                <Thermometer className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.storage_conditions}
                                                onChange={(e) => updateField('storage_conditions', e.target.value)}
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Store below 25°C, Keep refrigerated"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Profit Margin Calculator */}
                                {calculateMargin() && (
                                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    KES {calculateMargin()!.margin.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600 mb-1">Margin %</p>
                                                <p className="text-2xl font-bold text-green-600">
                                                    {calculateMargin()!.percentage}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Expiry Warning */}
                                {getExpiryWarning() && (
                                    <div className={`p-4 rounded-xl border ${
                                        getExpiryWarning()!.color === 'red' 
                                            ? 'bg-red-50 border-red-200' 
                                            : 'bg-yellow-50 border-yellow-200'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getExpiryWarning()!.icon}</span>
                                            <div>
                                                <p className={`font-semibold ${
                                                    getExpiryWarning()!.color === 'red' ? 'text-red-800' : 'text-yellow-800'
                                                }`}>
                                                    {getExpiryWarning()!.message}
                                                </p>
                                                <p className={`text-sm ${
                                                    getExpiryWarning()!.color === 'red' ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                    Expiry date: {new Date(formData.expiry_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SECTION 4: Safety & Clinical Notes */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Safety & Clinical Notes</h2>
                                        <p className="text-sm text-gray-600">Important medical information and warnings</p>
                                    </div>
                                </div>

                                {/* Tabbed Interface */}
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="flex border-b border-gray-200 bg-gray-50">
                                        <button
                                            onClick={() => {}}
                                            className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-white transition-colors border-b-2 border-blue-500 bg-white"
                                        >
                                            Contraindications
                                        </button>
                                    </div>

                                    <div className="p-6 bg-white">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Contraindications <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={formData.contraindications}
                                            onChange={(e) => updateField('contraindications', e.target.value)}
                                            rows={6}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="• Hypersensitivity to the active ingredient&#10;• Severe liver disease&#10;• Pregnancy (first trimester)&#10;&#10;List conditions where this drug should not be used..."
                                        />
                                        <p className="mt-2 text-xs text-gray-500">Use bullet points (•) for better readability</p>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="flex border-b border-gray-200 bg-gray-50">
                                        <button
                                            onClick={() => {}}
                                            className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-white transition-colors border-b-2 border-blue-500 bg-white"
                                        >
                                            Side Effects
                                        </button>
                                    </div>

                                    <div className="p-6 bg-white">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Side Effects <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={formData.side_effects}
                                            onChange={(e) => updateField('side_effects', e.target.value)}
                                            rows={6}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Common:&#10;• Nausea&#10;• Headache&#10;• Dizziness&#10;&#10;Rare:&#10;• Allergic reactions&#10;• Liver problems&#10;&#10;List potential adverse effects..."
                                        />
                                        <p className="mt-2 text-xs text-gray-500">Organize by frequency: Common, Uncommon, Rare</p>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="flex border-b border-gray-200 bg-gray-50">
                                        <button
                                            onClick={() => {}}
                                            className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-white transition-colors border-b-2 border-blue-500 bg-white"
                                        >
                                            Additional Notes
                                        </button>
                                    </div>

                                    <div className="p-6 bg-white">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Notes <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => updateField('notes', e.target.value)}
                                            rows={6}
                                            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="• Take with food&#10;• Avoid alcohol&#10;• May cause drowsiness&#10;&#10;Add any additional important information..."
                                        />
                                        <p className="mt-2 text-xs text-gray-500">Include dosing instructions, interactions, or special warnings</p>
                                    </div>
                                </div>

                                {/* Summary Preview */}
                                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Drug Summary</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Drug Name:</p>
                                            <p className="font-semibold text-gray-900">{formData.name || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Generic Name:</p>
                                            <p className="font-semibold text-gray-900">{formData.generic_name || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Strength & Form:</p>
                                            <p className="font-semibold text-gray-900">
                                                {formData.strength && formData.form 
                                                    ? `${formData.strength} ${DRUG_FORMS.find(f => f.value === formData.form)?.label}`
                                                    : 'Not set'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Stock Quantity:</p>
                                            <p className="font-semibold text-gray-900">{formData.stock_quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Unit Price:</p>
                                            <p className="font-semibold text-gray-900">KES {formData.unit_price.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Prescription:</p>
                                            <p className="font-semibold text-gray-900">
                                                {formData.requires_prescription ? 'Required' : 'Not Required'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                                    currentStep === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Previous
                            </button>

                            <div className="text-sm text-gray-500">
                                Step {currentStep} of {steps.length}
                            </div>

                            {currentStep < steps.length ? (
                                <button
                                    onClick={nextStep}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Next
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Save Drug
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
