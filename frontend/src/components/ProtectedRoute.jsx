import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath, hasRole } from '../utils/roleUtils';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(user, allowedRoles)) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
