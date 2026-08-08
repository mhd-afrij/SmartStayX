import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Building2, ChevronDown } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import ErrorBoundary from "../../components/ErrorBoundary";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import HeroWelcome from "../../components/dashboard/HeroWelcome";
import KpiCards from "../../components/dashboard/KpiCards";
import RevenueChart from "../../components/dashboard/RevenueChart";
import BookingDonut from "../../components/dashboard/BookingDonut";
import BookingsTable from "../../components/dashboard/BookingsTable";
import MaintenancePanel from "../../components/dashboard/MaintenancePanel";

const Dashboard = () => {
  const { currency, user, getToken, axios, selectedHotelId, setSelectedHotelId, dashboardData, setDashboardData, formatPrice } = useAppContext();

  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [maintenanceRoomId, setMaintenanceRoomId] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: "", message: "" });

  const requestConfirm = (id, title, message) => {
    setConfirmState({ open: true, id, title, message });
  };

  const handleConfirmed = () => {
    const { id } = confirmState;
    setConfirmState({ open: false, id: null, title: "", message: "" });
    if (id) handleDeleteBooking(id);
  };

  const fetchDashboardData = useCallback(async () => {
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
  }, [axios, getToken, selectedHotelId, setDashboardData]);

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

  const handleSubmitReport = useCallback(async (issue, roomId) => {
    setSubmittingReport(true);
    try {
      const { data } = await axios.post(
        "/api/maintenance/report",
        { issue, roomId, hotelId: selectedHotelId },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message || "Issue reported");
      } else {
        toast.error(data.message || "Failed to report issue");
      }
    } catch (error) {
      toast.error(error.message || "Failed to report issue");
    } finally {
      setSubmittingReport(false);
    }
  }, [axios, getToken, selectedHotelId]);

  const handleStatusChange = useCallback(async (bookingId, status) => {
    setUpdatingStatusId(bookingId);
    try {
      const { data } = await axios.patch(`/api/bookings/owner/${bookingId}/status`, { status }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message || "Status updated");
        setDashboardData((prev) => ({
          ...prev,
          bookings: prev.bookings.map((b) =>
            b._id === bookingId ? { ...b, status } : b
          ),
        }));
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  }, [axios, getToken, setDashboardData]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const formatCurrency = (value) => formatPrice(value, { maximumFractionDigits: 0 });

  const isLoading = !dashboardData.hotel && dashboardData.bookings.length === 0;
  const hasNoHotel = dashboardData.allHotels.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-10"
    >
      <HeroWelcome hotel={dashboardData.hotel} user={user} />

      {hasNoHotel && !isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-10 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
            <span className="text-2xl">🏨</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Welcome to your Partner Dashboard!</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            You haven't registered a hotel yet. Add your property details to start managing rooms,
            bookings, and revenue.
          </p>
          <a
            href="/Owner/hotel-management"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-[#2563EB] text-white hover:shadow-lg hover:shadow-[#2563EB]/20 transition-all"
          >
            Register Your Hotel
          </a>
        </motion.div>
      )}

      {dashboardData.allHotels.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div />
            <div className="relative">
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-black/[0.08] bg-white text-slate-600 outline-none focus:border-[#2563EB]/40 transition-colors cursor-pointer"
              >
                <option value="all" className="bg-white">All Properties</option>
                {dashboardData.allHotels.map((h) => (
                  <option key={h._id} value={h._id} className="bg-white">
                    {h.name}
                  </option>
                ))}
              </select>
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <ErrorBoundary>
            <KpiCards data={dashboardData} currency={currency} formatPrice={formatCurrency} />
          </ErrorBoundary>
        </>
      )}

      {dashboardData.bookings.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0">
            <ErrorBoundary>
              <RevenueChart revenueData={dashboardData.trends} currency={currency} formatPrice={formatCurrency} />
            </ErrorBoundary>
          </div>
          <div className="min-w-0">
            <ErrorBoundary>
              <BookingDonut bookings={dashboardData.bookings} />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {dashboardData.bookings.length > 0 && (
        <ErrorBoundary>
          <BookingsTable
            bookings={dashboardData.bookings}
            onDelete={(id) => requestConfirm(id, "Delete Booking", "Delete this booking record? This action cannot be undone.")}
            deletingId={deletingBookingId}
            formatCurrency={formatCurrency}
            onStatusChange={handleStatusChange}
            updatingStatusId={updatingStatusId}
          />
        </ErrorBoundary>
      )}

      {dashboardData.rooms.length > 0 && (
        <ErrorBoundary>
          <MaintenancePanel
            rooms={dashboardData.rooms}
            onToggle={handleToggleAvailability}
            togglingId={maintenanceRoomId}
            onReport={handleSubmitReport}
            submittingReport={submittingReport}
          />
        </ErrorBoundary>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant="danger"
        onConfirm={handleConfirmed}
        onCancel={() => setConfirmState({ open: false, id: null, title: "", message: "" })}
      />
    </motion.div>
  );
};

export default Dashboard;
