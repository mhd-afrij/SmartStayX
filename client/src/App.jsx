import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import AllRooms from './pages/AllRooms';
import RoomDetails from './pages/RoomDetails';
import MyBookings from './pages/MyBookings';
import About from './pages/About';
import Experience from './pages/Experience';
import TripPlanner from './pages/TripPlanner';
import Blog from './pages/Blog';
import HotelReg from './components/HotelReg';
import Layout from './hotelOwner/pages/Layout.jsx';
import Dashboard from './hotelOwner/pages/Dashboard';
import HotelManagement from './hotelOwner/pages/HotelManagement';
import AddRoom from './hotelOwner/pages/rooms/AddRoom';
import ListRoom from './hotelOwner/pages/rooms/ListRoom';
import ManageOffers from './hotelOwner/pages/ManageOffers';
import PaymentManagement from './hotelOwner/pages/PaymentManagement';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from "./context/AppContext";
import { motion } from 'framer-motion';


const App = () => {
  const location = useLocation();
  const { showHotelReg } = useAppContext();
  const isOwnerPath = location.pathname.startsWith('/Owner'); // Check if the path starts with '/Owner'
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
      {!isOwnerPath && <Navbar />}  {/* Show Navbar only on non-owner paths */}
      
      {showHotelReg && <HotelReg />} {/* Show HotelReg if `showHotelReg` is true */}
      
      {/* Route content */}
      <div className='min-h-[70vh]'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path='/rooms/:id' element={<RoomDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/about" element={<About />} />
          <Route path="/trip-planner" element={<TripPlanner />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/blog" element={<Blog />} />

          {/* Owner dashboard layout and nested routes */}
          <Route path='/Owner' element={<Layout />}>
            <Route index element={<Dashboard />} />  {/* Default owner dashboard */}
            <Route path='hotel-management' element={<HotelManagement />} />
            <Route path='add-room' element={<AddRoom />} />
            <Route path='list-room' element={<ListRoom />} />
            <Route path='offers' element={<ManageOffers />} />
            <Route path='payments' element={<PaymentManagement />} />
          </Route>
        </Routes>
      </div>
      
      {/* Chatbot on public pages only */}
      {!isOwnerPath && <ChatBot />}
      
      {/* Footer on public pages only */}
      {!isOwnerPath && <Footer />}
    </div>
  );
};

export default App;
