import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = ({ page, totalPages, totalItems, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-card border-t border-border">
      <p className="text-sm text-muted-foreground">
        {totalItems !== undefined && (
          <>{totalItems} élément{totalItems !== 1 ? 's' : ''}</>
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground px-3">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-lg bg-card border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
