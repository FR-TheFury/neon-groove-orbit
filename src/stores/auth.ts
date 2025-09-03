import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) => {
    set({ 
      session, 
      user: session?.user ?? null,
      loading: false 
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },

  initialize: () => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        get().setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      get().setSession(session);
    });

    return () => subscription.unsubscribe();
  },
}));