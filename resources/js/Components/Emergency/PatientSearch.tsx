import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X, ChevronDown } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  hospital_id?: string;
}

interface Props {
  onSelect: (patient: Patient | null) => void;
  placeholder?: string;
}

export default function PatientSearch({ onSelect, placeholder = 'Search patient...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Patient | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all patients on mount
  useEffect(() => {
    loadAllPatients();
  }, []);

  // Filter patients based on query
  useEffect(() => {
    if (query.length === 0) {
      setResults(allPatients.slice(0, 15));
    } else {
      const filtered = allPatients.filter(patient => {
        const searchStr = query.toLowerCase();
        return (
          patient.first_name.toLowerCase().includes(searchStr) ||
          patient.last_name.toLowerCase().includes(searchStr) ||
          patient.phone?.toLowerCase().includes(searchStr) ||
          patient.hospital_id?.toLowerCase().includes(searchStr)
        );
      });
      setResults(filtered.slice(0, 15));
    }
  }, [query, allPatients]);

  const loadAllPatients = async () => {
    setLoading(true);
    try {
      console.log('Fetching patients from /patients/search?all=1');
      const response = await fetch('/patients/search?all=1', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Patients loaded:', data.length);
        setAllPatients(data);
        setResults(data.slice(0, 15));
      } else {
        const errorText = await response.text();
        console.error('Failed to load patients:', response.status, errorText);
      }
    } catch (error) {
      console.error('Load patients error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (patient: Patient) => {
    setSelected(patient);
    setQuery('');
    setShowDropdown(false);
    onSelect(patient);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setResults(allPatients.slice(0, 15));
    onSelect(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputClick = () => {
    setShowDropdown(true);
    if (allPatients.length > 0) {
      setResults(allPatients.slice(0, 15));
    }
  };

  if (selected) {
    return (
      <div className="relative">
        <div className="flex items-center justify-between p-3 border border-green-300 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {selected.first_name} {selected.last_name}
              </div>
              <div className="text-sm text-gray-600">
                {selected.hospital_id && `MRN: ${selected.hospital_id} • `}
                {selected.phone} • {selected.gender}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClick={handleInputClick}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
        <button
          type="button"
          onClick={handleInputClick}
          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        {loading && (
          <div className="absolute right-10 top-3.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {patient.hospital_id && `MRN: ${patient.hospital_id} • `}
                        {patient.phone} • {patient.gender}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p>Loading patients...</p>
            </div>
          ) : query.length >= 1 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No patients found matching "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Start typing to search patients</p>
              <p className="text-sm mt-1">Search by name, phone, or MRN</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
