import HMSLayout from "@/Layouts/HMSLayout";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import {
  Search,
  X,
  ClipboardList,
  CheckCircle,
  Package,
  AlertTriangle,
  Clock,
  Activity,
  Pill,
  Box,
} from "lucide-react";

interface Stats {
    totalDrugs: number;
    pendingPrescriptions: number;
    dispensedToday: number;
    lowStockItems: number;
    expiringSoon: number;
}

interface Drug {
    id: number;
    generic_name: string;
    brand_name?: string;
    strength?: string;
    formulation?: string;
}

interface PrescriptionItem {
    id: number;
    drug_id: number;
    dose: string;
    frequency: string;
    duration: string;
    quantity: number;
    route?: string;
    instructions?: string;
    drug?: Drug;
}

interface Prescription {
    id: number;
    patient_id: string;
    physician_id: string;
    status: string;
    created_at: string;
    drug_name?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    quantity?: number;
    notes?: string;
    patient?: {
        id: string;
        first_name: string;
        last_name: string;
        hospital_id: string;
    };
    physician?: {
        physician_code: string;
        name: string;
    };
    items?: PrescriptionItem[];
}

interface InventoryItem {
    id: number;
    drug_id: number;
    quantity: number;
    min_level: number;
    max_level: number;
    batch_no?: string;
    expiry_date?: string;
    drug?: Drug;
}

interface DashboardProps {
    stats?: Stats;
    prescriptions?: Prescription[];
    inventory?: InventoryItem[];
    auth: any;
}

export default function PharmacistDashboard({ stats, prescriptions, inventory, auth }: DashboardProps) {
  const safeStats = stats || {
    totalDrugs: 0,
    pendingPrescriptions: 0,
    dispensedToday: 0,
    lowStockItems: 0,
    expiringSoon: 0,
  };
  const safePrescriptions = prescriptions || [];
  const safeInventory = inventory || [];
  const [searchTerm, setSearchTerm] = useState("");



  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return "unknown";
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return "expired";
    if (days <= 30) return "expiring-soon";
    if (days <= 90) return "expiring-warning";
    return "good";
  };

  const getReorderStatus = (quantity: number, minLevel: number, maxLevel: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity <= minLevel) return "reorder-now";
    if (quantity <= minLevel * 1.5) return "reorder-soon";
    return "adequate";
  };

  const expiringItems = safeInventory.filter((i: any) => {
    const s = getExpiryStatus(i.expiry_date);
    return s === "expiring-soon" || s === "expired";
  });

  const reorderItems = safeInventory.filter((i: any) => {
    const s = getReorderStatus(i.quantity, i.min_level, i.max_level);
    return s === "reorder-now" || s === "out-of-stock";
  });

  const filteredPrescriptions = safePrescriptions.filter((p: any) => {
    const patient = `${p.patient?.first_name ?? ""} ${p.patient?.last_name ?? ""}`.toLowerCase();
    const doctor = p.physician?.name?.toLowerCase() ?? "";
    return (
      patient.includes(searchTerm.toLowerCase()) ||
      doctor.includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm)
    );
  });

  const filteredInventory = safeInventory.filter((i: any) => {
    const g = i.drug?.generic_name?.toLowerCase() || "";
    const b = i.drug?.brand_name?.toLowerCase() || "";
    return g.includes(searchTerm.toLowerCase()) || b.includes(searchTerm.toLowerCase());
  });

  return (
    <HMSLayout user={auth.user}>
      <Head title="Pharmacy Dashboard - MediCare HMS" />

      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-blue-100 rounded-2xl shadow-sm p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pharmacy Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, <span className="font-medium text-blue-700">{auth.user.name}</span> 👋
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" /> {new Date().toLocaleString()}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prescriptions, patients, or drugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/pharmacy/prescriptions"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Prescriptions</p>
                <p className="text-3xl font-semibold text-orange-600 mt-1">
                  {safeStats.pendingPrescriptions}
                </p>
              </div>
              <div className="bg-orange-100 text-orange-700 p-3 rounded-xl">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>
          </Link>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Dispensed Today</p>
                <p className="text-3xl font-semibold text-green-600 mt-1">{safeStats.dispensedToday}</p>
              </div>
              <div className="bg-green-100 text-green-700 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <Link
            href="/pharmacy/inventory"
            className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Low Stock Items</p>
                <p className="text-3xl font-semibold text-red-600 mt-1">{safeStats.lowStockItems}</p>
              </div>
              <div className="bg-red-100 text-red-700 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </Link>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Expiring Soon</p>
                <p className="text-3xl font-semibold text-purple-600 mt-1">{safeStats.expiringSoon}</p>
              </div>
              <div className="bg-purple-100 text-purple-700 p-3 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(expiringItems.length > 0 || reorderItems.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expiry Alerts */}
            {expiringItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Expiry Alerts ({expiringItems.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {expiringItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.drug?.generic_name}</p>
                        <p className="text-xs text-gray-600">
                          Batch: {item.batch_no || "N/A"} • Stock: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reorder Alerts */}
            {reorderItems.length > 0 && (
              <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" /> Reorder Alerts ({reorderItems.length})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reorderItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100"
                    >
                      <Box className="w-5 h-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.drug?.generic_name}</p>
                        <p className="text-xs text-gray-600">
                          Stock: {item.quantity} • Min: {item.min_level} • Max: {item.max_level}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Prescriptions & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Prescriptions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Pending Prescriptions
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredPrescriptions.length ? (
                filteredPrescriptions.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/pharmacy/prescriptions/${p.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    <div className="text-sm text-gray-500 font-mono w-20">
                      {new Date(p.created_at).toLocaleTimeString()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {p.patient
                          ? `${p.patient.first_name} ${p.patient.last_name}`
                          : `Patient ID: ${p.patient_id}`}
                      </p>
                      {p.patient?.hospital_id && (
                        <p className="text-xs text-gray-400">ID: {p.patient.hospital_id}</p>
                      )}
                      <p className="text-xs text-gray-500 mb-1">
                        By {p.physician?.name || `Physician ID: ${p.physician_id}`}
                      </p>
                      
                      {/* Display prescribed medications */}
                      <div className="mt-2 space-y-1">
                        {p.items && p.items.length > 0 ? (
                          p.items.slice(0, 2).map((item: PrescriptionItem, index: number) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <Pill className="w-3 h-3 text-blue-500" />
                              <span className="font-medium text-blue-700">
                                {item.drug?.generic_name || 'Unknown Drug'}
                                {item.drug?.strength && ` ${item.drug.strength}`}
                              </span>
                              <span className="text-gray-500">
                                {item.dose} • {item.frequency} • {item.duration}
                              </span>
                            </div>
                          ))
                        ) : p.drug_name ? (
                          // Fallback to old prescription format
                          <div className="flex items-center gap-2 text-xs">
                            <Pill className="w-3 h-3 text-blue-500" />
                            <span className="font-medium text-blue-700">{p.drug_name}</span>
                            <span className="text-gray-500">
                              {p.dosage} • {p.frequency} • {p.duration}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Pill className="w-3 h-3" />
                            <span>No medications specified</span>
                          </div>
                        )}
                        
                        {p.items && p.items.length > 2 && (
                          <div className="text-xs text-gray-500 ml-5">
                            +{p.items.length - 2} more medication{p.items.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === "pending"
                          ? "bg-orange-100 text-orange-700"
                          : p.status === "verified"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.status}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">
                  {searchTerm ? "No prescriptions match your search" : "No recent prescriptions"}
                </p>
              )}
            </div>
          </div>

          {/* Inventory Status */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Inventory Status
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredInventory.length ? (
                filteredInventory.map((item: any) => {
                  const status =
                    item.quantity === 0
                      ? "critical"
                      : item.quantity <= item.min_level
                      ? "low"
                      : "good";
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          status === "critical"
                            ? "bg-red-100"
                            : status === "low"
                            ? "bg-yellow-100"
                            : "bg-green-100"
                        }`}
                      >
                        {status === "critical" ? "🚨" : status === "low" ? "⚠️" : "✅"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.drug?.generic_name || "Unknown Drug"}
                        </p>
                        <p className="text-xs text-gray-600">Stock: {item.quantity}</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === "critical"
                            ? "bg-red-100 text-red-700"
                            : status === "low"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {status}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-6">
                  {searchTerm ? "No inventory match your search" : "No inventory data"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Featured Action - Add New Drug */}
            <Link
              href="/pharmacy/drugs/create"
              className="p-4 rounded-xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✨</span>
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">NEW</span>
              </div>
              <h4 className="font-bold text-gray-900">Add New Drug</h4>
              <p className="text-sm text-gray-700">Complete drug wizard</p>
            </Link>

            {[
              {
                href: "/pharmacy/prescriptions",
                icon: Pill,
                title: "Dispense Medication",
                desc: "Process prescription",
              },
              {
                href: "/pharmacy/inventory",
                icon: Package,
                title: "Update Stock",
                desc: "Manage inventory",
              },
              {
                href: "/pharmacy/formulary",
                icon: Search,
                title: "Search Medication",
                desc: "Find drugs quickly",
              },
            ].map(({ href, icon: Icon, title, desc }) => (
              <Link
                key={title}
                href={href}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <Icon className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-medium text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </HMSLayout>
  );
}
