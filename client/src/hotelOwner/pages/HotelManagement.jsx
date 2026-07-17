// HotelManagement — Owner panel for creating and updating hotel property details
import { useEffect, useState } from "react";
import { cities } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Building2, Plus, Save, ChevronDown, Trash2, GripVertical, Home, Award, MapPin, Heart, Users, Wifi, Coffee, ConciergeBell, Mountain, Waves } from "lucide-react";

const ICON_MAP = {
  homeIcon: Home,
  badgeIcon: Award,
  locationFilledIcon: MapPin,
  heartIcon: Heart,
  guestsIcon: Users,
  freeWifiIcon: Wifi,
  freeBreakfastIcon: Coffee,
  roomServiceIcon: ConciergeBell,
  mountainIcon: Mountain,
  poolIcon: Waves,
};

// safeUrl — Returns the URL only if it starts with http or blob, otherwise empty string
const safeUrl = (url) =>
  url && (url.startsWith('http') || url.startsWith('blob:')) ? url : '';

// emptyForm — Default empty hotel form state
const emptyForm = {
  name: "",
  address: "",
  contact: "",
  city: "",
  description: "",
  image: null,
};

const AVAILABLE_ICONS = [
  { key: "homeIcon", label: "Home" },
  { key: "badgeIcon", label: "Badge" },
  { key: "locationFilledIcon", label: "Location" },
  { key: "heartIcon", label: "Heart" },
  { key: "guestsIcon", label: "Guests" },
  { key: "freeWifiIcon", label: "WiFi" },
  { key: "freeBreakfastIcon", label: "Breakfast" },
  { key: "roomServiceIcon", label: "Room Service" },
  { key: "mountainIcon", label: "Mountain" },
  { key: "poolIcon", label: "Pool" },
];

// HotelManagement — Owner panel for creating and updating hotel property details
const HotelManagement = () => {
  const { axios, getToken, user, setShowHotelReg } = useAppContext();

  // Hotel list and form state.
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState([]);
  const [amenityOptions, setAmenityOptions] = useState([]);
  const [newFeature, setNewFeature] = useState({ icon: "homeIcon", title: "", description: "" });
  const [newAmenity, setNewAmenity] = useState("");

  // loadHotels — Fetches the owner's hotels and selects the first one for editing
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
          setFeatures(first.features || []);
          setAmenityOptions(first.amenityOptions || []);
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

  // handleSelectHotel — Populates the form with selected hotel data
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
    setFeatures(selected.features || []);
    setAmenityOptions(selected.amenityOptions || []);
  };

  // handleImageChange — Updates hotel image preview on file selection
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
    setPreview(safeUrl(URL.createObjectURL(file)));
  };

  // handleSubmit — Saves hotel details (name, address, contact, city, description, image)
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
    payload.append("features", JSON.stringify(features));
    payload.append("amenityOptions", JSON.stringify(amenityOptions));
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
                  {preview ? (
                    <img src={preview} alt="hotel preview" className="w-full h-48 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-48 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/20 text-xs">No image</div>
                  )}
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
                  type="tel"
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                  required
                  placeholder="+1 234 567 8900"
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

      {/* Feature cards management */}
      {hotels.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Feature Cards</h3>
            <p className="text-sm text-white/40 mt-1">Custom feature cards displayed on your room detail pages.</p>
          </div>

          {features.length > 0 && (
            <div className="space-y-2">
              {features.map((feat, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/[0.02] rounded-xl p-3 border border-white/[0.06]">
                  <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
                  {(() => {
                    const Icon = ICON_MAP[feat.icon]
                    return Icon ? (
                      <Icon className="w-8 h-8 opacity-70 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] shrink-0" />
                    )
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{feat.title}</p>
                    <p className="text-xs text-white/40 truncate">{feat.description || "No description"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeatures((prev) => prev.filter((_, i) => i !== index))}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[120px_1fr_1fr_auto] items-end">
            <div>
              <p className="text-xs font-medium text-white/50 mb-1">Icon</p>
              <select
                value={newFeature.icon}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full appearance-none px-2 py-2 text-xs rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
              >
                {AVAILABLE_ICONS.map((ico) => (
                  <option key={ico.key} value={ico.key} className="bg-[#0B1220]">{ico.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-medium text-white/50 mb-1">Title</p>
              <input
                type="text"
                value={newFeature.title}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-2 py-2 text-xs rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                placeholder="e.g. Beach Access"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-white/50 mb-1">Description</p>
              <input
                type="text"
                value={newFeature.description}
                onChange={(e) => setNewFeature((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-2 py-2 text-xs rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                placeholder="Short description"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newFeature.title.trim()) {
                  toast.error("Feature title is required");
                  return;
                }
                setFeatures((prev) => [...prev, { ...newFeature }]);
                setNewFeature({ icon: "homeIcon", title: "", description: "" });
              }}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>
      )}

      {/* Amenity options management */}
      {hotels.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Amenity Options</h3>
            <p className="text-sm text-white/40 mt-1">Amenity choices available when adding or editing rooms for this hotel.</p>
          </div>

          {amenityOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenityOptions.map((opt, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04]"
                >
                  <span className="text-xs text-white/70">{opt}</span>
                  <button
                    type="button"
                    onClick={() => setAmenityOptions((prev) => prev.filter((_, i) => i !== index))}
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newAmenity.trim() && !amenityOptions.includes(newAmenity.trim())) {
                    setAmenityOptions((prev) => [...prev, newAmenity.trim()]);
                    setNewAmenity("");
                  }
                }
              }}
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
              placeholder="e.g. Free WiFi"
            />
            <button
              type="button"
              onClick={() => {
                if (!newAmenity.trim()) {
                  toast.error("Please enter an amenity name");
                  return;
                }
                if (amenityOptions.includes(newAmenity.trim())) {
                  toast.error("Amenity already exists");
                  return;
                }
                setAmenityOptions((prev) => [...prev, newAmenity.trim()]);
                setNewAmenity("");
              }}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HotelManagement;
