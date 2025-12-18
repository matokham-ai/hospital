// resources/js/Pages/Admin/Physicians.tsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import HMSLayout from "@/Layouts/HMSLayout";
import { Button } from "@/Components/ui/button";
import { RefreshCw, PlusCircle, Edit, Trash2, UserPlus, Stethoscope } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";

interface Physician {
  id?: number;
  physician_code: string;
  user_id?: number;
  name: string;
  license_number: string;
  specialization: string;
  qualification: string;
  medical_school?: string;
  years_of_experience?: number;
  is_consultant: boolean;
  bio?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PhysiciansPageProps {
  auth: {
    user: {
      name: string;
      email: string;
      role: string;
    };
  };
  physicians: Physician[];
  includeTrashed?: boolean;
}

/* ------------------- ADD PHYSICIAN MODAL ------------------- */
function AddPhysicianModal({ onAdd }: { onAdd: (data: Omit<Physician, "id" | "physician_code">) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    license_number: "",
    specialization: "",
    qualification: "",
    medical_school: "",
    years_of_experience: 0,
    is_consultant: false,
    bio: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(form as any);
    setOpen(false);
    setForm({
      name: "",
      license_number: "",
      specialization: "",
      qualification: "",
      medical_school: "",
      years_of_experience: 0,
      is_consultant: false,
      bio: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-emerald-600 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all rounded-xl">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Physician
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-100 shadow-xl bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            Add New Physician
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Provide details for the new physician below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Basic Information</h3>
            
            <div>
              <Label className="text-sm font-medium">Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Dr. John Smith"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">License Number *</Label>
                <Input
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  placeholder="e.g., MD001"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Qualification *</Label>
                <Input
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  placeholder="e.g., MD, MBBS, DO"
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Professional Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Specialization *</Label>
                <Input
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="e.g., Cardiology, Pediatrics"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Years of Experience</Label>
                <Input
                  type="number"
                  value={form.years_of_experience}
                  onChange={(e) => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Medical School</Label>
              <Input
                value={form.medical_school}
                onChange={(e) => setForm({ ...form, medical_school: e.target.value })}
                placeholder="e.g., Harvard Medical School"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_consultant"
                checked={form.is_consultant}
                onChange={(e) => setForm({ ...form, is_consultant: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <Label htmlFor="is_consultant" className="text-sm font-medium cursor-pointer">
                Is Consultant
              </Label>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Additional Information</h3>
            
            <div>
              <Label className="text-sm font-medium">Bio / About</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Brief description about the physician's expertise and background"
                className="mt-1 min-h-[100px]"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
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
              className="bg-gradient-to-r from-emerald-600 to-cyan-500 text-white rounded-xl shadow hover:shadow-lg transition-all"
            >
              Save Physician
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------- EDIT PHYSICIAN MODAL ------------------- */
function EditPhysicianModal({ 
  physician, 
  onEdit 
}: { 
  physician: Physician; 
  onEdit: (code: string, data: Partial<Physician>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: physician.name,
    license_number: physician.license_number,
    specialization: physician.specialization,
    qualification: physician.qualification,
    medical_school: physician.medical_school || "",
    years_of_experience: physician.years_of_experience || 0,
    is_consultant: physician.is_consultant,
    bio: physician.bio || "",
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setForm({
        name: physician.name,
        license_number: physician.license_number,
        specialization: physician.specialization,
        qualification: physician.qualification,
        medical_school: physician.medical_school || "",
        years_of_experience: physician.years_of_experience || 0,
        is_consultant: physician.is_consultant,
        bio: physician.bio || "",
      });
    }
    setOpen(newOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEdit(physician.physician_code, form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-blue-100 shadow-xl bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Edit Physician
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Update the physician details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Basic Information</h3>
            
            <div>
              <Label className="text-sm font-medium">Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Dr. John Smith"
                className="mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">License Number *</Label>
                <Input
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  placeholder="e.g., MD001"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Qualification *</Label>
                <Input
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  placeholder="e.g., MD, MBBS, DO"
                  className="mt-1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Professional Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Specialization *</Label>
                <Input
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="e.g., Cardiology, Pediatrics"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Years of Experience</Label>
                <Input
                  type="number"
                  value={form.years_of_experience}
                  onChange={(e) => setForm({ ...form, years_of_experience: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Medical School</Label>
              <Input
                value={form.medical_school}
                onChange={(e) => setForm({ ...form, medical_school: e.target.value })}
                placeholder="e.g., Harvard Medical School"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_consultant"
                checked={form.is_consultant}
                onChange={(e) => setForm({ ...form, is_consultant: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <Label htmlFor="edit_is_consultant" className="text-sm font-medium cursor-pointer">
                Is Consultant
              </Label>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Additional Information</h3>
            
            <div>
              <Label className="text-sm font-medium">Bio / About</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Brief description about the physician's expertise and background"
                className="mt-1 min-h-[100px]"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
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
              Update Physician
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------- PHYSICIANS MAIN PAGE ------------------- */
export default function Physicians({ auth, physicians, includeTrashed = false }: PhysiciansPageProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(includeTrashed);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      router.reload({ only: ["physicians"] });
      toast({
        title: "🔄 Refreshed",
        description: "Physicians data has been refreshed",
      });
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast({
        title: "❌ Error",
        description: "Failed to refresh physicians data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddPhysician = (data: Omit<Physician, "id" | "physician_code">) => {
    router.post("/admin/physicians", data, {
      onSuccess: () => {
        toast({
          title: "✅ Success",
          description: "Physician added successfully",
        });
      },
      onError: (errors) => {
        console.error("Validation errors:", errors);
        
        let errorMessage = 'Failed to add physician';
        let errorTitle = "❌ Error";
        
        if (typeof errors === 'object' && errors !== null) {
          // Format validation errors nicely
          const errorEntries = Object.entries(errors);
          if (errorEntries.length > 0) {
            errorTitle = "⚠️ Validation Error";
            // Create a formatted list of errors
            const errorList = errorEntries.map(([field, messages]) => {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const messageArray = Array.isArray(messages) ? messages : [messages];
              return `${fieldName}: ${messageArray.join(', ')}`;
            });
            errorMessage = errorList.join('. ');
          }
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleEditPhysician = (code: string, data: Partial<Physician>) => {
    router.put(`/admin/physicians/${code}`, data, {
      onSuccess: () => {
        toast({
          title: "✅ Success",
          description: "Physician updated successfully",
        });
      },
      onError: (errors) => {
        console.error("Update error:", errors);
        
        let errorMessage = 'Failed to update physician';
        let errorTitle = "❌ Error";
        
        if (typeof errors === 'object' && errors !== null) {
          const errorEntries = Object.entries(errors);
          if (errorEntries.length > 0) {
            errorTitle = "⚠️ Validation Error";
            const errorList = errorEntries.map(([field, messages]) => {
              const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const messageArray = Array.isArray(messages) ? messages : [messages];
              return `${fieldName}: ${messageArray.join(', ')}`;
            });
            errorMessage = errorList.join('. ');
          }
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleDeletePhysician = (code: string, name: string) => {
    if (!confirm(`Are you sure you want to archive ${name}? They can be restored later.`)) return;
    
    router.delete(`/admin/physicians/${code}`, {
      onSuccess: () => {
        toast({
          title: "🗄️ Archived",
          description: `${name} has been archived successfully`,
        });
      },
      onError: (errors) => {
        console.error("Delete error:", errors);
        toast({
          title: "❌ Error",
          description: "Failed to archive physician.",
          variant: "destructive",
        });
      },
    });
  };

  const handleRestorePhysician = (code: string, name: string) => {
    if (!confirm(`Are you sure you want to restore ${name}?`)) return;
    
    router.post(`/admin/physicians/${code}/restore`, {}, {
      onSuccess: () => {
        toast({
          title: "♻️ Restored",
          description: `${name} has been restored successfully`,
        });
      },
      onError: (errors) => {
        console.error("Restore error:", errors);
        toast({
          title: "❌ Error",
          description: "Failed to restore physician.",
          variant: "destructive",
        });
      },
    });
  };

  const handleForceDeletePhysician = (code: string, name: string) => {
    if (!confirm(`⚠️ PERMANENT DELETE: Are you sure you want to permanently delete ${name}? This action CANNOT be undone!`)) return;
    
    router.delete(`/admin/physicians/${code}/force`, {
      onSuccess: () => {
        toast({
          title: "🗑️ Permanently Deleted",
          description: `${name} has been permanently deleted`,
        });
      },
      onError: (errors) => {
        console.error("Force delete error:", errors);
        toast({
          title: "❌ Error",
          description: "Failed to permanently delete physician. They may have active appointments or records.",
          variant: "destructive",
        });
      },
    });
  };

  const toggleShowArchived = () => {
    const newValue = !showArchived;
    setShowArchived(newValue);
    router.get('/admin/physicians', { include_trashed: newValue }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Filter physicians based on search query
  const filteredPhysicians = physicians.filter(physician =>
    physician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    physician.physician_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    physician.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    physician.license_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <HMSLayout
      user={auth?.user}
      breadcrumbs={[
        { name: 'Admin', href: '/admin/dashboard' },
        { name: 'Physicians' }
      ]}
    >
      <Head title="Physicians Management - MediCare HMS" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              Physicians Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage hospital physicians, their specializations, and credentials
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <AddPhysicianModal onAdd={handleAddPhysician} />
            <Button
              onClick={toggleShowArchived}
              variant={showArchived ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
            >
              {showArchived ? "Hide Archived" : "Show Archived"}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription>Active Physicians</CardDescription>
              <CardTitle className="text-3xl">
                {physicians.filter(p => !p.deleted_at).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription>Consultants</CardDescription>
              <CardTitle className="text-3xl">
                {physicians.filter(p => p.is_consultant && !p.deleted_at).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription>Specializations</CardDescription>
              <CardTitle className="text-3xl">
                {new Set(physicians.filter(p => !p.deleted_at).map(p => p.specialization)).size}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardDescription>
                {showArchived ? 'Archived' : 'Avg. Experience'}
              </CardDescription>
              <CardTitle className="text-3xl">
                {showArchived ? (
                  physicians.filter(p => p.deleted_at).length
                ) : (
                  <>
                    {physicians.filter(p => !p.deleted_at).length > 0
                      ? Math.round(
                          physicians
                            .filter(p => !p.deleted_at)
                            .reduce((sum, p) => sum + (p.years_of_experience || 0), 0) /
                            physicians.filter(p => !p.deleted_at).length
                        )
                      : 0}{" "}
                    yrs
                  </>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <Input
              type="text"
              placeholder="Search by name, code, specialization, or license number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Physicians Grid */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Stethoscope className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Physicians Directory
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              {filteredPhysicians.length} physician{filteredPhysicians.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {filteredPhysicians.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPhysicians.map((physician) => (
                  <div
                    key={physician.physician_code}
                    className={`group border rounded-xl p-5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all ${
                      physician.deleted_at 
                        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 opacity-75' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          {physician.name}
                          {physician.deleted_at && (
                            <Badge variant="destructive" className="text-xs">
                              Archived
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {physician.physician_code}
                        </p>
                      </div>
                      {physician.is_consultant && !physician.deleted_at && (
                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">
                          Consultant
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Specialization:</span>
                        <span className="text-slate-600 dark:text-slate-400">{physician.specialization}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">License:</span>
                        <span className="text-slate-600 dark:text-slate-400">{physician.license_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Qualification:</span>
                        <span className="text-slate-600 dark:text-slate-400">{physician.qualification}</span>
                      </div>
                      {physician.years_of_experience !== null && physician.years_of_experience > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Experience:</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {physician.years_of_experience} years
                          </span>
                        </div>
                      )}
                      {physician.medical_school && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">School:</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {physician.medical_school}
                          </span>
                        </div>
                      )}
                    </div>

                    {physician.bio && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {physician.bio}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {physician.deleted_at ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => handleRestorePhysician(physician.physician_code, physician.name)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleForceDeletePhysician(physician.physician_code, physician.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Forever
                          </Button>
                        </>
                      ) : (
                        <>
                          <EditPhysicianModal 
                            physician={physician} 
                            onEdit={handleEditPhysician} 
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            onClick={() => handleDeletePhysician(physician.physician_code, physician.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <Stethoscope className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {searchQuery ? "No physicians found" : "No physicians yet"}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "Add your first physician to get started"}
                </p>
                {!searchQuery && <AddPhysicianModal onAdd={handleAddPhysician} />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </HMSLayout>
  );
}
