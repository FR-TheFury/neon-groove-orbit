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
        .single();

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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const user = session?.user ?? null;
        
        setAuthState(prev => ({
          ...prev,
          user,
          session,
          loading: false
        }));

        // Defer async operations to prevent deadlock
        if (user) {
          setTimeout(async () => {
            try {
              // Try to assign admin role if this is the admin email
              if (user.email === 'frthefury@gmail.com') {
                await assignAdminRole();
              }
              
              // Fetch user role
              const role = await fetchUserRole(user.id);
              
              setAuthState(prev => ({
                ...prev,
                role
              }));
            } catch (error) {
              console.error('Error handling auth state change:', error);
            }
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            role: null,
            loading: false
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      
      if (user) {
        // Try to assign admin role if this is the admin email
        if (user.email === 'frthefury@gmail.com') {
          await assignAdminRole();
        }
        
        // Fetch user role
        const role = await fetchUserRole(user.id);
        
        setAuthState({
          user,
          session,
          role,
          loading: false
        });
      } else {
        setAuthState({
          user: null,
          session: null,
          role: null,
          loading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return authState;
}