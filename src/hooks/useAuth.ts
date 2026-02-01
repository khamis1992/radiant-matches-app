import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Try global signout first
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.log('Global signout failed, trying local signout:', error);
      try {
        // If global fails (e.g., session not found), do local signout
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError) {
        console.log('Local signout also failed:', localError);
      }
    }
    
    // Always clear local state regardless of server response
    setUser(null);
    
    // Clear any cached session data
    localStorage.removeItem('supabase.auth.token');
  };

  return { user, loading, signOut };
};
