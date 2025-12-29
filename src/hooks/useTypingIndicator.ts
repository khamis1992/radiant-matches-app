import { useState, useCallback } from "react";

/**
 * Hook for typing indicators
 * Note: This feature requires typing_indicators table to be created
 */
export const useTypingIndicator = (_conversationId: string | undefined) => {
  const [typingUsers] = useState<Set<string>>(new Set());

  const startTyping = useCallback(() => {
    console.log("Typing indicators not configured - table not available");
  }, []);

  const stopTyping = useCallback(() => {
    console.log("Typing indicators not configured - table not available");
  }, []);

  return {
    typingUsers: Array.from(typingUsers),
    isTyping: typingUsers.size > 0,
    startTyping,
    stopTyping,
  };
};
