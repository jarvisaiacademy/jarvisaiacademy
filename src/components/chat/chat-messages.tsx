"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { motion } from "motion/react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 py-6 px-4 sm:px-6">
      {messages.map((msg, idx) => {
        const isUser = msg.role === "user";
        return (
          <motion.div
            key={msg.id || idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`group relative flex flex-col ${
              isUser ? "items-end" : "items-start"
            }`}
          >
            {isUser ? (
              /* User Message Bubble */
              <div className="flex items-center gap-2 max-w-[85%] sm:max-w-[75%]">
                <button
                  type="button"
                  onClick={() => handleCopy(msg.id, msg.content)}
                  aria-label="Copy message"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <div className="bg-[#212121] text-neutral-100 px-4 py-2.5 rounded-3xl text-sm leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* Assistant Response */
              <div className="flex flex-col gap-3 max-w-full text-neutral-200 text-sm sm:text-base leading-relaxed">
                <div className="whitespace-pre-line space-y-3.5">
                  {msg.content.split("\n\n").map((para, pIdx) => (
                    <p key={pIdx} className="leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Assistant Action Bar */}
                <div className="flex items-center gap-1 mt-1 text-neutral-400">
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    aria-label="Copy response"
                    className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                    title="Copy"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Share response"
                    className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
