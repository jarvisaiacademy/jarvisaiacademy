"use client";

import { useState, useRef } from "react";
import { Plus, ArrowUp, Brain, Mic, AudioLines, Link2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PromptCapsuleProps {
  onSubmit?: (prompt: string, thinkMode: boolean) => void;
  onVoiceStart?: () => void;
  onAttach?: () => void;
  placeholder?: string;
  showThink?: boolean;
}

export function PromptCapsule({
  onSubmit,
  onVoiceStart,
  onAttach,
  placeholder = "Ask anything",
  showThink = true,
}: PromptCapsuleProps) {
  const [value, setValue] = useState("");
  const [thinkMode, setThinkMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!value.trim()) return;
    onSubmit?.(value.trim(), thinkMode);
    setValue("");
    setSelectedText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    if (start !== end) {
      setSelectedText(target.value.substring(start, end));
    } else {
      setSelectedText("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className={`relative w-full max-w-2xl mx-auto rounded-full bg-[#212121] border transition-all duration-200 ${
        isFocused
          ? "border-neutral-500 shadow-xl shadow-black/50"
          : "border-white/10 hover:border-white/20 shadow-lg shadow-black/30"
      }`}
    >
      {/* Floating Selection Formatting Bar */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 left-6 flex items-center gap-1.5 px-2.5 py-1 bg-[#262626] border border-white/15 rounded-xl shadow-2xl z-30 select-none text-neutral-200"
          >
            <button
              type="button"
              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="px-1.5 py-0.5 rounded hover:bg-white/10 font-bold text-xs hover:text-white transition-colors"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              className="px-1.5 py-0.5 rounded hover:bg-white/10 italic text-xs hover:text-white transition-colors font-serif"
              title="Italic"
            >
              I
            </button>
            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
            <button
              type="button"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-xs text-neutral-300 hover:text-white transition-colors"
            >
              <span>Text</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        {/* Plus / Attach Button */}
        <button
          type="button"
          onClick={onAttach}
          aria-label="Add attachment or action"
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Text Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setSelectedText("");
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder:text-neutral-500 text-sm sm:text-base font-normal border-none outline-none focus:outline-none focus:ring-0 min-w-0"
        />

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Think Toggle Button */}
          {showThink && (
            <button
              type="button"
              onClick={() => setThinkMode((prev) => !prev)}
              aria-pressed={thinkMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                thinkMode
                  ? "bg-white/15 text-white border border-white/20 shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Brain
                className={`w-4 h-4 ${
                  thinkMode ? "text-cyan-400" : "text-neutral-400"
                }`}
              />
              <span>Think</span>
            </button>
          )}

          {/* Microphone Button */}
          <button
            type="button"
            onClick={onVoiceStart}
            aria-label="Voice dictation"
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Dynamic Voice / Send Action Button */}
          <AnimatePresence mode="wait" initial={false}>
            {value.trim() ? (
              <motion.button
                key="send-action"
                type="button"
                onClick={handleSend}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Send message"
                className="w-8 h-8 rounded-full bg-[#ea580c] hover:bg-[#f97316] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            ) : showThink ? (
              <motion.button
                key="voice-action"
                type="button"
                onClick={onVoiceStart}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Interactive voice mode"
                className="w-8 h-8 rounded-full bg-[#ea580c] hover:bg-[#f97316] text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
              >
                <AudioLines className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                key="guest-empty-send"
                type="button"
                disabled
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Send message disabled"
                className="w-8 h-8 rounded-full bg-[#2f2f2f] text-neutral-500 flex items-center justify-center cursor-not-allowed shrink-0"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>


      </div>
    </motion.div>
  );
}
