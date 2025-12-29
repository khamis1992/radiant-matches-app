import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface TypingIndicatorProps {
  typingUsers?: string[];
  userNames?: Map<string, string>;
  typingText?: string;
}

export const TypingIndicator = ({ typingUsers = [], userNames = new Map(), typingText }: TypingIndicatorProps) => {
  const { t, isRTL } = useLanguage();

  // If typingText is provided directly, use it
  if (typingText) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-4 bg-accent/50 rounded-lg animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{typingText}</span>
      </div>
    );
  }

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 0) return "";
    if (typingUsers.length === 1) {
      const userName = userNames.get(typingUsers[0]) || t.messages.someoneTyping;
      return isRTL ? `${userName} ${t.messages.typingNow}` : `${t.messages.someoneTyping} ${userName}`;
    }
    if (typingUsers.length <= 3) {
      return isRTL ? t.messages.multipleTyping : t.messages.typing;
    }
    return isRTL ? t.messages.multipleTyping : t.messages.typing;
  };

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-4 bg-accent/50 rounded-lg animate-pulse">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{getTypingText()}</span>
    </div>
  );
};

export default TypingIndicator;