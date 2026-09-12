"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Square, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface AttachmentItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

export type ActiveToolType = "web_search" | "create_image" | "deep_research" | null;

export interface ChatComposerProps {
  onSend?: (data: {
    text: string;
    attachments: AttachmentItem[];
    activeTool: ActiveToolType;
  }) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatComposer({
  onSend,
  onStop,
  isGenerating: externalGenerating,
  placeholder = "Ask anything",
  className = "",
}: ChatComposerProps) {
  // Input text & textarea ref
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [isDictating, setIsDictating] = useState(false);
  const [internalGenerating, setInternalGenerating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isGenerating = externalGenerating ?? internalGenerating;
  const recognitionRef = useRef<any>(null);

  // Auto-grow textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset immediately to base 32px height when empty to prevent Firefox mobile (Gecko)
    // from inflating scrollHeight or stretching to max-height inside flex containers
    if (!el.value) {
      el.style.height = "32px";
      el.style.overflowY = "hidden";
      return;
    }

    // Collapse to base height before measuring scrollHeight to prevent retaining inflated dimensions
    el.style.height = "32px";
    const scrollH = el.scrollHeight;
    const newHeight = Math.min(Math.max(scrollH, 32), 220);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = scrollH > 220 ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  // Speech Recognition (Dictation)
  const toggleDictation = () => {
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = () => {
          setIsDictating(false);
        };

        recognition.onend = () => {
          setIsDictating(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsDictating(true);
      } catch {
        simulateDictation();
      }
    } else {
      simulateDictation();
    }
  };

  const simulateDictation = () => {
    setIsDictating(true);
    setTimeout(() => {
      setText((prev) => (prev ? `${prev} Tell me more about the academy` : "Tell me more about the academy"));
      setIsDictating(false);
    }, 2500);
  };

  // Submission handler
  const handleSend = () => {
    if (isGenerating) {
      onStop?.();
      setInternalGenerating(false);
      return;
    }

    if (!text.trim()) return;

    onSend?.({
      text: text.trim(),
      attachments: [],
      activeTool: null,
    });

    setText("");

    if (externalGenerating === undefined) {
      setInternalGenerating(true);
      setTimeout(() => setInternalGenerating(false), 3000);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "32px";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = text.trim().length > 0;

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto rounded-[28px] bg-neutral-100 dark:bg-[#212121] border transition-all duration-200 ${
        isFocused
          ? "border-neutral-400 dark:border-neutral-500 shadow-xl shadow-neutral-300/30 dark:shadow-black/50"
          : "border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20 shadow-md shadow-neutral-200/40 dark:shadow-black/40"
      } ${className}`}
    >
      {/* Main Composer Row */}
      <div className="flex items-end gap-2 pl-4 pr-2.5 py-2 sm:pl-5 sm:pr-3 sm:py-2.5">
        {/* Center: Multiline Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          spellCheck
          autoCorrect="on"
          aria-label="Chat with ChatGPT"
          style={{ height: "32px", minHeight: "32px", maxHeight: "220px" }}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base font-normal border-none outline-none focus:outline-none focus:ring-0 resize-none min-w-0 py-1 leading-6 max-h-[220px] overflow-hidden no-scrollbar box-border"
        />

        {/* Right Controls: Microphone & Send/Stop Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Microphone Dictation Button */}
          <button
            type="button"
            onClick={toggleDictation}
            aria-label="Start dictation"
            title="Start dictation"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isDictating
                ? "bg-rose-500/20 text-rose-500 animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {isDictating ? (
              <MicOff className="w-4 h-4 text-rose-500" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Dynamic Send / Stop Button */}
          <AnimatePresence mode="wait" initial={false}>
            {isGenerating ? (
              /* Stop Generating State */
              <motion.button
                key="stop-action"
                type="button"
                onClick={handleSend}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Stop generating"
                title="Stop generating"
                className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </motion.button>
            ) : hasContent ? (
              /* Active Send Button */
              <motion.button
                key="send-active"
                type="button"
                onClick={handleSend}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Send message"
                title="Send message"
                className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0 hover:opacity-90 cursor-pointer"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            ) : (
              /* Disabled Send Button */
              <motion.button
                key="send-disabled"
                type="button"
                disabled
                aria-label="Send message (disabled)"
                className="w-8 h-8 rounded-full bg-muted text-muted-foreground/60 flex items-center justify-center cursor-not-allowed shrink-0"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default ChatComposer;
