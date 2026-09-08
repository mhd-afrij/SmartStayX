// StatusBadge — Colored badge component for displaying booking/service status
const STATUS_MAP = {
  pending: { label: "Pending", color: "bg-[#EFEAE1] dark:bg-[#222823] text-amber-700 dark:text-amber-300 border-[#A67C52]/45 dark:border-[#303631]/45" },
  confirmed: { label: "Confirmed", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  checked_in: { label: "Checked-in", color: "bg-green-50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/25" },
  checked_out: { label: "Completed", color: "bg-[#F6EFE3] dark:bg-[#1A1E1B] text-[#8A643F] border-[#A67C52]/40" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/25" },
  expired: { label: "Expired", color: "bg-slate-100 dark:bg-[#111412] text-slate-500 dark:text-[#A9AEA7] border-slate-200 dark:border-[#303631]" },
  assigned: { label: "Assigned", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  visible: { label: "Visible", color: "bg-green-50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/25" },
  hidden: { label: "Hidden", color: "bg-red-50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/25" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_MAP[status] || {
    label: status || "Unknown",
    color: "bg-slate-100 dark:bg-[#111412] text-slate-500 dark:text-[#A9AEA7] border-slate-200 dark:border-[#303631]",
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
