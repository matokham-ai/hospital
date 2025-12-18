import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/Components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Checkbox } from "@/Components/ui/checkbox";
import { useToast } from "@/Components/ui/use-toast";
import { ShieldCheck, Trash2, Eye, EyeOff, UserCog } from "lucide-react";

interface Role { id: number; name: string; }
interface Permission { id: number; name: string; }
interface User {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  roles: Role[];
  permissions: Permission[];
}
interface Props {
  users: { data: User[] };
  roles: Role[];
  permissions: Permission[];
}

export default function UserSettings({ users, roles, permissions }: Props) {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", email: "", password: "", password_confirmation: "",
    status: "active" as "active" | "inactive" | "suspended",
    roles: [] as string[], permissions: [] as string[],
  });

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name, email: user.email, password: "", password_confirmation: "",
      status: user.status, roles: user.roles.map(r => r.name),
      permissions: user.permissions.map(p => p.name),
    });
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    const updateData: any = {
      name: editForm.name, email: editForm.email,
      status: editForm.status, roles: editForm.roles,
      permissions: editForm.permissions,
    };
    if (editForm.password) {
      updateData.password = editForm.password;
      updateData.password_confirmation = editForm.password_confirmation;
    }
    router.post(`/admin/users/${selectedUser.id}/update`, updateData, {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: "✅ User Updated", description: "Changes saved successfully." });
        setSelectedUser(null);
      },
      onError: (errors) => {
        toast({
          title: "❌ Update Failed",
          description: Object.values(errors).join(", "),
          variant: "destructive",
        });
      },
    });
  };

  const handleDelete = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      router.delete(`/admin/users/${userId}`, {
        preserveScroll: true,
        onSuccess: () => toast({ title: "🗑 User Deleted", description: "User removed successfully." }),
      });
    }
  };

  const toggleRole = (r: string) =>
    setEditForm(prev => ({
      ...prev, roles: prev.roles.includes(r)
        ? prev.roles.filter(x => x !== r) : [...prev.roles, r],
    }));
  const togglePermission = (p: string) =>
    setEditForm(prev => ({
      ...prev, permissions: prev.permissions.includes(p)
        ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p],
    }));

  return (
    <AdminLayout>
      <Head title="User Management" />
      <div className="p-8 space-y-8">
        <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl">
          <CardHeader className="flex items-center justify-between border-b pb-4">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <UserCog className="w-6 h-6 text-teal-600" /> User Management
            </CardTitle>
            <span className="text-sm text-gray-500">
              {users.data.length} registered users
            </span>
          </CardHeader>

          <CardContent className="divide-y divide-gray-100">
            {users.data.map((user, i) => (
              <div key={user.id} className="py-4 flex justify-between items-center hover:bg-gray-50/80 px-2 rounded-md transition">
                <div>
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <Badge key={r.id} variant="outline" className="border-teal-500 text-teal-700">
                        {r.name}
                      </Badge>
                    ))}
                    <Badge
                      variant={user.status === "active" ? "default" : "destructive"}
                      className={`${user.status === "active"
                        ? "bg-teal-600 hover:bg-teal-700"
                        : user.status === "inactive"
                          ? "bg-gray-500"
                          : "bg-red-600"
                        } text-white`}
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-teal-500 text-teal-700 hover:bg-teal-50"
                    onClick={() => openEditDialog(user)}
                  >
                    <ShieldCheck className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-red-50"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent
            className="
              sm:max-w-2xl 
              rounded-3xl 
              border border-gray-200/60 
              bg-white/80 
              backdrop-blur-xl 
              shadow-[0_8px_32px_rgba(0,0,0,0.1)] 
              animate-in fade-in-0 zoom-in-95 
              transition-all duration-300
            "
          >
            <DialogHeader className="border-b border-gray-200 pb-3 mb-2">
              <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-teal-600 rounded-md" />
                Edit User – {selectedUser?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-8 py-1">
                  {/* Section: Basic Info */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))}
                          className="border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))}
                          className="border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(v: "active" | "inactive" | "suspended") =>
                          setEditForm(p => ({ ...p, status: v }))
                        }
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-teal-500 focus:border-teal-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </section>

                  {/* Section: Password */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Change Password
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Label>New Password</Label>
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={editForm.password}
                          onChange={(e) => setEditForm(p => ({ ...p, password: e.target.value }))}
                          placeholder="Leave blank to keep current"
                          className="border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-600 hover:text-teal-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div>
                        <Label>Confirm Password</Label>
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={editForm.password_confirmation}
                          onChange={(e) =>
                            setEditForm(p => ({ ...p, password_confirmation: e.target.value }))
                          }
                          placeholder="Confirm new password"
                          className="border-gray-300 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Section: Roles */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Roles
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map((r) => (
                        <div key={r.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${r.id}`}
                            checked={editForm.roles.includes(r.name)}
                            onCheckedChange={() => toggleRole(r.name)}
                          />
                          <Label htmlFor={`role-${r.id}`} className="text-sm font-medium text-gray-700">
                            {r.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Section: Permissions */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Permissions
                    </h3>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50/60">
                      {permissions.map((p) => (
                        <div key={p.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${p.id}`}
                            checked={editForm.permissions.includes(p.name)}
                            onCheckedChange={() => togglePermission(p.name)}
                          />
                          <Label htmlFor={`perm-${p.id}`} className="text-sm font-medium text-gray-700">
                            {p.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}
