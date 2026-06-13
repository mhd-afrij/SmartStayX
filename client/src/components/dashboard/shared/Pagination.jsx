import { ChevronLeft, ChevronRight } from "lucide-react";

// Pagination — Reusable pagination component with prev/next buttons and page numbers
const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
      <span className="text-xs text-white/30">
        Page {page + 1} of {pages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            onClick={() => onPage(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              i === page
                ? "bg-[#D4A85F]/10 text-[#D4A85F] border border-[#D4A85F]/20"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-transparent"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(pages - 1, page + 1))}
          disabled={page >= pages - 1}
          className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
