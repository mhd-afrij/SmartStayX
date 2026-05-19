import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Building2, ChevronDown } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import HeroWelcome from "../../components/dashboard/HeroWelcome";
import KpiCards from "../../components/dashboard/KpiCards";
import RevenueChart from "../../components/dashboard/RevenueChart";
import BookingDonut from "../../components/dashboard/BookingDonut";
import BookingsTable from "../../components/dashboard/BookingsTable";
import MaintenancePanel from "../../components/dashboard/MaintenancePanel";

const Dashboard = () => {
  const { currency, user, getToken, axios, selectedHotelId, setSelectedHotelId } = useAppContext();

  // Dashboard interaction state.
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
      // Load bookings, revenue, rooms, and hotel data for the selected property.
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
    // Toggle maintenance availability for a room.
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
    // Remove an owner booking after confirmation.
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, selectedHotelId]);

  const formatCurrency = (value) => `${currency} ${Number(value || 0).toLocaleString()}`;

  const isLoading = !dashboardData.hotel && dashboardData.bookings.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-10"
    >
      {/* Hero welcome and summary blocks */}
      <HeroWelcome hotel={dashboardData.hotel} user={user} />

      {/* Empty-state message when no hotel exists yet */}
      {!dashboardData.hotel && dashboardData.bookings.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-10 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-[#D4A85F]/20 flex items-center justify-center">
            <span className="text-2xl">🏨</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Welcome to your Partner Dashboard!</h2>
          <p className="text-sm text-white/50 max-w-md mx-auto">
            You haven't registered a hotel yet. Add your property details to start managing rooms,
            bookings, and revenue.
          </p>
        </motion.div>
      )}

  {/* Hotel selector and KPI cards */}
      {dashboardData.allHotels.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div />
            <div className="relative">
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
              >
                <option value="all" className="bg-[#0B1220]">All Properties</option>
                {dashboardData.allHotels.map((h) => (
                  <option key={h._id} value={h._id} className="bg-[#0B1220]">
                    {h.name}
                  </option>
                ))}
              </select>
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
            </div>
          </div>
          <KpiCards data={dashboardData} currency={currency} />
        </>
      )}

      {/* Revenue and booking breakdown */}
      {dashboardData.bookings.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart revenueData={dashboardData.trends} />
          </div>
          <BookingDonut bookings={dashboardData.bookings} />
        </div>
      )}

      {/* Booking table */}
      {dashboardData.bookings.length > 0 && (
        <BookingsTable
          bookings={dashboardData.bookings}
          onDelete={handleDeleteBooking}
          deletingId={deletingBookingId}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Maintenance controls */}
      {dashboardData.rooms.length > 0 && (
        <MaintenancePanel
          rooms={dashboardData.rooms}
          onToggle={handleToggleAvailability}
          togglingId={maintenanceRoomId}
        />
      )}
    </motion.div>
  );
};

export default Dashboard;
