import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ReceptionistNavbar from '../components/Navbar';

const Layout = () => {
  const { isReceptionist, user, userLoaded, receptionistResolved } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoaded || !receptionistResolved) return;
    if (!user || !isReceptionist) navigate('/');
  }, [isReceptionist, user, navigate, userLoaded, receptionistResolved]);

  if (!userLoaded || !receptionistResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB] animate-spin" />
          <span className="text-sm text-slate-400 font-space">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || !isReceptionist) return null;

  return (
    <div className="min-h-screen bg-[#fbfaf8]">
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
