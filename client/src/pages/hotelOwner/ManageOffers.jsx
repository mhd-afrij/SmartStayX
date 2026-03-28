import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Title from "../../components/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const emptyForm = {
  title: "",
  description: "",
  discountPercent: "",
  expiryDate: "",
  hotelId: "",
  roomId: "",
  image: null,
  isActive: true,
};

const ManageOffers = () => {
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
      const { data } = await axios.get("/api/rooms/Owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load rooms");
    }
  };

  const loadHotels = async () => {
    try {
      const { data } = await axios.get("/api/hotels/owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setHotels(data.hotels || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load hotels");
    }
  };

  const loadOffers = async () => {
    try {
      const { data } = await axios.get("/api/offers/owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setOffers(data.offers || []);
      }
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
      const filtered = rooms.filter(room => room.hotel?._id === form.hotelId || room.hotel === form.hotelId);
      setFilteredRooms(filtered);
      setForm(prev => ({ ...prev, roomId: "" }));
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

  const sortedOffers = useMemo(() => offers.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [offers]);

  return (
    <div className="space-y-6">
      <Title
        align="left"
        font="outfit"
        title="Exclusive Offers"
        subtitle="Create, edit, and retire special deals. Link each offer to a specific room so guests can book directly."
      />

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Offer title</p>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Summer escape package"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Description</p>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add a concise guest-facing summary"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Discount (%)</p>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Expires</p>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Select Hotel</p>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              value={form.hotelId}
              onChange={(e) => setForm({ ...form, hotelId: e.target.value })}
            >
              <option value="">Choose a hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name} — {hotel.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Link to room</p>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              disabled={!form.hotelId}
            >
              <option value="">
                {form.hotelId ? "Select a room" : "Select a hotel first"}
              </option>
              {filteredRooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.roomType} — ₹{room.pricePerNight}/night
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="isActive">Active (visible to guests)</label>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Offer image</p>
            <label className="border border-dashed border-slate-300 rounded-lg px-3 py-4 block text-center cursor-pointer bg-slate-50 hover:border-slate-400">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setForm({ ...form, image: file || null });
                  setPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              <span className="text-xs text-slate-600">Click to upload (optional)</span>
            </label>
            {preview && <img src={preview} alt="preview" className="mt-3 rounded-lg w-full max-h-48 object-cover" />}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : editingId ? "Update Offer" : "Create Offer"}
            </button>
            {editingId && (
              <button type="button" className="text-sm text-slate-600" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {sortedOffers.length === 0 && (
            <p className="text-sm text-slate-500">No offers yet. Add your first deal to boost bookings.</p>
          )}

          {sortedOffers.map((offer) => (
            <div key={offer._id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-slate-800">{offer.title}</p>
                  <p className="text-sm text-slate-600">{offer.description}</p>
                  <p className="text-xs text-slate-500">{offer.discountPercent}% off • Expires {new Date(offer.expiryDate).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">{offer.hotel?.name || "Hotel"} — {offer.room?.roomType || "Room"}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-1 rounded-full ${offer.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {offer.isActive ? "Active" : "Hidden"}
                    </span>
                    <Link className="text-blue-600 hover:underline" to={`/rooms/${offer.room?._id || offer.room}`}>
                      View room
                    </Link>
                  </div>
                </div>
                {offer.image && (
                  <img src={offer.image} alt={offer.title} className="w-32 h-24 object-cover rounded" />
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 text-sm">
                <button
                  className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50"
                  onClick={() => handleEdit(offer)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => handleDelete(offer._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
};

export default ManageOffers;
