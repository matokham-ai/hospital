import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
  Stethoscope,
  Bed,
  AlertTriangle,
  Heart,
  Users,
  Check,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Activity
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Badge } from '@/Components/ui/badge';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Progress } from '@/Components/ui/progress';
import { cn } from '@/lib/utils';

interface Facility {
  id: string;
  name: string;
  type: 'OPD' | 'IPD' | 'Emergency' | 'ICU' | 'Maternity' | 'OR';
  icon: LucideIcon;
  patientCount?: number;
  color: string;
  capacity?: number;
  status?: 'Normal' | 'High Load' | 'Critical';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated?: string;
  notes?: string;
}

interface FacilitySwitcherProps {
  currentFacility?: string;
  facilities?: Facility[];
  onSwitch?: (facilityId: string) => void;
}

const defaultFacilities: Facility[] = [
  {
    id: 'opd',
    name: 'Outpatient Department',
    type: 'OPD',
    icon: Stethoscope,
    patientCount: 18,
    capacity: 24,
    color: 'bg-blue-500',
    status: 'Normal',
    trend: 'up',
    lastUpdated: 'Updated 2 min ago',
    notes: 'Walk-in flow tracking steady – triage queue under 5 patients.'
  },
  {
    id: 'ipd',
    name: 'Inpatient Department',
    type: 'IPD',
    icon: Bed,
    patientCount: 42,
    capacity: 56,
    color: 'bg-purple-500',
    status: 'Normal',
    trend: 'stable',
    lastUpdated: 'Updated 5 min ago',
    notes: 'Rounds in progress; escalate discharges before 2 PM.'
  },
  {
    id: 'emergency',
    name: 'Emergency Department',
    type: 'Emergency',
    icon: AlertTriangle,
    patientCount: 12,
    capacity: 14,
    color: 'bg-red-500',
    status: 'High Load',
    trend: 'up',
    lastUpdated: 'Updated 1 min ago',
    notes: 'Two red tags arriving – notify trauma bay when switching in.'
  },
  {
    id: 'icu',
    name: 'Intensive Care Unit',
    type: 'ICU',
    icon: Heart,
    patientCount: 8,
    capacity: 10,
    color: 'bg-orange-500',
    status: 'Critical',
    trend: 'up',
    lastUpdated: 'Updated moments ago',
    notes: 'Ventilator usage at 80%. Coordinate with respiratory therapy.'
  },
  {
    id: 'maternity',
    name: 'Maternity Ward',
    type: 'Maternity',
    icon: Users,
    patientCount: 14,
    capacity: 18,
    color: 'bg-pink-500',
    status: 'Normal',
    trend: 'down',
    lastUpdated: 'Updated 10 min ago',
    notes: 'Postpartum checks due for three patients within the hour.'
  },
];

export default function FacilitySwitcher({
  currentFacility = 'ipd',
  facilities = defaultFacilities,
  onSwitch
}: FacilitySwitcherProps) {
  const [selectedFacility, setSelectedFacility] = useState(currentFacility);
  const [hoveredFacilityId, setHoveredFacilityId] = useState(currentFacility);

  useEffect(() => {
    setHoveredFacilityId(selectedFacility);
  }, [selectedFacility]);

  const current = facilities.find(f => f.id === selectedFacility) || facilities[0];
  const CurrentIcon = current.icon;

  const statusColor = (status?: Facility['status']) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'High Load':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const trendIcon = (trend?: Facility['trend']) => {
    if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5" />;
    if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  const quickFilters = useMemo(
    () => facilities.filter((facility) => facility.status === 'High Load' || facility.status === 'Critical'),
    [facilities]
  );

  const handleSwitch = (facilityId: string) => {
    setSelectedFacility(facilityId);
    setHoveredFacilityId(facilityId);

    if (onSwitch) {
      onSwitch(facilityId);
    } else {
      // Default behavior: navigate to facility-specific dashboard
      router.visit(`/nurse/facility/${facilityId}`, {
        preserveState: true,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between border-slate-300 hover:border-slate-400"
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${current.color} bg-opacity-10`}>
              <CurrentIcon className={`h-4 w-4 ${current.color.replace('bg-', 'text-')}`} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900">{current.type}</div>
              <div className="text-xs text-slate-500">{current.patientCount ?? 0} patients</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[320px] md:w-[360px] p-0">
        <div className="px-4 pt-3 pb-2">
          <DropdownMenuLabel className="px-0 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active Unit Overview
          </DropdownMenuLabel>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className={cn('rounded-lg p-2 text-white', current.color)}>
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{current.name}</p>
                <p className="text-xs text-slate-600">{current.patientCount ?? 0} patients • {current.type}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn('flex items-center gap-1 border', statusColor(current.status))}>
              {trendIcon(current.trend)}
              <span className="text-[11px] font-medium">{current.status ?? 'Normal'}</span>
            </Badge>
          </div>

          {quickFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1 bg-red-50 text-red-600">
                <Sparkles className="h-3 w-3" />
                High attention units
              </Badge>
              {quickFilters.map((facility) => (
                <button
                  key={facility.id}
                  type="button"
                  onClick={() => handleSwitch(facility.id)}
                  className="rounded-full border border-transparent bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-200 hover:bg-slate-200"
                >
                  {facility.type}
                </button>
              ))}
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <ScrollArea className="max-h-80">
          <div className="space-y-2 px-3 py-2">
            {facilities.map((facility) => {
              const Icon = facility.icon;
              const isActive = facility.id === selectedFacility;
              const patientTotal = facility.patientCount ?? 0;
              const capacity = facility.capacity ?? 0;
              const occupancy = capacity ? Math.round((patientTotal / capacity) * 100) : undefined;
              const isHovered = hoveredFacilityId === facility.id;

              return (
                <DropdownMenuItem asChild key={facility.id}>
                  <button
                    type="button"
                    onClick={() => handleSwitch(facility.id)}
                    onMouseEnter={() => setHoveredFacilityId(facility.id)}
                    onMouseLeave={() => setHoveredFacilityId(selectedFacility)}
                    className={cn(
                      'group w-full rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isActive && 'border-slate-200 bg-slate-50 shadow-sm'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-xl p-2', facility.color, 'bg-opacity-20 text-slate-900')}>
                          <Icon className={cn('h-4 w-4', facility.color.replace('bg-', 'text-'))} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {facility.name}
                          </p>
                          <p className="text-xs text-slate-500">{facility.type}</p>
                          {facility.lastUpdated && (
                            <p className="mt-1 text-xs text-slate-400">{facility.lastUpdated}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="text-[11px] font-semibold">
                          {patientTotal} pts
                        </Badge>
                        {isActive && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>

                    {capacity ? (
                      <div className="mt-3 space-y-1">
                        <Progress value={occupancy} className="h-2.5 bg-slate-200" />
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{patientTotal} of {capacity} beds</span>
                          <span>{occupancy}% occupied</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                        <Activity className="h-3.5 w-3.5" />
                        <span>Live census available</span>
                      </div>
                    )}

                    {isHovered && facility.notes && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                        {facility.notes}
                      </div>
                    )}

                    {isHovered && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          Status
                          <Badge variant="outline" className={cn('border px-2', statusColor(facility.status))}>
                            {facility.status ?? 'Normal'}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          Trend
                          {trendIcon(facility.trend)}
                        </span>
                      </div>
                    )}
                  </button>
                </DropdownMenuItem>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
