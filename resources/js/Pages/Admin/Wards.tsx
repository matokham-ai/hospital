// resources/js/Pages/Admin/Wards.tsx
import { Head } from "@inertiajs/react";
import { useState, useMemo } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import BedMatrix from "@/Components/Admin/BedMatrix";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { useToast } from "@/Components/ui/use-toast";
import { Button } from "@/Components/ui/button";
import {
  RefreshCw,
  Activity,
  Bed,
  Building2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Progress } from "@/Components/ui/progress";

// Types
interface Ward {
  id: number;
  wardid: string;
  name: string;
  code: string;
  ward_type:
    | "GENERAL"
    | "ICU"
    | "MATERNITY"
    | "PEDIATRIC"
    | "ISOLATION"
    | "PRIVATE";
  total_beds: number;
  floor_number?: number;
  description?: string;
  status: "active" | "inactive" | "maintenance" | "renovation";
  department?: {
    id: number;
    name: string;
  };
  beds: BedData[];
  occupancy_rate?: number;
  available_beds?: number;
}

interface BedData {
  id: number;
  bed_number: string;
  bed_type: "STANDARD" | "ICU" | "ISOLATION" | "PRIVATE";
  status:
    | "available"
    | "occupied"
    | "maintenance"
    | "reserved"
    | "out_of_order";
}

interface WardsPageProps {
  user: { name: string; email: string; role: string };
  wards: Ward[];
  permissions: string[];
}

export default function Wards({ user, wards: initialWards }: WardsPageProps) {
  const [wards, setWards] = useState<Ward[]>(initialWards);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Reactive ward stats
  const stats = useMemo(() => {
    const totalBeds = wards.reduce((sum, w) => sum + w.total_beds, 0);
    const availableBeds = wards.reduce(
      (sum, w) => sum + (w.available_beds ?? 0),
      0
    );
    const occupiedBeds = totalBeds - availableBeds;
    const occupancyRate =
      totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalBeds,
      availableBeds,
      occupiedBeds,
      occupancyRate,
    };
  }, [wards]);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/admin/wards/matrix/data", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const freshWards = await response.json();
      console.log('Fresh wards data:', freshWards);
      console.log('First ward beds:', freshWards[0]?.beds);
      setWards(freshWards);
      toast({ title: "✅ Refreshed", description: "Latest ward data loaded." });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "❌ Refresh Failed",
        description: "Unable to load latest data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout user={user}>
      <Head title="Ward & Bed Management - MediCare HMS" />

      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-100 transition-all duration-700 text-gray-800">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin/dashboard">
                      Administration
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Ward & Bed Management</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <h1 className="text-3xl font-bold mt-1 text-sky-600">
                Ward & Bed Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Monitor occupancy and manage ward bed assignments efficiently.
              </p>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`relative bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-md rounded-xl px-5 py-2 transition-all ${
                isLoading ? "opacity-80 cursor-wait" : "hover:scale-105"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span className="ml-2">Refresh</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              title: "Total Beds",
              icon: <Bed className="text-sky-600" />,
              value: stats.totalBeds,
              color: "from-sky-50 to-sky-100",
            },
            {
              title: "Occupancy Rate",
              icon: <Activity className="text-emerald-600" />,
              value: `${stats.occupancyRate}%`,
              color: "from-emerald-50 to-emerald-100",
              progress: stats.occupancyRate,
            },
            {
              title: "Available Beds",
              icon: <Building2 className="text-indigo-600" />,
              value: stats.availableBeds,
              color: "from-indigo-50 to-indigo-100",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`bg-gradient-to-br ${item.color} border border-sky-100 rounded-xl shadow-sm hover:shadow-md transition-all`}
            >
              <CardHeader className="flex items-center gap-2">
                {item.icon}
                <CardTitle className="text-gray-800 text-base">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {item.progress ? (
                  <>
                    <Progress value={item.progress} className="mt-2" />
                    <p className="text-2xl font-semibold mt-2 text-emerald-600">
                      {item.value}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl font-bold text-sky-700">{item.value}</p>
                )}
              </CardContent>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="max-w-7xl mx-auto mt-8 px-6">
          <Card className="bg-white/90 shadow-sm border border-sky-100 rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-sky-700 flex items-center gap-2">
                <Activity className="text-sky-500 h-5 w-5" />
                Bed Status Legend
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-sm">
              {[
                { label: "Available", color: "bg-green-50 border-2 border-green-200", icon: "✓", textColor: "text-green-700" },
                { label: "Occupied", color: "bg-blue-50 border-2 border-blue-200", icon: "👤", textColor: "text-blue-700" },
                { label: "Critical", color: "bg-red-50 border-2 border-red-200", icon: "🚨", textColor: "text-red-700" },
                { label: "Isolation", color: "bg-yellow-50 border-2 border-yellow-200", icon: "🔒", textColor: "text-yellow-700" },
                { label: "Cleaning", color: "bg-amber-50 border-2 border-amber-200", icon: "🧹", textColor: "text-amber-700" },
                { label: "Maintenance", color: "bg-gray-100 border-2 border-gray-200", icon: "🔧", textColor: "text-gray-700" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${item.color}`}>
                    {item.icon}
                  </div>
                  <span className={`${item.textColor} font-medium`}>{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-48 bg-gray-100 rounded-xl animate-pulse shadow-inner"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <BedMatrix
                  wards={wards}
                  onBedUpdate={async (bedId, data) => {
                    try {
                      const backendData = {
                        ...data,
                        status: data.status?.toLowerCase(),
                      };
                      const response = await fetch(
                        `/admin/beds/${bedId}/status`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            "X-CSRF-TOKEN":
                              document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute("content") || "",
                          },
                          body: JSON.stringify(backendData),
                        }
                      );

                      if (response.ok) {
                        handleRefresh();
                        toast({
                          title: "✅ Bed Updated",
                          description: "Bed status updated successfully.",
                        });
                      } else {
                        throw new Error("Failed to update bed");
                      }
                    } catch (error) {
                      toast({
                        title: "❌ Update Failed",
                        description: "Unable to update bed status.",
                        variant: "destructive",
                      });
                    }
                  }}
                  onWardUpdate={() => {}}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
