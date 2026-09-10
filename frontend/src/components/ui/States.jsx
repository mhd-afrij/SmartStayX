import { Inbox, AlertTriangle } from 'lucide-react';
import Button from './Button';

// Re-export Card here because several pages import { Card, Table } from this module.
export { Card } from './Card';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-[#E3E0D8] dark:bg-[#303631] ${className}`} />
);

export const SkeletonCard = () => (
  <div className="rounded-2xl border border-[#E3E0D8] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-6 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFEEE8] dark:bg-[#111412] mb-4">
      <Icon className="h-6 w-6 text-[#72766F] dark:text-[#A9AEA7]" />
    </div>
    <h3 className="text-base font-semibold text-[#183B35] dark:text-[#F2EFE8]">{title}</h3>
    {description && <p className="mt-1 text-sm text-[#5C6B64] dark:text-[#A9AEA7] max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', description = 'Please try again.', onRetry }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
      <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
    </div>
    <h3 className="text-base font-semibold text-[#183B35] dark:text-[#F2EFE8]">{title}</h3>
    <p className="mt-1 text-sm text-[#5C6B64] dark:text-[#A9AEA7] max-w-sm">{description}</p>
    {onRetry && (
      <div className="mt-5">
        <Button variant="outline" onClick={onRetry}>Try again</Button>
      </div>
    )}
  </div>
);

// Table — minimal key/label table used by simple list pages.
// Columns may declare `render: (row) => node` for custom cell content.
export const Table = ({ data = [], columns = [], emptyMessage = 'No records found' }) => {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-slate-400 dark:text-[#A9AEA7]">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E3E0D8] dark:border-[#303631] text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#72766F] dark:text-[#A9AEA7]"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row._id ?? row.id ?? i}
              className="border-b border-[#E3E0D8] dark:border-[#303631] last:border-0"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[#183B35] dark:text-[#F2EFE8]">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
