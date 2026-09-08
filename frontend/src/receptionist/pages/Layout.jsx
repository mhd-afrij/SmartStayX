import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ReceptionistNavbar from '../components/Navbar';

const Layout = () => {
  // Super admins and hotel managers may view the receptionist dashboard
  // (route definitions allow it), so the layout must not bounce them out.
  const { isReceptionist, isHotelManager, isSuperAdmin, user, userLoaded, roleResolved } = useAppContext();
  const navigate = useNavigate();
  const canAccess = isReceptionist || isHotelManager || isSuperAdmin;

  useEffect(() => {
    if (!userLoaded || !roleResolved) return;
    if (!user || !canAccess) navigate('/');
  }, [canAccess, user, navigate, userLoaded, roleResolved]);

  if (!userLoaded || !roleResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" />
          <span className="text-sm text-slate-400 dark:text-[#A9AEA7] font-space">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || !canAccess) return null;

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#111412]">
      <div className="flex flex-col">
        <ReceptionistNavbar />
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
