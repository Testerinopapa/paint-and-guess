import { useState, useRef, useEffect } from "react";
import { BottomSheet, BottomSheetHeader, BottomSheetContent } from "../BottomSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "../../state/types";

interface MobileChatSheetProps {
  chatMessages: ChatMessage[];
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  onSubmit: (message: string) => void;
}

export function MobileChatSheet({
  chatMessages,
  expanded,
  onToggle,
  onSubmit,
}: MobileChatSheetProps) {
  const [chatInput, setChatInput] = useState("");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, expanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    onSubmit(message);
    setChatInput("");
  };

  return (
    <BottomSheet
      defaultHeight={56}
      maxHeight={200}
      minHeight={56}
      onToggle={onToggle}
    >
      <BottomSheetHeader expanded={expanded} onToggle={() => onToggle(!expanded)}>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold">CHAT</span>
          {chatMessages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {chatMessages.length}
            </Badge>
          )}
        </div>
      </BottomSheetHeader>
      <BottomSheetContent className="flex flex-col px-4 pb-2">
        <div className="flex-1 overflow-y-auto space-y-1 mb-2 pr-2">
          {chatMessages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No messages yet
            </p>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">{msg.player.name}:</span> {msg.message}
              </div>
            ))
          )}
          <div ref={chatMessagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 flex-shrink-0">
          <Input
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 h-10"
          />
          <Button type="submit" disabled={!chatInput.trim()} className="h-10 px-4">
            Send
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

