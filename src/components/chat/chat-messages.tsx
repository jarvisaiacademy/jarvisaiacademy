"use client";

import { useState, useEffect, useRef } from "react";
import {
  Copy,
  Check,
  Pencil,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { EnrollmentCard, EnrollmentData } from "./enrollment-card";
import { CourseCatalogResponse } from "./course-catalog-response";
import { AdmissionCtaCard } from "./admission-cta-card";
import { useCourses } from "@/providers/courses-provider";
import { useToast } from "@/components/ui/toast";


// Share Tray with Up Arrow Icon (matching today's ChatGPT UI)
function ShareTrayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

/** Keys the share button's tick apart from the copy button's on the same message. */
const shareKey = (id: string) => `${id}:share`;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  feedback?: "like" | "dislike" | null;
  timestamp?: string;
  enrollment?: EnrollmentData;
  suggestions?: string[];
  showCourseCatalog?: boolean;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  onRegenerate?: (messageId: string) => void;
  onEditSubmit?: (messageId: string, newContent: string) => void;
  onFeedback?: (messageId: string, type: "like" | "dislike") => void;
  onUpdateEnrollment?: (messageId: string, data: EnrollmentData) => void;
  onActionPrompt?: (prompt: string) => void;
  currentUser?: { name?: string; email?: string } | null;
}

export function ChatMessages({
  messages,
  onRegenerate,
  onEditSubmit,
  onFeedback,
  onUpdateEnrollment,
  onActionPrompt,
  currentUser,
}: ChatMessagesProps) {
  const { courses } = useCourses();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [currentTime, setCurrentTime] = useState<string>("5:44 PM");
  const { showToast } = useToast();
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }, []);

  useEffect(() => {
    if (editingId && editTextareaRef.current) {
      const el = editTextareaRef.current;
      el.style.height = "auto";
      const scrollH = el.scrollHeight;
      const newH = Math.min(Math.max(scrollH, 40), 400);
      el.style.height = `${newH}px`;
      el.style.overflowY = scrollH > 400 ? "auto" : "hidden";
      el.focus();
      el.selectionStart = el.value.length;
      el.selectionEnd = el.value.length;
    }
  }, [editingId]);

  const handleEditChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditDraft(e.target.value);
    e.target.style.height = "auto";
    const scrollH = e.target.scrollHeight;
    const newH = Math.min(Math.max(scrollH, 40), 400);
    e.target.style.height = `${newH}px`;
    e.target.style.overflowY = scrollH > 400 ? "auto" : "hidden";
  };

  // The tick lasts two seconds; the key names which control put it there, so
  // sharing a message does not flash the copy button above it.
  const flashCopied = (key: string) => {
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    flashCopied(id);
    showToast("Copied to clipboard", "success");
  };

  /** The ask a message belongs to: its own text if it is the ask, else the one above. */
  const askBehind = (msg: ChatMessage, idx: number) => {
    if (msg.role === "user") return msg.content;
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return "";
  };

  // `/` reads `?q=` on mount and asks it, so a shared link reopens the same ask —
  // and therefore the same answer — instead of the welcome screen.
  const handleShare = (msg: ChatMessage, idx: number) => {
    const ask = askBehind(msg, idx);
    navigator.clipboard.writeText(
      ask
        ? `${window.location.origin}/?q=${encodeURIComponent(ask)}`
        : window.location.href
    );
    flashCopied(shareKey(msg.id));
    showToast("Share link copied to clipboard", "success");
  };

  const startEditing = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditDraft(msg.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editDraft.trim()) return;
    onEditSubmit?.(msgId, editDraft.trim());
    setEditingId(null);
    setEditDraft("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 py-6 px-4 sm:px-6">
      {messages.map((msg, idx) => {
        const isUser = msg.role === "user";
        const isEditing = editingId === msg.id;
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const showTimestamp =
          idx === 0 || (prevMsg && prevMsg.role !== msg.role && isUser);
        // The checkout is already the call to action, so the admission card below
        // would only repeat it.
        const showsCheckout =
          Boolean(msg.enrollment) ||
          msg.content.includes("Admissions & Enrollment Portal") ||
          msg.content.includes("Enrollment Checkout");

        return (
          <div key={msg.id || idx} className="flex flex-col w-full">
            {/* Centered Timestamp (matching today's ChatGPT UI: Today 5:44 PM) */}
            {showTimestamp && (
              <div className="w-full flex justify-center py-2 mb-2 select-none">
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-normal tracking-wide">
                  {msg.timestamp || `Today ${currentTime}`}
                </span>
              </div>
            )}

            <div
              className={`group/message relative flex flex-col ${
                isEditing ? "w-full" : isUser ? "items-end" : "items-start"
              }`}
            >
              {isUser ? (
                /* User Message Bubble or Edit Mode */
                isEditing ? (
                  <div className="w-full bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[24px] p-3.5 sm:p-4 pb-3 sm:pb-3.5 transition-colors">
                    <textarea
                      ref={editTextareaRef}
                      value={editDraft}
                      onChange={handleEditChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit(msg.id);
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEditing();
                        }
                      }}
                      rows={1}
                      className="w-full bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm sm:text-[15px] leading-6 outline-none resize-none border-0 focus:outline-none focus:ring-0 p-0 font-normal selection:bg-[#9d5932] selection:text-white"
                      placeholder="Send a message..."
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2 mt-2 select-none">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-full px-4 py-1.5 text-[13px] sm:text-sm font-medium transition-colors cursor-pointer bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-[#383838] dark:hover:bg-[#484848] dark:text-white active:scale-95"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(msg.id)}
                        disabled={!editDraft.trim()}
                        className="rounded-full px-4 py-1.5 text-[13px] sm:text-sm font-medium transition-colors cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
                    {/* Message Bubble (ChatGPT exact classes) */}
                    <div className="corner-superellipse/0.98 relative min-w-0 overflow-hidden rounded-[22px] px-4 py-2.5 leading-6 user-message-bubble-color w-full text-sm sm:text-[15px] font-normal shadow-xs break-words">
                      {msg.content}
                    </div>

                    {/* Action Bar on Hover (matching today's ChatGPT UI directly underneath: Copy, Share, Edit) */}
                    <div className="opacity-0 group-hover/message:opacity-100 flex items-center gap-2 mt-1.5 mr-1 transition-opacity select-none text-neutral-400 dark:text-neutral-400">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        aria-label="Copy message"
                        title="Copy"
                        className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Share */}
                      <button
                        type="button"
                        onClick={() => handleShare(msg, idx)}
                        aria-label="Share message"
                        title="Share"
                        className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {copiedId === shareKey(msg.id) ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ShareTrayIcon className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => startEditing(msg)}
                        aria-label="Edit message"
                        title="Edit"
                        className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              ) : (
              /* Assistant Response */
              <div className="w-full flex flex-col gap-2 max-w-full text-foreground">
                {/* Assistant Message Content with Markdown & Streaming indicator */}
                <div className="relative">
                  {msg.content ? (
                    <MarkdownRenderer content={msg.content} onPromptClick={onActionPrompt} />
                  ) : msg.isStreaming ? (
                    /* Loading/Thinking Skeleton dots before first token */
                    <div className="flex items-center gap-1.5 py-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:200ms]" />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse [animation-delay:400ms]" />
                    </div>
                  ) : null}

                  {/* Pulsing streaming circle cursor (ChatGPT style circle instead of box) */}
                  {msg.isStreaming && (
                    <span
                      aria-hidden="true"
                      className="inline-block w-2.5 h-2.5 ml-1.5 rounded-full bg-neutral-900 dark:bg-white align-middle animate-pulse shrink-0"
                    />
                  )}
                </div>



                {/* Interactive Enrollment & Payment Module */}
                {showsCheckout && !msg.isStreaming && (
                  <EnrollmentCard
                    messageId={msg.id}
                    initialData={msg.enrollment}
                    currentUser={currentUser}
                    onUpdate={(data) => onUpdateEnrollment?.(msg.id, data)}
                  />
                )}

                {/* Interactive Course Catalog Response */}
                {(msg.showCourseCatalog ||
                  msg.content.includes("featured programs") ||
                  msg.content.includes("Choose a category or explore all courses") ||
                  msg.content.includes("Here are our featured courses")) &&
                  !msg.isStreaming && (
                    <CourseCatalogResponse
                      onActionPrompt={onActionPrompt}
                      onSelectCourse={(courseId) => {
                        const course = courses.find((c) => c.id === courseId);
                        if (course) {
                          onActionPrompt?.(course.actionPrompt);
                        } else {
                          onActionPrompt?.("Tell me more about " + courseId);
                        }
                      }}
                    />
                  )}

                {/* Follow-up Question Suggestions (ChatGPT clean pill chips) */}
                {!msg.isStreaming && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 mb-1 w-full">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => onActionPrompt?.(suggestion)}
                        className="group/sug inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200/80 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 transition-all cursor-pointer text-left active:scale-98"
                      >
                        <span className="text-neutral-400 dark:text-neutral-500 group-hover/sug:text-neutral-600 dark:group-hover/sug:text-neutral-300 transition-colors text-xs select-none">
                          ↳
                        </span>
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Assistant Action Bar (Matching today's ChatGPT UI: Copy, Dual Thumbs, Share, Regenerate, More) */}
                {!msg.isStreaming && msg.content && (
                  <div className="relative flex items-center gap-2.5 mt-2.5 text-neutral-400 dark:text-neutral-400 select-none">
                    {/* 1. Copy */}
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      aria-label="Copy response"
                      className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* 2. Good Response (Like) */}
                    <button
                      type="button"
                      onClick={() => {
                        const isTogglingOff = msg.feedback === "like";
                        onFeedback?.(msg.id, "like");
                        if (!isTogglingOff) {
                          showToast("Thanks for the feedback!", "success");
                        }
                      }}
                      aria-label="Good response"
                      className={`p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                        msg.feedback === "like"
                          ? "text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                          : ""
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp className={`w-4 h-4 ${msg.feedback === "like" ? "fill-current" : ""}`} />
                    </button>

                    {/* 3. Bad Response (Dislike) */}
                    <button
                      type="button"
                      onClick={() => {
                        const isTogglingOff = msg.feedback === "dislike";
                        onFeedback?.(msg.id, "dislike");
                        if (!isTogglingOff) {
                          showToast("Feedback recorded", "info");
                        }
                      }}
                      aria-label="Bad response"
                      className={`p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                        msg.feedback === "dislike"
                          ? "text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
                          : ""
                      }`}
                      title="Bad response"
                    >
                      <ThumbsDown className={`w-4 h-4 ${msg.feedback === "dislike" ? "fill-current" : ""}`} />
                    </button>

                    {/* 3. Share (Tray with Up Arrow) */}
                    <button
                      type="button"
                      onClick={() => handleShare(msg, idx)}
                      aria-label="Share response"
                      className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Share"
                    >
                      {copiedId === shareKey(msg.id) ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ShareTrayIcon className="w-4 h-4" />
                      )}
                    </button>

                    {/* 4. Regenerate */}
                    <button
                      type="button"
                      onClick={() => {
                        onRegenerate?.(msg.id);
                        showToast("Regenerating response...", "info");
                      }}
                      aria-label="Regenerate response"
                      className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Regenerate"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* Admission route, closing every answer — unless the checkout is already up.
                    Below the action bar so the copy/like/share controls stay next to the text. */}
                {!msg.isStreaming && msg.content && !showsCheckout && (
                  <AdmissionCtaCard onActionPrompt={onActionPrompt} />
                )}
              </div>
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
