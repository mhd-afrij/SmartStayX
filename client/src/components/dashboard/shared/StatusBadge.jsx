const STATUS_MAP = {
  pending: { label: "Pending", color: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20" },
  confirmed: { label: "Confirmed", color: "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20" },
  checked_in: { label: "Checked-in", color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" },
  checked_out: { label: "Completed", color: "bg-[#D4A85F]/10 text-[#D4A85F] border-[#D4A85F]/20" },
  cancelled: { label: "Cancelled", color: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" },
  expired: { label: "Expired", color: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20" },
  assigned: { label: "Assigned", color: "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20" },
  visible: { label: "Visible", color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" },
  hidden: { label: "Hidden", color: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_MAP[status] || {
    label: status || "Unknown",
    color: "bg-white/[0.04] text-white/60 border-white/[0.06]",
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
