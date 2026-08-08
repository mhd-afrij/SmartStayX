import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
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
import { motion } from 'framer-motion';

import ChatBotWidget from './components/chatbot/ChatBotWidget';

const Blog = lazy(() => import('./pages/Blog'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const SupportTickets = lazy(() => import('./pages/SupportTickets'));
const Invoice = lazy(() => import('./pages/Invoice'));
const ChatBotPage = lazy(() => import('./components/chatbot/ChatBotPage'));
const ItineraryPlanner = lazy(() => import('./pages/ItineraryPlanner'));

import PaymentPage from './pages/PaymentPage';
import RoleManagement from './hotelOwner/pages/RoleManagement';
import DestinationManagement from './hotelOwner/pages/DestinationManagement';

import ReceptionistLayout from './receptionist/pages/Layout';
import ReceptionistReservations from './receptionist/pages/Reservations';
import ReceptionistRooms from './receptionist/pages/Rooms';
import ReceptionistPayments from './receptionist/pages/Payments';
import ReceptionistServices from './receptionist/pages/Services';
import ReceptionistOffers from './receptionist/pages/Offers';
import ReceptionistReviews from './receptionist/pages/Reviews';

const App = () => {
  const location = useLocation();
  const { showHotelReg } = useAppContext();
  const isOwnerPath = location.pathname.startsWith('/Owner');
  const isReceptionistPath = location.pathname.startsWith('/Receptionist');
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

  return (
    <div className='relative'>
      <Toaster />

      {/* Scroll progress indicator */}
      <div className='fixed left-0 top-0 z-[70] h-1 w-full bg-white/5'>
        <motion.div
          className='h-full bg-[linear-gradient(90deg,#D4A85F_0%,#F5D08A_52%,#FFF3D6_100%)]'
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
      
      {/* Shared layout for public pages */}
      {!isOwnerPath && !isReceptionistPath && <Navbar />}
      
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
          <Route path="/blog" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#07111f]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" /></div>}>
              <Blog />
            </Suspense>
          } />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />
          <Route path="/itinerary" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#07111f]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" /></div>}>
              <ItineraryPlanner />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#07111f]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" /></div>}>
              <Profile />
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#07111f]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" /></div>}>
              <Notifications />
            </Suspense>
          } />
          <Route path="/support" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#07111f]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" /></div>}>
              <SupportTickets />
            </Suspense>
          } />
          <Route path="/chat" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" /></div>}>
              <ChatBotPage />
            </Suspense>
          } />
          <Route path="/invoice/:bookingId" element={
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#07111f]"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A85F] border-t-transparent" /></div>}>
              <Invoice />
            </Suspense>
          } />

          {/* Receptionist dashboard layout and nested routes */}
          <Route path='/Receptionist' element={<ReceptionistLayout />}>
            <Route index element={<ReceptionistReservations />} />
            <Route path='rooms' element={<ReceptionistRooms />} />
            <Route path='payments' element={<ReceptionistPayments />} />
            <Route path='services' element={<ReceptionistServices />} />
            <Route path='offers' element={<ReceptionistOffers />} />
            <Route path='reviews' element={<ReceptionistReviews />} />
          </Route>

          {/* Owner dashboard layout and nested routes */}
          <Route path='/Owner' element={<Layout />}>
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
          </Route>
        </Routes>
        </ErrorBoundary>
      </div>
      
      
      {/* ChatBot widget on public pages only */}
      {!isOwnerPath && !isReceptionistPath && <ChatBotWidget />}

      {/* Footer on public pages only */}
      {!isOwnerPath && !isReceptionistPath && <Footer />}
      
      {/* Back to top button */}
      <BackToTop />
    </div>
  );
};

export default App;
