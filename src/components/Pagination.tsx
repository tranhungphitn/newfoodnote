import React from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel: string;
  accent?: 'orange' | 'blue';
  onPageChange: (page: number) => void;
}

function getVisiblePages(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({length: total}, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];

  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  if (current < total - 2) {
    pages.push('ellipsis');
  }

  pages.push(total);
  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  itemLabel,
  accent = 'orange',
  onPageChange,
}) => {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, safePage * itemsPerPage);
  const pages = getVisiblePages(safePage, totalPages);

  const activeButtonClass =
    accent === 'blue'
      ? 'border-[#1D4ED8] bg-[#1D4ED8] text-white'
      : 'border-[#EA580C] bg-[#EA580C] text-white';

  const hoverBorderClass =
    accent === 'blue'
      ? 'hover:border-[#1D4ED8] hover:text-[#1D4ED8]'
      : 'hover:border-[#EA580C] hover:text-[#EA580C]';

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-col items-center justify-between gap-4 border-t border-[#E4E4E0] pt-6 sm:flex-row"
    >
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Trang trước"
          className={`inline-flex h-10 items-center gap-1 rounded-sm border border-[#E4E4E0] bg-white px-2.5 text-xs font-semibold text-[#111110] transition-colors disabled:cursor-not-allowed disabled:opacity-35 whitespace-nowrap sm:px-3 ${hoverBorderClass}`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {pages.map((entry, idx) =>
          entry === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-10 w-6 items-center justify-center text-xs font-semibold text-[#787872] sm:w-8"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === safePage ? 'page' : undefined}
              className={`flex h-10 min-w-[38px] items-center justify-center rounded-sm border px-2 text-xs font-bold tabular-nums transition-colors sm:min-w-[40px] ${
                entry === safePage
                  ? activeButtonClass
                  : `border-[#E4E4E0] bg-white text-[#111110] ${hoverBorderClass}`
              }`}
            >
              {entry}
            </button>
          )
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Trang sau"
          className={`inline-flex h-10 items-center gap-1 rounded-sm border border-[#E4E4E0] bg-white px-2.5 text-xs font-semibold text-[#111110] transition-colors disabled:cursor-not-allowed disabled:opacity-35 whitespace-nowrap sm:px-3 ${hoverBorderClass}`}
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};
