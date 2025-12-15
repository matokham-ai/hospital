import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Search,
  X,
  Filter,
  User,
  Phone,
  Calendar,
  Hash,
  Users
} from "lucide-react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";

interface PatientAdvancedSearchProps {
  onSearch?: (filters: Record<string, string>) => void;
  loading?: boolean;
  defaultOpen?: boolean;
  filters?: any;
  className?: string;
}

interface FilterState extends Record<string, string> {
  name: string;
  patientId: string;
  phone: string;
  gender: string;
  dob: string;
  ageRange: string;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const AGE_RANGE_OPTIONS = [
  { value: "0-18", label: "0-18 years" },
  { value: "19-35", label: "19-35 years" },
  { value: "36-50", label: "36-50 years" },
  { value: "51-65", label: "51-65 years" },
  { value: "65+", label: "65+ years" },
];

export default function PatientAdvancedSearch({
  onSearch,
  loading = false,
  defaultOpen = false,
  filters: initialFilters = {},
  className = "",
}: PatientAdvancedSearchProps) {
  const [filters, setFilters] = useState<FilterState>(() => {
    // Convert backend filters to frontend format
    const frontendFilters: FilterState = {
      name: initialFilters.search || "",
      patientId: "",
      phone: "",
      gender: "",
      dob: "",
      ageRange: "",
    };

    // Convert backend gender to frontend format
    if (initialFilters.gender) {
      const genderMap: Record<string, string> = {
        'M': 'male',
        'F': 'female',
        'O': 'other'
      };
      frontendFilters.gender = genderMap[initialFilters.gender] || initialFilters.gender.toLowerCase();
    }

    // Convert age_min/age_max to age range
    if (initialFilters.age_min && initialFilters.age_max) {
      const min = parseInt(initialFilters.age_min);
      const max = parseInt(initialFilters.age_max);

      if (min === 0 && max === 18) frontendFilters.ageRange = '0-18';
      else if (min === 19 && max === 35) frontendFilters.ageRange = '19-35';
      else if (min === 36 && max === 50) frontendFilters.ageRange = '36-50';
      else if (min === 51 && max === 65) frontendFilters.ageRange = '51-65';
      else if (min === 65 && max >= 120) frontendFilters.ageRange = '65+';
    }

    return frontendFilters;
  });

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value.trim() !== "").length;
  }, [filters]);

  const handleChange = useCallback((name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleChange(name, value);
  }, [handleChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // Convert frontend filters to backend expected format
    const backendFilters: Record<string, string> = {};

    // Map name to search
    if (filters.name.trim()) {
      backendFilters.search = filters.name.trim();
    }

    // Map patientId to search (combine with name if both exist)
    if (filters.patientId.trim()) {
      if (backendFilters.search) {
        backendFilters.search += ' ' + filters.patientId.trim();
      } else {
        backendFilters.search = filters.patientId.trim();
      }
    }

    // Map phone to search (combine with existing search if exists)
    if (filters.phone.trim()) {
      if (backendFilters.search) {
        backendFilters.search += ' ' + filters.phone.trim();
      } else {
        backendFilters.search = filters.phone.trim();
      }
    }

    // Gender mapping
    if (filters.gender) {
      // Convert frontend gender values to backend format
      const genderMap: Record<string, string> = {
        'male': 'M',
        'female': 'F',
        'other': 'O'
      };
      backendFilters.gender = genderMap[filters.gender.toLowerCase()] || filters.gender;
    }

    // Date of birth - convert to age range
    if (filters.dob) {
      const birthDate = new Date(filters.dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      backendFilters.age_min = age.toString();
      backendFilters.age_max = age.toString();
    }

    // Age range mapping
    if (filters.ageRange) {
      const ageRangeMap: Record<string, { min: string; max: string }> = {
        '0-18': { min: '0', max: '18' },
        '19-35': { min: '19', max: '35' },
        '36-50': { min: '36', max: '50' },
        '51-65': { min: '51', max: '65' },
        '65+': { min: '65', max: '120' }
      };

      const range = ageRangeMap[filters.ageRange];
      if (range) {
        backendFilters.age_min = range.min;
        backendFilters.age_max = range.max;
      }
    }

    if (onSearch) onSearch(backendFilters);
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    const resetFilters: FilterState = {
      name: "",
      patientId: "",
      phone: "",
      gender: "",
      dob: "",
      ageRange: "",
    };
    setFilters(resetFilters);

    // Send empty backend filters to clear all filters
    const emptyBackendFilters: Record<string, string> = {
      search: "",
      gender: "",
      age_min: "",
      age_max: "",
    };

    if (onSearch) onSearch(emptyBackendFilters);
  }, [onSearch]);

  const handleQuickClear = useCallback((fieldName: string) => {
    handleChange(fieldName, "");
  }, [handleChange]);

  return (
    <Card className={`shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm ${className}`}>
      <CardHeader
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/50 transition-colors duration-200 rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Advanced Patient Search
            </CardTitle>
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
                </Badge>
                {/* Show active filter summary */}
                <div className="flex flex-wrap gap-1">
                  {filters.name && (
                    <Badge variant="outline" className="text-xs">
                      Name: {filters.name.length > 10 ? filters.name.substring(0, 10) + '...' : filters.name}
                    </Badge>
                  )}
                  {filters.gender && (
                    <Badge variant="outline" className="text-xs">
                      {GENDER_OPTIONS.find(g => g.value === filters.gender)?.label}
                    </Badge>
                  )}
                  {filters.ageRange && (
                    <Badge variant="outline" className="text-xs">
                      Age: {AGE_RANGE_OPTIONS.find(a => a.value === filters.ageRange)?.label}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
          type="button"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </Button>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Patient Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Patient Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter patient name (first or last name)"
                        value={filters.name}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        className={`transition-all duration-200 ${focusedField === "name"
                          ? "ring-2 ring-blue-500 border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      />
                      {filters.name && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                          onClick={() => handleQuickClear("name")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* Patient ID */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="patientId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      Patient ID
                    </Label>
                    <div className="relative">
                      <Input
                        id="patientId"
                        name="patientId"
                        placeholder="Enter patient ID (e.g., PAT000001)"
                        value={filters.patientId}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("patientId")}
                        onBlur={() => setFocusedField(null)}
                        className={`transition-all duration-200 ${focusedField === "patientId"
                          ? "ring-2 ring-blue-500 border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      />
                      {filters.patientId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                          onClick={() => handleQuickClear("patientId")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* Phone Number */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="Enter phone number (e.g., +254...)"
                        value={filters.phone}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("phone")}
                        onBlur={() => setFocusedField(null)}
                        className={`transition-all duration-200 ${focusedField === "phone"
                          ? "ring-2 ring-blue-500 border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      />
                      {filters.phone && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                          onClick={() => handleQuickClear("phone")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* Gender */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2"
                  >
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      Gender
                    </Label>
                    <div className="relative">
                      <Select value={filters.gender || undefined} onValueChange={(value) => handleChange("gender", value || "")}>
                        <SelectTrigger className="border-gray-200 hover:border-gray-300 transition-colors duration-200">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {filters.gender && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100 z-10"
                          onClick={() => handleQuickClear("gender")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* Date of Birth */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="dob" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Date of Birth
                    </Label>
                    <div className="relative">
                      <Input
                        id="dob"
                        name="dob"
                        type="date"
                        value={filters.dob}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("dob")}
                        onBlur={() => setFocusedField(null)}
                        className={`transition-all duration-200 ${focusedField === "dob"
                          ? "ring-2 ring-blue-500 border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                          }`}
                      />
                      {filters.dob && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                          onClick={() => handleQuickClear("dob")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* Age Range */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-2"
                  >
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Age Range
                    </Label>
                    <div className="relative">
                      <Select value={filters.ageRange || undefined} onValueChange={(value) => handleChange("ageRange", value || "")}>
                        <SelectTrigger className="border-gray-200 hover:border-gray-300 transition-colors duration-200">
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_RANGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {filters.ageRange && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100 z-10"
                          onClick={() => handleQuickClear("ageRange")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100"
                >
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Searching...
                      </span>
                    ) : (
                      "Search Patients"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading || activeFiltersCount === 0}
                    className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reset Filters
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
