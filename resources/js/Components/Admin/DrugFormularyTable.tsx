import React from 'react';
import { router } from '@inertiajs/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { Progress } from '@/Components/ui/progress';
import { Eye, Edit3, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrugSubstitute {
  id: number;
  name: string;
  generic_name: string;
  strength: string;
  form: string;
  substitution_type: string;
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
  expiry_date?: string;
  status: 'active' | 'discontinued';
  stock_status?: string;
  substitutes?: DrugSubstitute[];
}

interface Props {
  drugs: DrugFormulary[];
}

export default function DrugFormularyTable({ drugs }: Props) {
  if (!drugs || drugs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border shadow-sm">
        <Info className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No drugs found. Try adjusting filters or import data.</p>
      </div>
    );
  }

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this drug?')) return;
    router.delete(route('drug-formulary.destroy', id));
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-sky-50/50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700">#</TableHead>
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Form</TableHead>
              <TableHead className="font-semibold text-gray-700">Strength</TableHead>
              <TableHead className="font-semibold text-gray-700">Stock</TableHead>
              <TableHead className="font-semibold text-gray-700">Unit Price</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Manufacturer</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {drugs.map((drug, index) => {
              const stockPercent = drug.reorder_level
                ? Math.min((drug.stock_quantity / drug.reorder_level) * 100, 100)
                : 100;

              const stockColor =
                drug.stock_quantity === 0
                  ? 'bg-red-500'
                  : stockPercent <= 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500';

              return (
                <TableRow key={drug.id} className="hover:bg-gray-50/50 transition">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{drug.name}</span>
                      <span className="text-xs text-gray-500">{drug.generic_name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="capitalize">{drug.form}</TableCell>
                  <TableCell>{drug.strength}</TableCell>

                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-1">
                            <Progress
                              value={stockPercent}
                              className={cn(
                                'h-2 rounded-full',
                                stockColor === 'bg-red-500' && 'bg-red-100',
                                stockColor === 'bg-yellow-500' && 'bg-yellow-100',
                                stockColor === 'bg-green-500' && 'bg-green-100'
                              )}
                            />
                            <p className="text-xs text-gray-600">
                              {drug.stock_quantity} / {drug.reorder_level}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          Stock: {drug.stock_quantity} | Reorder: {drug.reorder_level}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  <TableCell>KSh {drug.unit_price.toLocaleString()}</TableCell>

                  <TableCell>
                    {drug.status === 'active' ? (
                      <Badge className="bg-green-100 text-green-700 border-none">
                        <CheckCircle className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700 border-none">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Discontinued
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>{drug.manufacturer ?? '-'}</TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-sky-50 text-sky-600"
                              onClick={() => router.visit(route('drug-formulary.show', drug.id))}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View details</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-amber-50 text-amber-600"
                              onClick={() => router.visit(route('drug-formulary.edit', drug.id))}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit drug</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-red-50 text-red-600"
                              onClick={() => handleDelete(drug.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
