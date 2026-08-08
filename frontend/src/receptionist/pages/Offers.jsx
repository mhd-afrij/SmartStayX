import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { Star, Plus, Edit3, Trash2, Percent, Calendar, Building2, ChevronDown, DoorOpen } from "lucide-react";
import toast from "react-hot-toast";

const Offers = () => {
  const { axios, getToken } = useAppContext();
  const [offers, setOffers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", discountPercent: "", expiryDate: "", roomId: "", hotelId: "" });

  const loadOffers = async () => {
    try {
      setLoading(true);
      const [offRes, roomRes] = await Promise.all([
        axios.get("/api/receptionist/offers", { headers: { Authorization: `Bearer ${await getToken()}` } }),
        axios.get("/api/receptionist/rooms", { headers: { Authorization: `Bearer ${await getToken()}` } }),
      ]);
      if (offRes.data.success) setOffers(offRes.data.offers);
      if (roomRes.data.success) {
        setRooms(roomRes.data.rooms);
        const unique = {};
        roomRes.data.rooms.forEach((r) => { if (r.hotel?._id) unique[r.hotel._id] = r.hotel.name; });
        setHotels(Object.entries(unique).map(([value, name]) => ({ value, name })));
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffers(); }, []);

  const resetForm = () => setForm({ title: "", description: "", discountPercent: "", expiryDate: "", roomId: "", hotelId: "" });

  const filteredRooms = form.hotelId ? rooms.filter((r) => r.hotel?._id === form.hotelId || r.hotel === form.hotelId) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.discountPercent || !form.expiryDate || !form.roomId) {
      return toast.error("Fill in all required fields");
    }
    try {
      const payload = { ...form, discountPercent: Number(form.discountPercent), hotelId: form.hotelId };
      const { data } = editingOffer
        ? await axios.put(`/api/receptionist/offers/${editingOffer._id}`, payload, {
            headers: { Authorization: `Bearer ${await getToken()}` },
          })
        : await axios.post("/api/receptionist/offers", payload, {
            headers: { Authorization: `Bearer ${await getToken()}` },
          });
      if (data.success) {
        toast.success(editingOffer ? "Offer updated" : "Offer created");
        setShowForm(false);
        setEditingOffer(null);
        resetForm();
        await loadOffers();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to save offer");
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    const room = rooms.find((r) => r._id === offer.room?._id);
    setForm({
      title: offer.title,
      description: offer.description,
      discountPercent: offer.discountPercent,
      expiryDate: offer.expiryDate ? new Date(offer.expiryDate).toISOString().split("T")[0] : "",
      roomId: offer.room?._id || "",
      hotelId: room?.hotel?._id || offer.hotel?._id || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer?")) return;
    try {
      const { data } = await axios.delete(`/api/receptionist/offers/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Offer deleted");
        await loadOffers();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Offers & Discounts</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage promotional offers</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingOffer(null); resetForm(); }}
          className="gold-button flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus className="w-4 h-4" /> {showForm ? "Close" : "New Offer"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              {editingOffer ? <Edit3 className="w-4 h-4 text-[#2563EB]" /> : <Plus className="w-4 h-4 text-[#2563EB]" />}
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{editingOffer ? "Edit Offer" : "New Offer"}</h3>
              <p className="text-xs text-slate-500">{editingOffer ? "Update offer details" : "Create a new promotional offer"}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1.5">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="luxury-input h-auto py-2 px-3 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-500 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="luxury-input h-auto py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Discount % *</label>
              <input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                className="luxury-input h-auto py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Expiry Date *</label>
              <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="luxury-input h-auto py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Hotel</label>
              <div className="relative">
                <select value={form.hotelId} onChange={(e) => { setForm({ ...form, hotelId: e.target.value, roomId: "" }); }}
                  className="luxury-select h-auto py-2 px-3 text-sm">
                  <option value="">Select hotel</option>
                  {hotels.map((h) => (
                    <option key={h.value} value={h.value}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Room *</label>
              <div className="relative">
                <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="luxury-select h-auto py-2 px-3 text-sm">
                  <option value="">Select room</option>
                  {filteredRooms.map((r) => (
                    <option key={r._id} value={r._id}>Room {r.roomNumber} — {r.roomType}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button type="submit" className="gold-button px-5 py-2 text-sm">
                {editingOffer ? "Update Offer" : "Create Offer"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingOffer(null); resetForm(); }}
                className="ghost-button px-5 py-2 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-8 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#2563EB]/25 border-t-[#2563EB] animate-spin" />
          <span className="text-sm text-slate-500">Loading offers...</span>
        </div>
      ) : offers.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">No offers created yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const expired = new Date(offer.expiryDate) < new Date();
            return (
              <motion.div
                key={offer._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-black/[0.06] bg-white shadow-sm overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <Percent className="w-5 h-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{offer.title}</h4>
                        <p className="text-xs text-slate-500">{offer.hotel?.name || "Hotel"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(offer)}
                        className="p-1.5 rounded-lg border border-black/[0.06] text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(offer._id)}
                        className="p-1.5 rounded-lg border border-black/[0.06] text-slate-400 hover:text-red-600 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{offer.description}</p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        <span className="text-[#2563EB] font-medium">{offer.discountPercent}%</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(offer.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${expired ? "border-red-200 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
                      {expired ? "Expired" : "Active"}
                    </span>
                  </div>

                  {offer.room && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-black/[0.06] pt-2">
                      <DoorOpen className="w-3 h-3" />
                      Room {offer.room.roomNumber} — {offer.room.roomType}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Offers;
