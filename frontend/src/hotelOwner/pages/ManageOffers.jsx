// ManageOffers — Owner panel for creating and managing promotional offers and discounts
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Tag, Plus, Edit3, Trash2, ChevronDown, X, Search } from "lucide-react";
import ConfirmModal from "../../components/dashboard/ConfirmModal";

// emptyForm — Default empty offer form state
const emptyForm = {
  title: "", description: "", discountPercent: "", expiryDate: "",
  hotelId: "", roomId: "", image: null, isActive: true,
};

// safeUrl — Returns URL if it's a valid http/blob string, otherwise null
const safeUrl = (url) => url && (typeof url === 'string') && (url.startsWith('http') || url.startsWith('blob:')) ? url : null;

// ManageOffers — Owner panel for creating, editing, and deleting promotional offers linked to rooms
const ManageOffers = () => {
  const { axios, getToken, user, fetchOffers, currency } = useAppContext();
  const [offers, setOffers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    return () => {
      if (preview && typeof preview === 'string' && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // loadRooms — Fetches owner's rooms for offer linking
  const loadRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms/Owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setRooms(data.rooms || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load rooms");
    }
  };

  // loadHotels — Fetches owner's hotels for offer hotel selection
  const loadHotels = async () => {
    try {
      const { data } = await axios.get("/api/hotels/owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setHotels(data.hotels || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load hotels");
    }
  };

  // loadOffers — Fetches all offers created by the owner
  const loadOffers = async () => {
    try {
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
    } else {
      setFilteredRooms([]);
    }
  }, [form.hotelId, rooms]);

  // resetForm — Clears the offer form and exits editing mode
  const resetForm = () => {
    setForm(emptyForm);
    setPreview(null);
    setEditingId(null);
  };

  // handleSubmit — Creates or updates an offer with title, discount, expiry, hotel, and room
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || form.discountPercent === "" || !form.expiryDate || !form.hotelId || !form.roomId) {
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

  // handleDelete — Sets confirm modal for offer deletion
  const handleDelete = (id) => {
    setConfirmDelete({ open: true, id });
  };

  // handleDeleteConfirmed — Performs the actual offer deletion after confirmation
  const handleDeleteConfirmed = async () => {
    const id = confirmDelete.id;
    if (!id) return;
    setDeletingId(id);
    setConfirmDelete({ open: false, id: null });
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
    } finally {
      setDeletingId(null);
    }
  };

  // handleEdit — Populates the form with offer data for editing
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
    setPreview(safeUrl(offer.image));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sortedOffers = useMemo(
    () => offers
      .filter((o) => !searchTerm || o.title.toLowerCase().includes(searchTerm.toLowerCase()) || o.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [offers, searchTerm]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Exclusive Offers</h1>
        <p className="text-sm text-slate-400 mt-1">
          Create, edit, and retire special deals. Link each offer to a specific room so guests can book directly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <form onSubmit={handleSubmit} className="luxury-card p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06]">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
            <span className="text-sm font-medium text-slate-900">{editingId ? "Edit Offer" : "New Offer"}</span>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 mb-1.5">Offer title</p>
            <input
              type="text"
              className="luxury-input text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Summer escape package"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 mb-1.5">Description</p>
            <textarea
              className="luxury-input text-sm h-24 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add a concise guest-facing summary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1.5">Discount (%)</p>
              <input
                type="number" min={0} max={100}
                className="luxury-input text-sm"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1.5">Expires</p>
              <input
                type="date"
                className="luxury-input text-sm"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 mb-1.5">Select Hotel</p>
            <div className="relative">
              <select
                className="luxury-select text-sm cursor-pointer"
                value={form.hotelId}
                onChange={(e) => setForm({ ...form, hotelId: e.target.value, roomId: "" })}
              >
                <option value="">Choose a hotel</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name} — {hotel.city}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 mb-1.5">Link to room</p>
            <div className="relative">
              <select
                className="luxury-select text-sm cursor-pointer disabled:opacity-40"
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                disabled={!form.hotelId}
              >
                <option value="">
                  {form.hotelId ? "Select a room" : "Select a hotel first"}
                </option>
                {filteredRooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.roomType} — {currency}{room.pricePerNight}/night
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-black/[0.1] bg-white text-[#2563EB] focus:ring-[#2563EB]/30"
            />
            <span className="text-sm text-slate-600">Active (visible to guests)</span>
          </label>

          <div>
            <p className="text-sm font-medium text-slate-500 mb-1.5">Offer image</p>
            <label className="border border-dashed border-black/[0.1] rounded-xl px-3 py-4 block text-center cursor-pointer hover:bg-black/[0.02] transition">
              <input
                type="file" accept="image/*" hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setForm({ ...form, image: file || null });
                  setPreview(file ? safeUrl(URL.createObjectURL(file)) : null);
                }}
              />
              <span className="text-xs text-slate-400">Click to upload (optional)</span>
            </label>
            {preview && safeUrl(preview) && (
              <img src={safeUrl(preview)} alt="preview" className="mt-3 rounded-xl w-full max-h-48 object-cover" />
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="gold-button flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {saving ? "Saving..." : editingId ? "Update Offer" : "Create Offer"}
            </button>
            {editingId && (
              <button type="button" className="text-sm text-slate-500 hover:text-slate-900" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-black/[0.08] bg-white text-slate-600 placeholder:text-slate-400 outline-none focus:border-[#2563EB]/40 transition-colors"
            />
          </div>
          {sortedOffers.length === 0 && (
            <div className="luxury-card p-8 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#2563EB]/5 border border-[#2563EB]/20 flex items-center justify-center">
                <Tag className="w-6 h-6 text-[#2563EB]/70" />
              </div>
              <p className="text-slate-500">No offers yet. Add your first deal to boost bookings.</p>
            </div>
          )}

          {sortedOffers.map((offer) => (
            <motion.div
              key={offer._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="luxury-card p-5 hover:border-black/[0.12] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 truncate">{offer.title}</h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                        offer.isActive
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {offer.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{offer.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="text-[#2563EB] font-medium font-space">{offer.discountPercent}% off</span>
                    <span>Expires {new Date(offer.expiryDate).toLocaleDateString()}</span>
                    <span>{offer.hotel?.name || "Hotel"} — {offer.room?.roomType || "Room"}</span>
                    <Link className="text-[#2563EB]/80 hover:text-[#2563EB] underline" to={`/rooms/${offer.room?._id || offer.room}`}>
                      View room
                    </Link>
                  </div>
                </div>
                {offer.image && (
                  <img src={offer.image} alt={offer.title} className="w-28 h-20 object-cover rounded-xl shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/[0.06]">
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/[0.08] text-slate-500 hover:text-[#2563EB] hover:border-[#2563EB]/30 hover:bg-[#2563EB]/10 transition-all"
                  onClick={() => handleEdit(offer)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/[0.08] text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                  disabled={deletingId === offer._id} onClick={() => handleDelete(offer._id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </motion.div>
  );
};

export default ManageOffers;
