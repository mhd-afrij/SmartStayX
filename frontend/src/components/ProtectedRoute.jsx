import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, userLoaded } = useAppContext();

  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaf8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB] animate-spin" />
          <span className="text-sm text-slate-400 font-space">Loading...</span>
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
