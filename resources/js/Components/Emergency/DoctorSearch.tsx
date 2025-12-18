import { useState, useEffect, useRef } from 'react';
import { Search, UserCircle, X, ChevronDown } from 'lucide-react';

interface Doctor {
  id: string | number;
  name: string;
  email?: string;
  specialization?: string;
}

interface Props {
  onSelect: (doctor: Doctor | null) => void;
  placeholder?: string;
  initialDoctorId?: string | number;
  initialDoctorName?: string;
}

export default function DoctorSearch({ 
  onSelect, 
  placeholder = 'Search doctor...', 
  initialDoctorId,
  initialDoctorName 
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<Doctor | null>(null);
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

  // Load all doctors on mount
  useEffect(() => {
    loadAllDoctors();
  }, []);

  // Set initial selected doctor
  useEffect(() => {
    if (initialDoctorId && initialDoctorName && !selected) {
      setSelected({ id: initialDoctorId, name: initialDoctorName });
    }
  }, [initialDoctorId, initialDoctorName, selected]);

  // Filter doctors based on query
  useEffect(() => {
    console.log('Filtering - Query:', query, 'All doctors:', allDoctors.length);
    if (query.length === 0) {
      setResults(allDoctors.slice(0, 15));
      console.log('No query - showing all:', allDoctors.length);
    } else {
      const filtered = allDoctors.filter(doctor => {
        const searchStr = query.toLowerCase();
        const matches = (
          doctor.name.toLowerCase().includes(searchStr) ||
          doctor.email?.toLowerCase().includes(searchStr) ||
          doctor.specialization?.toLowerCase().includes(searchStr)
        );
        return matches;
      });
      console.log('Filtered results:', filtered.length, filtered);
      setResults(filtered.slice(0, 15));
    }
  }, [query, allDoctors]);

  const loadAllDoctors = async () => {
    setLoading(true);
    try {
      console.log('Fetching doctors from /doctors/search');
      const response = await fetch('/doctors/search', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Doctors loaded:', data.length, data);
        setAllDoctors(data);
        setResults(data.slice(0, 15));
      } else {
        const errorText = await response.text();
        console.error('Failed to load doctors:', response.status, errorText);
      }
    } catch (error) {
      console.error('Load doctors error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (doctor: Doctor) => {
    setSelected(doctor);
    setQuery('');
    setShowDropdown(false);
    onSelect(doctor);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setResults(allDoctors.slice(0, 15));
    onSelect(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputClick = () => {
    setShowDropdown(true);
    if (allDoctors.length > 0) {
      setResults(allDoctors.slice(0, 15));
    }
  };

  if (selected) {
    return (
      <div className="relative">
        <div className="flex items-center justify-between p-3 border border-green-300 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{selected.name}</div>
              {(selected.email || selected.specialization) && (
                <div className="text-sm text-gray-600">
                  {selected.specialization && `${selected.specialization}`}
                  {selected.specialization && selected.email && ' • '}
                  {selected.email}
                </div>
              )}
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
          onChange={(e) => {
            console.log('Input changed:', e.target.value);
            setQuery(e.target.value);
          }}
          onFocus={() => {
            console.log('Input focused');
            setShowDropdown(true);
          }}
          onClick={handleInputClick}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
        <button
          type="button"
          onClick={handleInputClick}
          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        {loading && (
          <div className="absolute right-10 top-3.5 pointer-events-none">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((doctor) => (
                <div
                  key={doctor.id}
                  onClick={() => handleSelect(doctor)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{doctor.name}</div>
                      {(doctor.email || doctor.specialization) && (
                        <div className="text-sm text-gray-600">
                          {doctor.specialization && `${doctor.specialization}`}
                          {doctor.specialization && doctor.email && ' • '}
                          {doctor.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p>Loading doctors...</p>
            </div>
          ) : query.length >= 1 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <UserCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No doctors found matching "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <UserCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Start typing to search doctors</p>
              <p className="text-sm mt-1">Search by name or specialization</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
