import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import {
  Users,
  Stethoscope,
  Bed,
  Check,
  ChevronDown,
  Filter,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus
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
import { Input } from '@/Components/ui/input';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PatientList {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  count: number;
  color: string;
  tags?: string[];
  trend?: 'up' | 'down' | 'stable';
  updatedAt?: string;
  notifications?: number;
  priority?: 'standard' | 'important' | 'critical';
}

interface PatientListSelectorProps {
  currentList?: string;
  lists?: PatientList[];
  onSelect?: (listId: string) => void;
}

const defaultLists: PatientList[] = [
  {
    id: 'my-patients',
    name: 'My Patients',
    description: 'Assigned to me',
    icon: Users,
    count: 12,
    color: 'bg-blue-500',
    trend: 'up',
    updatedAt: 'Synced 30s ago',
    notifications: 3,
    tags: ['Rounds', 'Handover'],
    priority: 'important'
  },
  {
    id: 'clinic-patients',
    name: 'My Clinic Patients',
    description: 'Scheduled for OPD follow-up',
    icon: Stethoscope,
    count: 18,
    color: 'bg-green-500',
    trend: 'down',
    updatedAt: 'Synced 2m ago',
    notifications: 1,
    tags: ['OPD', 'Follow-up'],
    priority: 'standard'
  },
  {
    id: 'ward-patients',
    name: 'My Ward Patients',
    description: 'IPD patients on my shift',
    icon: Bed,
    count: 26,
    color: 'bg-purple-500',
    trend: 'up',
    updatedAt: 'Synced 1m ago',
    notifications: 5,
    tags: ['High acuity'],
    priority: 'critical'
  },
  {
    id: 'all-patients',
    name: 'All Patients',
    description: 'Complete hospital census',
    icon: Users,
    count: 64,
    color: 'bg-slate-500',
    trend: 'stable',
    updatedAt: 'Synced 5m ago',
    tags: ['Admin'],
    priority: 'standard'
  },
];

export default function PatientListSelector({
  currentList = 'my-patients',
  lists = defaultLists,
  onSelect
}: PatientListSelectorProps) {
  const [selectedList, setSelectedList] = useState(currentList);
  const [query, setQuery] = useState('');
  const [hoveredListId, setHoveredListId] = useState(currentList);

  useEffect(() => {
    setHoveredListId(selectedList);
  }, [selectedList]);

  const current = lists.find(l => l.id === selectedList) || lists[0];
  const CurrentIcon = current.icon;

  const filteredLists = useMemo(() => {
    const sanitized = query.trim().toLowerCase();
    if (!sanitized) {
      return lists;
    }

    return lists.filter((list) =>
      list.name.toLowerCase().includes(sanitized) ||
      list.description.toLowerCase().includes(sanitized) ||
      list.tags?.some((tag) => tag.toLowerCase().includes(sanitized))
    );
  }, [lists, query]);

  const trendIcon = (trend?: PatientList['trend']) => {
    if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5" />;
    if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  const priorityTone = (priority?: PatientList['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'important':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleSelect = (listId: string) => {
    setSelectedList(listId);

    if (onSelect) {
      onSelect(listId);
    } else {
      // Default behavior: navigate to patient list
      const route = listId === 'my-patients' ? '/nurse/patients' :
                    listId === 'clinic-patients' ? '/nurse/patients/clinic' :
                    listId === 'ward-patients' ? '/nurse/patients/ward' :
                    '/nurse/patients/all';

      router.visit(route, {
        preserveState: true,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[180px] justify-between border-slate-300 hover:border-slate-400"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900">{current.name}</div>
              <div className="text-xs text-slate-500">{current.count} patients</div>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[300px] md:w-[340px] p-0">
        <div className="px-4 pt-3 pb-2">
          <DropdownMenuLabel className="px-0 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Patient Lists
          </DropdownMenuLabel>
          <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className={cn('rounded-lg p-2 text-white', current.color)}>
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{current.name}</p>
                <p className="text-xs text-slate-600">{current.count} patients • live sync</p>
              </div>
            </div>
            <Badge variant="outline" className={cn('border', priorityTone(current.priority))}>
              {trendIcon(current.trend)}
              <span className="text-[11px] font-medium">{current.updatedAt ?? 'Synced just now'}</span>
            </Badge>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lists or tags..."
              className="h-8 border-0 p-0 text-sm focus-visible:ring-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-[11px] font-medium text-blue-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />

        <ScrollArea className="max-h-72">
          <div className="space-y-2 px-3 py-2">
            {filteredLists.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No lists match “{query}”. Try a different keyword.
              </div>
            )}

            {filteredLists.map((list) => {
              const Icon = list.icon;
              const isActive = list.id === selectedList;
              const isHovered = hoveredListId === list.id;

              return (
                <DropdownMenuItem asChild key={list.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(list.id)}
                    onMouseEnter={() => setHoveredListId(list.id)}
                    onMouseLeave={() => setHoveredListId(selectedList)}
                    className={cn(
                      'group w-full rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isActive && 'border-slate-200 bg-slate-50 shadow-sm'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-xl p-2', list.color, 'bg-opacity-20 text-slate-900')}>
                          <Icon className={cn('h-4 w-4', list.color.replace('bg-', 'text-'))} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{list.name}</p>
                          <p className="text-xs text-slate-500">{list.description}</p>
                          {list.tags && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {list.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[11px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="text-[11px] font-semibold">
                          {list.count}
                        </Badge>
                        {list.notifications && list.notifications > 0 && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-600">
                            <Bell className="h-3.5 w-3.5" />
                            <span>{list.notifications}</span>
                          </div>
                        )}
                        {isActive && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>

                    {isHovered && (
                      <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span>Last sync</span>
                          <span>{list.updatedAt ?? 'Auto sync enabled'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Priority</span>
                          <Badge variant="outline" className={cn('border px-2 capitalize', priorityTone(list.priority))}>
                            {list.priority ?? 'standard'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Trend</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            {trendIcon(list.trend)}
                            {list.trend ?? 'stable'}
                          </span>
                        </div>
                        {list.notifications && list.notifications > 0 && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                            {list.notifications} pending alerts in this view.
                          </div>
                        )}
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
