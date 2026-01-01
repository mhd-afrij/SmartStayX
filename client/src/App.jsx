import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AllRooms from './pages/AllRooms';
import RoomDetails from './pages/RoomDetails';
import MyBookings from './pages/MyBookings';
import HotelReg from './components/HotelReg';
import Layout from './pages/hotelOwner/Layout';
import Dashboard from './pages/hotelOwner/Dashboard';
import AddRoom from './pages/hotelOwner/AddRoom';
import ListRoom from './pages/hotelOwner/ListRoom';
import { Toaster } from 'react-hot-toast';
import { useAppContext } from "./context/AppContext";


const App = () => {
  const location = useLocation();
  const { showHotelReg } = useAppContext();
  const isOwnerPath = location.pathname.startsWith('/Owner'); // Check if the path starts with '/Owner'

  return (
    <div>
      <Toaster />
      
      {/* Conditionally render Navbar and Footer based on the current path */}
      {!isOwnerPath && <Navbar />}  {/* Show Navbar only on non-owner paths */}
      
      {showHotelReg && <HotelReg />} {/* Show HotelReg if `showHotelReg` is true */}
      
      <div className='min-h-[70vh]'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path='/rooms/:id' element={<RoomDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />

          {/* Layout with nested routes for Owner */}
          <Route path='/Owner' element={<Layout />}>
            <Route index element={<Dashboard />} />  {/* Default route when visiting '/Owner' */}
            <Route path='add-room' element={<AddRoom />} />
            <Route path='list-room' element={<ListRoom />} />
          </Route>
        </Routes>
      </div>
      
      {/* Conditionally render Footer only on non-owner pages */}
      {!isOwnerPath && <Footer />}
    </div>
  );
};

export default App;
