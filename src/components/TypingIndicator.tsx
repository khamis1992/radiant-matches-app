interface TypingIndicatorProps {
  typingText: string;
}

const TypingIndicator = ({ typingText }: TypingIndicatorProps) => {
  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-xs text-muted-foreground">{typingText}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
