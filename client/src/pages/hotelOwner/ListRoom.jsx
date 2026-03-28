import React, { useEffect, useState, useRef } from 'react';
import Title from '../../components/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
// Removed server-side import. Client should call API endpoints via HTTP.

const AMENITY_OPTIONS = [
  'Free Wifi',
  'Free Breakfast',
  'Room Service',
  'Mountain View',
  'Pool Access',
];

const ListRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({
    roomType: '',
    pricePerNight: '',
    amenities: {},
    isAvailable: true,
  });
  const hasFetched = useRef(false);
  const {axios,getToken,user,currency} = useAppContext();

  const roomTypeOptions = [
    'all',
    ...Array.from(new Set(rooms.map((room) => room.roomType).filter(Boolean))),
  ];

  const filteredRooms = rooms.filter((room) => {
    if (roomTypeFilter === 'all') return true;
    return room.roomType === roomTypeFilter;
  });


  // Fetch rooms data when hotel owner 

  const fetchRooms = async () => {
    if (isLoading) return; // Prevent simultaneous requests
    
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

  //Toggle Room Availability
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
              ? {
                  ...room,
                  roomType: payload.roomType,
                  pricePerNight: payload.pricePerNight,
                  amenities: payload.amenities,
                  isAvailable: payload.isAvailable,
                }
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
    // Only fetch once when user becomes available
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchRooms();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object
  
  useEffect(() => {
    console.log('Rooms state changed:', rooms.length, 'rooms');
  }, [rooms]);

  console.log('ListRoom render - rooms count:', rooms.length);

  return (
    <div className="space-y-6">
      <Title
        align="left"
        font="outfit"
        title="Room Listings"
        subtitle="Manage all your room listings, update pricing, and control availability."
      />

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <label htmlFor="room-type-filter" className="text-sm text-slate-600">
            Room Type
          </label>
          <select
            id="room-type-filter"
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {roomTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Room Types' : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <p className="text-slate-500">No rooms listed yet. Add your first room to get started.</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <p className="text-slate-500">No rooms match the selected room type.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {/* Room Image */}
              {room.images && room.images[0] ? (
                <div className="aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={room.images[0]}
                    alt={room.roomType}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image</span>
                </div>
              )}

              {/* Room Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{room.roomType}</h3>
                    {room.hotel?.name && (
                      <p className="text-sm text-slate-500">{room.hotel.name}</p>
                    )}
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {currency} {room.pricePerNight}
                      <span className="text-xs text-slate-500 font-normal"> / night</span>
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      room.isAvailable
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {room.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-xs text-slate-500 px-2 py-1">
                        +{room.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Availability</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={room.isAvailable}
                        onChange={() => toggleAvailability(room._id)}
                      />
                      <div className="h-6 w-11 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 transition-colors duration-200"></div>
                      <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5 shadow-sm"></span>
                    </label>
                  </div>

                  <button
                    className="text-sm px-3 py-1.5 rounded border border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => openEditModal(room)}
                  >
                    Edit
                  </button>

                  <button
                    className="text-sm px-3 py-1.5 rounded border border-rose-200 text-rose-700 hover:bg-rose-50"
                    onClick={() => deleteRoom(room._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <form
            onSubmit={submitRoomEdit}
            className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-xl p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Edit Room</h3>
                <p className="text-sm text-slate-500">Update room details and save changes.</p>
              </div>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                onClick={closeEditModal}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-slate-700 text-sm font-medium mb-1">Room Type</p>
                <select
                  value={editForm.roomType}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, roomType: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select room type</option>
                  <option value="Single Bed">Single Bed</option>
                  <option value="Double Bed">Double Bed</option>
                  <option value="Luxury Room">Luxury Room</option>
                  <option value="Family Suite">Family Suite</option>
                </select>
              </div>
              <div>
                <p className="text-slate-700 text-sm font-medium mb-1">Price / night</p>
                <input
                  type="number"
                  min={0}
                  value={editForm.pricePerNight}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, pricePerNight: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <p className="text-slate-700 text-sm font-medium mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        amenities: {
                          ...prev.amenities,
                          [amenity]: !prev.amenities[amenity],
                        },
                      }))
                    }
                    className={`px-3 py-2 rounded-lg border text-sm transition ${
                      editForm.amenities[amenity]
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="edit-availability"
                type="checkbox"
                checked={editForm.isAvailable}
                onChange={(e) => setEditForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
              />
              <label htmlFor="edit-availability" className="text-sm text-slate-700">
                Room is available for booking
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ListRoom;
