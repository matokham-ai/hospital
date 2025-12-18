import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
// Badge component not available, using inline styles
import {
  Pencil,
  Trash2,
  PlusCircle,
  Filter,
  ArrowUpDown,
  Save,
  RefreshCw,
  Search,
  ClipboardList,
  CheckCircle2,
  Tags,
  BadgeDollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/Components/ui/use-toast";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
interface TestCatalog {
  id: number;
  name: string;
  code: string;
  category: string;
  price: number;
  turnaround_time: number;
  status: "active" | "inactive";
  department?: { id: number; name: string };
}

interface TestFormData extends Omit<TestCatalog, 'price' | 'turnaround_time'> {
  price: string | number;
  turnaround_time: string | number;
}

interface TestCategory {
  id: number;
  name: string;
  code: string;
}

interface TestsPageProps {
  user: { name: string; email: string; role: string };
  tests: TestCatalog[];
  categories: TestCategory[];
  stats?: {
    total_tests: number;
    active_tests: number;
    inactive_tests: number;
    categories_count: number;
    average_price: number;
  };
}

// -------------------------------------------------------------------
// Page Component
// -------------------------------------------------------------------
export default function Tests({ user, tests, categories, stats }: TestsPageProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState<TestFormData | null>(null);
  const [newTest, setNewTest] = useState<Partial<TestFormData>>({
    name: "",
    code: "",
    category: "",
    price: "",
    turnaround_time: "",
    status: "active",
  });
  const [sortKey, setSortKey] = useState<keyof TestCatalog>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query);
    const url = params.toString() ? `/admin/tests?${params}` : `/admin/tests`;
    router.get(url, {}, { preserveState: true, preserveScroll: true });
  };

  const handleAdd = () => {
    if (!newTest.name || !newTest.code || !newTest.category || !newTest.price || !newTest.turnaround_time) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    const testData = {
      ...newTest,
      price: parseFloat(newTest.price as string) || 0,
      turnaround_time: parseInt(newTest.turnaround_time as string) || 24,
    };

    setIsLoading(true);
    router.post("/admin/tests", testData, {
      onSuccess: () => {
        toast({ title: "Success", description: "Test added successfully" });
        setShowAddForm(false);
        setNewTest({
          name: "",
          code: "",
          category: "",
          price: "",
          turnaround_time: "",
          status: "active",
        });
      },
      onFinish: () => setIsLoading(false),
    });
  };

  const handleEdit = (test: TestCatalog) => {
    setEditingTest({
      ...test,
      price: test.price.toString(),
      turnaround_time: test.turnaround_time.toString(),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingTest) return;

    const testData = {
      ...editingTest,
      price: parseFloat(editingTest.price as string) || 0,
      turnaround_time: parseInt(editingTest.turnaround_time as string) || 24,
    };

    setIsLoading(true);
    router.put(`/admin/tests/${editingTest.id}`, testData, {
      onSuccess: () => {
        toast({ title: "Success", description: "Test updated successfully" });
        setShowEditModal(false);
        setEditingTest(null);
      },
      onFinish: () => setIsLoading(false),
    });
  };

  const handleUpdate = (id: number, data: Partial<TestCatalog>) => {
    setIsLoading(true);
    router.put(`/admin/tests/${id}`, data, {
      onSuccess: () =>
        toast({ title: "Success", description: "Test updated successfully" }),
      onFinish: () => setIsLoading(false),
    });
  };

  const handleDelete = (id: number) => {
    setIsLoading(true);
    router.delete(`/admin/tests/${id}`, {
      onSuccess: () =>
        toast({ title: "Deleted", description: "Test removed successfully" }),
      onFinish: () => setIsLoading(false),
    });
  };

  const sortedTests = [...tests].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === "string" && typeof valB === "string")
      return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    if (typeof valA === "number" && typeof valB === "number")
      return sortDir === "asc" ? valA - valB : valB - valA;
    return 0;
  });

  const toggleSort = (key: keyof TestCatalog) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // -------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------
  return (
    <AdminLayout user={user}>
      <Head title="Test Catalogs | MediCare HMS" />
      <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Summary Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <SummaryCard
                icon={<ClipboardList className="h-5 w-5 text-sky-600" />}
                label="Total Tests"
                value={stats.total_tests}
                color="text-sky-600"
              />
              <SummaryCard
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                label="Active Tests"
                value={stats.active_tests}
                color="text-green-600"
              />
              <SummaryCard
                icon={<Tags className="h-5 w-5 text-indigo-600" />}
                label="Categories"
                value={stats.categories_count}
                color="text-indigo-600"
              />
              <SummaryCard
                icon={<BadgeDollarSign className="h-5 w-5 text-amber-600" />}
                label="Avg. Price"
                value={`KES ${stats.average_price?.toLocaleString("en-KE", {
                  minimumFractionDigits: 2,
                })}`}
                color="text-amber-600"
              />
            </motion.div>
          )}

          {/* Card Table */}
          <Card className="border border-slate-200 shadow-sm backdrop-blur-sm bg-white/70">
            <CardHeader className="space-y-5">
              {/* Search + Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2 w-full sm:w-1/2"
                >
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by test name, code, or category..."
                    className="rounded-md shadow-inner focus:ring-2 focus:ring-sky-400"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    <PlusCircle className="h-4 w-4" />{" "}
                    {showAddForm ? "Cancel" : "Add Test"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch()}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Add Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 border rounded-lg p-4 bg-sky-50/40 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Input
                        placeholder="Test Name"
                        value={newTest.name}
                        onChange={(e) =>
                          setNewTest({ ...newTest, name: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Test Code"
                        value={newTest.code}
                        onChange={(e) =>
                          setNewTest({ ...newTest, code: e.target.value })
                        }
                      />
                      <select
                        className="border rounded-md p-2 text-sm"
                        value={newTest.category}
                        onChange={(e) =>
                          setNewTest({ ...newTest, category: e.target.value })
                        }
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        placeholder="Price"
                        value={newTest.price}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            price: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Turnaround (hrs)"
                        value={newTest.turnaround_time}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            turnaround_time: e.target.value,
                          })
                        }
                      />
                      <select
                        className="border rounded-md p-2 text-sm"
                        value={newTest.status}
                        onChange={(e) =>
                          setNewTest({
                            ...newTest,
                            status: e.target.value as "active" | "inactive",
                          })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAdd}
                        size="sm"
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Edit Modal */}
              <AnimatePresence>
                {showEditModal && editingTest && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowEditModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Test</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEditModal(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Test Name *
                            </label>
                            <Input
                              placeholder="Test Name"
                              value={editingTest.name}
                              onChange={(e) =>
                                setEditingTest({ ...editingTest, name: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Test Code *
                            </label>
                            <Input
                              placeholder="Test Code"
                              value={editingTest.code}
                              onChange={(e) =>
                                setEditingTest({ ...editingTest, code: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Category *
                            </label>
                            <select
                              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                              value={editingTest.category}
                              onChange={(e) =>
                                setEditingTest({ ...editingTest, category: e.target.value })
                              }
                            >
                              <option value="">Select Category</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                              value={editingTest.status}
                              onChange={(e) =>
                                setEditingTest({
                                  ...editingTest,
                                  status: e.target.value as "active" | "inactive",
                                })
                              }
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price (KES) *
                            </label>
                            <Input
                              type="number"
                              placeholder="Price"
                              value={editingTest.price}
                              onChange={(e) =>
                                setEditingTest({
                                  ...editingTest,
                                  price: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Turnaround Time (hours) *
                            </label>
                            <Input
                              type="number"
                              placeholder="Turnaround (hrs)"
                              value={editingTest.turnaround_time}
                              onChange={(e) =>
                                setEditingTest({
                                  ...editingTest,
                                  turnaround_time: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setShowEditModal(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveEdit}
                          disabled={isLoading}
                          className="bg-sky-600 hover:bg-sky-700 text-white"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table */}
              <div className="overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-sky-50 sticky top-0 z-10 text-slate-600">
                    <tr>
                      <SortableHeader label="Name" onClick={() => toggleSort("name")} />
                      <SortableHeader label="Category" onClick={() => toggleSort("category")} />
                      <SortableHeader label="Price (KES)" onClick={() => toggleSort("price")} />
                      <SortableHeader label="TAT (hrs)" onClick={() => toggleSort("turnaround_time")} />
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-sky-600 animate-pulse">
                            Loading tests...
                          </td>
                        </tr>
                      ) : tests.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            No test records found.
                          </td>
                        </tr>
                      ) : (
                        sortedTests.map((test) => (
                          <motion.tr
                            key={test.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="hover:bg-sky-50 transition"
                          >
                            <td className="px-4 py-2 font-medium">{test.name}</td>
                            <td className="px-4 py-2">{test.category || "-"}</td>
                            <td className="px-4 py-2">
                              {test.price.toLocaleString("en-KE")}
                            </td>
                            <td className="px-4 py-2">{test.turnaround_time}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs ${test.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-200 text-gray-700"
                                  }`}
                              >
                                {test.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {test.department?.name ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-sky-100 text-sky-700"
                                  onClick={() => handleEdit(test)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-rose-100 text-rose-600"
                                  onClick={() => handleDelete(test.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

// -------------------------------------------------------------------
// Summary Card Component
// -------------------------------------------------------------------
function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center hover:shadow-md transition">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      {icon}
    </div>
  );
}

// -------------------------------------------------------------------
// Sortable Header Helper
// -------------------------------------------------------------------
function SortableHeader({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className="px-4 py-2 text-left cursor-pointer select-none hover:text-sky-700"
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      </div>
    </th>
  );
}
