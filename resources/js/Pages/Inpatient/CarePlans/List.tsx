import React, { useState, useEffect } from "react";
import { Head, Link, router } from "@inertiajs/react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { CalendarDays, User, Bed, Search, X, Filter } from "lucide-react";

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
  chief_complaint?: string;
  patient: Patient;
}

interface Filters {
  search: string;
  date_from: string;
  date_to: string;
  ward: string;
  complaint: string;
}

interface Props {
  encounters: Encounter[];
  wards: string[];
  filters: Filters;
}

export default function CarePlansList({ encounters, wards, filters }: Props) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setIsSearching(true);
    router.get('/inpatient/care-plans', localFilters, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsSearching(false),
    });
  };

  const handleClearFilters = () => {
    const emptyFilters: Filters = {
      search: '',
      date_from: '',
      date_to: '',
      ward: '',
      complaint: '',
    };
    setLocalFilters(emptyFilters);
    setIsSearching(true);
    router.get('/inpatient/care-plans', emptyFilters, {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => setIsSearching(false),
    });
  };

  const hasActiveFilters = Object.values(localFilters).some(val => val !== '');
  const activeFilterCount = Object.values(localFilters).filter(val => val !== '').length;

  return (
    <HMSLayout>
      <Head title="Patient Care Plans" />
      <div className="max-w-6xl mx-auto py-8 space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Patient Care Plans</h2>
        </div>

        {/* Search Bar */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by patient name or encounter number..."
                    value={localFilters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-10 bg-white"
                  />
                  {localFilters.search && (
                    <button
                      onClick={() => handleFilterChange('search', '')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <Input
                    type="date"
                    value={localFilters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <Input
                    type="date"
                    value={localFilters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ward
                  </label>
                  <select
                    value={localFilters.ward}
                    onChange={(e) => handleFilterChange('ward', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Wards</option>
                    {wards.map((ward) => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chief Complaint
                  </label>
                  <Input
                    type="text"
                    placeholder="Filter by complaint..."
                    value={localFilters.complaint}
                    onChange={(e) => handleFilterChange('complaint', e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Apply Filters
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      disabled={isSearching}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {localFilters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Search: {localFilters.search}
                <button
                  onClick={() => {
                    handleFilterChange('search', '');
                    setTimeout(handleSearch, 0);
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {localFilters.date_from && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                From: {new Date(localFilters.date_from).toLocaleDateString()}
                <button
                  onClick={() => {
                    handleFilterChange('date_from', '');
                    setTimeout(handleSearch, 0);
                  }}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {localFilters.date_to && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                To: {new Date(localFilters.date_to).toLocaleDateString()}
                <button
                  onClick={() => {
                    handleFilterChange('date_to', '');
                    setTimeout(handleSearch, 0);
                  }}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {localFilters.ward && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                Ward: {localFilters.ward}
                <button
                  onClick={() => {
                    handleFilterChange('ward', '');
                    setTimeout(handleSearch, 0);
                  }}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {localFilters.complaint && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                Complaint: {localFilters.complaint}
                <button
                  onClick={() => {
                    handleFilterChange('complaint', '');
                    setTimeout(handleSearch, 0);
                  }}
                  className="hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Active Inpatients</h3>
          <p className="text-sm text-gray-500">
            {encounters.length} {encounters.length === 1 ? 'admission' : 'admissions'} found
          </p>
        </div>

        {encounters.length ? (
          <div className="grid gap-4">
            {encounters.map((encounter) => (
              <Card key={encounter.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-5 h-5 text-blue-500" />
                        <h4 className="text-lg font-semibold text-gray-800">
                          {encounter.patient.first_name} {encounter.patient.last_name}
                        </h4>
                        <span className="text-sm text-gray-500">
                          ({encounter.patient.age}y, {encounter.patient.gender})
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>Encounter #{encounter.encounter_number}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          <span>Admitted: {new Date(encounter.admission_datetime).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {encounter.chief_complaint && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Chief Complaint:</span> {encounter.chief_complaint}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/inpatient/admissions/${encounter.id}/care-plans`}>
                        <Button variant="outline" size="sm">
                          View Care Plans
                        </Button>
                      </Link>
                      <Link href={`/inpatient/admissions/${encounter.id}/prescriptions`}>
                        <Button variant="outline" size="sm">
                          Prescriptions
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Bed className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Active Admissions</h3>
            <p className="text-gray-500">There are currently no active inpatient admissions.</p>
          </div>
        )}
      </div>
    </HMSLayout>
  );
}
