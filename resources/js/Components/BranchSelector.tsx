import { router, usePage, Link } from '@inertiajs/react';
import { Building2, MapPin, CheckCircle2, ExternalLink } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

interface Branch {
    id: number;
    branch_code: string;
    branch_name: string;
    location?: string;
    status: string;
}

interface BranchSelectorProps {
    className?: string;
    showLabel?: boolean;
}

export default function BranchSelector({ className = '', showLabel = true }: BranchSelectorProps) {
    const { branches, selectedBranch } = usePage().props as any;

    if (!branches || branches.length === 0) {
        return null;
    }

    const handleBranchChange = (branchId: string) => {
        router.post('/branch/switch', { branch_id: branchId }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const currentBranchId = selectedBranch?.toString() || 'all';
    const currentBranch = branches.find((b: Branch) => b.id.toString() === currentBranchId);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {showLabel && (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">Branch:</span>
                </div>
            )}
            <Select value={currentBranchId} onValueChange={handleBranchChange}>
                <SelectTrigger className="w-[220px] bg-white border-gray-300 hover:border-teal-400 transition-colors">
                    <SelectValue placeholder="Select branch">
                        {currentBranchId === 'all' ? (
                            <span className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-teal-600" />
                                <span className="font-medium">All Branches</span>
                            </span>
                        ) : currentBranch ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span className="font-medium">{currentBranch.branch_code}</span>
                            </span>
                        ) : (
                            'Select branch'
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white">
                    <SelectItem value="all" className="cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                            <Building2 className="h-4 w-4 text-teal-600" />
                            <div>
                                <div className="font-semibold">All Branches</div>
                                <div className="text-xs text-gray-500">View system-wide data</div>
                            </div>
                        </div>
                    </SelectItem>
                    <div className="my-1 border-t"></div>
                    {branches.map((branch: Branch) => (
                        <SelectItem 
                            key={branch.id} 
                            value={branch.id.toString()}
                            className="cursor-pointer group"
                        >
                            <div className="flex items-center justify-between gap-3 py-1 w-full">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-shrink-0">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold">{branch.branch_name}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span className="font-mono">{branch.branch_code}</span>
                                            {branch.location && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {branch.location}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={`/admin/branches/${branch.id}/dashboard`}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                    title="View branch dashboard"
                                >
                                    <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                                </Link>
                            </div>
                        </SelectItem>
                    ))}
                    <div className="my-1 border-t"></div>
                    <Link
                        href="/admin/branches"
                        className="flex items-center gap-2 px-2 py-2 text-sm text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">Manage All Branches</span>
                        <ExternalLink className="h-3.5 w-3.5 ml-auto" />
                    </Link>
                </SelectContent>
            </Select>
        </div>
    );
}
