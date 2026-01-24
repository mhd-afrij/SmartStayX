import { useState, useEffect } from "react";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast"; 


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

  // Fetch all hotels
  const fetchHotels = async () => {
    try {
      const { data } = await axios.get('/api/hotels/all');
      if (data.success) {
        setHotels(data.hotels);
        // Auto-select owner's hotel
        const ownerHotelData = await axios.get('/api/hotels/owner', {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (ownerHotelData.data.success) {
          setSelectedHotel(ownerHotelData.data.hotel._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch hotels');
    }
  };

  useEffect(() => {
    if (user) {
      fetchHotels();
    }
  }, [user]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    //check if all inputs are filled

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

      //converting amenities to array & keeping only enable amenities
      const amenities = Object
        .keys(inputs.amenities)
        .filter((key) => inputs.amenities[key]);
      formData.append("amenities", JSON.stringify(amenities));

      Object.keys(images).forEach((key) => {
        images[key] && formData.append("images", images[key]);
      });

      const { data } = await axios.post("/api/rooms/", formData, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success(data.message);

        // Correctly setting the input fields with the received data or initial values
        setInputs({
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
        setImages({ 1: null, 2: null, 3: null, 4: null });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add room')
    }finally{
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <Title
        align="left"
        font="outfit"
        title="Add Room"
        subtitle="Add photos, set pricing, and choose amenities to create a great listing."
      />

      <form
        onSubmit={onSubmitHandler}
        className="bg-white border border-slate-200 rounded-xl shadow-sm p-6"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div>
              <p className="text-slate-800 font-semibold mb-2">Images</p>
              <p className="text-sm text-slate-500 mb-3">Upload up to 4 photos (first will be the cover).</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(images).map((key) => (
                  <label
                    htmlFor={`roomImage${key}`}
                    key={key}
                    className="border border-dashed border-slate-300 rounded-lg aspect-video flex items-center justify-center bg-slate-50 hover:border-slate-400 transition cursor-pointer overflow-hidden relative"
                  >
                    {key === "1" && (
                      <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide bg-blue-600 text-white px-2 py-1 rounded-full">
                        Cover
                      </span>
                    )}
                    {images[key] ? (
                      <img src={URL.createObjectURL(images[key])} alt="upload" className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-xs text-slate-500 text-center leading-tight">
                        Click to upload
                        <br />
                        JPG or PNG
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id={`roomImage${key}`}
                      hidden
                      onChange={(e) => setImages({ ...images, [key]: e.target.files[0] })}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Basics */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <p className="text-slate-800 font-semibold mb-1">Hotel Name</p>
                <select
                  value={selectedHotel || ''}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel._id} value={hotel._id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-slate-800 font-semibold mb-1">City</p>
                <input
                  type="text"
                  value={hotels.find(h => h._id === selectedHotel)?.city || ''}
                  disabled
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700"
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            {/* Room Type and Price */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <p className="text-slate-800 font-semibold mb-1">Room Type</p>
                <select
                  value={inputs.roomType}
                  onChange={(e) => setInputs({ ...inputs, roomType: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select room type</option>
                  <option value="Single Bed">Single Bed</option>
                  <option value="Double Bed">Double Bed</option>
                  <option value="Luxury Room">Luxury Room</option>
                  <option value="Family Suite">Family Suite</option>
                </select>
              </div>
              <div>
                <p className="text-slate-800 font-semibold mb-1">Price / night</p>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={inputs.pricePerNight}
                  onChange={(e) => setInputs({ ...inputs, pricePerNight: e.target.value })}
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <p className="text-slate-800 font-semibold mb-2">Amenities</p>
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
                          amenities: {
                            ...inputs.amenities,
                            [amenity]: !inputs.amenities[amenity],
                          },
                        })
                      }
                      className={`px-3 py-2 rounded-lg border text-sm transition ${
                        selected ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Adding..." : "Add Room"}
              </button>
              <p className="text-xs text-slate-500">Ensure pricing and amenities are accurate before publishing.</p>
            </div>
          </div>

          {/* Side tips */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">Quick tips</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Use bright cover photos.</li>
              <li>Match price to room size and amenities.</li>
              <li>Include WiFi and breakfast when available.</li>
              <li>Keep at least one image under 1MB for speed.</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddRoom;
