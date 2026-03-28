import { useEffect } from 'react';
import Navbar from '../../components/hotelOwner/Navbar';
import Sidebar from '../../components/hotelOwner/Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';


const Layout = () => {
  const { isOwner, user, userLoaded, ownerResolved } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoaded || !ownerResolved) {
      return;
    }

    if (!user || !isOwner) {
      navigate('/');
    }
  }, [isOwner, user, navigate, userLoaded, ownerResolved]);

  if (!userLoaded || !ownerResolved) {
    return <div className='min-h-screen flex items-center justify-center text-slate-500'>Loading dashboard...</div>;
  }

  if (!user || !isOwner) {
    return null;
  }

  return (
    <div className='flex flex-col h-screen'>
      <Navbar />
      <div className='flex h-full'>
        <Sidebar />
        <div className='flex-1 p-4 pt-10 md:px-10 h-full'>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
