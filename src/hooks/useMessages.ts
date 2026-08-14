import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useRef } from "react";
import { playNotificationSound } from "@/lib/notificationSound";
import { secureSignedUrl, secureUpload } from "@/lib/secureStorage";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

// Cap initial load to the most recent messages so long conversations
// don't fetch unbounded history on open.
const MESSAGES_INITIAL_LIMIT = 100;

const hydrateMessageImage = async (message: Message): Promise<Message> => {
  if (!message.image_url || message.image_url.startsWith("http")) return message;
  try {
    return { ...message, image_url: await secureSignedUrl("chat-attachments", message.image_url) };
  } catch {
    return { ...message, image_url: null };
  }
};

export const useMessages = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isInitialLoad = useRef(true);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(MESSAGES_INITIAL_LIMIT);

      if (error) throw error;
      // Return in chronological order and resolve private attachment paths to short-lived URLs.
      return Promise.all((data as Message[]).reverse().map(hydrateMessageImage));
    },
    enabled: !!conversationId && !!user,
  });

  // Reset initial load flag when conversation changes
  useEffect(() => {
    isInitialLoad.current = true;
  }, [conversationId]);

  // Mark as loaded after first data fetch
  useEffect(() => {
    if (messages && isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = await hydrateMessageImage(payload.new as Message);
          
          // Play sound only for messages from others (not sent by current user)
          // and not during initial load
          if (newMessage.sender_id !== user.id && !isInitialLoad.current) {
            playNotificationSound();
          }

          queryClient.setQueryData(
            ["messages", conversationId],
            (old: Message[] | undefined) => {
              if (!old) return [newMessage];
              // Avoid duplicates
              if (old.some((m) => m.id === newMessage.id)) {
                return old;
              }
              return [...old, newMessage];
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          
          queryClient.setQueryData(
            ["messages", conversationId],
            (old: Message[] | undefined) => {
              if (!old) return [updatedMessage];
              return old.map((m) => 
                m.id === updatedMessage.id ? updatedMessage : m
              );
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, imageFile }: { content: string; imageFile?: File }) => {
      if (!user || !conversationId) throw new Error("Missing data");

      let imageUrl: string | null = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const uploadResult = await secureUpload({
          bucket: "chat-attachments",
          path: fileName,
          file: imageFile,
        });
        imageUrl = uploadResult.path ?? fileName;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content || (imageUrl ? '' : ''),
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (newRow) => {
      // Immediately reflect the sent message in UI (realtime may not be enabled).
      const msg = await hydrateMessageImage(newRow as Message);
      if (conversationId) {
        queryClient.setQueryData(["messages", conversationId], (old: Message[] | undefined) => {
          const next = old ? [...old] : [];
          if (!next.some((message) => message.id === msg.id)) next.push(msg);
          return next;
        });
      }

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user || !conversationId) return;

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
  });

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
  };
};
