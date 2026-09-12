"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, ArrowUp, Brain, Mic, AudioLines, Square, Link2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PromptCapsuleProps {
  onSubmit?: (prompt: string, thinkMode: boolean) => void;
  onVoiceStart?: () => void;
  onAttach?: () => void;
  onStop?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  showThink?: boolean;
}

export function PromptCapsule({
  onSubmit,
  onVoiceStart,
  onAttach,
  onStop,
  isGenerating = false,
  placeholder = "Ask ChatGPT",
  showThink = false,
}: PromptCapsuleProps) {
  const [value, setValue] = useState("");
  const [thinkMode, setThinkMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as text expands
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 200); // max 200px
    el.style.height = `${Math.max(newHeight, 24)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = () => {
    if (isGenerating) {
      onStop?.();
      return;
    }
    if (!value.trim()) return;
    onSubmit?.(value.trim(), thinkMode);
    setValue("");
    setSelectedText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative w-full max-w-3xl mx-auto rounded-[26px] bg-[#212121] border transition-all duration-200 ${
        isFocused
          ? "border-neutral-500 shadow-xl shadow-black/60"
          : "border-white/10 hover:border-white/20 shadow-lg shadow-black/40"
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

      <div className="flex items-end gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Plus / Attach Button */}
        <button
          type="button"
          onClick={onAttach}
          aria-label="Add attachment or action"
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 mb-0.5"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Auto-growing Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setSelectedText("");
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder:text-neutral-500 text-sm sm:text-base font-normal border-none outline-none focus:outline-none focus:ring-0 resize-none min-w-0 py-0.5 leading-6 max-h-[200px] overflow-y-auto no-scrollbar"
        />

        {/* Right Action Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 mb-0.5">
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

          {/* Microphone Button (only if not generating and empty) */}
          {!isGenerating && !value.trim() && (
            <button
              type="button"
              onClick={onVoiceStart}
              aria-label="Voice dictation"
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          {/* Dynamic Send / Stop Button */}
          <AnimatePresence mode="wait" initial={false}>
            {isGenerating ? (
              /* Stop Streaming Button */
              <motion.button
                key="stop-streaming"
                type="button"
                onClick={handleSend}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Stop generation"
                className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-black" />
              </motion.button>
            ) : value.trim() ? (
              /* Active Send Button */
              <motion.button
                key="send-action"
                type="button"
                onClick={handleSend}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Send message"
                className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            ) : showThink ? (
              /* Voice Mode Button */
              <motion.button
                key="voice-action"
                type="button"
                onClick={onVoiceStart}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
                aria-label="Interactive voice mode"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
              >
                <AudioLines className="w-4 h-4" />
              </motion.button>
            ) : (
              /* Disabled Send Placeholder */
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
