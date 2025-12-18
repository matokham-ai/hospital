import HMSLayout from '@/Layouts/HMSLayout';
import { Head, Link } from '@inertiajs/react';

interface StockMovement {
    id: number;
    drug_id: number;
    movement_type: string;
    quantity: number;
    reference_no?: string;
    created_at: string;
    drug?: {
        generic_name: string;
        brand_name?: string;
        strength?: string;
    };
    user?: {
        name: string;
    };
}

export default function StockMovements({
    movements,
    auth
}: {
    movements: { data: StockMovement[]; links: any; meta: any };
    auth: any;
}) {
    const getMovementTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'grn':
                return 'bg-green-100 text-green-800';
            case 'transfer':
                return 'bg-blue-100 text-blue-800';
            case 'adjustment':
                return 'bg-yellow-100 text-yellow-800';
            case 'return':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getMovementIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'grn':
                return '📦';
            case 'transfer':
                return '🔄';
            case 'adjustment':
                return '⚖️';
            case 'return':
                return '↩️';
            default:
                return '📋';
        }
    };

    return (
        <HMSLayout user={auth.user}>
            <Head title="Stock Movements - Pharmacy" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
                                <p className="text-gray-600">Track all inventory movements and transactions</p>
                            </div>
                            <div className="flex gap-3">
                                <Link 
                                    href="/pharmacy/dashboard"
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    ← Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Movements Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Movements</h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            {movements.data && movements.data.length > 0 ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drug</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {movements.data.map((movement) => (
                                            <tr key={movement.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(movement.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{getMovementIcon(movement.movement_type)}</span>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeColor(movement.movement_type)}`}>
                                                            {movement.movement_type}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {movement.drug?.generic_name || 'Unknown Drug'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {movement.drug?.brand_name && `${movement.drug.brand_name} • `}
                                                            {movement.drug?.strength}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-sm font-medium ${
                                                        movement.movement_type === 'GRN' || movement.movement_type === 'RETURN' 
                                                            ? 'text-green-600' 
                                                            : 'text-red-600'
                                                    }`}>
                                                        {movement.movement_type === 'GRN' || movement.movement_type === 'RETURN' ? '+' : '-'}
                                                        {movement.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {movement.reference_no || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {movement.user?.name || 'System'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📊</div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No stock movements found</h3>
                                    <p className="text-gray-600">There are no stock movements to display at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HMSLayout>
    );
}
