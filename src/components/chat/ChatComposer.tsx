"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  Globe,
  Palette,
  Sparkles,
  X,
  FileText,
} from "lucide-react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [activeTool, setActiveTool] = useState<ActiveToolType>(null);
  const [isDictating, setIsDictating] = useState(false);
  const [internalGenerating, setInternalGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isGenerating = externalGenerating ?? internalGenerating;

  // Refs
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
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

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, [attachments]);

  // Process files into attachments
  const processFiles = useCallback((files: FileList | File[]) => {
    const newItems: AttachmentItem[] = Array.from(files).map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
    });

    setAttachments((prev) => [...prev, ...newItems]);
    setIsMenuOpen(false);
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

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
        // Fallback simulation if speech recognition fails to start
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

    if (!text.trim() && attachments.length === 0) return;

    onSend?.({
      text: text.trim(),
      attachments,
      activeTool,
    });

    setText("");
    setAttachments([]);
    setActiveTool(null);
    setIsMenuOpen(false);

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
    } else if (e.key === "Escape") {
      setIsMenuOpen(false);
    }
  };

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full max-w-3xl mx-auto rounded-[28px] bg-neutral-100 dark:bg-[#212121] border transition-all duration-200 ${
        isFocused
          ? "border-neutral-400 dark:border-neutral-500 shadow-xl shadow-neutral-300/30 dark:shadow-black/50"
          : "border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20 shadow-md shadow-neutral-200/40 dark:shadow-black/40"
      } ${className}`}
    >
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 rounded-[28px] bg-[#1a1a1a]/95 border-2 border-dashed border-[#ea580c] flex flex-col items-center justify-center p-4 text-center backdrop-blur-xs select-none"
          >
            <FolderOpen className="w-8 h-8 text-[#ea580c] mb-1.5 animate-bounce" />
            <span className="text-sm font-semibold text-white">Add anything</span>
            <span className="text-[11px] text-neutral-400 mt-0.5">
              .avif, .bmp, .gif, .heic, .heif, .jpeg, .jpg, .png, .webp
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Tool Pill & Attachments Preview Area */}
      {(activeTool || attachments.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 pb-1">
          {/* Active Tool Pill */}
          {activeTool && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-neutral-200 font-medium">
              {activeTool === "web_search" && <Globe className="w-3.5 h-3.5 text-blue-400" />}
              {activeTool === "create_image" && <Palette className="w-3.5 h-3.5 text-emerald-400" />}
              {activeTool === "deep_research" && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>
                {activeTool === "web_search" && "Web search"}
                {activeTool === "create_image" && "Create image"}
                {activeTool === "deep_research" && "Deep research"}
              </span>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                aria-label={`Deactivate ${activeTool}`}
                className="p-0.5 ml-0.5 rounded-full hover:bg-white/20 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Attachments Preview */}
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-200"
            >
              {att.previewUrl ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black/40 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-neutral-300" />
                </div>
              )}
              <div className="flex flex-col min-w-0 pr-1">
                <span className="truncate max-w-[120px] sm:max-w-[160px] font-medium leading-tight">
                  {att.name}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {(att.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                aria-label={`Remove attachment ${att.name}`}
                className="p-1 rounded-full bg-black/50 hover:bg-white/20 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Row */}
      <div className="flex items-end gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        {/* Left Action Button: Circular '+' */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Add files and more"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isMenuOpen
                ? "bg-neutral-200 dark:bg-white/20 text-neutral-900 dark:text-white"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10"
            }`}
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Floating Action Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.15 }}
                role="menu"
                aria-label="Add files and options"
                className="absolute bottom-11 left-0 z-50 w-52 p-1.5 bg-card border border-border rounded-2xl shadow-2xl text-foreground text-xs sm:text-sm select-none"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-muted text-left transition-colors"
                >
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-neutral-400" />
                  <span>Photos</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-neutral-400" />
                  <span>Files</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                >
                  <Plus className="w-4 h-4 text-neutral-400" />
                  <span>Add photos</span>
                </button>
                <div className="h-px bg-white/10 my-1 mx-1.5" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTool((prev) => (prev === "web_search" ? null : "web_search"));
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors ${
                    activeTool === "web_search" ? "bg-white/10 text-blue-400" : ""
                  }`}
                >
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>Web search</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTool((prev) => (prev === "create_image" ? null : "create_image"));
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors ${
                    activeTool === "create_image" ? "bg-white/10 text-emerald-400" : ""
                  }`}
                >
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span>Create image</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTool((prev) => (prev === "deep_research" ? null : "deep_research"));
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors ${
                    activeTool === "deep_research" ? "bg-white/10 text-amber-400" : ""
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Deep research</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
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
                className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0"
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
                className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center transition-transform active:scale-95 shadow-md shrink-0 hover:opacity-90"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </motion.button>
            ) : (
              /* Disabled Send Button (matching screenshot) */
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
