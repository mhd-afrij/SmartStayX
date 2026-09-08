import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, userLoaded } = useAppContext();

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffaf4] dark:bg-[#0B1D24]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#5077B3]/30 border-t-[#5077B3] animate-spin" />
          <span className="text-sm text-slate-400 dark:text-[#6B828A] font-space">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
