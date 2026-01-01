import  { useEffect } from 'react';
import Navbar from '../../components/hotelOwner/Navbar';
import Sidebar from '../../components/hotelOwner/Sidebar';
import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from "../../context/AppContext";
import { useUser } from "@clerk/clerk-react";


const Layout = () => {
  const {isOwner, isUserDataLoading} = useAppContext();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(()=>{
    // Wait for Clerk authentication to load before checking
    if (!isLoaded) {
      return; // Still loading, don't do anything yet
    }
    
    // If user is not authenticated, redirect to home
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    
    // Wait for user data to be fetched before checking owner status
    if (isUserDataLoading) {
      return; // Still loading user data, wait
    }
    
    // Once user data is loaded, check if user is an owner
    // Redirect non-owners away from dashboard
    if (!isOwner) {
      navigate('/', { replace: true });
    }
  }, [isOwner, navigate, user, isLoaded, isUserDataLoading])

  // Show loading state while checking authentication
  if (!isLoaded || isUserDataLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen'>
      <Navbar />
      <div className='flex h-full'>
        <Sidebar/>
        <div className='flex-1 p-4 pt-10 md:px-10 h-full'>
          <Outlet/>
        </div>
      </div>
    </div>
  );
};

export default Layout;
