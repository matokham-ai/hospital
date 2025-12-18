import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
// Badge component not available, using inline styles

interface TestCatalog {
  id: number;
  name: string;
  code: string;
  category: string;
  price: number;
  turnaround_time: number;
  unit?: string;
  normal_range?: string;
  sample_type?: string;
  instructions?: string;
  status: 'active' | 'inactive';
  department?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface TestCategory {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

interface TestCatalogTableProps {
  tests: TestCatalog[];
  categories: TestCategory[];
  onUpdate: (id: number, data: Partial<TestCatalog>) => void;
  onDelete: (id: number) => void;
  onAdd: (data: Omit<TestCatalog, 'id' | 'created_at' | 'updated_at'>) => void;
  onBulkUpdate: (updates: { id: number; data: Partial<TestCatalog> }[]) => void;
  onSearch: (query: string, filters: any) => void;
  isLoading: boolean;
}

export default function TestCatalogTable({ 
  tests, 
  categories, 
  onUpdate, 
  onDelete, 
  onAdd, 
  onBulkUpdate, 
  onSearch, 
  isLoading 
}: TestCatalogTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Catalog ({tests.length} tests)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((test) => (
                <tr key={test.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{test.name}</div>
                    {test.sample_type && (
                      <div className="text-sm text-gray-500">{test.sample_type}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{test.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{test.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      KES {test.price.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      test.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdate(test.id, { status: test.status === 'active' ? 'inactive' : 'active' })}
                        disabled={isLoading}
                      >
                        {test.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this test?')) {
                            onDelete(test.id);
                          }
                        }}
                        disabled={isLoading}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {tests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No test catalogs found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
