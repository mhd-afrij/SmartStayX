import { ChevronLeft, ChevronRight } from "lucide-react";

// Pagination — Reusable pagination component with prev/next buttons and page numbers
const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-black/[0.06]">
      <span className="text-xs text-slate-400">
        Page {page + 1} of {pages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-slate-700 hover:bg-[#f4f2ef] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            onClick={() => onPage(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              i === page
                ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20"
                : "text-slate-400 hover:text-slate-700 hover:bg-[#f4f2ef] border border-transparent"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(pages - 1, page + 1))}
          disabled={page >= pages - 1}
          className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-slate-700 hover:bg-[#f4f2ef] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
