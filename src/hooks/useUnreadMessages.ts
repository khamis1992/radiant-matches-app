import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export const useUnreadMessagesCount = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["unreadMessagesCount", user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get user's artist ID if they are an artist
      const { data: artistData } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const artistId = artistData?.id;

      // Get all conversations where user is either customer or artist
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .or(`customer_id.eq.${user.id}${artistId ? `,artist_id.eq.${artistId}` : ""}`);

      if (convError || !conversations?.length) return 0;

      const conversationIds = conversations.map((c) => c.id);

      // Count unread messages in these conversations (not sent by current user)
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to realtime updates for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("unread-messages-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch count when any message changes
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, query]);

  return query;
};
