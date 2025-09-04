import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, role, loading } = useAuth();

  console.log('AdminRoute - user:', user?.email, 'role:', role, 'loading:', loading);

  // Show loading during initial load AND when role is being fetched
  if (loading || (user && role === null)) {
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
    console.log('AdminRoute - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Redirect to home if not admin
  if (role !== 'admin') {
    console.log('AdminRoute - Role is not admin:', role, 'redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute - Access granted, rendering admin dashboard');
  return <>{children}</>;
}