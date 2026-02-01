import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Logout = () => {
  useEffect(() => {
    const handleLogout = async () => {
      // Use local scope to ensure cleanup works
      await supabase.auth.signOut({ scope: 'local' });
      
      // Clear all supabase auth tokens from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage
      sessionStorage.clear();
      
      // Force full page reload to /auth to clear all React state
      window.location.replace("/auth");
    };

    handleLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default Logout;
