import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { RefreshCw, Upload, Download, Search, Pill, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import DrugFormularyTable from '@/Components/Admin/DrugFormularyTable';

interface DrugSubstitute {
  id: number;
  name: string;
  generic_name: string;
  strength: string;
  form: string;
  substitution_type: 'generic' | 'therapeutic' | 'brand';
  notes?: string;
}

interface DrugFormulary {
  id: number;
  name: string;
  generic_name: string;
  atc_code?: string;
  strength: string;
  form: string;
  stock_quantity: number;
  reorder_level: number;
  unit_price: number;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  status: 'active' | 'discontinued';
  notes?: string;
  substitutes?: DrugSubstitute[];
  created_at: string;
  updated_at: string;
}

interface Props {
  drugs: {
    data: DrugFormulary[];
    links?: any[];
    current_page?: number;
    last_page?: number;
  };
  filters?: Record<string, any>;
  stats?: {
    total_drugs: number;
    active_drugs: number;
    low_stock_drugs: number;
    out_of_stock_drugs: number;
    total_stock_value: number;
  };
}

export default function Drugs({ drugs, filters = {}, stats }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');
  const [form, setForm] = useState(filters.form || '');
  const [stockLevel, setStockLevel] = useState(filters.stock_level || '');

  const handleFilter = () => {
    router.get(
      route('admin.drug-formulary.index'),
      { search, status, form, stock_level: stockLevel },
      { preserveState: true, replace: true }
    );
  };

  const handleExport = (format = 'xlsx') => {
    window.open(route('drug-formulary.export', { format }), '_blank');
  };

  return (
    <AdminLayout>
      <Head title="Drug Formulary Management" />

      <div className="space-y-8">
        {/* ================= Header + Actions ================= */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Pill className="h-6 w-6 text-sky-600" />
              Drug Formulary
            </h1>
            <p className="text-gray-500 text-sm">Manage inventory, pricing, and drug substitutions</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.reload()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleExport('xlsx')}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1 bg-gradient-to-r from-sky-500 to-cyan-600 text-white"
              onClick={() => document.getElementById('drugImport')?.click()}
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input
              id="drugImport"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (!e.target.files?.[0]) return;
                const formData = new FormData();
                formData.append('file', e.target.files[0]);
                router.post(route('drug-formulary.import'), formData, { forceFormData: true });
              }}
            />
          </div>
        </div>

        {/* ================= Stats Summary ================= */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'Total Drugs',
                value: stats.total_drugs,
                color: 'bg-blue-50 text-blue-600',
                icon: <Pill className="h-6 w-6" />,
              },
              {
                label: 'Active Drugs',
                value: stats.active_drugs,
                color: 'bg-green-50 text-green-600',
                icon: <Filter className="h-6 w-6" />,
              },
              {
                label: 'Low Stock',
                value: stats.low_stock_drugs,
                color: 'bg-yellow-50 text-yellow-600',
                icon: <AlertTriangleIcon />,
              },
              {
                label: 'Out of Stock',
                value: stats.out_of_stock_drugs,
                color: 'bg-red-50 text-red-600',
                icon: <XIcon />,
              },
              {
                label: 'Stock Value',
                value: `KSh ${stats.total_stock_value?.toLocaleString()}`,
                color: 'bg-purple-50 text-purple-600',
                icon: <DollarSignIcon />,
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="bg-white shadow-sm border rounded-xl p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>{card.icon}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ================= Filters ================= */}
        <Card className="bg-white/60 backdrop-blur-md border rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
              <Filter className="h-5 w-5 text-gray-500" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1">
              <Input
                placeholder="Search drug name or ATC code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockLevel} onValueChange={setStockLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Stock Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleFilter}>
                <Search className="h-4 w-4 mr-1" /> Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ================= Table ================= */}
        <DrugFormularyTable drugs={drugs.data} />
      </div>
    </AdminLayout>
  );
}

// === Lucide icon shorthands for readability ===
const AlertTriangleIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);
const XIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const DollarSignIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1" />
  </svg>
);
