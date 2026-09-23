"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { ArrowDown } from "lucide-react";
import { ChatMessages, ChatMessage } from "./chat-messages";
import { ChatComposer } from "./ChatComposer";
import { EnrollmentData } from "./enrollment-card";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { siteConfig } from "@/config/site";
import { academyKnowledge, type TopicResponseData } from "@/data/academy-knowledge";

const SAMPLE_STARTER_QUESTION = `Hi! I want to transition into AI & Full-Stack software engineering. How does ${siteConfig.name} help learners reach production-ready skills?`;

const WELCOME_AI_RESPONSE = `Welcome to **${siteConfig.name}**! 🚀  
*${siteConfig.tagline}*

We specialize in high-impact software engineering programs engineered to take you from core programming to building and deploying production-ready AI systems:

* **Fast-Track 60-Day Duration**: All programs are intensive **60 days (2 months)** with build-first commercial project development.
* **Transparent Pricing**: **₹30,000** all-inclusive tuition for our 60-day programs, with no hidden charges. The **Super10 Elite Batch** is the one fully sponsored track — **₹0**, strictly 10 seats.
* **Flagship Programs**: Comprehensive **Full-Stack AI & Web Engineering** and our signature **Super10 Elite Program** with 100% placement assurance.
* **🎁 Refer & Earn ₹3,000**: Refer a friend or colleague and receive **₹3,000** direct reward once your referred student completes the whole course!
* **1-on-1 Mentorship**: Direct weekly architecture reviews, mock technical interviews, and resume coaching with lead software engineers.

What area would you like to explore first — our **Course Curriculum**, the **Super10 Batch**, **Admissions & Fees**, or **Refer & Earn**?`;

const WELCOME_SUGGESTIONS = [
  "What is the fee structure for the 60-day courses?",
  "Tell me about the Super10 Elite Program with 100% placement assurance",
  "How does the ₹3,000 Refer & Earn program work?",
];

const initialConversation: ChatMessage[] = [
  {
    id: "msg-init-user",
    role: "user",
    content: SAMPLE_STARTER_QUESTION,
  },
  {
    id: "msg-init-ai",
    role: "assistant",
    content: WELCOME_AI_RESPONSE,
    suggestions: WELCOME_SUGGESTIONS,
  },
];

/** Longest the simulated stream may take, however long the reply is. A reply under
 *  ~280 tokens keeps the original flat tick and is unaffected; past that the delay
 *  is derived from the token count against this budget, so a 600-token answer lands
 *  at 5s instead of the 10.8s a flat 18ms/token produced. */
const STREAM_BUDGET_MS = 5000;
/** The old flat delay, kept as the ceiling so no reply streams slower than before. */
const STREAM_DELAY_MAX_MS = 18;
/** Floor, so the longest replies still read as typing rather than appearing at once. */
const STREAM_DELAY_MIN_MS = 8;

/** Legal sections, linked under the composer. Each maps to a `academyKnowledge` key. */
const LEGAL_LINKS = [
  { topic: "terms", label: "Terms & Conditions" },
  { topic: "privacy", label: "Privacy Policy" },
  { topic: "payment_terms", label: "Payment Terms" },
] as const;

interface ChatCanvasProps {
  onAttach?: () => void;
  onVoiceStart?: () => void;
  activeTopic?: string | null;
  onTopicHandled?: () => void;
  resetSignal?: number;
  /** A full question to answer on mount, for links that carry one — `/?q=`. */
  initialPrompt?: string | null;
  /**
   * Runs the action straight away for a signed-in visitor, or opens the login modal
   * and replays it afterwards for a guest. Wraps what acts on an answer — sending,
   * the follow-up chips, feedback, regenerate, edit, the checkout — while reading
   * stays open to everyone.
   */
  onRequireLogin?: (action: () => void) => void;
}

export function ChatCanvas({
  activeTopic,
  onTopicHandled,
  resetSignal,
  initialPrompt,
  onRequireLogin,
}: ChatCanvasProps) {
  const { courses } = useCourses();
  const [messages, setMessages] = useState<ChatMessage[]>(initialConversation);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  // True until the visitor asks something of their own. While it holds, the view is
  // pinned to the top of the welcome: a greeting is read from its first line, and
  // following the end of it would drop them past what this place even is.
  const onWelcomeRef = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortStreamRef = useRef<(() => void) | null>(null);

  // Auto-scroll down smoothly when messages update or stream
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  useEffect(() => {
    if (onWelcomeRef.current) {
      scrollContainerRef.current?.scrollTo({ top: 0 });
      return;
    }
    scrollToBottom("smooth");
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  }, []);

  // The container starts at the top, so no scroll event announces the welcome
  // screen's real position — measure once after the first commit, or the button
  // below would stay hidden on the one screen that always needs it.
  useEffect(() => {
    handleScroll();
  }, [handleScroll]);

  // Core simulated token streamer
  const streamAIResponse = useCallback(
    (
      fullText: string,
      suggestions?: string[],
      extraData?: {
        showCourseCatalog?: boolean;
        enrollment?: EnrollmentData;
      },
      onComplete?: () => void
    ) => {
      // Abort any ongoing stream
      if (abortStreamRef.current) {
        abortStreamRef.current();
      }

      setIsGenerating(true);
      const aiMessageId = `ai-${Date.now()}`;

      // Optimistic AI message placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: "",
          isStreaming: true,
          showCourseCatalog: extraData?.showCourseCatalog,
          enrollment: extraData?.enrollment,
        },
      ]);

      // Split text into tokens/words preserving spacing
      const tokens = fullText.split(/(\s+)/);

      // Pace the reply against a time budget rather than a flat per-token delay.
      // Short replies clamp to the ceiling and stream exactly as they used to;
      // long ones clamp to the floor and finish in ~5s instead of dragging.
      const delayMs = Math.min(
        STREAM_DELAY_MAX_MS,
        Math.max(STREAM_DELAY_MIN_MS, STREAM_BUDGET_MS / tokens.length)
      );

      let currentIndex = 0;
      let accumulated = "";
      let isAborted = false;
      let timerId: ReturnType<typeof setTimeout> | null = null;

      const tick = () => {
        if (isAborted) {
          setIsGenerating(false);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
            )
          );
          return;
        }

        if (currentIndex < tokens.length) {
          accumulated += tokens[currentIndex];
          currentIndex += 1;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, content: accumulated, isStreaming: true }
                : msg
            )
          );
          // A streaming welcome must not drag the view down from the top it is
          // pinned to; its own effect re-pins after every tick.
          if (!onWelcomeRef.current) scrollToBottom("auto");
          timerId = setTimeout(tick, delayMs);
        } else {
          setIsGenerating(false);
          abortStreamRef.current = null;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: fullText,
                    isStreaming: false,
                    suggestions: suggestions,
                    showCourseCatalog: extraData?.showCourseCatalog,
                    enrollment: extraData?.enrollment,
                  }
                : msg
            )
          );
          if (!onWelcomeRef.current) scrollToBottom("smooth");
          onComplete?.();
        }
      };

      abortStreamRef.current = () => {
        isAborted = true;
        if (timerId) clearTimeout(timerId);
        tick(); // unwinds immediately rather than waiting out the pending tick
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // No animation: run one tick at the end of the text, so the same
        // completion path (suggestions, smooth scroll, onComplete) still fires.
        currentIndex = tokens.length;
        tick();
      } else {
        timerId = setTimeout(tick, delayMs);
      }
    },
    [scrollToBottom]
  );

  // Handle New Chat reset and auto-trigger sample chat starter
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      // A new chat opens on the welcome again, so it is pinned to the top again.
      onWelcomeRef.current = true;

      if (abortStreamRef.current) {
        abortStreamRef.current();
        abortStreamRef.current = null;
      }

      const starterUser: ChatMessage = {
        id: `user-starter-${Date.now()}`,
        role: "user",
        content: SAMPLE_STARTER_QUESTION,
      };

      const timer = setTimeout(() => {
        setIsGenerating(false);
        setMessages([starterUser]);
        setTimeout(() => {
          streamAIResponse(WELCOME_AI_RESPONSE, WELCOME_SUGGESTIONS);
        }, 120);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [resetSignal, streamAIResponse]);

  // Generate reply content based on query text
  const determineReply = useCallback((prompt: string): TopicResponseData => {
    const lower = prompt.toLowerCase();
    if (
      lower.includes("refer") ||
      lower.includes("reffer") ||
      lower.includes("referral") ||
      lower.includes("3k") ||
      lower.includes("3000") ||
      lower.includes("reward") ||
      lower.includes("affiliate") ||
      lower.includes("invite")
    ) {
      return academyKnowledge.referral;
    } else if (
      lower.includes("fee") ||
      lower.includes("fees") ||
      lower.includes("cost") ||
      lower.includes("price") ||
      lower.includes("pricing") ||
      lower.includes("installment") ||
      lower.includes("emi")
    ) {
      return academyKnowledge.payment_terms;
    } else if (
      lower.includes("enroll") ||
      lower.includes("admission") ||
      lower.includes("checkout") ||
      lower.includes("pay") ||
      lower.includes("payment") ||
      lower.includes("register") ||
      lower.includes("book seat") ||
      lower.includes("join batch") ||
      lower.includes("join program")
    ) {
      return academyKnowledge.enroll;
    } else if (lower.includes("super10") || lower.includes("elite")) {
      return lower.includes("zero") || lower.includes("₹0")
        ? academyKnowledge.sponsored
        : academyKnowledge.super10;
    } else if (lower.includes("referral") || lower.includes("refer & earn") || lower.includes("3,000") || lower.includes("3000")) {
      return academyKnowledge.referral;
    } else if (lower.includes("frontend") || lower.includes("reactjs") || lower.includes("tailwind")) {
      return academyKnowledge.frontend;
    } else if (lower.includes("backend") || lower.includes("fastapi") || lower.includes("django")) {
      return academyKnowledge.backend;
    } else if (lower.includes("devops") || lower.includes("aws") || lower.includes("docker") || lower.includes("kubernetes")) {
      return academyKnowledge.devops;
    } else if (lower.includes("database admin") || lower.includes("oracle") || lower.includes("pl/sql") || lower.includes("plsql") || lower.includes("mongodb")) {
      return academyKnowledge.database;
    } else if (lower.includes("data analyst") || lower.includes("data science")) {
      return academyKnowledge.data_analyst;
    } else if (lower.includes("business analyst") || lower.includes("brd") || lower.includes("jira")) {
      return academyKnowledge.business_analyst;
    } else if (lower.includes("genai") || lower.includes("generative ai") || lower.includes("rag") || lower.includes("agentic")) {
      return academyKnowledge.genai;
    } else if (lower.includes("laravel") || lower.includes("php")) {
      return academyKnowledge.laravel;
    } else if (lower.includes("application support") || (lower.includes("support") && lower.includes("linux"))) {
      return academyKnowledge.app_support;
    } else if (
      lower.includes("course") ||
      lower.includes("courses") ||
      lower.includes("program") ||
      lower.includes("programs") ||
      lower.includes("syllabus") ||
      lower.includes("curriculum") ||
      lower.includes("learn") ||
      lower.includes("duration") ||
      lower.includes("60") ||
      lower.includes("30k") ||
      lower.includes("full-stack")
    ) {
      return academyKnowledge.courses;
    } else if (
      lower.includes("placement") ||
      lower.includes("job") ||
      lower.includes("review") ||
      lower.includes("testimonial")
    ) {
      return academyKnowledge.testimonials;
    } else if (lower.includes("alumn") || lower.includes("hiring partner")) {
      // The two follow-ups the testimonials reply offers. Neither has a section of its own, so
      // both land on admissions — the people who can make the introduction, or name the
      // companies. Give each its own entry here once there is copy for it.
      return academyKnowledge.enquiry;
    } else if (lower.includes("certificate") || lower.includes("verify")) {
      return academyKnowledge.certificate;
    } else if (
      lower.includes("social") ||
      lower.includes("socials") ||
      lower.includes("instagram") ||
      lower.includes("insta") ||
      lower.includes("linkedin") ||
      lower.includes("youtube") ||
      lower.includes("yt") ||
      lower.includes("twitter") ||
      lower.includes("x.com") ||
      lower.includes("facebook") ||
      lower.includes("fb") ||
      lower.includes("follow") ||
      lower.includes("channel") ||
      lower.includes("community")
    ) {
      return academyKnowledge.socials;
    } else if (
      lower.includes("contact") ||
      lower.includes("counselor") ||
      lower.includes("enquiry") ||
      lower.includes("phone") ||
      lower.includes("email") ||
      lower.includes("reach") ||
      lower.includes("support")
    ) {
      return academyKnowledge.enquiry;
    }

    // Dynamic course matching from Firestore database (active courses only)
    const activeCourses = courses.filter((c) => (c.status ?? "active") !== "inactive");
    const matchedCourse = activeCourses.find((c) => {
      const idMatch = lower.includes(c.id.toLowerCase());
      const titleMatch = lower.includes(c.title.toLowerCase());
      const numberMatch = c.number && lower.includes(c.number.toLowerCase());
      return idMatch || titleMatch || numberMatch;
    });

    if (matchedCourse) {
      if (academyKnowledge[matchedCourse.id]) {
        return academyKnowledge[matchedCourse.id];
      }
      return {
        text: `### 🎓 **${matchedCourse.title}**\n\n` +
          `* **Track**: ${matchedCourse.categoryLabel || matchedCourse.category}\n` +
          `* **Duration**: **${matchedCourse.duration}**\n` +
          `* **Tuition Fee**: **${matchedCourse.fee}**\n` +
          `* **Curriculum Overview**: ${matchedCourse.description}\n\n` +
          (matchedCourse.topics?.length ? `**Key Modules**:\n${matchedCourse.topics.map((t: string) => `* ${t}`).join("\n")}\n\n` : "") +
          (matchedCourse.techStack?.length ? `**Tech Stack**: ${matchedCourse.techStack.join(", ")}\n\n` : "") +
          `> "${matchedCourse.bannerSubtitle || matchedCourse.description}"\n\n` +
          `Would you like to enroll in **${matchedCourse.title}** or ask about the syllabus?`,
        suggestions: [
          `I want to enroll in ${matchedCourse.title}`,
          "What is the fee structure & payment options?",
          "Tell me about the Super10 Elite Batch with 100% placement assurance",
        ],
      };
    }

    return {
      text: `Thank you for your question about **"${prompt}"**!\n\nAt **Jarvis AI Academy**, our programs feature:\n* **Duration**: Fast-track **60 Days (2 Months)** build-first training.\n* **Tuition**: **₹30,000** all-inclusive — the Super10 Elite track is fully sponsored at **₹0**.\n* **🎁 Refer & Earn**: Refer a student and receive **₹3,000** cash reward once they complete the full 60-day course!\n\n🌐 **Connect With Us Online**:\n* 💼 **LinkedIn**: [@jarvisaiacademy](https://www.linkedin.com/company/jarvisaiacademy/)\n* 📸 **Instagram**: [@jarvisaiacademy](https://www.instagram.com/jarvisaiacademy/)\n* 🎥 **YouTube**: [@JarvisAIAcademy](https://www.youtube.com/@JarvisAIAcademy)\n* 𝕏 **X (Twitter)**: [@jarvisaiacademy](https://x.com/jarvisaiacademy)\n* 📘 **Facebook**: [@jarvisaiacademy](https://www.facebook.com/jarvisaiacademy/)\n\nWould you like to explore our course syllabus, the **Super10** batch, or start enrollment?`,
      suggestions: [
        "What is the fee structure for the 60-day courses?",
        "Tell me about the Super10 Elite Program with 100% placement assurance",
        "How does the ₹3,000 Refer & Earn program work?",
      ],
    };
  }, [courses]);

  // Handle prompt submit
  const handlePromptSubmit = useCallback(
    (prompt: string) => {
      onWelcomeRef.current = false;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt,
      };

      setMessages((prev) => [...prev, userMsg]);

      // Brief thinking delay then stream tokens
      setTimeout(() => {
        const responseData = determineReply(prompt);
        streamAIResponse(
          responseData.text,
          responseData.suggestions,
          { showCourseCatalog: responseData.showCourseCatalog }
        );
      }, 300);
    },
    [determineReply, streamAIResponse]
  );

  // Streams a knowledge-base section as if the user had asked for it. Shared by
  // the sidebar topics and the legal links under the composer.
  const openSection = useCallback(
    (topic: string) => {
      onWelcomeRef.current = false;

      const topicPrompts: Record<string, string> = {
        courses: "Tell me about the available courses at Jarvis AI Academy",
        super10: "What is the Super10 Elite Batch and how can I qualify?",
        referral: "Tell me about the Refer & Earn program (₹3,000 reward)",
        testimonials: "Show me student reviews and placement testimonials",
        certificate: "How do I verify a certificate issued by Jarvis AI Academy?",
        enquiry: "I'd like to get in touch with an admissions counselor",
        enroll: "I want to enroll in the upcoming program and proceed with payment",
        terms: "Can you provide the Terms & Conditions of Jarvis AI Academy?",
        privacy: "What is the Privacy Policy of Jarvis AI Academy?",
        payment_terms: "What are the Payment Terms, fee structure, and refund policy at Jarvis AI Academy?",
      };

      // A course row sends a catalogue id, which is not a knowledge-base key, so ask
      // for the programme by name and let the keyword router pick its section.
      const course = courses.find((c) => c.id === topic);
      const userText = topicPrompts[topic] || `Tell me about ${course?.title ?? topic}`;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
      };

      setMessages((prev) => [...prev, userMsg]);
      const data = academyKnowledge[topic] || determineReply(userText);

      setTimeout(() => {
        streamAIResponse(
          data.text,
          data.suggestions,
          { showCourseCatalog: data.showCourseCatalog }
        );
      }, 300);
    },
    [courses, determineReply, streamAIResponse]
  );

  // Handle topic click from sidebar
  useEffect(() => {
    if (!activeTopic) return;
    openSection(activeTopic);
    onTopicHandled?.();
  }, [activeTopic, onTopicHandled, openSection]);

  // Answer a question carried in the URL, so an inline `#ask:` link on a public
  // course page continues in the chat instead of dead-ending.
  useEffect(() => {
    if (!initialPrompt) return;
    handlePromptSubmit(initialPrompt);
  }, [initialPrompt, handlePromptSubmit]);

  // Handle stop generation
  const handleStop = useCallback(() => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  // Handle regenerate response
  const handleRegenerate = useCallback(
    (messageId: string) => {
      // Find the user message before this assistant message
      const targetIndex = messages.findIndex((m) => m.id === messageId);
      if (targetIndex === -1) return;

      let userPrompt = "Tell me more about Jarvis AI Academy";
      for (let i = targetIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userPrompt = messages[i].content;
          break;
        }
      }

      // Remove the targeted assistant message
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      setTimeout(() => {
        const data = determineReply(userPrompt);
        // Slightly rephrase for regenerated variation
        const alternativeText = `*(Regenerated response)*\n\n${data.text}`;
        streamAIResponse(
          alternativeText,
          data.suggestions,
          { showCourseCatalog: data.showCourseCatalog }
        );
      }, 250);
    },
    [messages, determineReply, streamAIResponse]
  );

  // Handle edit & resubmit
  const handleEditSubmit = useCallback(
    (messageId: string, newContent: string) => {
      const editIndex = messages.findIndex((m) => m.id === messageId);
      if (editIndex === -1) return;

      // Truncate everything after this message and update its content
      const truncated = messages.slice(0, editIndex);
      const updatedUserMsg: ChatMessage = {
        id: messageId,
        role: "user",
        content: newContent,
      };

      setMessages([...truncated, updatedUserMsg]);

      // Trigger fresh streaming response
      setTimeout(() => {
        const data = determineReply(newContent);
        streamAIResponse(
          data.text,
          data.suggestions,
          { showCourseCatalog: data.showCourseCatalog }
        );
      }, 300);
    },
    [messages, determineReply, streamAIResponse]
  );

  // Handle thumbs up/down feedback
  const handleFeedback = useCallback((messageId: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === type ? null : type }
          : msg
      )
    );
  }, []);

  const { user } = useAuth();

  const handleUpdateEnrollment = useCallback(
    (messageId: string, data: EnrollmentData) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, enrollment: data } : msg
        )
      );
    },
    []
  );

  const handleActionPrompt = useCallback(
    (prompt: string) => {
      handlePromptSubmit(prompt);
    },
    [handlePromptSubmit]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Scrollable Conversation Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar pb-44 sm:pb-36 pt-2 sm:pt-4 relative z-0"
      >
        <ChatMessages
          messages={messages}
          onRegenerate={(id) => onRequireLogin?.(() => handleRegenerate(id))}
          onEditSubmit={(id, content) =>
            onRequireLogin?.(() => handleEditSubmit(id, content))
          }
          onFeedback={(id, type) => onRequireLogin?.(() => handleFeedback(id, type))}
          onUpdateEnrollment={handleUpdateEnrollment}
          onActionPrompt={(prompt) => onRequireLogin?.(() => handleActionPrompt(prompt))}
          onRequireLogin={onRequireLogin}
          currentUser={user}
        />
      </div>

      {/* Floating Sticky Composer (Always on top with z-30) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 px-3 sm:px-4 flex flex-col items-center transition-colors">
        {/* Shown the moment the view leaves the bottom, which on the welcome screen
            is immediately — it is pinned to the top, so this is the way down to the
            suggestions waiting at the end of the greeting. Above the capsule rather
            than over the stream, so it never covers the text it scrolls to. */}
        {!isAtBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            aria-label="Scroll to latest message"
            title="Scroll to latest message"
            className="pointer-events-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 dark:border-white/15 bg-white dark:bg-[#212121] text-neutral-600 dark:text-neutral-300 shadow-md transition-colors hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
        <div className="w-full max-w-3xl pointer-events-auto">
          <ChatComposer
            onSend={(data) => onRequireLogin?.(() => {
              const { text, activeTool, attachments } = data;
              let prompt = text;
              if (activeTool === "web_search") prompt = `[Web Search] ${text}`;
              if (activeTool === "create_image") prompt = `[Create Image] ${text}`;
              if (activeTool === "deep_research") prompt = `[Deep Research] ${text}`;
              if (attachments.length > 0) {
                prompt = `${prompt ? prompt + "\n" : ""}[Attached ${attachments.length} file(s): ${attachments.map(a => a.name).join(", ")}]`;
              }
              handlePromptSubmit(prompt);
            })}
            onStop={handleStop}
            isGenerating={isGenerating}
            placeholder="Ask anything"
          />
        </div>
        {/* Legal links. These live here rather than in the sidebar footer, and
            stay visible at every width so mobile keeps a route to them.
            `pointer-events-auto` overrides the gradient wrapper's `none`. */}
        <div className="pointer-events-auto flex flex-nowrap items-center justify-center gap-x-1.5 mt-1.5 text-[11px] text-neutral-500 select-none">
          {LEGAL_LINKS.map(({ topic, label }, index) => (
            <Fragment key={topic}>
              {index > 0 && (
                <span className="text-neutral-300 dark:text-neutral-700 select-none">·</span>
              )}
              <button
                type="button"
                onClick={() => openSection(topic)}
                className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                {label}
              </button>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
