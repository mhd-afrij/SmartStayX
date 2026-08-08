// ListRoom — Owner panel for viewing, editing, and deleting existing rooms
import { useEffect, useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { List, Edit3, Trash2, ChevronDown, X } from 'lucide-react';
import ConfirmModal from '../../../components/dashboard/ConfirmModal';

// ListRoom — Owner panel for viewing, filtering, editing, and deleting existing rooms
const ListRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({
    roomNumber: '', roomType: '', pricePerNight: '', amenities: {}, isAvailable: true,
  });
  const [editAmenityOptions, setEditAmenityOptions] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [deletingId, setDeletingId] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const { axios, getToken, user, currency } = useAppContext();

  const formatPrice = (value) => `${currency} ${Number(value || 0).toLocaleString()}`;

  const roomTypeOptions = [
    'all', ...Array.from(new Set(rooms.map((room) => room.roomType).filter(Boolean))),
  ];

  const filteredRooms = rooms.filter((room) =>
    roomTypeFilter === 'all' ? true : room.roomType === roomTypeFilter
  );

  // fetchRooms — Loads all rooms owned by the current user
  const fetchRooms = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/rooms/Owner', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setRooms(data.rooms);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setIsLoading(false);
    }
  };

  // toggleAvailability — Toggles a room's availability on/off
  const toggleAvailability = async (roomId) => {
    try {
      const { data } = await axios.post(
        '/api/rooms/toggle-availability',
        { roomId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message);
        fetchRooms();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    }
  };

  // deleteRoom — Sets confirm modal for room deletion
  const deleteRoom = (roomId) => {
    setConfirmDelete({ open: true, id: roomId });
  };

  // handleDeleteConfirmed — Performs the actual room deletion after confirmation
  const handleDeleteConfirmed = async () => {
    const roomId = confirmDelete.id;
    if (!roomId) return;
    setDeletingId(roomId);
    setConfirmDelete({ open: false, id: null });
    try {
      const { data } = await axios.delete(`/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message);
        setRooms((prev) => prev.filter((r) => r._id !== roomId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    } finally {
      setDeletingId(null);
    }
  };

  // openEditModal — Populates the edit form modal with room data
  const openEditModal = async (room) => {
    const hotelId = room.hotel?._id || room.hotel;
    let options = [];
    if (hotelId) {
      try {
        const { data } = await axios.get(`/api/hotels/${hotelId}`);
        if (data.success) {
          options = data.hotel?.amenityOptions || [];
        }
      } catch { /* fallback to defaults */ }
    }
    if (options.length === 0) {
      options = ["Free Wifi", "Free Breakfast", "Room Service", "Mountain View", "Pool Access"];
    }
    setEditAmenityOptions(options);
    const amenityMap = {};
    options.forEach((amenity) => {
      amenityMap[amenity] = (room.amenities || []).includes(amenity);
    });
    setEditForm({
      roomNumber: room.roomNumber || '',
      roomType: room.roomType || '',
      pricePerNight: room.pricePerNight ?? '',
      amenities: amenityMap,
      isAvailable: Boolean(room.isAvailable),
    });
    setEditingRoom(room);
    setEditingHotelId(hotelId);
    setEditPreview(null);
  };

  // Auto-generate room number when room type changes in edit modal
  const [editingHotelId, setEditingHotelId] = useState(null);
  useEffect(() => {
    if (!editingRoom || !editForm.roomType || !editingHotelId) return;
    const getNextNumber = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`/api/rooms/next-number/${editingHotelId}?roomType=${encodeURIComponent(editForm.roomType)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setEditForm((prev) => ({ ...prev, roomNumber: data.roomNumber }));
        }
      } catch {
        // fallback: let user type manually
      }
    };
    getNextNumber();
  }, [editingRoom, editForm.roomType, editingHotelId]);

  // closeEditModal — Closes the edit modal and resets edit state
  const closeEditModal = () => {
    if (editPreview && editPreview.startsWith('blob:')) URL.revokeObjectURL(editPreview);
    setEditingRoom(null);
    setEditingHotelId(null);
    setEditPreview(null);
    setIsSaving(false);
  };

  // submitRoomEdit — Saves edited room details (type, price, amenities, availability, image)
  const submitRoomEdit = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!editForm.roomType || editForm.pricePerNight === '') {
      toast.error('Room type and price are required');
      return;
    }
    const payload = new FormData();
    payload.append("roomNumber", editForm.roomNumber);
    payload.append("roomType", editForm.roomType);
    payload.append("pricePerNight", Number(editForm.pricePerNight));
    payload.append("isAvailable", editForm.isAvailable);
    payload.append("amenities", JSON.stringify(Object.keys(editForm.amenities).filter((key) => editForm.amenities[key])));
    if (editForm.newImage) payload.append("image", editForm.newImage);
    if (Number.isNaN(Number(editForm.pricePerNight)) || Number(editForm.pricePerNight) < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    try {
      setIsSaving(true);
      const { data } = await axios.put(`/api/rooms/${editingRoom._id}`, payload, {
        headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success(data.message || 'Room updated');
        setRooms((prev) =>
          prev.map((room) =>
            room._id === editingRoom._id
              ? { ...room, ...payload }
              : room
          )
        );
        closeEditModal();
      } else {
        toast.error(data.message || 'Failed to update room');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update room');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Room Listings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all your room listings, update pricing, and control availability.
          </p>
        </div>
        <div className="relative">
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="luxury-select w-full appearance-none pl-3 pr-8 py-2"
          >
            {roomTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Room Types' : option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {rooms.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#fbf2e1] border border-[#2563EB]/20 flex items-center justify-center">
            <List className="w-6 h-6 text-[#2563EB]" />
          </div>
          <p className="text-slate-500">No rooms listed yet. Add your first room to get started.</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-12 text-center">
          <p className="text-slate-500">No rooms match the selected room type.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] overflow-hidden hover:border-[#2563EB]/25 transition-all"
            >
              {room.images && room.images[0] ? (
                <div className="aspect-video bg-[#f4f2ef] overflow-hidden">
                  <img src={room.images[0]} alt={room.roomType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="aspect-video bg-[#f4f2ef] flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image</span>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{room.roomType}</h3>
                    {room.hotel?.name && (
                      <p className="text-xs text-slate-500">{room.hotel.name}</p>
                    )}
                    {room.roomNumber && (
                      <span className="inline-block mt-1 text-[10px] font-medium text-[#2563EB] bg-[#fbf2e1] px-2 py-0.5 rounded-full border border-[#2563EB]/20">
                        Room {room.roomNumber}
                      </span>
                    )}
                    <p className="text-lg font-bold text-[#2563EB] font-space mt-1">
                      {formatPrice(room.pricePerNight)}
                      <span className="text-xs text-slate-400 font-normal"> / night</span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                      room.isAvailable
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    {room.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="text-[10px] bg-[#f4f2ef] text-slate-600 px-2 py-0.5 rounded">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-[10px] text-slate-400 px-2 py-0.5">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Available</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={room.isAvailable}
                        onChange={() => toggleAvailability(room._id)}
                      />
                      <div className="h-5 w-9 rounded-full bg-black/[0.1] peer peer-checked:bg-emerald-200 transition-colors" />
                      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white border border-black/[0.06] rounded-full transition-transform duration-200 peer-checked:translate-x-4 peer-checked:bg-emerald-600 peer-checked:border-emerald-600" />
                    </label>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded-lg border border-black/[0.08] text-slate-500 hover:text-[#2563EB] hover:border-[#2563EB]/25 hover:bg-[#fbf2e1] transition-all"
                      onClick={() => openEditModal(room)}
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg border border-black/[0.08] text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all"
                      disabled={deletingId === room._id} onClick={() => deleteRoom(room._id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={submitRoomEdit}
            className="w-full max-w-xl rounded-2xl border border-black/[0.06] bg-white p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Room</h3>
                <p className="text-sm text-slate-500">Update room details and save changes.</p>
              </div>
              <button type="button" onClick={closeEditModal} className="p-1 rounded-lg hover:bg-black/[0.04] transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1.5">Room Number</p>
                <input
                  type="text"
                  placeholder='e.g. R101'
                  value={editForm.roomNumber}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, roomNumber: e.target.value }))}
                  className="luxury-input"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1.5">Room Type</p>
                <div className="relative">
                  <select
                    value={editForm.roomType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, roomType: e.target.value }))}
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
                  value={editForm.pricePerNight}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, pricePerNight: e.target.value }))}
                  className="luxury-input"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {editAmenityOptions.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        amenities: { ...prev.amenities, [amenity]: !prev.amenities[amenity] },
                      }))
                    }
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      editForm.amenities[amenity]
                        ? "border-[#2563EB]/30 bg-[#fbf2e1] text-[#2563EB]"
                        : "border-black/[0.08] bg-white text-slate-500"
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Room Images</p>
              <label className="border border-dashed border-black/[0.15] rounded-xl px-3 py-4 block text-center cursor-pointer hover:bg-[#f4f2ef] transition">
                <input type="file" accept="image/*" hidden onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditForm((prev) => ({ ...prev, newImage: file }));
                    setEditPreview(URL.createObjectURL(file));
                  }
                }} />
                <span className="text-xs text-slate-500">Click to upload new image</span>
              </label>
              {editPreview && (
                <div className="mt-2 relative">
                  <img src={editPreview} alt="preview" className="rounded-xl w-full max-h-48 object-cover" />
                  <button type="button" onClick={() => { setEditPreview(null); setEditForm((prev) => ({ ...prev, newImage: null })); }} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isAvailable}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                className="w-4 h-4 rounded border-black/[0.15] bg-white text-[#2563EB] focus:ring-[#2563EB]/30"
              />
              <span className="text-sm text-slate-600">Room is available for booking</span>
            </label>

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="ghost-button px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="gold-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </motion.div>
  );
};

export default ListRoom;
