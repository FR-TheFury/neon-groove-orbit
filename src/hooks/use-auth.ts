import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user' | 'pending';

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true
  });

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as UserRole || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  const assignAdminRole = async () => {
    try {
      const { error } = await supabase.rpc('assign_admin_role');
      if (error) {
        console.error('Error assigning admin role:', error);
      }
    } catch (error) {
      console.error('Error calling assign_admin_role:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    const handleAuthStateChange = async (event: string, session: any) => {
      const user = session?.user ?? null;
      
      // Set a timeout to prevent infinite loading
      if (loadingTimeout) clearTimeout(loadingTimeout);
      loadingTimeout = setTimeout(() => {
        if (mounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }, 10000); // 10 second timeout
      
      if (user && mounted) {
        try {
          // Initialize user if needed
          await supabase.rpc('initialize_user_if_needed');
          
          // Try to assign admin role if this is the admin email
          if (user.email === 'frthefury@gmail.com') {
            await assignAdminRole();
          }
          
          // Fetch user role with timeout
          const rolePromise = fetchUserRole(user.id);
          const timeoutPromise = new Promise<UserRole | null>((resolve) => {
            setTimeout(() => resolve(null), 5000); // 5 second timeout for role fetch
          });
          
          const role = await Promise.race([rolePromise, timeoutPromise]);
          
          if (mounted) {
            clearTimeout(loadingTimeout);
            setAuthState({
              user,
              session,
              role,
              loading: false
            });
          }
        } catch (error) {
          console.error('Error processing auth state change:', error);
          if (mounted) {
            clearTimeout(loadingTimeout);
            setAuthState({
              user,
              session,
              role: null,
              loading: false
            });
          }
        }
      } else if (mounted) {
        clearTimeout(loadingTimeout);
        setAuthState({
          user: null,
          session: null,
          role: null,
          loading: false
        });
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (mounted) {
        await handleAuthStateChange('INITIAL_SESSION', session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}