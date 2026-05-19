import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Tag, Plus, Edit3, Trash2, ChevronDown, X } from "lucide-react";

const emptyForm = {
  title: "", description: "", discountPercent: "", expiryDate: "",
  hotelId: "", roomId: "", image: null, isActive: true,
};

const ManageOffers = () => {
  // Offer management state.
  const { axios, getToken, user, fetchOffers } = useAppContext();
  const [offers, setOffers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadRooms = async () => {
    try {
      // Load the owner's rooms for offer targeting.
      const { data } = await axios.get("/api/rooms/Owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setRooms(data.rooms || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load rooms");
    }
  };

  const loadHotels = async () => {
    try {
      // Load the owner's hotels for offer targeting.
      const { data } = await axios.get("/api/hotels/owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setHotels(data.hotels || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load hotels");
    }
  };

  const loadOffers = async () => {
    try {
      // Load current offers for the owner.
      const { data } = await axios.get("/api/offers/owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setOffers(data.offers || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load offers");
    }
  };

  useEffect(() => {
    if (user) {
      loadRooms();
      loadHotels();
      loadOffers();
    }
  }, [user]);

  useEffect(() => {
    if (form.hotelId) {
      const filtered = rooms.filter(
        (room) => room.hotel?._id === form.hotelId || room.hotel === form.hotelId
      );
      setFilteredRooms(filtered);
      setForm((prev) => ({ ...prev, roomId: "" }));
    } else {
      setFilteredRooms([]);
    }
  }, [form.hotelId, rooms]);

  const resetForm = () => {
    setForm(emptyForm);
    setPreview(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.discountPercent || !form.expiryDate || !form.hotelId || !form.roomId) {
      toast.error("Please complete all fields including hotel and room selection");
      return;
    }
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("discountPercent", form.discountPercent);
    payload.append("expiryDate", form.expiryDate);
    payload.append("roomId", form.roomId);
    payload.append("isActive", form.isActive);
    if (form.image) payload.append("image", form.image);

    setSaving(true);
    try {
      let response;
      if (editingId) {
        response = await axios.put(`/api/offers/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
      } else {
        response = await axios.post("/api/offers", payload, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
      }
      if (response.data.success) {
        toast.success(editingId ? "Offer updated" : "Offer created");
        resetForm();
        loadOffers();
        fetchOffers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save offer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(`/api/offers/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Offer deleted");
        setOffers((prev) => prev.filter((o) => o._id !== id));
        fetchOffers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete offer");
    }
  };

  const handleEdit = (offer) => {
    setEditingId(offer._id);
    const hotelId = offer.hotel?._id || offer.hotel;
    setForm({
      title: offer.title,
      description: offer.description,
      discountPercent: offer.discountPercent,
      expiryDate: offer.expiryDate?.slice(0, 10) || "",
      hotelId: hotelId,
      roomId: offer.room?._id || offer.room,
      image: null,
      isActive: offer.isActive,
    });
    setPreview(offer.image || null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortedOffers = useMemo(
    () => offers.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [offers]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Exclusive Offers</h1>
        <p className="text-sm text-white/40 mt-1">
          Create, edit, and retire special deals. Link each offer to a specific room so guests can book directly.
        </p>
      </div>

      {/* Offer editor and offer list */}
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5 space-y-4 h-fit">
          {/* Offer form fields */}
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-[#D4A85F]/10 border border-[#D4A85F]/20 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-[#D4A85F]" />
            </div>
            <span className="text-sm font-medium text-white">{editingId ? "Edit Offer" : "New Offer"}</span>
          </div>

          <div>
            <p className="text-sm font-medium text-white/60 mb-1.5">Offer title</p>
            <input
              type="text"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Summer escape package"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-white/60 mb-1.5">Description</p>
            <textarea
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors h-24 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add a concise guest-facing summary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-white/60 mb-1.5">Discount (%)</p>
              <input
                type="number" min={0} max={100}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-white/60 mb-1.5">Expires</p>
              <input
                type="date"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors [color-scheme:dark]"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-white/60 mb-1.5">Select Hotel</p>
            <div className="relative">
              <select
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
                value={form.hotelId}
                onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
              >
                <option value="" className="bg-[#0B1220]">Choose a hotel</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id} className="bg-[#0B1220]">
                    {hotel.name} — {hotel.city}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-white/60 mb-1.5">Link to room</p>
            <div className="relative">
              <select
                className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer disabled:opacity-40"
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                disabled={!form.hotelId}
              >
                <option value="" className="bg-[#0B1220]">
                  {form.hotelId ? "Select a room" : "Select a hotel first"}
                </option>
                {filteredRooms.map((room) => (
                  <option key={room._id} value={room._id} className="bg-[#0B1220]">
                    {room.roomType} — ${room.pricePerNight}/night
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-[#D4A85F] focus:ring-[#D4A85F]/30"
            />
            <span className="text-sm text-white/70">Active (visible to guests)</span>
          </label>

          <div>
            <p className="text-sm font-medium text-white/60 mb-1.5">Offer image</p>
            <label className="border border-dashed border-white/[0.08] rounded-xl px-3 py-4 block text-center cursor-pointer hover:bg-white/[0.04] transition">
              <input
                type="file" accept="image/*" hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setForm({ ...form, image: file || null });
                  setPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              <span className="text-xs text-white/40">Click to upload (optional)</span>
            </label>
            {preview && (
              <img src={preview} alt="preview" className="mt-3 rounded-xl w-full max-h-48 object-cover" />
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {saving ? "Saving..." : editingId ? "Update Offer" : "Create Offer"}
            </button>
            {editingId && (
              <button type="button" className="text-sm text-white/50 hover:text-white" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {/* Saved offers list */}
        <div className="space-y-3">
          {sortedOffers.length === 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-[#D4A85F]/20 flex items-center justify-center">
                <Tag className="w-6 h-6 text-[#D4A85F]/60" />
              </div>
              <p className="text-white/50">No offers yet. Add your first deal to boost bookings.</p>
            </div>
          )}

          {sortedOffers.map((offer) => (
            <motion.div
              key={offer._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5 hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white truncate">{offer.title}</h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                        offer.isActive
                          ? "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]"
                          : "border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]"
                      }`}
                    >
                      {offer.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">{offer.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40">
                    <span className="text-[#D4A85F] font-medium font-space">{offer.discountPercent}% off</span>
                    <span>Expires {new Date(offer.expiryDate).toLocaleDateString()}</span>
                    <span>{offer.hotel?.name || "Hotel"} — {offer.room?.roomType || "Room"}</span>
                    <Link className="text-[#D4A85F]/70 hover:text-[#D4A85F] underline" to={`/rooms/${offer.room?._id || offer.room}`}>
                      View room
                    </Link>
                  </div>
                </div>
                {offer.image && (
                  <img src={offer.image} alt={offer.title} className="w-28 h-20 object-cover rounded-xl shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.06] text-white/50 hover:text-[#D4A85F] hover:border-[#D4A85F]/20 hover:bg-[#D4A85F]/10 transition-all"
                  onClick={() => handleEdit(offer)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.06] text-white/50 hover:text-[#EF4444] hover:border-[#EF4444]/20 hover:bg-[#EF4444]/10 transition-all"
                  onClick={() => handleDelete(offer._id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ManageOffers;
