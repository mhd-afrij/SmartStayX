import { Inbox, AlertTriangle } from 'lucide-react';
import Button from './Button';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-[#E2E8F0] ${className}`} />
);

export const SkeletonCard = () => (
  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-3">
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
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9] mb-4">
      <Icon className="h-6 w-6 text-[#94A3B8]" />
    </div>
    <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
    {description && <p className="mt-1 text-sm text-[#64748B] max-w-sm">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', description = 'Please try again.', onRetry }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
      <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
    </div>
    <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
    <p className="mt-1 text-sm text-[#64748B] max-w-sm">{description}</p>
    {onRetry && (
      <div className="mt-5">
        <Button variant="outline" onClick={onRetry}>Try again</Button>
      </div>
    )}
  </div>
);
