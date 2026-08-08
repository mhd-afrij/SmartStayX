import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../../components/dashboard/Navbar';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../../context/AppContext';

const Layout = () => {
  const { user, userLoaded } = useAppContext();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!userLoaded) return;
    if (!user || !isAdmin) navigate('/');
  }, [user, isAdmin, userLoaded, navigate]);

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB] animate-spin" />
          <span className="text-sm text-slate-400 font-space">Loading admin console...</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="h-screen bg-[#F8FAFC] overflow-hidden flex">
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
