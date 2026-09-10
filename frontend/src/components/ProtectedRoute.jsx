import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const roleMatchesAccess = ({ role, isSuperAdmin, isHotelManager, isReceptionist }) => {
  if (role === "super_admin") return isSuperAdmin;
  if (role === "hotel_manager") return isHotelManager;
  if (role === "receptionist") return isReceptionist;
  return false;
};

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, userLoaded, isSuperAdmin, isHotelManager, isReceptionist } = useAppContext();

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#183B35]/30 border-t-[#183B35] animate-spin" />
          <span className="text-sm text-slate-400 dark:text-[#A9AEA7] font-space">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const canAccess = allowedRoles.length === 0 || allowedRoles.some((role) =>
    roleMatchesAccess({ role, isSuperAdmin, isHotelManager, isReceptionist }) || user.role === role
  );

  if (!canAccess) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;