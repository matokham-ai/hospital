import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/Components/ui/button';

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface SimplePaginationProps {
  data: PaginationData;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function SimplePagination({ data, onPageChange, loading = false }: SimplePaginationProps) {
  const { current_page, last_page, total, from, to } = data;

  if (last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing <span className="font-medium">{from}</span> to{' '}
          <span className="font-medium">{to}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1 || loading}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {/* Show page numbers */}
          {Array.from({ length: Math.min(5, last_page) }, (_, i) => {
            let pageNum;
            if (last_page <= 5) {
              pageNum = i + 1;
            } else if (current_page <= 3) {
              pageNum = i + 1;
            } else if (current_page >= last_page - 2) {
              pageNum = last_page - 4 + i;
            } else {
              pageNum = current_page - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={current_page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page || loading}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
