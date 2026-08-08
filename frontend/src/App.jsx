import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import Layout from './hotelOwner/pages/Layout.jsx';
import Dashboard from './hotelOwner/pages/Dashboard';
import HotelManagement from './hotelOwner/pages/HotelManagement';
import RoomManagement from './hotelOwner/pages/RoomManagement';
import ManageOffers from './hotelOwner/pages/ManageOffers';
import PaymentManagement from './hotelOwner/pages/PaymentManagement';
import ServiceManagement from './hotelOwner/pages/ServiceManagement';
import ReviewsManagement from './hotelOwner/pages/ReviewsManagement';
import TestimonialsManagement from './hotelOwner/pages/TestimonialsManagement';

import DynamicPricing from './hotelOwner/pages/DynamicPricing';
import AnalyticsDashboard from './hotelOwner/pages/AnalyticsDashboard';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { motion } from 'framer-motion';


const Blog = lazy(() => import('./pages/Blog'));
const Profile = lazy(() => import('./pages/Profile'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const Login = lazy(() => import('./pages/StaffLogin'));
const SignUp = lazy(() => import('./pages/SignUp'));
const Notifications = lazy(() => import('./pages/Notifications'));
const SupportTickets = lazy(() => import('./pages/SupportTickets'));
const Invoice = lazy(() => import('./pages/Invoice'));

import PaymentPage from './pages/PaymentPage';
import BookingWizard from './pages/BookingWizard';
import RoleManagement from './hotelOwner/pages/RoleManagement';
import DestinationManagement from './hotelOwner/pages/DestinationManagement';
import OwnerProfile from './hotelOwner/pages/OwnerProfile';

import ReceptionistLayout from './receptionist/pages/Layout';
import ReceptionistReservations from './receptionist/pages/Reservations';
import ReceptionistRooms from './receptionist/pages/Rooms';
import ReceptionistRoomStatusBoard from './receptionist/pages/RoomStatusBoard';
import ReceptionistAssignedTasks from './receptionist/pages/AssignedTasks';
import ReceptionistPayments from './receptionist/pages/Payments';
import ReceptionistServices from './receptionist/pages/Services';
import ReceptionistOffers from './receptionist/pages/Offers';
import ReceptionistReviews from './receptionist/pages/Reviews';

import AdminLayout from './admin/pages/Layout';
import AdminDashboard from './admin/pages/Dashboard';
import AdminComingSoon from './admin/pages/ComingSoon';
import AdminUserManagement from './admin/pages/UserManagement';
import AdminRoleManagement from './admin/pages/RoleManagement';
import AdminHotels from './admin/pages/Hotels';

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showHotelReg, user, isReceptionist, isOwner, roleResolved, userLoaded } = useAppContext();
  const isOwnerPath = location.pathname.startsWith('/Owner');
  const isReceptionistPath = location.pathname.startsWith('/Receptionist');
  const isAdminPath = location.pathname.startsWith('/Admin');
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

  useEffect(() => {
    if (!userLoaded || !roleResolved || !user) return;
    if (location.pathname === '/Owner' || location.pathname.startsWith('/Owner/')) return;
    if (location.pathname === '/Receptionist' || location.pathname.startsWith('/Receptionist/')) return;
    if (location.pathname === '/Admin' || location.pathname.startsWith('/Admin/')) return;
    if (user.role === 'admin') {
      navigate('/Admin', { replace: true });
    } else if (isReceptionist) {
      navigate('/Receptionist', { replace: true });
    } else if (isOwner) {
      navigate('/Owner', { replace: true });
    }
  }, [isOwner, isReceptionist, location.pathname, navigate, roleResolved, user, userLoaded]);

  return (
    <div className='relative'>
      <Toaster />

      {/* Scroll progress indicator */}
      <div className='fixed left-0 top-0 z-[70] h-1 w-full bg-white/5'>
        <motion.div
          className='h-full bg-[linear-gradient(90deg,#2563EB_0%,#D4A85F_100%)]'
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* Shared layout for public pages */}
      {!isOwnerPath && !isReceptionistPath && !isAdminPath && <Navbar />}
      
      {showHotelReg && <HotelReg />} {/* Show HotelReg if `showHotelReg` is true */}
      
       {/* Route content */}
      <div className='min-h-[70vh]'>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path='/rooms/:id' element={<RoomDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/about" element={<About />} />
          <Route path="/login/*" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <Login />
            </Suspense>
          } />
          <Route path="/signup/*" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <SignUp />
            </Suspense>
          } />
          <Route path="/blog" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <Blog />
            </Suspense>
          } />
          <Route path="/trip-planner" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <TripPlanner />
            </Suspense>
          } />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/booking/:roomId" element={<BookingWizard />} />
          <Route path="/profile" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <Profile />
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <Notifications />
            </Suspense>
          } />
          <Route path="/support" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <SupportTickets />
            </Suspense>
          } />
          <Route path="/invoice/:bookingId" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfaf8]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" /></div>}>
              <Invoice />
            </Suspense>
          } />

          {/* Receptionist dashboard layout and nested routes */}
          <Route path='/Receptionist' element={<ProtectedRoute allowedRoles={["staff", "owner", "admin"]}><ReceptionistLayout /></ProtectedRoute>}>
            <Route index element={<ReceptionistReservations />} />
            <Route path='rooms' element={<ReceptionistRooms />} />
            <Route path='room-status' element={<ReceptionistRoomStatusBoard />} />
            <Route path='tasks' element={<ReceptionistAssignedTasks />} />
            <Route path='payments' element={<ReceptionistPayments />} />
            <Route path='services' element={<ReceptionistServices />} />
            <Route path='offers' element={<ReceptionistOffers />} />
            <Route path='reviews' element={<ReceptionistReviews />} />
          </Route>

          {/* Owner dashboard layout and nested routes */}
          <Route path='/Owner' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />  {/* Default owner dashboard */}
            <Route path='hotel-management' element={<HotelManagement />} />
            <Route path='room-management' element={<RoomManagement />} />
            <Route path='offers' element={<ManageOffers />} />
            <Route path='payments' element={<PaymentManagement />} />
            <Route path='service-management' element={<ServiceManagement />} />
            <Route path='reviews' element={<ReviewsManagement />} />
            <Route path='testimonials' element={<TestimonialsManagement />} />
            <Route path='analytics' element={<AnalyticsDashboard />} />
            <Route path='role-management' element={<RoleManagement />} />
            <Route path='destinations' element={<DestinationManagement />} />
            <Route path='profile' element={<OwnerProfile />} />
          </Route>

          {/* Admin console layout and nested routes */}
          <Route path='/Admin' element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path='users' element={<AdminUserManagement />} />
            <Route path='roles' element={<AdminRoleManagement />} />
            <Route path='hotels' element={<AdminHotels />} />
            <Route path='managers' element={<AdminComingSoon title="Hotel Managers" />} />
            <Route path='analytics' element={<AdminComingSoon title="Platform Analytics" />} />
            <Route path='payments' element={<AdminComingSoon title="Payments" />} />
            <Route path='reports' element={<AdminComingSoon title="Reports" />} />
            <Route path='logs' element={<AdminComingSoon title="System Logs" />} />
            <Route path='security' element={<AdminComingSoon title="Security" />} />
            <Route path='settings' element={<AdminComingSoon title="Settings" />} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </div>
      
      
      {/* Guest assistant widget on public pages only */}
      {!isOwnerPath && !isReceptionistPath && !isAdminPath && <GuestAssistantWidget />}

      {/* Footer on public pages only */}
      {!isOwnerPath && !isReceptionistPath && !isAdminPath && <Footer />}
      
      {/* Back to top button */}
      <BackToTop />
    </div>
  );
};

export default App;
