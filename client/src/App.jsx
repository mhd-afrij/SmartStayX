import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Footer from './components/Footer'
import AllRooms from './pages/AllRooms'
import RoomDetails from './pages/RoomDetails'
import MyBookings from './pages/MyBookings'
import HotelReg from './components/HotelReg'
import Layout from './pages/hotelOnwer/layout'
import Dashboard from './pages/hotelOnwer/Dashboard'
import AddRoom from './pages/hotelOnwer/AddRoom'
import ListRoom from './pages/hotelOnwer/ListRoom'

const App = () => {
  const location = useLocation();
  const isOwnerPath = location.pathname.includes('owner'); // Check if the path includes 'owner'
  
  return (
    <div>
      {!isOwnerPath && <Navbar />} {/* Show Navbar only on non-owner paths */}
      {false && <HotelReg />} {/* This seems like a conditional rendering that’s always false */}
      <div className='min-h-[70vh]'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<AllRooms />} />
          <Route path='/rooms/:id' element={<RoomDetails />} />
          <Route path="/my-bookings" element={<MyBookings />} />

          <Route path='/owner' element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path='add-room' element={<AddRoom />} />
            <Route path='list-room' element={<ListRoom />} />
          </Route>
        </Routes>
      </div>
      {!isOwnerPath && <Footer />} {/* Conditionally render Footer only on non-owner pages */}
    </div>
  )
}

export default App
