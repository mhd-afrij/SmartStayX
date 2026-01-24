import { useEffect, useState, useMemo } from "react";
import Title from "../../components/Title";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const { currency, user, getToken, axios } = useAppContext();
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
  });

  const fetchDashboardData = async () => {
    try {
      const { data } = await axios.get("/api/bookings/hotel", {
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
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleAvailability = async (roomId) => {
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
  }, [user]);

  const formatCurrency = (value) => `${currency} ${Number(value || 0).toLocaleString()}`;

  return (
    <div className="space-y-8">
      <Title
        align="left"
        font="outfit"
        title="Dashboard"
        subtitle="Monitor rooms, bookings, revenue, and guest sentiment in one place."
      />

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room availability */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800">Room Availability</h3>
          <p className="text-xs text-slate-500">Toggle to block/unblock rooms</p>
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
                  {room.isAvailable ? "Available" : "Blocked"}
                </span>
              </div>
              <button
                className="mt-3 text-xs px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-100 transition"
                onClick={() => handleToggleAvailability(room._id)}
              >
                {room.isAvailable ? "Block for maintenance" : "Mark available"}
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
