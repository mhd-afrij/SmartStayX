// ListRoom — Owner panel for viewing, editing, and deleting existing rooms
import { useEffect, useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { List, Edit3, Trash2, ChevronDown, X } from 'lucide-react';

const AMENITY_OPTIONS = [
  'Free Wifi', 'Free Breakfast', 'Room Service', 'Mountain View', 'Pool Access',
];

const ListRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({
    roomType: '', pricePerNight: '', amenities: {}, isAvailable: true,
  });
  const { axios, getToken, user, currency } = useAppContext();

  const roomTypeOptions = [
    'all', ...Array.from(new Set(rooms.map((room) => room.roomType).filter(Boolean))),
  ];

  const filteredRooms = rooms.filter((room) =>
    roomTypeFilter === 'all' ? true : room.roomType === roomTypeFilter
  );

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

  const deleteRoom = async (roomId) => {
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
    }
  };

  const openEditModal = (room) => {
    const amenityMap = {};
    AMENITY_OPTIONS.forEach((amenity) => {
      amenityMap[amenity] = (room.amenities || []).includes(amenity);
    });
    setEditForm({
      roomType: room.roomType || '',
      pricePerNight: room.pricePerNight ?? '',
      amenities: amenityMap,
      isAvailable: Boolean(room.isAvailable),
    });
    setEditingRoom(room);
  };

  const closeEditModal = () => {
    setEditingRoom(null);
    setIsSaving(false);
  };

  const submitRoomEdit = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!editForm.roomType || editForm.pricePerNight === '') {
      toast.error('Room type and price are required');
      return;
    }
    const payload = {
      roomType: editForm.roomType,
      pricePerNight: Number(editForm.pricePerNight),
      isAvailable: editForm.isAvailable,
      amenities: Object.keys(editForm.amenities).filter((key) => editForm.amenities[key]),
    };
    if (Number.isNaN(payload.pricePerNight) || payload.pricePerNight < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    try {
      setIsSaving(true);
      const { data } = await axios.put(`/api/rooms/${editingRoom._id}`, payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
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
          <h1 className="text-xl font-bold text-white tracking-tight">Room Listings</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage all your room listings, update pricing, and control availability.
          </p>
        </div>
        <div className="relative">
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
          >
            {roomTypeOptions.map((option) => (
              <option key={option} value={option} className="bg-[#0B1220]">
                {option === 'all' ? 'All Room Types' : option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      {rooms.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-[#D4A85F]/20 flex items-center justify-center">
            <List className="w-6 h-6 text-[#D4A85F]/60" />
          </div>
          <p className="text-white/50">No rooms listed yet. Add your first room to get started.</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-12 text-center">
          <p className="text-white/50">No rooms match the selected room type.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden hover:border-white/[0.12] transition-all"
            >
              {room.images && room.images[0] ? (
                <div className="aspect-video bg-white/[0.02] overflow-hidden">
                  <img src={room.images[0]} alt={room.roomType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center">
                  <span className="text-white/20 text-sm">No image</span>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{room.roomType}</h3>
                    {room.hotel?.name && (
                      <p className="text-xs text-white/40">{room.hotel.name}</p>
                    )}
                    <p className="text-lg font-bold text-[#D4A85F] font-space mt-1">
                      {currency}{room.pricePerNight}
                      <span className="text-xs text-white/30 font-normal"> / night</span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                      room.isAvailable
                        ? "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]"
                        : "border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]"
                    }`}
                  >
                    {room.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="text-[10px] bg-white/[0.04] text-white/50 px-2 py-0.5 rounded">
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-[10px] text-white/30 px-2 py-0.5">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40">Available</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={room.isAvailable}
                        onChange={() => toggleAvailability(room._id)}
                      />
                      <div className="h-5 w-9 rounded-full bg-white/[0.08] peer peer-checked:bg-[#22C55E]/30 transition-colors" />
                      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white/60 rounded-full transition-transform duration-200 peer-checked:translate-x-4 peer-checked:bg-[#22C55E]" />
                    </label>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-[#D4A85F] hover:border-[#D4A85F]/20 hover:bg-[#D4A85F]/10 transition-all"
                      onClick={() => openEditModal(room)}
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-[#EF4444] hover:border-[#EF4444]/20 hover:bg-[#EF4444]/10 transition-all"
                      onClick={() => deleteRoom(room._id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={submitRoomEdit}
            className="w-full max-w-xl rounded-2xl border border-white/[0.06] bg-[#0B1220]/95 backdrop-blur-xl p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit Room</h3>
                <p className="text-sm text-white/40">Update room details and save changes.</p>
              </div>
              <button type="button" onClick={closeEditModal} className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-white/60 mb-1.5">Room Type</p>
                <div className="relative">
                  <select
                    value={editForm.roomType}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, roomType: e.target.value }))}
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
                  value={editForm.pricePerNight}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, pricePerNight: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white/60 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => (
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
                        ? "border-[#D4A85F]/30 bg-[#D4A85F]/10 text-[#D4A85F]"
                        : "border-white/[0.06] bg-white/[0.04] text-white/50"
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.isAvailable}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-[#D4A85F] focus:ring-[#D4A85F]/30"
              />
              <span className="text-sm text-white/70">Room is available for booking</span>
            </label>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </motion.div>
  );
};

export default ListRoom;
