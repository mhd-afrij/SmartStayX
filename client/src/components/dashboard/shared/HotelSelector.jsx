import { Building2 } from "lucide-react";

const HotelSelector = ({
  hotels = [],
  value,
  onChange,
  placeholder = "Select hotel",
  disabled = false,
}) => {
  if (hotels.length <= 1) return null;

  return (
    <div className="relative">
      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="luxury-input pl-9 pr-8 appearance-none cursor-pointer disabled:opacity-50"
      >
        <option value="" className="bg-[#0d1728]">
          {placeholder}
        </option>
        {hotels.map((hotel) => (
          <option key={hotel._id} value={hotel._id} className="bg-[#0d1728]">
            {hotel.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default HotelSelector;
