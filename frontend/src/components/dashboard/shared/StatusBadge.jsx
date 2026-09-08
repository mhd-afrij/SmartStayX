// StatusBadge — Colored badge component for displaying booking/service status
const STATUS_MAP = {
  pending: { label: "Pending", color: "bg-[#F4F2F9] dark:bg-[#1B2436] text-amber-700 dark:text-amber-300 border-[#B9B4CE]/45 dark:border-[#3D4660]/45" },
  confirmed: { label: "Confirmed", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  checked_in: { label: "Checked-in", color: "bg-green-50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/25" },
  checked_out: { label: "Completed", color: "bg-[#fbf2e1] dark:bg-[#2E2A1F] text-[#8a6621] border-[#D4A853]/40" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/25" },
  expired: { label: "Expired", color: "bg-slate-100 dark:bg-[#10131D] text-slate-500 dark:text-[#8299A0] border-slate-200 dark:border-[#232737]" },
  assigned: { label: "Assigned", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  visible: { label: "Visible", color: "bg-green-50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/25" },
  hidden: { label: "Hidden", color: "bg-red-50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/25" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_MAP[status] || {
    label: status || "Unknown",
    color: "bg-slate-100 dark:bg-[#10131D] text-slate-500 dark:text-[#8299A0] border-slate-200 dark:border-[#232737]",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${config.color} text-xs uppercase tracking-wide`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
