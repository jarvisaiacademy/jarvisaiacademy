"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessages, ChatMessage } from "./chat-messages";
import { ChatComposer } from "./ChatComposer";
import { EnrollmentData } from "./enrollment-card";
import { useAuth } from "@/providers/auth-provider";
import { siteConfig } from "@/config/site";

const SAMPLE_STARTER_QUESTION = `Hi! I want to transition into AI & Full-Stack software engineering. How does ${siteConfig.name} help learners reach production-ready skills?`;

const WELCOME_AI_RESPONSE = `Welcome to **${siteConfig.name}**! 🚀  
*${siteConfig.tagline}*

We specialize in high-impact software engineering programs engineered to take you from core programming to building and deploying production-ready AI systems:

* **Fast-Track 60-Day Duration**: All cohort programs are intensive **60 days (2 months)** with build-first commercial project development.
* **Transparent Pricing**: Flat tuition fee of **₹30,000** (₹30K) across all courses.
* **Flagship Programs**: Comprehensive **Full-Stack AI & Web Engineering** and our signature **Super10 Elite Cohort** with 100% placement assurance.
* **🎁 Refer & Earn ₹5,000**: Refer a friend or colleague and receive **₹5,000** direct reward once your referred student completes the whole course!
* **1-on-1 Mentorship**: Direct weekly architecture reviews, mock technical interviews, and resume coaching with lead software engineers.

What area would you like to explore first — our **Course Curriculum**, the **Super10 Batch**, **Admissions & Fees**, or **Refer & Earn**?`;

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
  },
];

interface TopicResponseData {
  text: string;
}

const academyKnowledge: Record<string, TopicResponseData> = {
  courses: {
    text: `Here are the flagship programs offered at **Jarvis AI Academy**:

### 1. Full-Stack AI & Web Engineering (60 Days)
Comprehensive training from fundamentals to enterprise architectures:
* **Duration**: **60 Days (2 Months)** intensive build-first curriculum
* **Tuition Fee**: **₹30,000** (₹30K)
* **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
* **Backend**: Python, FastAPI, Django, REST APIs, PostgreSQL
* **AI & Agentic Systems**: OpenAI API, Gemini SDK, LangChain, Vector Databases

### 2. Python & Data Science Specialization (60 Days)
* **Duration**: **60 Days (2 Months)**
* **Tuition Fee**: **₹30,000** (₹30K)
* Core & Advanced Python, Pandas, NumPy, Machine Learning basics
* Automated pipelines, data visualization, and model deployment

---

### 🎁 Refer & Earn ₹5,000:
Know someone interested in software engineering?
* **Earn ₹5,000** cash reward for every friend you refer!
* Bonus is paid directly to you once your referred person completes the full 60-day course.

\`\`\`bash
# Initialize your Academy workspace
pnpm create jarvis-app@latest my-academy-project
cd my-academy-project && pnpm dev
\`\`\`

Which technology stack or career track interests you the most?`,
  },
  super10: {
    text: `⚡ **Super10 Elite Batch** is our signature, high-intensity career acceleration cohort.

* **Duration**: **60 Days (2 Months)** high-intensity commercial training.
* **Tuition Fee**: **₹30,000** (₹30K).
* **Cohort Cap**: Strictly limited to **10 selected candidates** per batch to guarantee bespoke attention.
* **Format**: Hands-on live commercial projects, daily peer code reviews, and enterprise system designs.
* **1-on-1 Mentorship**: Direct weekly architecture reviews with lead tech architects.
* **Placement Guarantee**: 100% job placement assurance with partner tech companies across Pune and remote hubs.
* **🎁 Referral Bonus**: Refer a peer to Super10 and earn **₹5,000** after they complete the full 60-day cohort!

> "Super10 is engineered for ambitious learners ready to build real production-grade systems and secure senior developer packages."

Would you like to review the eligibility criteria or reserve a screening interview?`,
  },
  referral: {
    text: `# 🎁 Refer & Earn ₹5,000 — Jarvis AI Academy Referral Program

Earn **₹5,000** direct bonus for every learner you refer to Jarvis AI Academy!

### How the Referral Program Works:
1. **Invite a Learner**: Refer a friend, colleague, or classmate to enroll in any 60-day program.
2. **They Enroll**: Your referred person enrolls in their chosen cohort (Program Fee: **₹30,000**).
3. **Course Completion**: They attend classes, submit projects, and finish the full **60-day course**.
4. **Get Rewarded**: Once the referred candidate completes the whole course, you receive **₹5,000** cash reward directly via UPI or bank transfer!

### Key Program Details:
* **Reward Amount**: **₹5,000** per successful student completion.
* **Disbursement**: Prompt payout upon verification of course completion.
* **No Caps**: Refer 5 peers and earn **₹25,000**!

Ready to refer someone? Share their details with our admissions desk or have them mention your name during registration!`,
  },
  testimonials: {
    text: `🏆 **Student Success Stories & Placements**:

Our alumni have achieved remarkable career transitions into software and AI engineering:

* *"Transitioned from a non-IT background to Full Stack Developer in 60 days. The practical mentorship and live project experience made all the difference!"*  
  — **Pooja S.** (Software Engineer, Pune)
* *"The Super10 program helped me crack a 12 LPA backend engineering offer with top tech firms. The system design mock interviews were invaluable."*  
  — **Rahul M.** (Backend AI Engineer)
* *"Outstanding hands-on curriculum. Unlike regular courses, we wrote production code from week one."*  
  — **Amit K.** (Full Stack Developer)

Would you like to connect with an alumnus or see our hiring partner companies?`,
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
  "credentialType": "Full Stack AI Specialist (60-Day Program)"
}
\`\`\`

Do you have a certificate ID you would like to verify right now?`,
  },
  enquiry: {
    text: `📞 **Get in Touch with Admissions**:

Ready to accelerate your tech career? Our admissions counselors and mentors are available for guidance:

* **Phone / WhatsApp**: +91 91729 11988
* **Office & Lab**: Pune, Maharashtra
* **Email**: admissions@jarvisaiacademy.com
* **Walk-In Hours**: Monday – Saturday, 10:00 AM – 7:00 PM IST

Drop your contact number or question here and an engineering advisor will get in touch with you directly!`,
  },
  deep_research: {
    text: `🔬 **Jarvis Autonomous Deep Research**:

Our autonomous research pipeline synthesizes comprehensive technical analyses:

* **Curriculum & Tech Comparison**: Multi-step deep synthesis across market trends, enterprise tech stacks, and modern software architectures.
* **Placement & Salary Benchmarks**: In-depth analysis of compensation benchmarks and hiring partner criteria.
* **Cited Engineering Reports**: Generates structured markdown dossiers with verified sources and code snippets.

Log in to run multi-step research and save comprehensive reports to revisit later!`,
  },
  terms: {
    text: `# Terms & Conditions — Jarvis AI Academy

**Effective Date:** January 1, 2025  
**Entity:** Jarvis AI Academy (Pune, Maharashtra, India)

Welcome to **Jarvis AI Academy**! By enrolling in any cohort, accessing our engineering portals, or utilizing our curriculum resources, you agree to comply with and be bound by the following Terms & Conditions:

---

### 1. Admissions, Enrollment & Cohort Structure
* **Duration:** All programs have an intensive **60-day duration**.
* **Prerequisites & Screening:** Admission into specialized cohorts—specifically our **Super10 Elite Batch**—requires successful completion of our baseline programming assessment and technical screening interview.
* **Attendance & Milestone Delivery:** Candidates are expected to maintain at least **85% live attendance** and complete scheduled capstone milestones to remain eligible for placement drives.

---

### 2. Intellectual Property Rights
* **Academy Course Materials:** All proprietary lectures, architectural blueprints, curated roadmaps, video guides, coding challenge solutions, and course frameworks are the exclusive intellectual property of Jarvis AI Academy.
* **Learner Projects & Repositories:** Any software or capstone built individually by the learner during the cohort remains **100% the learner's intellectual property**.

---

### 3. Refer & Earn Program Terms
* Referrers receive **₹5,000** for each referred candidate.
* The payout is released once the referred student successfully completes the entire 60-day program.

---

### 4. Super10 Placement Assurance Terms
The signature **Super10 Elite Batch** includes our 100% job placement guarantee under the following conditions:
* Consistent submission and passing of all **commercial capstone projects**.
* Completion of scheduled mock technical interviews with lead engineers.
* Active application and attendance for interviews scheduled with hiring partners.

---

### 5. Governing Law & Jurisdiction
These Terms are governed by the **laws of India**. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in **Pune, Maharashtra**.`,
  },
  privacy: {
    text: `# Privacy Policy — Jarvis AI Academy

**Last Updated:** January 1, 2025  
**Compliance Standards:** Digital Personal Data Protection (DPDP) Act 2023 & GDPR Principles

At **Jarvis AI Academy**, we respect your personal data and are committed to transparency:

* **Identity Information:** Full name, email address, phone/WhatsApp number, educational background.
* **Academic Records:** Cohort attendance, code review feedback, assignment submissions, certificate issuance records.
* **Zero Data Selling:** Jarvis AI Academy never sells, rents, or monetizes student personal data to third-party advertisers.
* **Data Protection:** All data in transit is protected using modern **TLS 1.3** encryption. Sensitive records are encrypted with **AES-256**.

Contact Data Privacy Officer: \`privacy@jarvisaiacademy.com\``,
  },
  payment_terms: {
    text: `# Payment Terms & Refund Policy — Jarvis AI Academy

**Effective Date:** January 1, 2025  
**Applies to:** Full-Stack AI & Web Engineering Cohort and Super10 Elite Batch

At **Jarvis AI Academy**, we maintain transparent, straightforward pricing with no hidden fees.

---

### 1. Transparent Fee Structure
* **Program Tuition:** Flat **₹30,000** (₹30K) tuition fee for all **60-day programs**.
* **Duration:** **60 Days (2 Months)** live intensive training.
* **No Hidden Costs:** No examination fees, lab setup fees, or certification charges.
* **Taxes & Invoicing:** All program fees are subject to statutory **18% GST**, with GST-compliant tax invoices provided immediately.

---

### 2. 🎁 Refer & Earn Policy (₹5,000 Reward)
* Anyone can refer prospective candidates to Jarvis AI Academy.
* Referrer receives **₹5,000** cash reward once the referred student successfully completes the whole 60-day course.

---

### 3. Accepted Payment Methods
* **UPI & Net Banking:** Google Pay, PhonePe, Paytm, and all major Indian banking portals.
* **Credit & Debit Cards:** Visa, Mastercard, RuPay, and American Express.
* **Zero-Cost EMI Financing:** Flexible installment plans available.

---

### 4. 7-Day Money-Back Guarantee (Trial Period)
* If within the first **7 days** from your batch commencement date you decide the program is not the right fit, you are entitled to a **100% full refund**—no questions asked.
* Submit a written request to \`admissions@jarvisaiacademy.com\` within the 7-day window. Refunds are credited in **5–7 business days**.

For billing assistance: \`finance@jarvisaiacademy.com\` | 📞 **+91 91729 11988**`,
  },
  enroll: {
    text: `# Admissions & Enrollment Portal — ${siteConfig.name}

Welcome to the direct admissions and enrollment portal. Confirm your seat for the upcoming cohort with our transparent pricing and **7-day 100% money-back guarantee**.

### Available Cohort Tracks:
* **Program Duration**: **60 Days (60d / 2 Months)** for all courses.
* **Program Tuition**: **₹30,000** (₹30K) + 18% GST (₹35,400 total).
* **Tracks**:
  * **Full-Stack AI & Web Engineering** (60 Days Live)
  * **Super10 Elite Cohort** (60 Days, 100% Placement Assurance)

---

### 🎁 Refer & Earn ₹5,000:
* Refer a friend or colleague to any Jarvis AI Academy program.
* Earn a **₹5,000** cash reward once your referred candidate completes the full 60-day course!

Please select your program below and proceed with the secure checkout. Your verified Tax Invoice & Receipt will be available for download immediately upon confirmation.`,
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

  // Core simulated token streamer
  const streamAIResponse = useCallback(
    (
      fullText: string,
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

  // Handle New Chat reset and auto-trigger sample chat starter
  useEffect(() => {
    if (resetSignal && resetSignal > 0) {
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
          streamAIResponse(WELCOME_AI_RESPONSE);
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
      lower.includes("5k") ||
      lower.includes("5000") ||
      lower.includes("reward") ||
      lower.includes("affiliate") ||
      lower.includes("invite")
    ) {
      return academyKnowledge.referral;
    } else if (
      lower.includes("enroll") ||
      lower.includes("admission") ||
      lower.includes("checkout") ||
      lower.includes("pay") ||
      lower.includes("payment") ||
      lower.includes("register") ||
      lower.includes("book seat") ||
      lower.includes("join batch") ||
      lower.includes("join cohort")
    ) {
      return academyKnowledge.enroll;
    } else if (lower.includes("super10") || lower.includes("batch") || lower.includes("elite")) {
      return academyKnowledge.super10;
    } else if (
      lower.includes("course") ||
      lower.includes("learn") ||
      lower.includes("fees") ||
      lower.includes("duration") ||
      lower.includes("60") ||
      lower.includes("30k") ||
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
      text: `Thank you for your question about **"${prompt}"**!\n\nAt **Jarvis AI Academy**, our programs feature:\n* **Duration**: Fast-track **60 Days (2 Months)** build-first training.\n* **Tuition**: **₹30,000** (₹30K) flat fees across all courses.\n* **🎁 Refer & Earn**: Refer a student and receive **₹5,000** cash reward once they complete the full 60-day course!\n\nWould you like to explore our course syllabus, the **Super10** batch, or start enrollment?`,
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
        streamAIResponse(responseData.text);
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
        referral: "Tell me about the Refer & Earn program (₹5,000 reward)",
        testimonials: "Show me student reviews and placement testimonials",
        certificate: "How do I verify a certificate issued by Jarvis AI Academy?",
        enquiry: "I'd like to get in touch with an admissions counselor",
        enroll: "I want to enroll in the upcoming cohort and proceed with payment",
        terms: "Can you provide the Terms & Conditions of Jarvis AI Academy?",
        privacy: "What is the Privacy Policy of Jarvis AI Academy?",
        payment_terms: "What are the Payment Terms, fee structure, and refund policy at Jarvis AI Academy?",
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
        streamAIResponse(data.text);
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
        streamAIResponse(alternativeText);
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
        streamAIResponse(data.text);
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
        className="flex-1 overflow-y-auto no-scrollbar pb-44 sm:pb-36 pt-2 sm:pt-4"
      >
        <ChatMessages
          messages={messages}
          onRegenerate={handleRegenerate}
          onEditSubmit={handleEditSubmit}
          onFeedback={handleFeedback}
          onUpdateEnrollment={handleUpdateEnrollment}
          onActionPrompt={handleActionPrompt}
          currentUser={user}
        />
      </div>

      {/* Floating Transparent Sticky Composer */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none bg-gradient-to-t from-background via-background/85 to-transparent pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 px-3 sm:px-4 flex flex-col items-center transition-colors">
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
        {/* Subtle Disclaimer Footer - shown on desktop screens where vertical space is ample */}
        <p className="text-[11px] text-neutral-500 mt-1.5 text-center select-none hidden sm:block">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
