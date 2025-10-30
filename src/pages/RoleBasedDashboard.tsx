import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const RoleBasedDashboard = () => {
  const { user, isLoading } = useAuth();

  console.log('RoleBasedDashboard - user:', user, 'isLoading:', isLoading);

  // If still loading, show loading state instead of redirecting
  if (isLoading) {
    return <div className="text-center p-10">Carregando...</div>;
  }

  // If no user after loading completes, redirect to login
  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  console.log('User role:', user.role);

  switch (user.role) {
    case 'admin':
      console.log('Redirecting to admin dashboard');
      return <Navigate to="/dashboard/admin" replace />; // Use replace to avoid back button issues
    case 'diretoria':
      return <Navigate to="/dashboard/diretor" replace />;
    case 'solicitante':
      return <Navigate to="/dashboard/solicitante" replace />;
    case 'portaria':
      return <Navigate to="/dashboard/portaria" replace />;
    default:
      console.log('Unknown role, defaulting to admin');
      return <Navigate to="/dashboard/admin" replace />; // Default to admin if role is unknown
  }
};

export default RoleBasedDashboard;