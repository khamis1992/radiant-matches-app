import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useTypingIndicator = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const typingUsers = useState<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Set self as typing
  const startTyping = () => {
    if (!user || !conversationId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set as typing
    supabase
      .from("typing_indicators")
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        is_typing: true,
        updated_at: new Date().toISOString(),
      });

    // Clear typing status after 3 seconds of inactivity
    timeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!user || !conversationId) return;

    supabase
      .from("typing_indicators")
      .upsert({
        conversation_id: conversationId,
        user_id: user.id,
        is_typing: false,
        updated_at: new Date().toISOString(),
      });
  };

  // Listen for typing indicators
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const indicator = payload.new;
          
          // Ignore self
          if (indicator.user_id === user.id) return;

          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            if (indicator.is_typing) {
              setTypingUsers(prev => new Set(prev).add(indicator.user_id));
            } else {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(indicator.user_id);
                return newSet;
              });
            }
          } else if (payload.eventType === "DELETE") {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(indicator.user_id);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [conversationId, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, []);

  return {
    typingUsers,
    isTyping: typingUsers.size > 0,
    startTyping,
    stopTyping,
  };
};
