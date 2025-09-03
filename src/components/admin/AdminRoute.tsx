import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, role, loading } = useAuth();

  // Debug logs
  console.log('AdminRoute - user:', user?.email, 'role:', role, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('AdminRoute - No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  if (role !== 'admin') {
    console.log('AdminRoute - User role is not admin:', role, 'redirecting to /');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}