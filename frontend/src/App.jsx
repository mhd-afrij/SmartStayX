import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import GuestAssistantWidget from './components/guestAssistant/GuestAssistantWidget';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import AllRooms from './pages/AllRooms';
import RoomDetails from './pages/RoomDetails';
import MyBookings from './pages/MyBookings';
import About from './pages/About';

import HotelReg from './components/HotelReg';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { motion } from 'framer-motion';

// ── Hotel Manager (was Owner) ──────────────────────────────────────────
import ManagerLayout from './hotelOwner/pages/Layout.jsx';
import ManagerDashboard from './hotelOwner/pages/Dashboard';
import HotelManagement from './hotelOwner/pages/HotelManagement';
import RoomManagement from './hotelOwner/pages/RoomManagement';
import ManageOffers from './hotelOwner/pages/ManageOffers';
import PaymentManagement from './hotelOwner/pages/PaymentManagement';
import ServiceManagement from './hotelOwner/pages/ServiceManagement';
import ReviewsManagement from './hotelOwner/pages/ReviewsManagement';
import TestimonialsManagement from './hotelOwner/pages/TestimonialsManagement';
 import Housekeeping from './hotelOwner/pages/Housekeeping';
 import Inventory from './hotelOwner/pages/Inventory';
 import Attendance from './hotelOwner/pages/Attendance';
 import LoyaltyManagement from './hotelOwner/pages/LoyaltyManagement';
 import DynamicPricing from './hotelOwner/pages/DynamicPricing';
import AnalyticsDashboard from './hotelOwner/pages/AnalyticsDashboard';
import StaffManagement from './hotelOwner/pages/StaffManagement';
import AddRoom from './hotelOwner/pages/rooms/AddRoom';
import ListRoom from './hotelOwner/pages/rooms/ListRoom';
import RoleManagement from './hotelOwner/pages/RoleManagement';
import DestinationManagement from './hotelOwner/pages/DestinationManagement';
import OwnerProfile from './hotelOwner/pages/OwnerProfile';

// ── Receptionist ───────────────────────────────────────────────────────
import ReceptionistRooms from './receptionist/pages/Rooms';
import ReceptionistRoomStatusBoard from './receptionist/pages/RoomStatusBoard';
import ReceptionistAssignedTasks from './receptionist/pages/AssignedTasks';
import ReceptionistPayments from './receptionist/pages/Payments';
import ReceptionistServices from './receptionist/pages/Services';
import ReceptionistReservations from './receptionist/pages/Reservations';
import ReceptionistGuests from './receptionist/pages/Guests';
import ReceptionistCheckin from './receptionist/pages/Checkin';
import ReceptionistCheckout from './receptionist/pages/Checkout';
import ReceptionistNotifications from './receptionist/pages/Notifications';
import ReceptionistFrontDesk from './receptionist/pages/FrontDesk';

// ── Super Admin ────────────────────────────────────────────────────────
import AdminLayout from './admin/pages/Layout';
import ReceptionistLayout from './receptionist/pages/Layout.jsx';
import AdminDashboard from './admin/pages/Dashboard';
import AdminComingSoon from './admin/pages/ComingSoon';
import AdminUserManagement from './admin/pages/UserManagement';
import AdminRoleManagement from './admin/pages/RoleManagement';
import AdminHotels from './admin/pages/Hotels';
import AdminGuests from './admin/pages/Guests';
import AdminRooms from './admin/pages/Rooms';
import AdminReservations from './admin/pages/Reservations';
import AdminAnalytics from './admin/pages/Analytics';
import AdminSecurityCenter from './admin/pages/SecurityCenter';
import AdminAuditLogs from './admin/pages/AuditLogs';
import AdminPlatformSettings from './admin/pages/PlatformSettings';
import AdminHotelApprovals from './admin/pages/HotelApprovals';
import AdminReports from './admin/pages/Reports';

// ── Lazy-loaded public pages ───────────────────────────────────────────
const Blog = lazy(() => import('./pages/Blog'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/StaffLogin'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Notifications = lazy(() => import('./pages/Notifications'));
const SupportTickets = lazy(() => import('./pages/SupportTickets'));
const Invoice = lazy(() => import('./pages/Invoice'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));

import PaymentPage from './pages/PaymentPage';
import BookingWizard from './pages/BookingWizard';

const SuspenseWrap = ({ children }) => (
  <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#183B35] border-t-transparent dark:border-[#8FB8A8]" /></div>}>
    {children}
  </Suspense>
);

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showHotelReg, user, isSuperAdmin, isHotelManager, isReceptionist, roleResolved, userLoaded } = useAppContext();
  const isManagerPath = location.pathname.startsWith('/manager') || location.pathname.startsWith('/Owner');
  const isReceptionistPath = location.pathname.startsWith('/receptionist') || location.pathname.startsWith('/Receptionist');
  const isSuperAdminPath = location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/Admin');
  const isDashboardPath = isManagerPath || isReceptionistPath || isSuperAdminPath;
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll position for the top progress bar.
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-redirect logged-in users to their dashboard
  useEffect(() => {
    if (!userLoaded || !roleResolved || !user) return;
    // Don't redirect if already on a dashboard path
    if (isDashboardPath) return;
    // Don't redirect if on legacy paths (they'll be handled by redirects below)
    if (location.pathname.startsWith('/Owner') || location.pathname.startsWith('/Receptionist') || location.pathname.startsWith('/Admin')) return;

    if (isSuperAdmin) {
      navigate('/super-admin', { replace: true });
    } else if (isReceptionist) {
      navigate('/receptionist', { replace: true });
    } else if (isHotelManager) {
      navigate('/manager', { replace: true });
    }
  }, [isSuperAdmin, isHotelManager, isReceptionist, isDashboardPath, location.pathname, navigate, roleResolved, user, userLoaded]);

  return (
    <div className='relative'>
      <Toaster
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          },
        }}
      />

      {/* Scroll progress indicator */}
      <div className='fixed left-0 top-0 z-[70] h-1 w-full bg-white/5 dark:bg-white/5'>
        <motion.div
          className='h-full bg-[linear-gradient(90deg,#183B35_0%,#2A4A43_100%)]'
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Shared layout for public pages */}
      {!isDashboardPath && <Navbar />}

      {showHotelReg && <HotelReg />}

      {/* Route content */}
      <div className='min-h-[70vh]'>
        <ErrorBoundary>
        <Routes>
          {/* ── Public routes ──────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path='/rooms/:id' element={<RoomDetails />} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/login/*" element={<SuspenseWrap><Login /></SuspenseWrap>} />
          <Route path="/signup/*" element={<SuspenseWrap><SignUp /></SuspenseWrap>} />
          <Route path="/blog" element={<SuspenseWrap><Blog /></SuspenseWrap>} />
          <Route path="/payment/:bookingId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/booking/:roomId" element={<ProtectedRoute><BookingWizard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><SuspenseWrap><Profile /></SuspenseWrap></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><SuspenseWrap><Notifications /></SuspenseWrap></ProtectedRoute>} />
          <Route path="/support" element={<SuspenseWrap><SupportTickets /></SuspenseWrap>} />
          <Route path="/trip-planner" element={<ProtectedRoute><SuspenseWrap><TripPlanner /></SuspenseWrap></ProtectedRoute>} />
          <Route path="/invoice/:bookingId" element={<SuspenseWrap><Invoice /></SuspenseWrap>} />

          {/* ── Legacy path redirects (backward compatibility) ─────── */}
          <Route path="/Owner/*" element={<Navigate to={location.pathname.replace('/Owner', '/manager')} replace />} />
          <Route path="/Receptionist/*" element={<Navigate to={location.pathname.replace('/Receptionist', '/receptionist')} replace />} />
          <Route path="/Admin/*" element={<Navigate to={location.pathname.replace('/Admin', '/super-admin')} replace />} />

          {/* ── Super Admin dashboard ─────────────────────────────── */}
          <Route path='/super-admin' element={<ProtectedRoute allowedRoles={["super_admin"]}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path='users' element={<AdminUserManagement />} />
            <Route path='roles' element={<AdminRoleManagement />} />
            <Route path='hotels' element={<AdminHotels />} />
            <Route path='guests' element={<AdminGuests />} />
            <Route path='rooms' element={<AdminRooms />} />
            <Route path='reservations' element={<AdminReservations />} />
            <Route path='analytics' element={<AdminAnalytics />} />
            <Route path='managers' element={<AdminComingSoon title="Hotel Managers" />} />
            <Route path='payments' element={<AdminComingSoon title="Payments" />} />
            <Route path='reports' element={<AdminReports />} />
            <Route path='audit-logs' element={<AdminAuditLogs />} />
            <Route path='security' element={<AdminSecurityCenter />} />
            <Route path='settings' element={<AdminPlatformSettings />} />
            <Route path='hotel-approvals' element={<AdminHotelApprovals />} />
          </Route>

          {/* ── Hotel Manager dashboard ───────────────────────────── */}
          <Route path='/manager' element={<ProtectedRoute allowedRoles={["hotel_manager", "super_admin"]}><ManagerLayout /></ProtectedRoute>}>
            <Route index element={<ManagerDashboard />} />
            <Route path='hotel-management' element={<HotelManagement />} />
            <Route path='room-management' element={<RoomManagement />} />
            <Route path='rooms' element={<ListRoom />} />
            <Route path='rooms/add' element={<AddRoom />} />
            <Route path='pricing' element={<DynamicPricing />} />
            <Route path='offers' element={<ManageOffers />} />
            <Route path='payments' element={<PaymentManagement />} />
            <Route path='service-management' element={<ServiceManagement />} />
            <Route path='reviews' element={<ReviewsManagement />} />
            <Route path='testimonials' element={<TestimonialsManagement />} />
            <Route path='analytics' element={<AnalyticsDashboard />} />
            <Route path='staff-management' element={<StaffManagement />} />
            <Route path='role-management' element={<RoleManagement />} />
            <Route path='destinations' element={<DestinationManagement />} />
            <Route path='housekeeping' element={<Housekeeping />} />
            <Route path='inventory' element={<Inventory />} />
            <Route path='attendance' element={<Attendance />} />
            <Route path='loyalty' element={<LoyaltyManagement />} />
            <Route path='profile' element={<OwnerProfile />} />
          </Route>

          {/* ── Receptionist dashboard ────────────────────────────── */}
          <Route path='/receptionist' element={<ProtectedRoute allowedRoles={["receptionist", "hotel_manager", "super_admin"]}><ReceptionistLayout /></ProtectedRoute>}>
            <Route index element={<ReceptionistFrontDesk />} />
            <Route path='reservations' element={<ReceptionistReservations />} />
            <Route path='guests' element={<ReceptionistGuests />} />
            <Route path='checkin' element={<ReceptionistCheckin />} />
            <Route path='checkout' element={<ReceptionistCheckout />} />
            <Route path='rooms' element={<ReceptionistRooms />} />
            <Route path='room-status' element={<ReceptionistRoomStatusBoard />} />
            <Route path='tasks' element={<ReceptionistAssignedTasks />} />
            <Route path='payments' element={<ReceptionistPayments />} />
            <Route path='services' element={<ReceptionistServices />} />
            <Route path='notifications' element={<ReceptionistNotifications />} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </div>

      {/* Guest assistant widget on public pages only */}
      {!isDashboardPath && <GuestAssistantWidget />}

      {/* Footer on public pages only */}
      {!isDashboardPath && <Footer />}

      {/* Back to top button */}
      <BackToTop />
    </div>
  );
};

export default App;
