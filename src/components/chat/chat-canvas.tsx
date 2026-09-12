"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessages, ChatMessage } from "./chat-messages";
import { ChatComposer, AttachmentItem, ActiveToolType } from "./ChatComposer";
import { CitationItem } from "./citations-view";

const initialConversation: ChatMessage[] = [
  {
    id: "msg-init-user",
    role: "user",
    content: "Hi! I want to transition into AI & Full-Stack software engineering. How does Jarvis AI Academy help learners reach production-ready skills?",
  },
  {
    id: "msg-init-ai",
    role: "assistant",
    content: `Welcome to **Jarvis AI Academy**! 🚀

We specialize in high-impact software engineering programs engineered to take you from core programming to building and deploying production-ready AI systems:

* **Practical, Build-First Learning**: 70% hands-on commercial project development rather than passive lectures.
* **Flagship Programs**: Comprehensive **Full-Stack AI & Web Engineering** and our signature **Super10 Elite Cohort** with 100% placement assurance.
* **1-on-1 Mentorship**: Direct weekly architecture reviews, mock technical interviews, and resume coaching with lead software engineers.

Whether you're starting with zero tech experience or looking to upskill into generative AI applications, I can tailor a personalized learning roadmap for you.

What area would you like to explore first — our **Course Curriculum**, the **Super10 Batch**, or **Student Placements**?`,
    citations: [
      {
        id: "c-init-1",
        number: 1,
        title: "Jarvis AI Academy Overview & Charter",
        source: "Jarvis Academic Advisory Board",
        snippet: "Hands-on engineering cohorts focusing on Next.js, Python architectures, and production GenAI pipelines.",
        url: "https://jarvisaiacademy.com",
      },
    ],
  },
];

interface TopicResponseData {
  text: string;
  citations: CitationItem[];
}

const academyKnowledge: Record<string, TopicResponseData> = {
  courses: {
    text: `Here are the flagship programs offered at **Jarvis AI Academy**:

### 1. Full-Stack AI & Web Engineering
Comprehensive training from fundamentals to enterprise architectures:
* **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
* **Backend**: Python, FastAPI, Django, REST APIs, PostgreSQL
* **AI & Agentic Systems**: OpenAI API, Gemini SDK, LangChain, Vector Databases

### 2. Python & Data Science Specialization
* Core & Advanced Python, Pandas, NumPy, Machine Learning basics
* Automated pipelines, data visualization, and model deployment

\`\`\`bash
# Initialize your Academy workspace
pnpm create jarvis-app@latest my-academy-project
cd my-academy-project && pnpm dev
\`\`\`

Which technology stack or career track interests you the most?`,
    citations: [
      {
        id: "c-course-1",
        number: 1,
        title: "Jarvis Official Curriculum 2025",
        source: "Jarvis AI Academy Academic Board",
        snippet: "Curriculum covers full-stack development, Python backend architectures, and production GenAI pipelines.",
        url: "https://jarvisaiacademy.com/courses",
      },
      {
        id: "c-course-2",
        number: 2,
        title: "Tech Career Transition Framework",
        source: "Industry Partner Network",
        snippet: "Includes hands-on capstone projects reviewed by senior engineering mentors.",
        url: "https://jarvisaiacademy.com/curriculum",
      },
    ],
  },
  super10: {
    text: `⚡ **Super10 Elite Batch** is our signature, high-intensity career acceleration cohort.

* **Cohort Cap**: Strictly limited to **10 selected candidates** per batch to guarantee bespoke attention.
* **Format**: Hands-on live commercial projects, daily peer code reviews, and enterprise system designs.
* **1-on-1 Mentorship**: Direct weekly architecture reviews with lead tech architects.
* **Placement Guarantee**: 100% job placement assurance with partner tech companies across Pune and remote hubs.

> "Super10 is engineered for ambitious learners ready to build real production-grade systems and secure senior developer packages."

Would you like to review the eligibility criteria or reserve a screening interview?`,
    citations: [
      {
        id: "c-super-1",
        number: 1,
        title: "Super10 Cohort Eligibility & Placement Charter",
        source: "Jarvis AI Academy Admissions",
        snippet: "Rigorous screening process assessing analytical mindset and dedication. 100% placement guarantee backed by contract.",
        url: "https://jarvisaiacademy.com/super10",
      },
    ],
  },
  testimonials: {
    text: `🏆 **Student Success Stories & Placements**:

Our alumni have achieved remarkable career transitions into software and AI engineering:

* *"Transitioned from a non-IT background to Full Stack Developer in 5 months. The practical mentorship and live project experience made all the difference!"*  
  — **Pooja S.** (Software Engineer, Pune)
* *"The Super10 program helped me crack a 12 LPA backend engineering offer with top tech firms. The system design mock interviews were invaluable."*  
  — **Rahul M.** (Backend AI Engineer)
* *"Outstanding hands-on curriculum. Unlike regular courses, we wrote production code from week one."*  
  — **Amit K.** (Full Stack Developer)

Would you like to connect with an alumnus or see our hiring partner companies?`,
    citations: [
      {
        id: "c-test-1",
        number: 1,
        title: "2024-2025 Alumni Placement Records",
        source: "Placement Cell Pune",
        snippet: "Over 85% of graduates received offers within 60 days of completing the cohort.",
        url: "https://jarvisaiacademy.com/placements",
      },
    ],
  },
  certificate: {
    text: `🛡️ **Digital Credential & Certificate Verification**:

Every graduate from **Jarvis AI Academy** earns an industry-recognized, cryptographically verifiable certificate:

* **Tamper-Proof**: Each credential includes a unique Certificate ID and QR code.
* **LinkedIn Compatible**: One-click addition to your LinkedIn Licenses & Certifications profile.
* **Employer Instant Verification**: Recruiters can instantly validate student competencies, completed capstones, and project source code.

\`\`\`json
{
  "issuer": "Jarvis AI Academy",
  "verificationStatus": "VERIFIED_AUTHENTIC",
  "credentialType": "Full Stack AI Specialist"
}
\`\`\`

Do you have a certificate ID you would like to verify right now?`,
    citations: [
      {
        id: "c-cert-1",
        number: 1,
        title: "Credential Registry & Verification Portal",
        source: "Jarvis AI Academy Registry",
        snippet: "Global database verifying course completion, capstone repository links, and instructor endorsements.",
        url: "https://jarvisaiacademy.com/verify",
      },
    ],
  },
  enquiry: {
    text: `📞 **Admissions & Counselor Connect**:

We are here to help you navigate your tech learning journey:

* **Direct Phone / WhatsApp**: +91 84828 31723
* **Campus & Hub**: Pune, Maharashtra, India
* **Counseling Hours**: Monday to Saturday, 9:00 AM – 7:30 PM IST
* **Email Support**: admissions@jarvisaiacademy.com

Feel free to share your current educational or career background, and I can tailor a custom learning roadmap for you right now!`,
    citations: [
      {
        id: "c-enq-1",
        number: 1,
        title: "Admissions Office & Student Support Desk",
        source: "Student Relations Team",
        snippet: "Dedicated student success counselors available for free career consultations.",
        url: "https://jarvisaiacademy.com/contact",
      },
    ],
  },
};

interface ChatCanvasProps {
  onAttach?: () => void;
  onVoiceStart?: () => void;
  activeTopic?: string | null;
  onTopicHandled?: () => void;
  resetSignal?: number;
}

export function ChatCanvas({
  onAttach,
  onVoiceStart,
  activeTopic,
  onTopicHandled,
  resetSignal,
}: ChatCanvasProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialConversation);
  const [isGenerating, setIsGenerating] = useState(false);
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
    scrollToBottom("smooth");
  }, [messages, scrollToBottom]);

  // Handle New Chat reset
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
      if (abortStreamRef.current) {
        abortStreamRef.current();
        abortStreamRef.current = null;
      }
      setIsGenerating(false);
      setMessages([]);
    }
  }, [resetSignal]);

  // Core simulated token streamer
  const streamAIResponse = useCallback(
    (
      fullText: string,
      citations?: CitationItem[],
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
        },
      ]);

      let isAborted = false;
      abortStreamRef.current = () => {
        isAborted = true;
      };

      // Split text into tokens/words preserving spacing
      const tokens = fullText.split(/(\s+)/);
      let currentIndex = 0;
      let accumulated = "";

      const intervalId = setInterval(() => {
        if (isAborted) {
          clearInterval(intervalId);
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
          scrollToBottom("auto");
        } else {
          clearInterval(intervalId);
          setIsGenerating(false);
          abortStreamRef.current = null;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    content: fullText,
                    isStreaming: false,
                    citations: citations,
                  }
                : msg
            )
          );
          scrollToBottom("smooth");
          onComplete?.();
        }
      }, 18); // 18ms per token chunk
    },
    [scrollToBottom]
  );

  // Generate reply content based on query text
  const determineReply = useCallback((prompt: string): TopicResponseData => {
    const lower = prompt.toLowerCase();
    if (lower.includes("super10") || lower.includes("batch") || lower.includes("elite")) {
      return academyKnowledge.super10;
    } else if (
      lower.includes("course") ||
      lower.includes("learn") ||
      lower.includes("fees") ||
      lower.includes("frontend") ||
      lower.includes("backend") ||
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
    } else if (lower.includes("certificate") || lower.includes("verify")) {
      return academyKnowledge.certificate;
    } else if (
      lower.includes("contact") ||
      lower.includes("counselor") ||
      lower.includes("enquiry") ||
      lower.includes("phone")
    ) {
      return academyKnowledge.enquiry;
    }

    return {
      text: `Thank you for your question about **"${prompt}"**!\n\nAt **Jarvis AI Academy**, our curriculum is tailored to modern high-demand tech roles. Whether you want to master Full-Stack Engineering, Python backend systems, or Generative AI integrations, our mentors guide you every step of the way.\n\nWould you like to explore our course syllabus or learn more about our upcoming **Super10** batch?`,
      citations: [
        {
          id: `c-gen-${Date.now()}`,
          number: 1,
          title: "Jarvis Academy Overview & FAQs",
          source: "Jarvis Academic Advisory",
          snippet: "Personalized mentorship and real-world software engineering cohorts in Pune & remote.",
          url: "https://jarvisaiacademy.com",
        },
      ],
    };
  }, []);

  // Handle prompt submit
  const handlePromptSubmit = useCallback(
    (prompt: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt,
      };

      setMessages((prev) => [...prev, userMsg]);

      // Brief thinking delay then stream tokens
      setTimeout(() => {
        const responseData = determineReply(prompt);
        streamAIResponse(responseData.text, responseData.citations);
      }, 300);
    },
    [determineReply, streamAIResponse]
  );

  // Handle topic click from sidebar
  useEffect(() => {
    if (activeTopic) {
      const topicPrompts: Record<string, string> = {
        courses: "Tell me about the available courses at Jarvis AI Academy",
        super10: "What is the Super10 Elite Batch and how can I qualify?",
        testimonials: "Show me student reviews and placement testimonials",
        certificate: "How do I verify a certificate issued by Jarvis AI Academy?",
        enquiry: "I'd like to get in touch with an admissions counselor",
      };

      const userText = topicPrompts[activeTopic] || `Tell me about ${activeTopic}`;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
      };

      setMessages((prev) => [...prev, userMsg]);
      const data = academyKnowledge[activeTopic] || determineReply(activeTopic);

      setTimeout(() => {
        streamAIResponse(data.text, data.citations);
      }, 300);

      onTopicHandled?.();
    }
  }, [activeTopic, onTopicHandled, determineReply, streamAIResponse]);

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
        streamAIResponse(alternativeText, data.citations);
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
        streamAIResponse(data.text, data.citations);
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

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Scrollable Conversation Stream */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar pb-36 pt-4"
      >
        <ChatMessages
          messages={messages}
          onRegenerate={handleRegenerate}
          onEditSubmit={handleEditSubmit}
          onFeedback={handleFeedback}
        />
      </div>

      {/* Floating Transparent Sticky Composer */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none bg-gradient-to-t from-black via-black/85 to-transparent pt-10 pb-3 px-4 flex flex-col items-center">
        <div className="w-full max-w-3xl pointer-events-auto">
          <ChatComposer
            onSend={({ text, activeTool, attachments }) => {
              let prompt = text;
              if (activeTool === "web_search") prompt = `[Web Search] ${text}`;
              if (activeTool === "create_image") prompt = `[Create Image] ${text}`;
              if (activeTool === "deep_research") prompt = `[Deep Research] ${text}`;
              if (attachments.length > 0) {
                prompt = `${prompt ? prompt + "\n" : ""}[Attached ${attachments.length} file(s): ${attachments.map(a => a.name).join(", ")}]`;
              }
              handlePromptSubmit(prompt);
            }}
            onStop={handleStop}
            isGenerating={isGenerating}
            placeholder="Ask anything"
          />
        </div>
        {/* Subtle Disclaimer Footer */}
        <p className="text-[11px] text-neutral-500 mt-2 text-center select-none">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
