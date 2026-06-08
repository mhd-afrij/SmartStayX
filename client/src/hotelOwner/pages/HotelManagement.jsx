import { useEffect, useState } from "react";
import { assets, cities } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Building2, Plus, Save, ChevronDown } from "lucide-react";

const safeUrl = (url) =>
  url && (url.startsWith('http') || url.startsWith('blob:')) ? url : '';

const emptyForm = {
  name: "",
  address: "",
  contact: "",
  city: "",
  description: "",
  image: null,
};

const HotelManagement = () => {
  const { axios, getToken, user, setShowHotelReg } = useAppContext();

  // Hotel list and form state.
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHotels = async () => {
    try {
      // Fetch owner hotels and preload the first record into the form.
      setLoading(true);
      const { data } = await axios.get("/api/hotels/owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        const ownerHotels = data.hotels || [];
        setHotels(ownerHotels);
        if (ownerHotels.length > 0) {
          const first = ownerHotels[0];
          setSelectedHotelId(first._id);
          setForm({
            name: first.name || "",
            address: first.address || "",
            contact: first.contact || "",
            city: first.city || "",
            description: first.description || "",
            image: null,
          });
          setPreview(safeUrl(first.image) || "");
        }
      } else {
        setHotels([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadHotels();
  }, [user]);

  const handleSelectHotel = (event) => {
    const hotelId = event.target.value;
    setSelectedHotelId(hotelId);
    const selected = hotels.find((hotel) => hotel._id === hotelId);
    if (!selected) return;
    setForm({
      name: selected.name || "",
      address: selected.address || "",
      contact: selected.contact || "",
      city: selected.city || "",
      description: selected.description || "",
      image: null,
    });
    setPreview(safeUrl(selected.image) || "");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
    setPreview(safeUrl(URL.createObjectURL(file)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedHotelId) {
      toast.error("Please select a hotel");
      return;
    }
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("address", form.address);
    payload.append("contact", form.contact);
    payload.append("city", form.city);
    payload.append("description", form.description);
    if (form.image) payload.append("image", form.image);
    try {
      setSaving(true);
      const { data } = await axios.put(`/api/hotels/${selectedHotelId}`, payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message || "Hotel updated successfully");
        await loadHotels();
      } else {
        toast.error(data.message || "Failed to update hotel");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update hotel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Hotel Management</h1>
          <p className="text-sm text-white/40 mt-1">
            Register new properties and update hotel image/details from one place.
          </p>
        </div>
        <button
          onClick={() => setShowHotelReg(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      {/* Hotel editor content */}
      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-8">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin" />
            <span className="text-sm text-white/40">Loading hotel details...</span>
          </div>
        </div>
      ) : hotels.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-[#D4A85F]/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#D4A85F]/60" />
          </div>
          <p className="text-white/50 mb-4">No properties found. Register your first hotel to start management.</p>
          <button
            onClick={() => setShowHotelReg(true)}
            className="px-5 py-2 text-xs font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all"
          >
            Register Hotel
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Property preview column */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-white/60 mb-1.5">Select Property</p>
                <div className="relative">
                  <select
                    value={selectedHotelId}
                    onChange={handleSelectHotel}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
                  >
                    {hotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id} className="bg-[#0B1220]">
                        {hotel.name} - {hotel.city}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white/60 mb-1.5">Hotel Image</p>
                <label
                  htmlFor="hotel-image"
                  className="block border border-dashed border-white/[0.08] rounded-xl p-2 cursor-pointer hover:bg-white/[0.04] transition"
                >
                  <img
                    src={preview || assets.uploadArea}
                    alt="hotel preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </label>
                <input id="hotel-image" type="file" accept="image/*" hidden onChange={handleImageChange} />
              </div>
            </div>
          </div>

          {/* Editable details column */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-white/60 mb-1.5">Hotel Name</p>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                required
              />
            </div>

            <div>
              <p className="text-sm font-medium text-white/60 mb-1.5">Address</p>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-white/60 mb-1.5">Phone</p>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                  required
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white/60 mb-1.5">Destination</p>
                <div className="relative">
                  <select
                    value={form.city}
                    onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
                    required
                  >
                    <option value="" className="bg-[#0B1220]">Select destination</option>
                    {cities.map((city) => (
                      <option key={city} value={city} className="bg-[#0B1220]">{city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white/60 mb-1.5">Hotel Details</p>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors h-28 resize-none"
                placeholder="Describe your property, amenities, and highlights..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Hotel Details"}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default HotelManagement;
