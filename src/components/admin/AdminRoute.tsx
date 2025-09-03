import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, role, loading } = useAuth();

  // Show loading only during initial load
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

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to home if not admin
  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}