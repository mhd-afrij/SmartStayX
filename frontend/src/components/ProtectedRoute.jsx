import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, userLoaded } = useAppContext();

  if (!userLoaded) return null;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
