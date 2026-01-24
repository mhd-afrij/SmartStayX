import { useEffect } from 'react';
import Navbar from '../../components/hotelOwner/Navbar';
import Sidebar from '../../components/hotelOwner/Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';


const Layout = () => {
  const { isOwner, user } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isOwner) {
      navigate('/');
    }
  }, [isOwner, user, navigate]);

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
