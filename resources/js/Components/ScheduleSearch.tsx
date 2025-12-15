import React, { useState, useCallback } from 'react';
import {
  Search,
  X,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Stethoscope,
  UserCheck,
  XCircle,
  Activity,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface ScheduleSearchProps {
  onSearch: (filters: { search?: string; status?: string; type?: string }) => void;
  loading?: boolean;
  initialFilters?: {
    search?: string;
    status?: string;
    type?: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'checked_in', label: 'Checked In', icon: UserCheck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'in_progress', label: 'In Progress', icon: Activity, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
];

const TYPE_OPTIONS = [
  { value: 'consultation', label: 'Consultation', icon: Stethoscope, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'follow_up', label: 'Follow Up', icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'emergency', label: 'Emergency', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  { value: 'routine_checkup', label: 'Routine Checkup', icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-100' },
];

export default function ScheduleSearch({ onSearch, loading = false, initialFilters = {} }: ScheduleSearchProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [status, setStatus] = useState(initialFilters.status || 'all');
  const [type, setType] = useState(initialFilters.type || 'all');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch({
        search: search.trim() || undefined,
        status: status && status !== 'all' ? status : undefined,
        type: type && type !== 'all' ? type : undefined,
      });
    },
    [search, status, type, onSearch]
  );

  const handleReset = useCallback(() => {
    setSearch('');
    setStatus('all');
    setType('all');
    onSearch({});
  }, [onSearch]);

  const hasActiveFilters = search || (status && status !== 'all') || (type && type !== 'all');

  return (
    <div className="space-y-4">
      {/* Active Filter Pills */}
      {!showFilters && ((status && status !== 'all') || (type && type !== 'all')) && (
        <div className="flex flex-wrap gap-2">
          {status && status !== 'all' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              <span>Status: {STATUS_OPTIONS.find(opt => opt.value === status)?.label}</span>
              <button
                type="button"
                onClick={() => setStatus('all')}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {type && type !== 'all' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              <span>Type: {TYPE_OPTIONS.find(opt => opt.value === type)?.label}</span>
              <button
                type="button"
                onClick={() => setType('all')}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search + Buttons */}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by patient name, doctor, or appointment type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-8 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100 rounded-full"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`relative transition-all duration-200 border-gray-300 hover:border-blue-400 ${
            hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''
          } ${showFilters ? 'bg-gray-100' : ''}`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          <ChevronDown
            className={`h-4 w-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
          />
          {((status && status !== 'all') || (type && type !== 'all')) && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-xs text-white font-bold">
                {[status && status !== 'all' ? status : null, type && type !== 'all' ? type : null]
                  .filter(Boolean)
                  .length}
              </span>
            </span>
          )}
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 transition-all duration-200 shadow-sm"
        >
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Searching...' : 'Search'}
        </Button>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
          >
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </form>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm transition-all duration-300">
          {/* Status Select */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Status Filter
            </label>
            <div className="relative">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 border-gray-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 bg-white">
                  <SelectValue placeholder="All statuses">
                    {status && status !== 'all' && (() => {
                      const selected = STATUS_OPTIONS.find(opt => opt.value === status);
                      if (selected) {
                        const Icon = selected.icon;
                        return (
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${selected.bgColor}`}>
                              <Icon className={`h-3.5 w-3.5 ${selected.color}`} />
                            </div>
                            <span>{selected.label}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white rounded-lg shadow-lg border border-gray-100">
                  <SelectItem value="all" className="font-medium text-gray-700 hover:bg-gray-100 rounded-md px-2 py-1.5">
                    All Statuses
                  </SelectItem>
                  {STATUS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="py-2 hover:bg-blue-50 rounded-md cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${option.bgColor}`}>
                            <Icon className={`h-4 w-4 ${option.color}`} />
                          </div>
                          <span className="font-medium text-gray-700">{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {status && status !== 'all' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100 rounded-full"
                  onClick={() => setStatus('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Type Select */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Stethoscope className="h-4 w-4 text-green-600" />
              Appointment Type
            </label>
            <div className="relative">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 border-gray-300 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 rounded-lg transition-all duration-200 bg-white">
                  <SelectValue placeholder="All types">
                    {type && type !== 'all' && (() => {
                      const selected = TYPE_OPTIONS.find(opt => opt.value === type);
                      if (selected) {
                        const Icon = selected.icon;
                        return (
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${selected.bgColor}`}>
                              <Icon className={`h-3.5 w-3.5 ${selected.color}`} />
                            </div>
                            <span>{selected.label}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white rounded-lg shadow-lg border border-gray-100">
                  <SelectItem value="all" className="font-medium text-gray-700 hover:bg-gray-100 rounded-md px-2 py-1.5">
                    All Types
                  </SelectItem>
                  {TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="py-2 hover:bg-blue-50 rounded-md cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${option.bgColor}`}>
                            <Icon className={`h-4 w-4 ${option.color}`} />
                          </div>
                          <span className="font-medium text-gray-700">{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {type && type !== 'all' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-gray-100 rounded-full"
                  onClick={() => setType('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
