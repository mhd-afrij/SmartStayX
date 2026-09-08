// ManagerLayout — Dashboard layout wrapper with sidebar, navbar, and nested route outlet
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const Layout = () => {
  // Super admins may view any dashboard (route definitions allow it), so the
  // layout must not bounce them out — only block plain guests.
  const { isHotelManager, isSuperAdmin, user, userLoaded, roleResolved } = useAppContext();
  const navigate = useNavigate();
  const canAccess = isHotelManager || isSuperAdmin;

  useEffect(() => {
    if (!userLoaded || !roleResolved) return;
    if (!user || !canAccess) navigate('/');
  }, [canAccess, user, navigate, userLoaded, roleResolved]);

  if (!userLoaded || !roleResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#A67C52]/30 border-t-[#A67C52] animate-spin" />
          <span className="text-sm text-slate-400 dark:text-[#A9AEA7] font-space">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || !canAccess) return null;

  return (
    <div className="owner-shell h-screen bg-[#F7F5F0] dark:bg-[#111412] overflow-hidden flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
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
