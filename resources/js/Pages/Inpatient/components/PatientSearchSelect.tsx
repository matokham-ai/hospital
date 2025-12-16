import React, { useState, useEffect, useRef } from "react";
import { Search, User, Phone, Mail, ChevronDown, X } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  dateOfBirth: string;
  gender: "M" | "F" | "O";
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
  registeredDate: string;
}

interface Props {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function PatientSearchSelect({
  selectedPatient,
  onPatientSelect,
  placeholder = "Search and select a patient...",
  disabled = false
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial patients on mount
  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Filter patients when search query changes
  useEffect(() => {
    if (searchQuery.length === 0) {
      setPatients(allPatients.slice(0, 15)); // Show first 15 when no search
    } else {
      // Filter locally for better performance
      const filtered = allPatients.filter(patient =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toString().includes(searchQuery)
      );
      setPatients(filtered.slice(0, 15)); // Limit to 15 results
    }
  }, [searchQuery, allPatients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllPatients = async () => {
    setLoading(true);
    try {
      console.log('Fetching patients from API...');
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/inpatient/api/search-patients', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token || '',
        },
        credentials: 'same-origin',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Patients data received:', data.length, 'patients');
        setAllPatients(data);
        setPatients(data.slice(0, 15)); // Show first 15 initially
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch patients. Status:', response.status, 'Response:', errorText);
        setAllPatients([]);
        setPatients([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out after 10 seconds');
      } else {
        console.error('Error fetching patients:', error);
      }

      // Fallback to mock data for testing
      console.log('Using fallback mock data...');
      const mockPatients = [
        {
          id: 1,
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          age: 35,
          dateOfBirth: '1988-05-15',
          gender: 'M' as const,
          phone: '+1234567890',
          email: 'john.doe@email.com',
          address: '123 Main St',
          emergencyContactName: 'Jane Doe',
          emergencyContactPhone: '+1234567891',
          bloodGroup: 'O+',
          allergies: 'None',
          medicalHistory: 'No significant history',
          registeredDate: 'Oct 20, 2024',
        },
        {
          id: 5,
          name: 'David Brown',
          firstName: 'David',
          lastName: 'Brown',
          age: 42,
          dateOfBirth: '1982-07-09',
          gender: 'M' as const,
          phone: '+1234567892',
          email: 'david.brown@email.com',
          address: '456 Oak Ave',
          emergencyContactName: 'Sarah Brown',
          emergencyContactPhone: '+1234567893',
          bloodGroup: 'A+',
          allergies: 'None',
          medicalHistory: 'Skin conditions',
          registeredDate: 'Oct 22, 2024',
        },
        {
          id: 3,
          name: 'Alice Johnson',
          firstName: 'Alice',
          lastName: 'Johnson',
          age: 28,
          dateOfBirth: '1995-12-03',
          gender: 'F' as const,
          phone: '+1234567894',
          email: 'alice.johnson@email.com',
          address: '789 Pine St',
          emergencyContactName: 'Bob Johnson',
          emergencyContactPhone: '+1234567895',
          bloodGroup: 'B+',
          allergies: 'Penicillin',
          medicalHistory: 'Allergic reactions',
          registeredDate: 'Oct 21, 2024',
        }
      ];

      setAllPatients(mockPatients);
      setPatients(mockPatients);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClearSelection = () => {
    onPatientSelect(null);
    setSearchQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      // Always show patients when opening dropdown
      if (allPatients.length > 0) {
        setPatients(allPatients.slice(0, 15));
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        {selectedPatient ? (
          // Selected patient display
          <div className="w-full p-3 border border-gray-300 rounded-lg bg-blue-50 border-blue-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedPatient.name}</div>
                  <div className="text-sm text-gray-600">
                    ID: {selectedPatient.id} • {selectedPatient.age}y, {selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedPatient.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {selectedPatient.email}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Search input
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={handleInputClick}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <button
              type="button"
              onClick={handleInputClick}
              disabled={disabled}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {loading && (
              <div className="absolute right-8 top-3.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !selectedPatient && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {patients.length > 0 ? (
            <div className="py-1">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-600">
                        ID: {patient.id} • {patient.age}y, {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                      </div>
                      <div className="text-sm text-gray-500">
                        📞 {patient.phone} • 📧 {patient.email}
                      </div>
                      {patient.allergies && (
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ Allergies: {patient.allergies}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Searching patients...</p>
            </div>
          ) : searchQuery.length >= 1 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No patients found matching "{searchQuery}"</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : allPatients.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Loading patients...</p>
              <p className="text-sm">Please wait while we fetch patient data</p>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Click to see all patients</p>
              <p className="text-sm">Or start typing to search by name, phone, email, or ID</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
