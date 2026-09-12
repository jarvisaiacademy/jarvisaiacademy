"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessages, ChatMessage } from "./chat-messages";
import { PromptCapsule } from "./prompt-capsule";

const sampleConversation: ChatMessage[] = [
  {
    id: "sample-user-1",
    role: "user",
    content: "hii am new here my age is 90yo",
  },
  {
    id: "sample-ai-1",
    role: "assistant",
    content:
      "Hi! 😊 It’s lovely to meet you. Welcome!\n\nWhether you’re 90 or simply having a little fun with me, you’re very welcome here. I can help with things like answering questions, explaining technology, writing messages, telling stories, learning new things, or just having a conversation.\n\nWhat would you like to do today? 🌷",
  },
];

interface ChatCanvasProps {
  onAttach?: () => void;
  onVoiceStart?: () => void;
}

export function ChatCanvas({ onAttach, onVoiceStart }: ChatCanvasProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(sampleConversation);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePromptSubmit = (prompt: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulated contextual AI reply
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: `I'd love to help you with "${prompt}"! Let's explore that together. Is there any specific area you'd like to dive into first?`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-[calc(100vh-3.5rem)] overflow-hidden relative">
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <ChatMessages messages={messages} />
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Sticky Bottom Prompt Capsule */}
      <div className="w-full px-4 pb-4 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent shrink-0">
        <PromptCapsule
          onSubmit={handlePromptSubmit}
          onAttach={onAttach}
          onVoiceStart={onVoiceStart}
          placeholder="Ask ChatGPT"
          showThink={false}
        />
      </div>
    </div>
  );
}
