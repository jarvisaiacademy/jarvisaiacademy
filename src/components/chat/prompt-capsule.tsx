"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  ArrowUp,
  Brain,
  Mic,
  AudioLines,
  Square,
  FileText,
  Image as ImageIcon,
  Code2,
  X,
  Link2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/toast";

interface PromptCapsuleProps {
  onSubmit?: (prompt: string, thinkMode: boolean, attachments?: File[]) => void;
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
  placeholder = "Ask anything",
  showThink = true,
}: PromptCapsuleProps) {
  const [value, setValue] = useState("");
  const [thinkMode, setThinkMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedText, setSelectedText] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Auto-resize textarea as text grows
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 240); // max 240px
    el.style.height = `${Math.max(newHeight, 36)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Click outside to close attachment menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Handle keyboard submission & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Escape") {
      setIsMenuOpen(false);
      setSelectedText("");
    }
  };

  const handleSend = () => {
    if (isGenerating) {
      onStop?.();
      return;
    }
    if (!value.trim() && attachments.length === 0) return;

    onSubmit?.(value.trim(), thinkMode, attachments);
    setValue("");
    setAttachments([]);
    setSelectedText("");
    setIsMenuOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px";
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachments((prev) => [...prev, ...newFiles]);
      showToast(`Attached ${newFiles.length} file(s)`, "info");
      setIsMenuOpen(false);
    }
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`relative w-full max-w-3xl mx-auto rounded-[24px] sm:rounded-[26px] bg-[#212121] border transition-all duration-200 ${
        isFocused
          ? "border-neutral-500 shadow-2xl shadow-black/70"
          : "border-white/10 hover:border-white/20 shadow-xl shadow-black/50"
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

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
              aria-label="Format as link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="px-1.5 py-0.5 rounded hover:bg-white/10 font-bold text-xs hover:text-white transition-colors"
              title="Bold"
              aria-label="Format bold"
            >
              B
            </button>
            <button
              type="button"
              className="px-1.5 py-0.5 rounded hover:bg-white/10 italic text-xs hover:text-white transition-colors font-serif"
              title="Italic"
              aria-label="Format italic"
            >
              I
            </button>
            <div className="w-px h-3.5 bg-white/10 mx-0.5" />
            <button
              type="button"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 text-xs text-neutral-300 hover:text-white transition-colors"
              aria-label="Text formatting options"
            >
              <span>Text</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Chips Display */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-200"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              <span className="truncate max-w-[150px] font-medium">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="p-0.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                aria-label={`Remove attachment ${file.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Content Container */}
      <div className="flex flex-col p-3 sm:p-3.5">
        {/* Center: Multiline Textarea */}
        <div className="w-full">
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
            spellCheck
            autoCorrect="on"
            aria-label="Chat with ChatGPT"
            className="w-full bg-transparent text-white placeholder:text-neutral-500 text-sm sm:text-base font-normal border-none outline-none focus:outline-none focus:ring-0 resize-none min-w-0 px-1 py-1 leading-6 max-h-[240px] overflow-y-auto no-scrollbar"
          />
        </div>

        {/* Bottom Controls Bar: Left, Center/Pills, Right */}
        <div className="flex items-center justify-between pt-2">
          {/* Left Controls: Add/Attachment Menu + Think Mode Pill */}
          <div className="flex items-center gap-1.5 relative" ref={menuRef}>
            {/* Circular '+' Add Files Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Add files and more"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isMenuOpen
                  ? "bg-white/20 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Accessible Attachment Menu Popover */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15 }}
                  role="menu"
                  aria-label="Attachment options"
                  className="absolute bottom-11 left-0 z-40 w-56 p-1.5 bg-[#262626] border border-white/15 rounded-2xl shadow-2xl text-neutral-200 text-xs sm:text-sm select-none"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                  >
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span>Upload from computer</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-neutral-400" />
                    <span>Upload image or screenshot</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      showToast("Code snippet mode ready", "info");
                      setIsMenuOpen(false);
                      if (textareaRef.current) {
                        setValue((prev) => prev + (prev ? "\n" : "") + "```\n\n```");
                        textareaRef.current.focus();
                      }
                    }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                  >
                    <Code2 className="w-4 h-4 text-neutral-400" />
                    <span>Insert code block</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Think Pill Button */}
            {showThink && (
              <button
                type="button"
                onClick={() => {
                  setThinkMode((prev) => !prev);
                  showToast(
                    !thinkMode ? "Think mode enabled" : "Think mode disabled",
                    "info"
                  );
                }}
                aria-pressed={thinkMode}
                aria-label="Toggle thinking mode"
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  thinkMode
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/10"
                }`}
              >
                <Brain
                  className={`w-3.5 h-3.5 transition-colors ${
                    thinkMode ? "text-cyan-400" : "text-neutral-400"
                  }`}
                />
                <span className="hidden sm:inline">Think</span>
              </button>
            )}
          </div>

          {/* Right Controls: Microphone / Dictation + Voice / Send Button */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Microphone / Dictation Button */}
            <button
              type="button"
              onClick={onVoiceStart}
              aria-label="Start dictation"
              className="p-1.5 sm:p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dictation"
            >
              <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Voice / Send Button */}
            <AnimatePresence mode="wait" initial={false}>
              {isGenerating ? (
                /* Stop Streaming State */
                <motion.button
                  key="stop-action"
                  type="button"
                  onClick={handleSend}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Stop generation"
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
                >
                  <Square className="w-3.5 h-3.5 fill-black" />
                </motion.button>
              ) : value.trim() || attachments.length > 0 ? (
                /* Active Send State */
                <motion.button
                  key="send-action"
                  type="button"
                  onClick={handleSend}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Send message"
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              ) : (
                /* Voice Mode / Audio Waveform State */
                <motion.button
                  key="voice-action"
                  type="button"
                  onClick={onVoiceStart}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Start Voice"
                  title="Start Voice"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-95 shadow-sm shrink-0"
                >
                  <AudioLines className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
