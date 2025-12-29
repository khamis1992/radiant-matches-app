import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useMarkAsRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user) {
        toast.error("Please login first");
        throw new Error("Not logged in");
      }

      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark as read");
    },
  });

  const markConversationAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) {
        toast.error("Please login first");
        throw new Error("Not logged in");
      }

      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .is("read_at", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark conversation as read");
    },
  });

  return {
    markAsRead: markAsRead.mutate,
    markConversationAsRead: markConversationAsRead.mutate,
    isMarking: markAsRead.isPending || markConversationAsRead.isPending,
  };
};

