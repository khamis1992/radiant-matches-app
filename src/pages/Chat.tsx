import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, ArrowRight, Image as ImageIcon, X, Loader2, Calendar, Clock, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversation } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import TypingIndicator from "@/components/TypingIndicator";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { formatBookingTime } from "@/lib/locale";
import { toast } from "sonner";

import artist1 from "@/assets/artist-1.jpg";

const Chat = () => {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { messages, isLoading: messagesLoading, sendMessage, markAsRead } = useMessages(conversationId);
  const { isOtherTyping, setTyping } = useTypingIndicator(conversationId);

  const dateLocale = language === "ar" ? ar : enUS;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when entering chat
  useEffect(() => {
    if (conversationId && user) {
      markAsRead.mutate();
    }
  }, [conversationId, user]);

  const handleSend = () => {
    if (!newMessage.trim() && !selectedImage) return;
    setTyping(false);
    sendMessage.mutate(
      { content: newMessage.trim(), imageFile: selectedImage || undefined },
      {
        onSuccess: () => {
          setNewMessage("");
          setSelectedImage(null);
          setImagePreview(null);
        },
        onError: () => {
          toast.error(t.errors.somethingWrong);
        }
      }
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === "ar" ? "حجم الصورة كبير جداً (الحد الأقصى 5MB)" : "Image too large (max 5MB)");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, "h:mm a", { locale: dateLocale });
    }
    if (isYesterday(date)) {
      return `${t.messages.yesterday} ${format(date, "h:mm a", { locale: dateLocale })}`;
    }
    return format(date, "MMM d, h:mm a", { locale: dateLocale });
  };

  // Determine the other party's info
  const isCustomer = user?.id === conversation?.customer_id;
  const otherParty = isCustomer
    ? {
        name: conversation?.artist_profile?.full_name || t.artist.anonymous,
        avatar: conversation?.artist_profile?.avatar_url || artist1,
      }
    : {
        name: conversation?.customer_profile?.full_name || t.artist.anonymous,
        avatar: conversation?.customer_profile?.avatar_url || artist1,
      };

  if (conversationLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </header>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t.messages.noMessages}</p>
          <Button onClick={() => navigate("/messages")}>{t.common.back}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/messages")}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            {isRTL ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </button>
          <img
            src={otherParty.avatar}
            alt={otherParty.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h1 className="font-semibold text-foreground">{otherParty.name}</h1>
          </div>
        </div>
      </header>

      {/* Booking Info Banner */}
      {conversation?.booking && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-primary">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(conversation.booking.booking_date), "MMM d, yyyy", { locale: dateLocale })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <Clock className="w-4 h-4" />
              <span>{formatBookingTime(conversation.booking.booking_time)}</span>
            </div>
          </div>
          {conversation.booking.service?.name && (
            <p className="text-xs text-muted-foreground mt-1">
              {conversation.booking.service.name}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messagesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-3/4" />
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((message) => {
            const isMine = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {message.image_url && (
                    <img 
                      src={message.image_url} 
                      alt="Shared image" 
                      className="rounded-lg max-w-full mb-2 cursor-pointer"
                      onClick={() => window.open(message.image_url!, '_blank')}
                    />
                  )}
                  {message.content && <p className="text-sm">{message.content}</p>}
                  <div
                    className={`flex items-center gap-1 text-[10px] mt-1 ${
                      isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    <span>{formatMessageTime(message.created_at)}</span>
                    {isMine && (
                      message.is_read ? (
                        <CheckCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>{t.messages.startConversation}</p>
          </div>
        )}
        {isOtherTyping && <TypingIndicator typingText={t.messages.typing} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block mb-3">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-20 rounded-lg object-cover"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMessage.isPending}
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={t.messages.typePlaceholder}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedImage) || sendMessage.isPending}
            size="icon"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
