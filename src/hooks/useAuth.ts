import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache so remounts (e.g. per-page BottomNavigation) don't
// re-enter a loading state while the same session is still valid.
let cachedUser: User | null = null;
let authInitialized = false;
const ipCapturedFor = new Set<string>();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!authInitialized);

  useEffect(() => {
    let mounted = true;

    const captureIp = (userId: string) => {
      if (ipCapturedFor.has(userId)) return;
      ipCapturedFor.add(userId);
      supabase.functions.invoke("check-blocked-ip", {
        body: { userId },
      }).catch(() => {});
    };

    const applySession = (session: { user: User } | null) => {
      if (!mounted) return;
      cachedUser = session?.user ?? null;
      authInitialized = true;
      setUser(cachedUser);
      setLoading(false);
      if (session?.user) captureIp(session.user.id);
    };

    // Listen for auth changes - set up FIRST so we don't miss events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        // Defer state update to avoid React queue error
        setTimeout(() => {
          applySession(session);
        }, 0);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Clear local state first
    cachedUser = null;
    authInitialized = true;
    setUser(null);
    
    // Use local scope to ensure client-side cleanup works even if server session is gone
    await supabase.auth.signOut({ scope: 'local' });
    
    // Clear all supabase auth tokens from localStorage
    // Supabase uses key pattern: sb-<project-ref>-auth-token
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clear session storage
    sessionStorage.clear();
  };

  return { user, loading, signOut };
};
