"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Share2,
  Pencil,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { EnrollmentCard, EnrollmentData } from "./enrollment-card";
import { CourseCatalogResponse } from "./course-catalog-response";
import { COURSES_DATA } from "@/data/courses";
import { useToast } from "@/components/ui/toast";

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
  const { showToast } = useToast();

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

        return (
          <div
            key={msg.id || idx}
            className={`group relative flex flex-col ${
              isUser ? "items-end" : "items-start"
            }`}
          >
            {isUser ? (
              /* User Message Bubble or Edit Mode */
              isEditing ? (
                <div className="w-full max-w-xl flex flex-col gap-2 p-3 bg-neutral-100 dark:bg-[#212121] rounded-2xl border border-neutral-300 dark:border-white/15 shadow-xl transition-colors">
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
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(msg.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-xs"
                    >
                      Save & Submit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 max-w-[85%] sm:max-w-[75%]">
                  {/* Action Cluster on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEditing(msg)}
                      aria-label="Edit message"
                      title="Edit"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      aria-label="Copy message"
                      title="Copy"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-neutral-100 dark:bg-[#212121] text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-transparent px-4 py-2.5 rounded-3xl text-sm leading-relaxed shadow-xs break-words">
                    {msg.content}
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

                {/* Assistant Action Bar */}
                {!msg.isStreaming && msg.content && (
                  <div className="flex items-center gap-1 mt-1 text-neutral-500 dark:text-neutral-400">
                    {/* Copy */}
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      aria-label="Copy response"
                      className="p-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors"
                      title="Copy"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Feedback: Thumbs Up */}
                    <button
                      type="button"
                      onClick={() => {
                        onFeedback?.(msg.id, "like");
                        showToast("Thanks for the feedback!", "success");
                      }}
                      aria-label="Good response"
                      className={`p-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors ${
                        msg.feedback === "like" ? "text-emerald-500" : ""
                      }`}
                      title="Good response"
                    >
                      <ThumbsUp
                        className={`w-4 h-4 ${
                          msg.feedback === "like" ? "fill-emerald-500" : ""
                        }`}
                      />
                    </button>

                    {/* Feedback: Thumbs Down */}
                    <button
                      type="button"
                      onClick={() => {
                        onFeedback?.(msg.id, "dislike");
                        showToast("Feedback recorded", "info");
                      }}
                      aria-label="Bad response"
                      className={`p-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors ${
                        msg.feedback === "dislike" ? "text-rose-500" : ""
                      }`}
                      title="Bad response"
                    >
                      <ThumbsDown
                        className={`w-4 h-4 ${
                          msg.feedback === "dislike" ? "fill-rose-500" : ""
                        }`}
                      />
                    </button>

                    {/* Regenerate */}
                    <button
                      type="button"
                      onClick={() => {
                        onRegenerate?.(msg.id);
                        showToast("Regenerating response...", "info");
                      }}
                      aria-label="Regenerate response"
                      className="p-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors"
                      title="Regenerate"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Share */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCopy(msg.id, window.location.href);
                        showToast("Share link copied to clipboard", "success");
                      }}
                      aria-label="Share response"
                      className="p-1.5 rounded-lg hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
