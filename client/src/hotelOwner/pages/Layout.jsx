// OwnerLayout — Dashboard layout wrapper with sidebar, navbar, and nested route outlet
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const Layout = () => {
  const { isOwner, user, userLoaded, ownerResolved } = useAppContext();
  const navigate = useNavigate();

  // Redirect non-owner users away from the owner area.
  useEffect(() => {
    if (!userLoaded || !ownerResolved) return;
    if (!user || !isOwner) navigate('/');
  }, [isOwner, user, navigate, userLoaded, ownerResolved]);

  if (!userLoaded || !ownerResolved) {
    return (
      /* Owner layout loading state */
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin" />
          <span className="text-sm text-white/40 font-space">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user || !isOwner) return null;

  return (
    /* Owner shell */
    <div className="h-screen bg-[#050816] overflow-hidden flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Owner top bar and routed content */}
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
