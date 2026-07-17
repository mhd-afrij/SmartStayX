import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { DoorOpen, Search, Plus, Edit3, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Building2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const PER_PAGE = 10;

const Rooms = () => {
  const { axios, getToken } = useAppContext();
  const [tab, setTab] = useState("list");
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState({ roomNumber: "", roomType: "", pricePerNight: "", amenities: "", hotelId: "" });

  const loadRooms = async (hotelId = selectedHotelId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (hotelId && hotelId !== "all") params.set("hotelId", hotelId);
      const { data } = await axios.get(`/api/receptionist/rooms?${params}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setRooms(data.rooms);
        setHotels(data.hotels || []);
      }
    } catch {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []);
  useEffect(() => { setPage(0); }, [search, selectedHotelId]);

  const resetForm = () => setForm({ roomNumber: "", roomType: "", pricePerNight: "", amenities: "", hotelId: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roomNumber || !form.roomType || !form.pricePerNight || !form.hotelId) {
      return toast.error("Fill in all required fields");
    }
    try {
      const payload = {
        roomNumber: form.roomNumber,
        roomType: form.roomType,
        pricePerNight: Number(form.pricePerNight),
        amenities: form.amenities ? form.amenities.split(",").map((a) => a.trim()) : [],
        hotelId: form.hotelId,
      };
      const { data } = await axios.post("/api/receptionist/rooms", payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Room created");
        resetForm();
        await loadRooms(selectedHotelId);
        setTab("list");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to create room");
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      pricePerNight: room.pricePerNight,
      amenities: (room.amenities || []).join(", "),
      hotelId: room.hotel?._id || "",
    });
    setTab("add");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      const payload = {
        roomNumber: form.roomNumber,
        roomType: form.roomType,
        pricePerNight: Number(form.pricePerNight),
        amenities: form.amenities ? form.amenities.split(",").map((a) => a.trim()) : [],
      };
      const { data } = await axios.put(`/api/receptionist/rooms/${editingRoom._id}`, payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Room updated");
        setEditingRoom(null);
        resetForm();
        await loadRooms(selectedHotelId);
        setTab("list");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update room");
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await axios.patch(`/api/receptionist/rooms/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message);
        await loadRooms(selectedHotelId);
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    try {
      const { data } = await axios.delete(`/api/receptionist/rooms/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Room deleted");
        await loadRooms(selectedHotelId);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = rooms.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.roomNumber || "").toLowerCase().includes(q) ||
      (r.roomType || "").toLowerCase().includes(q) ||
      (r.hotelName || r.hotel?.name || "").toLowerCase().includes(q);
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Rooms</h1>
          <p className="text-sm text-white/40 mt-1">Add, edit, and manage hotel rooms</p>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          <button onClick={() => { setTab("list"); setEditingRoom(null); resetForm(); }}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all ${tab === "list" ? "bg-[#D4A85F]/20 text-[#F5D08A] border border-[#D4A85F]/20" : "text-white/50 hover:text-white/80"}`}>
            All Rooms
          </button>
          <button onClick={() => { setTab("add"); setEditingRoom(null); resetForm(); }}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5 ${tab === "add" ? "bg-[#D4A85F]/20 text-[#F5D08A] border border-[#D4A85F]/20" : "text-white/50 hover:text-white/80"}`}>
            <Plus className="w-3.5 h-3.5" /> Add Room
          </button>
        </div>
      </div>

      {tab === "list" && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedHotelId}
                onChange={(e) => { setSelectedHotelId(e.target.value); loadRooms(e.target.value); }}
                className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
              >
                <option value="all" className="bg-[#0B1220]">All Properties</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id} className="bg-[#0B1220]">{hotel.name}</option>
                ))}
              </select>
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                    <DoorOpen className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">All Rooms</h3>
                    <p className="text-xs text-white/40">{filtered.length} room{filtered.length !== 1 ? "s" : ""} found</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-48 pl-9 pr-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors" />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin" />
                <span className="text-sm text-white/40">Loading rooms...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-sm">No rooms found.</div>
            ) : (
              <>
                <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((room) => (
                    <motion.div
                      key={room._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden hover:border-white/[0.12] transition-all"
                    >
                      {room.images && room.images[0] ? (
                        <div className="aspect-video bg-white/[0.02] overflow-hidden">
                          <img src={room.images[0]} alt={room.roomType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center">
                          <span className="text-white/20 text-sm">No image</span>
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{room.roomType || "Room"}</h3>
                            {room.hotel?.name && (
                              <p className="text-xs text-white/40">{room.hotel.name}</p>
                            )}
                            {room.roomNumber && (
                              <span className="inline-block mt-1 text-[10px] font-medium text-[#D4A85F] bg-[#D4A85F]/10 px-2 py-0.5 rounded-full border border-[#D4A85F]/20">
                                Room {room.roomNumber}
                              </span>
                            )}
                            <p className="text-lg font-bold text-[#D4A85F] font-space mt-1">
                              ${room.pricePerNight?.toFixed(2)}
                              <span className="text-xs text-white/30 font-normal"> / night</span>
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                              room.isAvailable
                                ? "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]"
                                : "border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]"
                            }`}
                          >
                            {room.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        {room.amenities && room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {room.amenities.slice(0, 3).map((amenity, idx) => (
                              <span key={idx} className="text-[10px] bg-white/[0.04] text-white/50 px-2 py-0.5 rounded">
                                {amenity}
                              </span>
                            ))}
                            {room.amenities.length > 3 && (
                              <span className="text-[10px] text-white/30 px-2 py-0.5">
                                +{room.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleEdit(room)}
                              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 hover:bg-[#3B82F6]/10 transition-all">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleToggle(room._id)}
                              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-[#F59E0B] hover:border-[#F59E0B]/30 hover:bg-[#F59E0B]/10 transition-all">
                              {room.isAvailable ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleDelete(room._id)}
                              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-[#EF4444] hover:border-[#EF4444]/30 hover:bg-[#EF4444]/10 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-4 py-4 border-t border-white/[0.06]">
                  <span className="text-xs text-white/30">Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                      className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {Array.from({ length: pages }, (_, i) => (
                      <button key={i} onClick={() => setPage(i)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === page ? "bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20" : "text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-transparent"}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
                      className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab === "add" && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">{editingRoom ? "Edit Room" : "Add New Room"}</h3>
              <p className="text-xs text-white/40">{editingRoom ? "Update room details" : "Fill in the details to add a new room"}</p>
            </div>
          </div>
          <form onSubmit={editingRoom ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Room Number *</label>
              <input type="text" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Room Type *</label>
              <input type="text" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Price Per Night *</label>
              <input type="number" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Hotel *</label>
              <select value={form.hotelId} onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors">
                <option value="" className="bg-[#0B1220]">Select hotel</option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id} className="bg-[#0B1220]">{h.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-white/40 mb-1.5">Amenities (comma separated)</label>
              <input type="text" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                placeholder="WiFi, AC, TV, Mini Bar"
                className="w-full px-3 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors" />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button type="submit"
                className="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] font-medium hover:opacity-90 transition-all">
                {editingRoom ? "Update Room" : "Create Room"}
              </button>
              {editingRoom && (
                <button type="button" onClick={() => { setEditingRoom(null); resetForm(); setTab("list"); }}
                  className="px-5 py-2 text-sm rounded-xl border border-white/[0.06] text-white/50 hover:text-white/80 transition-all">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
};

export default Rooms;