import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../../components/dashboard/Navbar';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../../context/AppContext';

const Layout = () => {
  const { user, userLoaded, isSuperAdmin } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoaded) return;
    if (!user || !isSuperAdmin) navigate('/');
  }, [user, isSuperAdmin, userLoaded, navigate]);

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#A67C52]/30 border-t-[#A67C52] animate-spin" />
          <span className="text-sm text-slate-400 dark:text-[#A9AEA7] font-space">Loading admin console...</span>
        </div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) return null;

  return (
    <div className="h-screen bg-[#F7F5F0] dark:bg-[#111412] overflow-hidden flex">
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
