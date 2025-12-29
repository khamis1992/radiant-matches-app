import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Hook for marking messages as read
 * Uses the is_read field on messages table
 */
export const useMarkAsRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) {
        throw new Error("Not logged in");
      }

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markConversationAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) {
        throw new Error("Not logged in");
      }

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    markAsRead: markAsRead.mutate,
    markConversationAsRead: markConversationAsRead.mutate,
    isMarking: markAsRead.isPending || markConversationAsRead.isPending,
  };
};
