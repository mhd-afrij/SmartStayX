import { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Plus, Image, ChevronDown } from "lucide-react";

const AddRoom = () => {
  const { axios, getToken, user } = useAppContext();

  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [inputs, setInputs] = useState({
    roomType: "",
    pricePerNight: "",
    amenities: {
      "Free Wifi": false,
      "Free Breakfast": false,
      "Room Service": false,
      "Mountain View": false,
      "Pool Access": false,
    },
  });
  const [loading, setLoading] = useState(false);

  const fetchHotels = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/hotels/owner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        const ownerHotels = data.hotels ?? [];
        setHotels(ownerHotels);
        if (ownerHotels.length === 1) {
          setSelectedHotel(ownerHotels[0]._id);
        }
      } else {
        toast.error(data.message || "Failed to load hotels");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load hotels");
    }
  };

  useEffect(() => {
    if (user) fetchHotels();
  }, [user]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!selectedHotel || !inputs.roomType || !inputs.pricePerNight || !Object.values(images).some((image) => image)) {
      toast.error("Please fill all fields and upload at least one image.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("roomType", inputs.roomType);
      formData.append("pricePerNight", inputs.pricePerNight);
      formData.append("hotelId", selectedHotel);
      const amenities = Object.keys(inputs.amenities).filter((key) => inputs.amenities[key]);
      formData.append("amenities", JSON.stringify(amenities));
      Object.keys(images).forEach((key) => {
        images[key] && formData.append("images", images[key]);
      });
      const { data } = await axios.post("/api/rooms/", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message);
        setInputs({
          roomType: "",
          pricePerNight: "",
          amenities: {
            "Free Wifi": false, "Free Breakfast": false, "Room Service": false,
            "Mountain View": false, "Pool Access": false,
          },
        });
        setImages({ 1: null, 2: null, 3: null, 4: null });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Add Room</h1>
        <p className="text-sm text-white/40 mt-1">
          Add photos, set pricing, and choose amenities to create a great listing.
        </p>
      </div>

      <form onSubmit={onSubmitHandler} className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-sm font-medium text-white/60 mb-2">Images</p>
              <p className="text-xs text-white/30 mb-3">Upload up to 4 photos (first will be the cover).</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(images).map((key) => (
                  <label
                    htmlFor={`roomImage${key}`}
                    key={key}
                    className="relative border border-dashed border-white/[0.08] rounded-xl aspect-video flex items-center justify-center bg-white/[0.02] hover:border-[#D4A85F]/30 transition cursor-pointer overflow-hidden group"
                  >
                    {key === "1" && (
                      <span className="absolute top-2 left-2 z-10 text-[9px] uppercase tracking-wide bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] px-2 py-0.5 rounded-full font-medium">
                        Cover
                      </span>
                    )}
                    {images[key] ? (
                      <img src={URL.createObjectURL(images[key])} alt="upload" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-white/30 group-hover:text-white/50 transition-colors">
                        <Image className="w-5 h-5" />
                        <span className="text-[10px]">Upload</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" id={`roomImage${key}`} hidden
                      onChange={(e) => setImages({ ...images, [key]: e.target.files[0] })}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-white/60 mb-1.5">Hotel Name</p>
                <div className="relative">
                  <select
                    value={selectedHotel || ''}
                    onChange={(e) => setSelectedHotel(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-[#0B1220]">Select hotel</option>
                    {hotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id} className="bg-[#0B1220]">{hotel.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white/60 mb-1.5">City</p>
                <input
                  type="text"
                  value={hotels.find(h => h._id === selectedHotel)?.city || ''}
                  disabled
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 outline-none"
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-white/60 mb-1.5">Room Type</p>
                <div className="relative">
                  <select
                    value={inputs.roomType}
                    onChange={(e) => setInputs({ ...inputs, roomType: e.target.value })}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-[#0B1220]">Select room type</option>
                    <option value="Single Bed" className="bg-[#0B1220]">Single Bed</option>
                    <option value="Double Bed" className="bg-[#0B1220]">Double Bed</option>
                    <option value="Luxury Room" className="bg-[#0B1220]">Luxury Room</option>
                    <option value="Family Suite" className="bg-[#0B1220]">Family Suite</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white/60 mb-1.5">Price / night</p>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                  value={inputs.pricePerNight}
                  onChange={(e) => setInputs({ ...inputs, pricePerNight: e.target.value })}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white/60 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(inputs.amenities).map((amenity) => {
                  const selected = inputs.amenities[amenity];
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() =>
                        setInputs({
                          ...inputs,
                          amenities: { ...inputs.amenities, [amenity]: !inputs.amenities[amenity] },
                        })
                      }
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        selected
                          ? "border-[#D4A85F]/30 bg-[#D4A85F]/10 text-[#D4A85F]"
                          : "border-white/[0.06] bg-white/[0.04] text-white/50 hover:text-white/70"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all disabled:opacity-50"
                disabled={loading}
                type="submit"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Adding..." : "Add Room"}
              </button>
              <p className="text-xs text-white/30">Ensure pricing and amenities are accurate before publishing.</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 space-y-3">
            <p className="text-sm font-medium text-white/60">Quick tips</p>
            <ul className="space-y-1.5 text-xs text-white/40">
              {[
                "Use bright cover photos.",
                "Match price to room size and amenities.",
                "Include WiFi and breakfast when available.",
                "Keep at least one image under 1MB for speed.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#D4A85F] mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default AddRoom;
