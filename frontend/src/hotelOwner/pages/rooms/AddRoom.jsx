// AddRoom — Owner panel for adding new rooms with images, pricing, and amenities
import { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Plus, Image, ChevronDown, X } from "lucide-react";

// AddRoom — Owner panel for adding new rooms with images, pricing, and amenities
const AddRoom = () => {
  const { axios, getToken, user } = useAppContext();

  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [amenityOptions, setAmenityOptions] = useState([
    "Free Wifi", "Free Breakfast", "Room Service", "Mountain View", "Pool Access",
  ]);
  const [inputs, setInputs] = useState({
    roomNumber: "",
    roomType: "",
    pricePerNight: "",
    amenities: {},
  });
  const [loading, setLoading] = useState(false);

  // fetchHotels — Loads owner's hotels for room assignment
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

  // fetchNextRoomNumber — Auto-generates room number based on hotel city and room type
  useEffect(() => {
    if (!selectedHotel) return;
    const getNextNumber = async () => {
      try {
        const token = await getToken();
        const params = inputs.roomType ? `?roomType=${encodeURIComponent(inputs.roomType)}` : '';
        const { data } = await axios.get(`/api/rooms/next-number/${selectedHotel}${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setInputs((prev) => ({ ...prev, roomNumber: data.roomNumber }));
        }
      } catch {
        // fallback: let user type manually
      }
    };
    getNextNumber();
  }, [selectedHotel, inputs.roomType]);

  // loadAmenityOptions — Fetches the selected hotel's custom amenity options
  useEffect(() => {
    if (!selectedHotel) return;
    const hotel = hotels.find((h) => h._id === selectedHotel);
    if (hotel?.amenityOptions && hotel.amenityOptions.length > 0) {
      setAmenityOptions(hotel.amenityOptions);
      setInputs((prev) => {
        const amenities = {};
        hotel.amenityOptions.forEach((opt) => { amenities[opt] = false; });
        return { ...prev, amenities };
      });
    } else {
      const defaults = ["Free Wifi", "Free Breakfast", "Room Service", "Mountain View", "Pool Access"];
      setAmenityOptions(defaults);
      setInputs((prev) => {
        const amenities = {};
        defaults.forEach((opt) => { amenities[opt] = false; });
        return { ...prev, amenities };
      });
    }
  }, [selectedHotel, hotels]);

  // onSubmitHandler — Submits the new room form with images, type, price, and amenities
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!selectedHotel || !inputs.roomNumber || !inputs.roomType || !inputs.pricePerNight || !Object.values(images).some((image) => image)) {
      toast.error("Please fill all fields and upload at least one image.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("roomNumber", inputs.roomNumber);
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
        const resetAmenities = {};
        amenityOptions.forEach((opt) => { resetAmenities[opt] = false; });
        setInputs({
          roomNumber: "",
          roomType: "",
          pricePerNight: "",
          amenities: resetAmenities,
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

  // removeImage — Clears a specific image slot
  const removeImage = (key) => {
    setImages({ ...images, [key]: null });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add Room</h1>
        <p className="text-sm text-slate-500 mt-1">
          Add photos, set pricing, and choose amenities to create a great listing.
        </p>
      </div>

      <form onSubmit={onSubmitHandler} className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Images</p>
              <p className="text-xs text-slate-400 mb-3">Upload up to 4 photos (first will be the cover).</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(images).map((key) => (
                  <label
                    htmlFor={`roomImage${key}`}
                    key={key}
                    className="relative border border-dashed border-black/[0.15] rounded-xl aspect-video flex items-center justify-center bg-[#f4f2ef] hover:border-[#2563EB]/40 transition cursor-pointer overflow-hidden group"
                  >
                    {key === "1" && (
                      <span className="absolute top-2 left-2 z-10 text-[9px] uppercase tracking-wide bg-[#2563EB] text-white px-2 py-0.5 rounded-full font-medium">
                        Cover
                      </span>
                    )}
                    {images[key] ? (
                      <>
                        <img src={URL.createObjectURL(images[key])} alt="upload" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeImage(key);
                          }}
                          className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-slate-600 transition-colors">
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
                <p className="text-sm font-medium text-slate-600 mb-1.5">Hotel Name</p>
                <div className="relative">
                  <select
                    value={selectedHotel || ''}
                    onChange={(e) => setSelectedHotel(e.target.value)}
                    className="luxury-select w-full appearance-none pl-3 pr-8"
                  >
                    <option value="">Select hotel</option>
                    {hotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1.5">City</p>
                <input
                  type="text"
                  value={hotels.find(h => h._id === selectedHotel)?.city || ''}
                  disabled
                  className="luxury-input bg-[#f4f2ef] text-slate-400"
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1.5">Room Number</p>
                <input
                  type="text"
                  placeholder='e.g. R101'
                  className="luxury-input"
                  value={inputs.roomNumber}
                  onChange={(e) => setInputs({ ...inputs, roomNumber: e.target.value })}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1.5">Room Type</p>
                <div className="relative">
                  <select
                    value={inputs.roomType}
                    onChange={(e) => setInputs({ ...inputs, roomType: e.target.value })}
                    className="luxury-select w-full appearance-none pl-3 pr-8"
                  >
                    <option value="">Select room type</option>
                    <option value="Single Bed">Single Bed</option>
                    <option value="Double Bed">Double Bed</option>
                    <option value="Luxury Room">Luxury Room</option>
                    <option value="Family Suite">Family Suite</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1.5">Price / night</p>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="luxury-input"
                  value={inputs.pricePerNight}
                  onChange={(e) => setInputs({ ...inputs, pricePerNight: e.target.value })}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Amenities</p>
              {!selectedHotel ? (
                <p className="text-xs text-slate-400">Select a hotel first to see its amenity options.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map((amenity) => {
                    const selected = inputs.amenities[amenity] || false;
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
                            ? "border-[#2563EB]/30 bg-[#fbf2e1] text-[#2563EB]"
                            : "border-black/[0.08] bg-white text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                className="gold-button px-5 py-2.5 text-sm disabled:opacity-50"
                disabled={loading}
                type="submit"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Adding..." : "Add Room"}
              </button>
              <p className="text-xs text-slate-400">Ensure pricing and amenities are accurate before publishing.</p>
            </div>
          </div>

          <div className="rounded-xl border border-black/[0.06] bg-[#f4f2ef] p-4 space-y-3">
            <p className="text-sm font-medium text-slate-600">Quick tips</p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              {[
                "Use bright cover photos.",
                "Match price to room size and amenities.",
                "Include WiFi and breakfast when available.",
                "Keep at least one image under 1MB for speed.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#2563EB] mt-0.5">•</span>
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
