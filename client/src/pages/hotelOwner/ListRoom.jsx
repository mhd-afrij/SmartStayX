import React, { useEffect, useState } from 'react';
import Title from '../../components/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
// Removed server-side import. Client should call API endpoints via HTTP.

const ListRoom = () => {
  const [rooms, setRooms] = useState([]);
  const {axios,getToken,user,currency} = useAppContext();


  // Fetch rooms data when hotel owner 

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('/api/rooms/Owner', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setRooms(data.rooms);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch rooms');
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



  useEffect(()=>{
    if(user){
      fetchRooms();
    }
  },[user])

  return (
    <div className="space-y-6">
      <Title
        align="left"
        font="outfit"
        title="Room Listings"
        subtitle="Manage all your room listings, update pricing, and control availability."
      />

      {rooms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <p className="text-slate-500">No rooms listed yet. Add your first room to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
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
    </div>
  )
}

export default ListRoom;
