"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Pencil,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Volume2,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { EnrollmentCard, EnrollmentData } from "./enrollment-card";
import { CourseCatalogResponse } from "./course-catalog-response";
import { COURSES_DATA } from "@/data/courses";
import { useToast } from "@/components/ui/toast";

// Dual Thumbs Feedback Icon (matching today's ChatGPT UI)
function DualThumbsIcon({ className }: { className?: string }) {
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
      {/* Upward thumb (top-left) */}
      <path d="M7 11V7a2 2 0 0 1 2-2 1 1 0 0 1 1 1v5h3a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H7" />
      <path d="M4 11h3v6H4z" />
      {/* Downward thumb (bottom-right) */}
      <path d="M17 13v4a2 2 0 0 1-2 2 1 1 0 0 1-1-1v-5h-3a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 1 11 9h6" />
      <path d="M20 13h-3V7h3z" />
    </svg>
  );
}

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [feedbackOpenId, setFeedbackOpenId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("5:44 PM");
  const { showToast } = useToast();

  useEffect(() => {
    setCurrentTime(
      new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  }, []);

  const handleReadAloud = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        text.replace(/[#*`_]/g, "")
      );
      window.speechSynthesis.speak(utterance);
      showToast("Reading aloud...", "info");
    } else {
      showToast("Speech synthesis not supported in this browser", "info");
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
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
    showToast("Message updated & regenerating...", "info");
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 py-6 px-4 sm:px-6">
      {messages.map((msg, idx) => {
        const isUser = msg.role === "user";
        const isEditing = editingId === msg.id;
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const showTimestamp =
          idx === 0 || (prevMsg && prevMsg.role !== msg.role && isUser);

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
              className={`group relative flex flex-col ${
                isUser ? "items-end" : "items-start"
              }`}
            >
              {isUser ? (
                /* User Message Bubble or Edit Mode */
                isEditing ? (
                  <div className="w-full max-w-xl flex flex-col gap-2 p-3 bg-neutral-100 dark:bg-[#212121] rounded-[22px] border border-neutral-300 dark:border-white/15 shadow-xl transition-colors">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-500 text-sm outline-none resize-none border-none p-1 font-normal leading-relaxed"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3 py-1.5 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(msg.id)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-xs"
                      >
                        Save & Submit
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
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 mt-1.5 mr-1 transition-opacity select-none text-neutral-400 dark:text-neutral-400">
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
                        onClick={() => {
                          handleCopy(msg.id, window.location.href);
                          showToast("Share link copied to clipboard", "success");
                        }}
                        aria-label="Share message"
                        title="Share"
                        className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <ShareTrayIcon className="w-4 h-4" />
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
                    <MarkdownRenderer content={msg.content} />
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



                {/* Quick Action Pill for Courses / Super10 (ChatGPT High-Contrast Pill) */}
                {!msg.isStreaming &&
                  (msg.content.includes("Full-Stack AI & Web Engineering") ||
                    msg.content.includes("Super10 Elite Batch") ||
                    msg.content.includes("Super10 Elite Cohort")) &&
                  !msg.content.includes("Admissions & Enrollment Portal") && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          onActionPrompt?.(
                            "I want to enroll in the upcoming cohort and proceed with payment"
                          )
                        }
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-medium transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>⚡ Enroll Now in Upcoming Batch</span>
                      </button>
                    </div>
                  )}

                {/* Interactive Enrollment & Payment Module */}
                {(msg.enrollment ||
                  msg.content.includes("Admissions & Enrollment Portal") ||
                  msg.content.includes("Enrollment Checkout")) &&
                  !msg.isStreaming && (
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
                        const course = COURSES_DATA.find((c) => c.id === courseId);
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

                    {/* 2. Dual Thumbs Feedback */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackOpenId(feedbackOpenId === msg.id ? null : msg.id)
                        }
                        aria-label="Rate response"
                        className={`p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                          msg.feedback ? "text-neutral-900 dark:text-white" : ""
                        }`}
                        title="Rate response"
                      >
                        <DualThumbsIcon className="w-4 h-4" />
                      </button>

                      {/* Feedback Flyout */}
                      {feedbackOpenId === msg.id && (
                        <div className="absolute left-0 bottom-full mb-1.5 flex items-center gap-1 p-1 rounded-full bg-white dark:bg-[#212121] border border-neutral-200 dark:border-white/10 shadow-lg z-20">
                          <button
                            type="button"
                            onClick={() => {
                              onFeedback?.(msg.id, "like");
                              setFeedbackOpenId(null);
                              showToast("Thanks for the feedback!", "success");
                            }}
                            className={`p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                              msg.feedback === "like" ? "text-emerald-500" : ""
                            }`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onFeedback?.(msg.id, "dislike");
                              setFeedbackOpenId(null);
                              showToast("Feedback recorded", "info");
                            }}
                            className={`p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                              msg.feedback === "dislike" ? "text-rose-500" : ""
                            }`}
                            title="Bad response"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. Share (Tray with Up Arrow) */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCopy(msg.id, window.location.href);
                        showToast("Share link copied to clipboard", "success");
                      }}
                      aria-label="Share response"
                      className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Share"
                    >
                      <ShareTrayIcon className="w-4 h-4" />
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

                    {/* 5. More Options (...) */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuOpenId(menuOpenId === msg.id ? null : msg.id)
                        }
                        aria-label="More options"
                        className="p-1 rounded-md hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {menuOpenId === msg.id && (
                        <div className="absolute left-0 bottom-full mb-1.5 flex flex-col min-w-[130px] p-1 rounded-xl bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-white/10 shadow-xl z-20 text-xs text-neutral-800 dark:text-neutral-200">
                          <button
                            type="button"
                            onClick={() => {
                              handleReadAloud(msg.content);
                              setMenuOpenId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-left transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Read aloud</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleCopy(msg.id, msg.content);
                              setMenuOpenId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-left transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy text</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
