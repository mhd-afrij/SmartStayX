import { useEffect, useState, useMemo } from "react";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const { currency, user, getToken, axios, selectedHotelId, setSelectedHotelId } = useAppContext();
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [maintenanceRoomId, setMaintenanceRoomId] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    bookings: [],
    rooms: [],
    totalBookings: 0,
    totalRevenue: 0,
    occupancyPercent: 0,
    revenue: { today: 0, week: 0, month: 0 },
    avgRating: null,
    upcomingBookings: 0,
    cancelledBookings: 0,
    lastMinuteBookings: 0,
    trends: [],
    hotel: null,
    allHotels: [],
  });

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get(`/api/bookings/hotel?hotelId=${selectedHotelId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setDashboardData((prev) => ({
          ...prev,
          ...data.dashboardData,
          bookings: data.dashboardData.bookings || [],
          rooms: data.dashboardData.rooms || [],
          revenue: data.dashboardData.revenue || { today: 0, week: 0, month: 0 },
          trends: data.dashboardData.trends || [],
          hotel: data.dashboardData.hotel || null,
          allHotels: data.dashboardData.allHotels || [],
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleAvailability = async (roomId) => {
    setMaintenanceRoomId(roomId);
    try {
      const { data } = await axios.post(
        "/api/rooms/toggle-availability",
        { roomId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setDashboardData((prev) => ({
          ...prev,
          rooms: prev.rooms.map((room) =>
            room._id === roomId ? { ...room, isAvailable: !room.isAvailable } : room
          ),
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMaintenanceRoomId(null);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!bookingId) return;

    const shouldDelete = window.confirm("Delete this booking record? This action cannot be undone.");
    if (!shouldDelete) return;

    setDeletingBookingId(bookingId);
    try {
      const { data } = await axios.delete(`/api/bookings/owner/${bookingId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success(data.message || "Booking deleted successfully");
        await fetchDashboardData();
      } else {
        toast.error(data.message || "Failed to delete booking");
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete booking");
    } finally {
      setDeletingBookingId(null);
    }
  };

  const trendMax = useMemo(() => {
    const values = dashboardData.trends?.map((d) => d.bookings || 0) || [];
    return Math.max(1, ...values);
  }, [dashboardData.trends]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, selectedHotelId]);

  const formatCurrency = (value) => `${currency} ${Number(value || 0).toLocaleString()}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Title
          align="left"
          font="outfit"
          title="Dashboard"
          subtitle="Monitor rooms, bookings, revenue, and guest sentiment in one place."
        />
        
        {dashboardData.allHotels.length > 0 && (
          <div className="flex items-center gap-3">
            <select 
              value={selectedHotelId} 
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-indigo-500 shadow-sm"
            >
              <option value="all">All Properties</option>
              {dashboardData.allHotels.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hotel Details Section */}
      {dashboardData.hotel ? (
        <div className="bg-white border text-center lg:text-left border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          {dashboardData.hotel.image ? (
            <img
              src={dashboardData.hotel.image}
              alt={dashboardData.hotel.name}
              className="w-20 h-20 rounded-full object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-20 h-20 bg-blue-100 rounded-full flex shrink-0 items-center justify-center text-blue-600 text-3xl font-bold">
              {dashboardData.hotel.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800">{dashboardData.hotel.name}</h2>
            <div className="flex flex-col sm:flex-row mt-2 text-sm text-slate-500 gap-2 sm:gap-4 items-center lg:items-start justify-center lg:justify-start">
              <span className="flex items-center gap-1">📍 {dashboardData.hotel.city} (Country), {dashboardData.hotel.address}</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="flex items-center gap-1">📞 {dashboardData.hotel.contact}</span>
            </div>
            {dashboardData.hotel.description && (
              <p className="text-sm text-slate-500 mt-2">{dashboardData.hotel.description}</p>
            )}
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg shrink-0 text-center">
             <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</p>
             <p className="text-emerald-600 font-medium">Active Partner</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center">
           <h2 className="text-2xl font-bold text-slate-800 mb-3">Welcome to your Partner Dashboard!</h2>
          <p className="text-slate-500 max-w-md">You haven't registered a hotel yet. Add your property details to start managing rooms, bookings, and revenue.</p>
        </div>
      )}

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Total Bookings</p>
          <p className="text-2xl font-semibold text-slate-800">{dashboardData.totalBookings}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Total Revenue</p>
          <p className="text-2xl font-semibold text-slate-800">{formatCurrency(dashboardData.totalRevenue)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Occupancy</p>
          <p className="text-2xl font-semibold text-slate-800">{dashboardData.occupancyPercent}%</p>
          <p className="text-xs text-slate-500 mt-1">Active stays / total rooms</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Guest Rating</p>
          <p className="text-2xl font-semibold text-slate-800">
            {dashboardData.avgRating ? dashboardData.avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Avg. from recent feedback</p>
        </div>
      </div>

      {/* Revenue + trends */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800">Revenue Breakdown</h3>
          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">Today</p>
              <p className="text-xl font-semibold text-slate-800">{formatCurrency(dashboardData.revenue.today)}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">Last 7 days</p>
              <p className="text-xl font-semibold text-slate-800">{formatCurrency(dashboardData.revenue.week)}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">Last 30 days</p>
              <p className="text-xl font-semibold text-slate-800">{formatCurrency(dashboardData.revenue.month)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Booking Trends (7d)</h3>
          <div className="mt-4 flex items-end gap-2 h-28">
            {dashboardData.trends.map((item) => {
              const height = `${Math.max(8, (item.bookings / trendMax) * 100)}%`;
              return (
                <div key={item.label} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full rounded-t bg-blue-500"
                    style={{ height, minHeight: 8 }}
                    title={`${item.label}: ${item.bookings} bookings`}
                  />
                  <span className="text-[11px] text-slate-500 mt-1">{item.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500 flex gap-3">
            <span>Upcoming: {dashboardData.upcomingBookings}</span>
            <span>Cancelled: {dashboardData.cancelledBookings}</span>
            <span>Last-minute: {dashboardData.lastMinuteBookings}</span>
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800">Recent Bookings</h3>
          <p className="text-xs text-slate-500">Latest activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="py-3 px-4 text-left">Guest</th>
                <th className="py-3 px-4 text-left">Room</th>
                <th className="py-3 px-4 text-left">Check-in</th>
                <th className="py-3 px-4 text-left">Check-out</th>
                <th className="py-3 px-4 text-left">Total</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Payment</th>
                <th className="py-3 px-4 text-left">Control</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {dashboardData.bookings.map((item) => (
                <tr key={item._id} className="border-t border-slate-100">
                  <td className="py-3 px-4">{item.user?.username || "Guest"}</td>
                  <td className="py-3 px-4">{item.room?.roomType || "Room"}</td>
                  <td className="py-3 px-4">{new Date(item.checkInDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{new Date(item.checkOutDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{formatCurrency(item.totalPrice)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.status === "cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : item.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDeleteBooking(item._id)}
                      disabled={deletingBookingId === item._id}
                      className="text-xs px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 transition disabled:opacity-60"
                    >
                      {deletingBookingId === item._id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room maintenance control */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800">Maintenance Control</h3>
          <p className="text-xs text-slate-500">Put rooms in/out of maintenance mode</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {dashboardData.rooms.map((room) => (
            <div key={room._id} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{room.roomType}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(room.pricePerNight)} / night</p>
                  <p className="text-xs text-slate-500">Capacity: {room.capacity || "—"}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    room.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {room.isAvailable ? "Available" : "Maintenance"}
                </span>
              </div>
              <button
                className="mt-3 text-xs px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-100 transition disabled:opacity-60"
                onClick={() => handleToggleAvailability(room._id)}
                disabled={maintenanceRoomId === room._id}
              >
                {maintenanceRoomId === room._id
                  ? "Updating..."
                  : room.isAvailable
                  ? "Set Maintenance"
                  : "Resume Room"}
              </button>
            </div>
          ))}
          {dashboardData.rooms.length === 0 && (
            <p className="text-sm text-slate-500">No rooms found for this property yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
