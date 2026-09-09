import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPagination = ({ page, pages, onPageChange, hasMore = false }) => {
  const canNext = hasMore || page < pages;
  if (pages <= 1 && !hasMore) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-[#E3E0D8] dark:border-[#303631]">
      <span className="text-xs text-[#72766F] dark:text-[#A9AEA7]">Page {page}{pages > 1 ? ` of ${pages}` : ''}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-[#E3E0D8] dark:border-[#303631] text-[#72766F] dark:text-[#A9AEA7] hover:text-[#183B35] dark:hover:text-[#F2EFE8] hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages > 1 && (
          <>
            <span className="px-2 text-xs text-[#72766F] dark:text-[#A9AEA7]">
              {page} / {pages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(pages, page + 1))}
              disabled={!canNext}
              className="p-1.5 rounded-lg border border-[#E3E0D8] dark:border-[#303631] text-[#72766F] dark:text-[#A9AEA7] hover:text-[#183B35] dark:hover:text-[#F2EFE8] hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {hasMore && pages <= 1 && (
          <button
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg border border-[#E3E0D8] dark:border-[#303631] text-[#72766F] dark:text-[#A9AEA7] hover:text-[#183B35] dark:hover:text-[#F2EFE8] hover:bg-[#EFEEE8] dark:hover:bg-[#303631] transition-all"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminPagination;
