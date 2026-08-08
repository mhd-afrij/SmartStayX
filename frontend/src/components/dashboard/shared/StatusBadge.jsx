// StatusBadge — Colored badge component for displaying booking/service status
const STATUS_MAP = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  checked_in: { label: "Checked-in", color: "bg-green-50 text-green-700 border-green-200" },
  checked_out: { label: "Completed", color: "bg-[#fbf2e1] text-[#8a6621] border-[#2563EB]/20" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-500 border-slate-200" },
  assigned: { label: "Assigned", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  visible: { label: "Visible", color: "bg-green-50 text-green-700 border-green-200" },
  hidden: { label: "Hidden", color: "bg-red-50 text-red-700 border-red-200" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_MAP[status] || {
    label: status || "Unknown",
    color: "bg-slate-100 text-slate-500 border-slate-200",
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
