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
      console.log('Fetching user role for:', userId);
      
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

      console.log('User role data:', data);
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
              console.log('Processing auth state change for user:', user.email);
              
              // Initialize user if needed
              await supabase.rpc('initialize_user_if_needed');
              
              // Try to assign admin role if this is the admin email
              if (user.email === 'frthefury@gmail.com') {
                console.log('Assigning admin role to:', user.email);
                await assignAdminRole();
              }
              
              // Fetch user role
              const role = await fetchUserRole(user.id);
              console.log('Final role for user:', role);
              
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
      console.log('Initial session check - user:', user?.email);
      
      if (user) {
        try {
          // Initialize user if needed
          await supabase.rpc('initialize_user_if_needed');
          
          // Try to assign admin role if this is the admin email
          if (user.email === 'frthefury@gmail.com') {
            console.log('Initial check - assigning admin role to:', user.email);
            await assignAdminRole();
          }
          
          // Fetch user role
          const role = await fetchUserRole(user.id);
          console.log('Initial check - final role for user:', role);
          
          setAuthState({
            user,
            session,
            role,
            loading: false
          });
        } catch (error) {
          console.error('Error in initial session check:', error);
          setAuthState({
            user,
            session,
            role: null,
            loading: false
          });
        }
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