"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessages, ChatMessage } from "./chat-messages";
import { ChatComposer } from "./ChatComposer";
import { CitationItem } from "./citations-view";
import { siteConfig } from "@/config/site";

const SAMPLE_STARTER_QUESTION = `Hi! I want to transition into AI & Full-Stack software engineering. How does ${siteConfig.name} help learners reach production-ready skills?`;

const WELCOME_AI_RESPONSE = `Welcome to **${siteConfig.name}**! 🚀  
*${siteConfig.tagline}*

We specialize in high-impact software engineering programs engineered to take you from core programming to building and deploying production-ready AI systems:

* **Practical, Build-First Learning**: 70% hands-on commercial project development rather than passive lectures.
* **Flagship Programs**: Comprehensive **Full-Stack AI & Web Engineering** and our signature **Super10 Elite Cohort** with 100% placement assurance.
* **1-on-1 Mentorship**: Direct weekly architecture reviews, mock technical interviews, and resume coaching with lead software engineers.

Whether you're starting with zero tech experience or looking to upskill into generative AI applications, I can tailor a personalized learning roadmap for you.

What area would you like to explore first — our **Course Curriculum**, the **Super10 Batch**, or **Student Placements**?`;

const WELCOME_CITATIONS: CitationItem[] = [
  {
    id: "c-init-1",
    number: 1,
    title: `${siteConfig.name} Overview & Charter`,
    source: "Jarvis Academic Advisory Board",
    snippet: "Hands-on engineering cohorts focusing on Next.js, Python architectures, and production GenAI pipelines.",
    url: "https://jarvisaiacademy.com",
  },
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
    citations: WELCOME_CITATIONS,
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
    text: `📞 **Get in Touch with Admissions**:

Ready to accelerate your tech career? Our admissions counselors and mentors are available for guidance:

* **Phone / WhatsApp**: +91 91729 11988
* **Office & Lab**: Pune, Maharashtra
* **Email**: admissions@jarvisaiacademy.com
* **Walk-In Hours**: Monday – Saturday, 10:00 AM – 7:00 PM IST

Drop your contact number or question here and an engineering advisor will get in touch with you directly!`,
    citations: [
      {
        id: "c-enq-1",
        number: 1,
        title: "Jarvis AI Academy Admissions & Counseling",
        source: "Student Advisory Desk",
        snippet: "Counselors available for career transition guidance, syllabus evaluation, and batch scheduling.",
        url: "https://jarvisaiacademy.com/contact",
      },
    ],
  },
  deep_research: {
    text: `🔬 **Jarvis Autonomous Deep Research**:

Our autonomous research pipeline synthesizes comprehensive technical analyses:

* **Curriculum & Tech Comparison**: Multi-step deep synthesis across market trends, enterprise tech stacks, and modern software architectures.
* **Placement & Salary Benchmarks**: In-depth analysis of compensation benchmarks and hiring partner criteria.
* **Cited Engineering Reports**: Generates structured markdown dossiers with verified sources and code snippets.

Log in to run multi-step research and save comprehensive reports to revisit later!`,
    citations: [
      {
        id: "c-deep-1",
        number: 1,
        title: "Jarvis Autonomous Synthesis Pipeline",
        source: "Jarvis Research Lab",
        snippet: "Autonomous agent synthesizing multi-source technical documentation and curriculum benchmarks.",
        url: "https://jarvisaiacademy.com/research",
      },
    ],
  },
  terms: {
    text: `# Terms & Conditions — Jarvis AI Academy

**Effective Date:** January 1, 2025  
**Entity:** Jarvis AI Academy (Pune, Maharashtra, India)

Welcome to **Jarvis AI Academy**! By enrolling in any cohort, accessing our engineering portals, or utilizing our curriculum resources, you agree to comply with and be bound by the following Terms & Conditions:

---

### 1. Admissions, Enrollment & Cohort Structure
* **Prerequisites & Screening:** Admission into specialized cohorts—specifically our **Super10 Elite Batch**—requires successful completion of our baseline programming assessment and technical screening interview.
* **Enrollment License:** Enrollment is strictly personal to the registered candidate. Credentials, private repository invitations, and portal access keys may not be shared, transferred, or sublicensed.
* **Attendance & Milestone Delivery:** Our programs rely on a build-first methodology. Candidates are expected to maintain at least **85% live attendance** and complete scheduled capstone milestones to remain eligible for placement drives.

---

### 2. Intellectual Property Rights
* **Academy Course Materials:** All proprietary lectures, architectural blueprints, curated roadmaps, video guides, coding challenge solutions, and course frameworks are the exclusive intellectual property of Jarvis AI Academy.
* **Learner Projects & Repositories:** Any software, application, model, or capstone built individually by the learner during the cohort remains **100% the learner's intellectual property**. You retain full commercial ownership of the code you author.

---

### 3. Academic Integrity & Code of Conduct
* **Academic Honesty:** While we teach and encourage the use of modern developer AI assistants, all capstone deliverables must demonstrate individual code understanding. Passing off existing commercial templates or unauthorized code without attribution constitutes grounds for review.
* **Collaborative Culture:** Learners must maintain professional, respectful communication in peer code reviews, Discord/Slack discussions, and live architecture critiques. Harassment or discriminatory conduct results in immediate termination without refund.

---

### 4. Super10 Placement Assurance Terms
The signature **Super10 Elite Batch** includes our 100% job placement guarantee under the following conditions:
* Consistent submission and passing of all **4 commercial capstone projects**.
* Completion of at least **6 scheduled mock technical interviews** with lead engineers.
* Active application and attendance for interviews scheduled with hiring partners across Pune, Bangalore, and remote software hubs.
* Maintenance of a verified GitHub portfolio displaying genuine commit histories.

---

### 5. Limitation of Liability & Termination
* Jarvis AI Academy is not liable for indirect, incidental, or consequential damages resulting from third-party service outages or cloud lab interruptions.
* The Academy reserves the right to suspend or terminate access for any learner violating intellectual property or code of conduct agreements.

---

### 6. Governing Law & Jurisdiction
These Terms are governed and construed in accordance with the **laws of India**. Any disputes arising shall be subject to the exclusive jurisdiction of the competent courts in **Pune, Maharashtra**.

For legal inquiries: \`legal@jarvisaiacademy.com\``,
    citations: [
      {
        id: "c-terms-1",
        number: 1,
        title: "Jarvis AI Academy Academic Charter & Student Agreement",
        source: "Legal & Academic Advisory Board",
        snippet: "Comprehensive terms covering enrollment eligibility, intellectual property ownership, and Super10 placement assurance conditions.",
        url: "https://jarvisaiacademy.com/terms",
      },
    ],
  },
  privacy: {
    text: `# Privacy Policy — Jarvis AI Academy

**Last Updated:** January 1, 2025  
**Compliance Standards:** Digital Personal Data Protection (DPDP) Act 2023 & GDPR Principles

At **Jarvis AI Academy**, we respect your personal data and are committed to transparency in how your information is collected, processed, and protected.

---

### 1. Information We Collect
We collect only the information necessary to provide software training, personalized mentorship, and placement acceleration:
* **Identity Information:** Full name, email address, phone/WhatsApp number, current educational background, and residential city.
* **Professional Profiles:** Resume/CV, GitHub profile URL, LinkedIn profile, portfolio projects, and technical assessment scores.
* **Academic Records:** Cohort attendance, code review feedback, assignment submissions, mentor evaluations, and certificate issuance records.
* **Billing Details:** Transaction IDs, payment mode, and tax invoice information. *(Note: All debit/credit card and UPI transactions are processed through PCI-DSS Level 1 compliant payment gateways; we never store raw card numbers or banking passwords).*
* **Technical Logs:** Device type, browser user agent, IP address, and platform usage metrics to ensure security and prevent unauthorized account access.

---

### 2. How We Use Your Data
Your information is utilized strictly for educational and career acceleration purposes:
* Delivering live classes, scheduling 1-on-1 code reviews, and tracking curriculum progress.
* Presenting verified learner dossiers and portfolio capstones to vetted enterprise hiring partners during placement drives.
* Generating cryptographically verifiable credentials on the Jarvis Academic Registry.
* Sending transactional updates, batch schedules, and curriculum updates.

---

### 3. Data Protection & Security Controls
* **Encryption:** All data in transit is protected using modern **TLS 1.3** encryption. Sensitive learner records at rest are secured with **AES-256** encryption.
* **Access Control:** Student records are restricted strictly to authorized mentors and career placement coordinators on a need-to-know basis.
* **Zero Data Selling:** Jarvis AI Academy never sells, rents, or monetizes student personal data to third-party advertisers or lead brokers.

---

### 4. Third-Party Service Providers
We partner exclusively with trusted, industry-standard service providers:
* **Cloud Infrastructure:** Secure hosting on ISO 27001 and SOC 2 certified data centers (AWS & Google Cloud).
* **Payment Gateways:** Razorpay & Stripe for secure payment processing.
* **Communication:** Official WhatsApp business channels and transactional email providers for admissions updates.

---

### 5. Your Rights & Data Control
Under applicable data protection laws, you retain the following rights:
* **Access & Export:** Request a copy of all personal records and evaluation metrics stored with the Academy.
* **Rectification:** Update or correct any incomplete or outdated personal information.
* **Deletion ("Right to be Forgotten"):** Request permanent deletion of non-essential records upon cohort completion (subject to statutory tax record retention).

To exercise your privacy rights or file an inquiry, contact our Data Privacy Officer at:  
📧 **\`privacy@jarvisaiacademy.com\`**`,
    citations: [
      {
        id: "c-privacy-1",
        number: 1,
        title: "Jarvis AI Academy Privacy Policy & DPDP Compliance",
        source: "Data Protection Office",
        snippet: "Data protection standards, student records encryption, zero data selling guarantee, and GDPR/DPDP learner rights.",
        url: "https://jarvisaiacademy.com/privacy",
      },
    ],
  },
  payment_terms: {
    text: `# Payment Terms & Refund Policy — Jarvis AI Academy

**Effective Date:** January 1, 2025  
**Applies to:** Full-Stack AI & Web Engineering Cohort and Super10 Elite Batch

At **Jarvis AI Academy**, we maintain transparent, straightforward pricing with no hidden fees. Below are the complete payment terms, installment schedules, and refund policies.

---

### 1. Transparent Fee Structure
* **Program Tuition:** Tuition covers complete live cohort access, mentor code reviews, production cloud lab credits, and placement support.
* **No Hidden Costs:** We do not charge examination fees, lab setup fees, or certification charges.
* **Taxes & Invoicing:** In accordance with Indian taxation laws, all program fees are subject to statutory **18% GST**. A GST-compliant tax invoice is automatically generated and emailed immediately upon transaction completion.

---

### 2. Accepted Payment Methods
We support secure, flexible digital payment channels:
* **UPI & Net Banking:** Google Pay, PhonePe, Paytm, and all major Indian banking portals.
* **Credit & Debit Cards:** Visa, Mastercard, RuPay, and American Express.
* **Zero-Cost EMI Financing:** Flexible 3, 6, 9, and 12-month installment plans via our education financing partners (subject to standard partner credit approval).

---

### 3. 7-Day Money-Back Guarantee (Trial Period)
We stand behind the quality of our mentorship and curriculum:
* **Full Refund Window:** If within the first **7 days** from your batch commencement date you decide the program is not the right fit, you are entitled to a **100% full refund** of the tuition paid—no questions asked.
* **Process:** Submit a written refund request to \`admissions@jarvisaiacademy.com\` before 11:59 PM IST on the 7th day of the cohort. Approved refunds are credited to the original payment source within **5–7 business days**.

---

### 4. Super10 Cohort Reservation Terms
* Because the **Super10 Elite Batch** is strictly capped at **10 students per cohort**, an initial seat reservation deposit is required upon passing the screening interview.
* Reservation deposits hold your seat exclusively and prevent allocation to waitlisted candidates.
* Once the 7-day trial period concludes, tuition fees become non-refundable as cohort seats cannot be reallocated mid-term.

---

### 5. Installment & EMI Obligations
* For students opting for milestone installment payments, installment dues must be cleared on or before the agreed milestone dates.
* A **5-day grace period** is provided for unforeseen bank processing delays. Continued non-payment after the grace period may result in temporary suspension of repository access and live lab environments until dues are cleared.

---

### 6. Scholarships & Merit Waivers
* Top performers in our quarterly entrance coding challenge may receive up to a **25% merit fee waiver**.
* Merit scholarships apply directly to total tuition and are non-transferable and non-convertible to cash.

For billing assistance or corporate sponsorship inquiries:  
📧 **\`finance@jarvisaiacademy.com\`** | 📞 **+91 91729 11988**`,
    citations: [
      {
        id: "c-pay-1",
        number: 1,
        title: "Jarvis AI Academy Tuition Policy & 7-Day Money-Back Guarantee",
        source: "Admissions & Finance Registry",
        snippet: "Clear fee structure, 18% GST invoicing, zero-cost EMI plans, and 100% money-back guarantee policy details.",
        url: "https://jarvisaiacademy.com/payment-terms",
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
          streamAIResponse(WELCOME_AI_RESPONSE, WELCOME_CITATIONS);
        }, 120);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [resetSignal, streamAIResponse]);

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
        className="flex-1 overflow-y-auto no-scrollbar pb-44 sm:pb-36 pt-2 sm:pt-4"
      >
        <ChatMessages
          messages={messages}
          onRegenerate={handleRegenerate}
          onEditSubmit={handleEditSubmit}
          onFeedback={handleFeedback}
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
