import React, { useEffect, useState } from "react";
import Title from "../../components/Title";
import { assets, cities } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

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
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHotels = async () => {
    try {
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
          setPreview(first.image || "");
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
    if (user) {
      loadHotels();
    }
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
    setPreview(selected.image || "");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: file }));
    setPreview(URL.createObjectURL(file));
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Title
          align="left"
          font="outfit"
          title="Hotel Management"
          subtitle="Register new properties and update hotel image/details from one place."
        />
        <button
          onClick={() => setShowHotelReg(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
        >
          + Add Property
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-slate-500">Loading hotel details...</p>
        </div>
      ) : hotels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-500 mb-4">No properties found. Register your first hotel to start management.</p>
          <button
            onClick={() => setShowHotelReg(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            Register Hotel
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Select Property</p>
              <select
                value={selectedHotelId}
                onChange={handleSelectHotel}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name} - {hotel.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Hotel Image</p>
              <label htmlFor="hotel-image" className="block mt-1 border border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition">
                <img
                  src={preview || assets.uploadArea}
                  alt="hotel preview"
                  className="w-full h-48 object-cover rounded-md"
                />
              </label>
              <input id="hotel-image" type="file" accept="image/*" hidden onChange={handleImageChange} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Hotel Name</p>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Address</p>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Phone</p>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Country</p>
                <select
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select country</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">Hotel Details</p>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-28"
                placeholder="Describe your property, amenities, and highlights..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Hotel Details"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HotelManagement;
