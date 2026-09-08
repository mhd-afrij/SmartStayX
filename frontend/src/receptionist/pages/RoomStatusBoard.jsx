import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import Badge from "../../components/ui/Badge";
import { LayoutGrid, Building2, Search } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = ["available", "occupied", "reserved", "cleaning", "maintenance", "out_of_service"];

const STATUS_CONFIG = {
  available: { label: "Available", tone: "success" },
  occupied: { label: "Occupied", tone: "confirmed" },
  reserved: { label: "Reserved", tone: "pending" },
  cleaning: { label: "Cleaning", tone: "cleaning" },
  maintenance: { label: "Maintenance", tone: "maintenance" },
  out_of_service: { label: "Out of Service", tone: "cancelled" },
};

const RoomStatusBoard = () => {
  const { axios, getToken } = useAppContext();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openPopoverId, setOpenPopoverId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadRooms = async (hotelId = selectedHotelId) => {
    try {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams();
      if (hotelId && hotelId !== "all") params.set("hotelId", hotelId);
      const { data } = await axios.get(`/api/receptionist/rooms?${params}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setRooms(data.rooms);
        setHotels(data.hotels || []);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(`/api/receptionist/rooms/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(`Room set to ${STATUS_CONFIG[status]?.label || status}`);
        setRooms((prev) => prev.map((r) => (r._id === id ? { ...r, status, isAvailable: status === "available" } : r)));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update room status");
    } finally {
      setUpdatingId(null);
      setOpenPopoverId(null);
    }
  };

  const filtered = rooms.filter((r) => {
    const roomStatus = r.status || "available";
    if (statusFilter !== "all" && roomStatus !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.roomNumber || "").toLowerCase().includes(q) ||
      (r.roomType || "").toLowerCase().includes(q) ||
      (r.hotelName || r.hotel?.name || "").toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#F2EFE8] tracking-tight">Room Status Board</h1>
          <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mt-1">Live overview of every room, with fast status updates</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#A9AEA7]" />
          <input type="text" placeholder="Search rooms..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="luxury-input w-48 h-auto py-2 pl-9 pr-3 text-xs" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={selectedHotelId}
            onChange={(e) => { setSelectedHotelId(e.target.value); loadRooms(e.target.value); }}
            className="luxury-select h-auto py-2 pl-9 pr-8 text-sm w-auto cursor-pointer"
          >
            <option value="all">All Properties</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
            ))}
          </select>
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#A9AEA7] pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 bg-[#EFEEE8] dark:bg-[#222823] rounded-xl p-1 border border-black/[0.06] dark:border-[#303631] flex-wrap">
          <button onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${statusFilter === "all" ? "bg-[#EFEAE1] dark:bg-[#222823] text-[#183B35] dark:text-[#8FB8A8] border border-[#A67C52]/45 dark:border-[#303631]/45" : "text-slate-500 dark:text-[#A9AEA7] hover:text-slate-800 dark:hover:text-[#F2EFE8]"}`}>
            All
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${statusFilter === s ? "bg-[#EFEAE1] dark:bg-[#222823] text-[#183B35] dark:text-[#8FB8A8] border border-[#A67C52]/45 dark:border-[#303631]/45" : "text-slate-500 dark:text-[#A9AEA7] hover:text-slate-800 dark:hover:text-[#F2EFE8]"}`}>
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] dark:border-[#303631]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFEAE1] dark:bg-[#222823] border border-[#A67C52]/45 dark:border-[#303631]/45 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Rooms</h3>
              <p className="text-xs text-slate-500 dark:text-[#A9AEA7]">{filtered.length} room{filtered.length !== 1 ? "s" : ""} found</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" />
            <span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading rooms...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mb-3">Could not load rooms.</p>
            <button onClick={() => loadRooms()} className="ghost-button px-4 py-1.5 text-xs">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-[#A9AEA7] text-sm">No rooms found.</div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((room) => {
              const roomStatus = room.status || "available";
              const cfg = STATUS_CONFIG[roomStatus] || STATUS_CONFIG.available;
              return (
                <div key={room._id} className="relative">
                  <button
                    onClick={() => setOpenPopoverId(openPopoverId === room._id ? null : room._id)}
                    disabled={updatingId === room._id}
                    className="w-full text-left rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-4 space-y-2 hover:border-black/[0.14] dark:hover:border-[#303631] shadow-sm transition-all disabled:opacity-60"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-[#F2EFE8] font-space">Room {room.roomNumber}</p>
                        <p className="text-xs text-slate-500 dark:text-[#A9AEA7]">{room.roomType || "—"}</p>
                      </div>
                      {updatingId === room._id && (
                        <div className="w-4 h-4 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" />
                      )}
                    </div>
                    {(room.hotelName || room.hotel?.name) && (
                      <p className="text-[11px] text-slate-400 dark:text-[#A9AEA7] truncate">{room.hotelName || room.hotel?.name}</p>
                    )}
                    <Badge tone={cfg.tone}>{cfg.label}</Badge>
                  </button>

                  <AnimatePresence>
                    {openPopoverId === room._id && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        className="absolute z-20 top-full mt-2 left-0 w-52 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-2xl p-1.5"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(room._id, s)}
                            className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg transition-colors ${
                              s === roomStatus ? "bg-[#EFEEE8] dark:bg-[#222823] text-slate-900 dark:text-[#F2EFE8]" : "text-slate-600 dark:text-[#A9AEA7] hover:bg-[#EFEEE8] dark:hover:bg-[#222823]"
                            }`}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RoomStatusBoard;
