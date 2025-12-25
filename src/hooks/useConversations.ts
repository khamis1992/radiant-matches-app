import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Conversation {
  id: string;
  customer_id: string;
  artist_id: string;
  booking_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  unread_count: number;
  artist_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  customer_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  booking?: {
    id: string;
    booking_date: string;
    booking_time: string;
    service?: {
      name: string;
    } | null;
  } | null;
}

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's artist ID if they are an artist
      const { data: artistData } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const artistId = artistData?.id;

      // Fetch conversations where user is either customer or artist
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`customer_id.eq.${user.id}${artistId ? `,artist_id.eq.${artistId}` : ""}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch related profile data for each conversation
      const conversationsWithProfiles: Conversation[] = await Promise.all(
        data.map(async (convo) => {
          // Get artist profile
          const { data: artistProfile } = await supabase
            .from("artists")
            .select("user_id")
            .eq("id", convo.artist_id)
            .single();

          let artistUserProfile = null;
          if (artistProfile) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", artistProfile.user_id)
              .single();
            artistUserProfile = profile;
          }

          // Get customer profile
          const { data: customerProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", convo.customer_id)
            .single();

          // Get unread count for this conversation
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .neq("sender_id", user.id)
            .eq("is_read", false);

          return {
            ...convo,
            unread_count: unreadCount || 0,
            artist_profile: artistUserProfile,
            customer_profile: customerProfile,
          };
        })
      );

      return conversationsWithProfiles;
    },
    enabled: !!user,
  });

  const getOrCreateConversation = useMutation({
    mutationFn: async (artistId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Check if conversation already exists (general conversation without booking)
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("artist_id", artistId)
        .is("booking_id", null)
        .maybeSingle();

      if (existing) return existing.id;

      // Create new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          customer_id: user.id,
          artist_id: artistId,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const getOrCreateBookingConversation = useMutation({
    mutationFn: async ({ artistId, bookingId }: { artistId: string; bookingId: string }) => {
      if (!user) throw new Error("Must be logged in");

      // Check if conversation already exists for this booking
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existing) return existing.id;

      // Create new conversation linked to booking
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          customer_id: user.id,
          artist_id: artistId,
          booking_id: bookingId,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    conversations,
    isLoading,
    getOrCreateConversation,
    getOrCreateBookingConversation,
  };
};

export const useConversation = (conversationId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data: convo, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error) throw error;

      // Get artist profile
      const { data: artistData } = await supabase
        .from("artists")
        .select("id, user_id")
        .eq("id", convo.artist_id)
        .single();

      let artistProfile = null;
      if (artistData) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", artistData.user_id)
          .single();
        artistProfile = profile;
      }

      // Get customer profile
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", convo.customer_id)
        .single();

      // Get booking info if linked
      let bookingInfo = null;
      if (convo.booking_id) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("id, booking_date, booking_time, service_id")
          .eq("id", convo.booking_id)
          .single();

        if (booking) {
          const { data: service } = await supabase
            .from("services")
            .select("name")
            .eq("id", booking.service_id)
            .single();

          bookingInfo = {
            ...booking,
            service: service,
          };
        }
      }

      return {
        ...convo,
        artist_user_id: artistData?.user_id,
        artist_profile: artistProfile,
        customer_profile: customerProfile,
        booking: bookingInfo,
      };
    },
    enabled: !!conversationId && !!user,
  });
};
