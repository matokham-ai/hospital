import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Pill,
  Plus,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Loader2
} from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  manufacturer: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  sideEffects: string[];
  contraindications: string[];
  dosage: string;
  inStock: boolean;
}

interface MedicineBrowserProps {
  onSelectMedicine?: (medicine: Medicine) => void;
  onPrescribe?: (medicine: Medicine, dosage: string, duration: string) => void;
  showPrescribeButton?: boolean;
}

// API service functions
const fetchMedicines = async (params: any) => {
  try {
    const response = await window.axios.get('/doctor/api/medicines', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching medicines:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch medicines');
  }
};

const fetchMedicine = async (id: string) => {
  try {
    const response = await window.axios.get(`/doctor/api/medicines/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching medicine details:', error);
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch medicine details');
  }
};

export default function MedicineBrowser({
  onSelectMedicine,
  onPrescribe,
  showPrescribeButton = false
}: MedicineBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    dosage: '',
    duration: '',
    instructions: ''
  });
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  });

  const categories = ['All', 'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler'];

  // Load medicines
  const loadMedicines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        search: searchQuery || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        per_page: 20
      };

      const response = await fetchMedicines(params);
      setMedicines(response.data || []);
      setPagination({
        current_page: response.current_page || 1,
        last_page: response.last_page || 1,
        per_page: response.per_page || 20,
        total: response.total || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medicines');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  // Load medicines on component mount and when filters change
  useEffect(() => {
    loadMedicines();
  }, [selectedCategory]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedicines();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMedicineSelect = async (medicine: Medicine) => {
    setLoading(true);
    try {
      // Fetch detailed medicine data
      const detailedMedicine = await fetchMedicine(medicine.id);
      setSelectedMedicine(detailedMedicine);
      setShowDetails(true);
      onSelectMedicine?.(detailedMedicine);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medicine details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrescribe = () => {
    if (selectedMedicine && prescriptionData.dosage && prescriptionData.duration) {
      onPrescribe?.(selectedMedicine, prescriptionData.dosage, prescriptionData.duration);
      setShowDetails(false);
      setPrescriptionData({ dosage: '', duration: '', instructions: '' });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Medicine Browser
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse available medications and create prescriptions
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines by name, generic name, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category === 'All' ? '' : category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medicine List */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button 
              onClick={loadMedicines}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading medicines...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((medicine) => (
            <div
              key={medicine.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${medicine.inStock
                  ? 'border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                }`}
              onClick={() => handleMedicineSelect(medicine)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {medicine.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {medicine.genericName} • {medicine.strength}
                  </p>
                </div>
                <div className={`p-1 rounded-full ${medicine.inStock ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                  {medicine.inStock ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Form:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{medicine.form}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    {medicine.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                  <span className={`font-medium ${medicine.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                    {medicine.stock} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Price:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${medicine.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-600">
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && medicines.length === 0 && !error && (
          <div className="text-center py-8">
            <Pill className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No medicines found matching your criteria</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.per_page && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} medicines
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* Handle previous page */}}
                disabled={pagination.current_page <= 1}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => {/* Handle next page */}}
                disabled={pagination.current_page >= pagination.last_page}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Medicine Details Modal */}
      {showDetails && selectedMedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedMedicine.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedMedicine.genericName} • {selectedMedicine.strength} • {selectedMedicine.form}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Medicine Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Medicine Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Manufacturer:</span>
                        <span className="text-gray-900 dark:text-white">{selectedMedicine.manufacturer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Category:</span>
                        <span className="text-gray-900 dark:text-white">{selectedMedicine.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Price:</span>
                        <span className="text-gray-900 dark:text-white">${selectedMedicine.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                        <span className={selectedMedicine.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {selectedMedicine.stock} units
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMedicine.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommended Dosage</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedMedicine.dosage}
                    </p>
                  </div>
                </div>

                {/* Side Effects & Contraindications */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      Side Effects
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {selectedMedicine.sideEffects.map((effect, index) => (
                        <li key={index}>• {effect}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <X className="w-4 h-4 text-red-500" />
                      Contraindications
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {selectedMedicine.contraindications.map((contraindication, index) => (
                        <li key={index}>• {contraindication}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Prescription Form */}
              {showPrescribeButton && selectedMedicine.inStock && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Create Prescription</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={prescriptionData.dosage}
                        onChange={(e) => setPrescriptionData({ ...prescriptionData, dosage: e.target.value })}
                        placeholder="e.g., 500mg twice daily"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={prescriptionData.duration}
                        onChange={(e) => setPrescriptionData({ ...prescriptionData, duration: e.target.value })}
                        placeholder="e.g., 7 days"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={prescriptionData.instructions}
                      onChange={(e) => setPrescriptionData({ ...prescriptionData, instructions: e.target.value })}
                      placeholder="Additional instructions for the patient..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Close
                </button>
                {showPrescribeButton && selectedMedicine.inStock && (
                  <button
                    onClick={handlePrescribe}
                    disabled={!prescriptionData.dosage || !prescriptionData.duration}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Prescription
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
