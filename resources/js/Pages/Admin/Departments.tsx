// resources/js/Pages/Admin/Departments.tsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/Components/ui/breadcrumb";
import { Button } from "@/Components/ui/button";
import { RefreshCw, ArrowLeft, PlusCircle } from "lucide-react";
import { useToast } from "@/Components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";

interface Department {
  id?: number;
  deptid: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  sort_order: number;
  status: "active" | "inactive";
  wards_count?: number;
  test_catalogs_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentsPageProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  departments: Department[];
  permissions: string[];
}

/* ------------------- EDIT DEPARTMENT MODAL ------------------- */
function EditDepartmentModal({ 
  department, 
  onEdit 
}: { 
  department: Department; 
  onEdit: (deptid: string, data: Partial<Department>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: department.name,
    code: department.code,
    description: department.description || "",
    sort_order: department.sort_order,
    status: department.status,
  });

  // Reset form when modal opens with fresh department data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setForm({
        name: department.name,
        code: department.code,
        description: department.description || "",
        sort_order: department.sort_order,
        status: department.status,
      });
    }
    setOpen(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(department.deptid, form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800"
        >
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border border-blue-100 shadow-xl bg-white/90 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Edit Department
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Update the department details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Radiology, Pediatrics"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="RAD"
                required
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the department's purpose"
            />
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as "active" | "inactive" })
              }
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow hover:shadow-lg transition-all"
            >
              Update Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------- ADD DEPARTMENT MODAL ------------------- */
function AddDepartmentModal({ onAdd }: { onAdd: (data: Omit<Department, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    sort_order: 1,
    status: "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(form as any);
    setOpen(false);
    setForm({ name: "", code: "", description: "", sort_order: 1, status: "active" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow hover:shadow-lg transition-all rounded-xl">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border border-blue-100 shadow-xl bg-white/90 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Add New Department
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Provide details for the new department below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Radiology, Pediatrics"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="RAD"
                required
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the department's purpose"
            />
          </div>

          <div>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as "active" | "inactive" })
              }
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow hover:shadow-lg transition-all"
            >
              Save Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------- DEPARTMENTS MAIN PAGE ------------------- */
export default function Departments({ user, departments, permissions }: DepartmentsPageProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.reload({ only: ["departments"] });
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh departments data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddDepartment = (data: Omit<Department, "id">) => {
    router.post("/admin/departments", data, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Department created successfully",
        });
      },
      onError: (errors) => {
        console.error("Create error:", errors);
        toast({
          title: "Error",
          description: "Failed to create department",
          variant: "destructive",
        });
      },
    });
  };

  const handleEditDepartment = (deptid: string, data: Partial<Department>) => {
    router.put(`/admin/departments/${deptid}`, data, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Department updated successfully",
        });
      },
      onError: (errors) => {
        console.error("Update error:", errors);
        toast({
          title: "Error",
          description: "Failed to update department",
          variant: "destructive",
        });
      },
    });
  };

  const handleDeleteDepartment = (deptid: string) => {
    router.delete(`/admin/departments/${deptid}`, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Department deleted successfully",
        });
      },
      onError: (errors) => {
        console.error("Delete error:", errors);
        toast({
          title: "Error",
          description:
            "Failed to delete department. It may have active references.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <AdminLayout user={user}>
      <Head title="Departments Management - MediCare HMS" />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header with Breadcrumb */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin">Administration</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Departments</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="mt-4">
                <h1 className="text-2xl font-semibold text-gray-800">
                  🏥 Departments Management
                </h1>
                <p className="text-gray-500 text-sm">
                  Create, edit, and manage hospital departments efficiently.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {permissions.includes('create departments') && (
                <AddDepartmentModal onAdd={handleAddDepartment} />
              )}
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.visit("/admin")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>

          {/* Department Grid */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-blue-100 p-6 transition-all">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <div
                    key={dept.deptid}
                    className={`group border border-gray-100 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all ${
                      dept.status === "inactive" ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {dept.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          dept.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {dept.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {dept.description || "No description provided."}
                    </p>
                    <div className="flex justify-end gap-2">
                      {permissions.includes('edit departments') && (
                        <EditDepartmentModal 
                          department={dept} 
                          onEdit={handleEditDepartment} 
                        />
                      )}
                      {permissions.includes('delete departments') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteDepartment(dept.deptid)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 col-span-full text-center py-8">
                  No departments found. Add one to get started.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
