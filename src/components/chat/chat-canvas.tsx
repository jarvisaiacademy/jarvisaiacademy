"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { ChatMessages, ChatMessage } from "./chat-messages";
import { ChatComposer } from "./ChatComposer";
import { EnrollmentData } from "./enrollment-card";
import { useAuth } from "@/providers/auth-provider";
import { siteConfig } from "@/config/site";

const SAMPLE_STARTER_QUESTION = `Hi! I want to transition into AI & Full-Stack software engineering. How does ${siteConfig.name} help learners reach production-ready skills?`;

const WELCOME_AI_RESPONSE = `Welcome to **${siteConfig.name}**! 🚀  
*${siteConfig.tagline}*

We specialize in high-impact software engineering programs engineered to take you from core programming to building and deploying production-ready AI systems:

* **Fast-Track 60-Day Duration**: All programs are intensive **60 days (2 months)** with build-first commercial project development.
* **Transparent Pricing**: **₹0** tuition — every seat is fully sponsored across all courses.
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

interface TopicResponseData {
  text: string;
  suggestions?: string[];
  showCourseCatalog?: boolean;
}

const academyKnowledge: Record<string, TopicResponseData> = {
  courses: {
    text: `Here are our featured programs to help you learn, build, and accelerate your engineering career.
Choose a category or explore all courses below:`,
    showCourseCatalog: true,
    suggestions: [
      "What is the fee structure & payment options?",
      "Tell me about the Super10 Elite Batch with 100% placement assurance",
      "How does the ₹3,000 Refer & Earn program work?",
    ],
  },
  super10: {
    text: `⚡ **Super10 Elite Batch** is our signature, high-intensity career acceleration program.

* **Duration**: **60 Days (2 Months)** high-intensity commercial training.
* **Tuition Fee**: **₹0** — [why ₹0?](#ask:Why%20is%20the%20Super10%20tuition%20%E2%82%B90%3F)
* **Program Cap**: Strictly limited to **10 selected candidates** per batch to guarantee bespoke attention.
* **Format**: Hands-on live commercial projects, daily peer code reviews, and enterprise system designs.
* **1-on-1 Mentorship**: Direct weekly architecture reviews with lead tech architects.
* **Placement Guarantee**: 100% job placement assurance with partner tech companies across Pune and remote hubs.
* **🎁 Referral Bonus**: Refer a peer to Super10 and earn **₹3,000** after they complete the full 60-day program!

> "Super10 is engineered for ambitious learners ready to build real production-grade systems and secure senior developer packages."

Would you like to review the eligibility criteria or reserve a screening interview?`,
    suggestions: [
      "What is the fee structure for Super10?",
      "How does the 100% placement assurance work?",
      "I want to enroll in the upcoming program and proceed with payment",
    ],
  },
  sponsored: {
    text: `### 🎓 Why is the tuition ₹0?

Every seat at **Jarvis AI Academy** is a **fully sponsored seat** — the programme cost is covered for you, so you join at **₹0** tuition.

* **What you pay**: **₹0**. No tuition fee, no registration fee, no GST, no certification charge.
* **Why**: your seat is funded rather than bought, so there is no fee to recover from you.
* **What is expected**: a full-time commitment to the **60-day** program — daily code reviews, live commercial projects and the capstone. A sponsored seat is released if a learner stops attending.
* **Availability**: **Super10** is capped at **10 candidates** per batch; every other track has its own intake cap.

* **🎁 Refer & Earn**: unchanged — refer a friend and earn **₹3,000** once they complete the full 60-day course.

Would you like to check seat availability for the upcoming program?`,
    suggestions: [
      "I want to enroll in the upcoming program and proceed with payment",
      "How does the 100% placement assurance work?",
      "What is the fee structure for Super10?",
    ],
  },
  referral: {
    text: `# 🎁 Refer & Earn ₹3,000 — Jarvis AI Academy Referral Program

Earn **₹3,000** direct bonus for every learner you refer to Jarvis AI Academy!

### How the Referral Program Works:
1. **Invite a Learner**: Refer a friend, colleague, or classmate to enroll in any 60-day program.
2. **They Enroll**: Your referred person enrolls in their chosen program (Program Fee: **₹0** — fully sponsored).
3. **Course Completion**: They attend classes, submit projects, and finish the full **60-day course**.
4. **Get Rewarded**: Once the referred candidate completes the whole course, you receive **₹3,000** cash reward directly via UPI or bank transfer!

### Key Program Details:
* **Reward Amount**: **₹3,000** per student on successful course completion.
* **Disbursement**: Prompt payout upon verification of course completion.
* **No Caps**: Refer 5 peers and earn **₹15,000**!
* Refer 10 peers and earn **₹30,000**!

Ready to refer someone? Share their details with our admissions desk or have them mention your name during registration!`,
    suggestions: [
      "How do I refer my friend right now?",
      "What is the course duration and fee structure?",
      "How do I enroll in the upcoming program?",
      "Tell me about available courses at Jarvis AI Academy",
    ],
  },
  frontend: {
    text: `### ⚛️ Frontend Engineering (ReactJS + Tailwind CSS)
    
* **Duration**: **60 Days (8 Weeks)** hands-on training.
* **Tuition**: **₹0** — fully sponsored across all programs.
* **Tech Stack**: React 19, Tailwind CSS, TypeScript, modern ES6+ JavaScript, HTML5 & CSS3.

#### Core Modules:
1. **Semantic HTML5 & Responsive CSS3**: Modern layout patterns, Flexbox, Grid, CSS animations.
2. **Modern JavaScript (ES6+) & TypeScript**: Closures, async/await, DOM APIs, strict typing.
3. **ReactJS Architecture**: Component hierarchy, Props, custom Hooks, Context API.
4. **Tailwind CSS Utility Design**: Rapid UI styling, dark mode configuration, mobile-first design.
5. **Production Capstone**: Build a high-performance responsive web dashboard with live API integration.

* **🎁 Refer & Earn**: Refer a friend to this course and earn **₹3,000** once they complete!`,
    suggestions: [
      "I want to enroll in the Frontend Engineering program and proceed with payment",
      "What projects will I build in Frontend Engineering?",
      "Tell me about the Super10 Elite Batch with 100% placement assurance",
    ],
  },
  backend: {
    text: `### 🐍 Backend Engineering (Python + FastAPI + Django)

* **Duration**: **60 Days (10 Weeks)** intensive API engineering.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: Python, FastAPI, Django, PostgreSQL, REST APIs, JWT Auth.

#### Core Modules:
1. **Advanced Python**: OOP, decorators, generators, async concurrency.
2. **FastAPI Asynchronous APIs**: Pydantic models, OpenAPI documentation, async endpoints.
3. **Django Framework**: ORM relations, admin dashboard, auth middleware.
4. **PostgreSQL Database**: Indexing, migrations, query optimization.
5. **Live Capstone**: Architect a scalable microservice with real-time authentication and payment processing.

* **🎁 Refer & Earn**: Refer a student and receive **₹3,000** upon course completion!`,
    suggestions: [
      "I want to enroll in Backend Engineering and proceed with payment",
      "How is FastAPI compared with Django in this course?",
      "Show all available courses",
    ],
  },
  devops: {
    text: `### ☁️ DevOps & Cloud Engineering (AWS + Docker + CI/CD)

* **Duration**: **60 Days (10 Weeks)** cloud automation.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: AWS (EC2, S3, IAM, VPC), Docker, Kubernetes, Linux, GitHub Actions CI/CD.

#### Core Modules:
1. **Linux Systems & Shell Scripting**: Server management, permissions, automated bash scripts.
2. **Docker Containers**: Containerizing full-stack apps, multi-stage Dockerfiles, Docker Compose.
3. **AWS Core Architecture**: Deploying on AWS EC2, S3 asset delivery, IAM security.
4. **Kubernetes Basics**: Pods, services, deployments, and cluster management.
5. **CI/CD Pipelines**: Automated GitHub Actions testing and zero-downtime releases.

* **🎁 Refer & Earn**: Earn **₹3,000** cash reward for every referral who completes the course!`,
    suggestions: [
      "I want to enroll in DevOps & Cloud Engineering and proceed with payment",
      "What AWS certifications does this course prepare for?",
      "Show all available courses",
    ],
  },
  database: {
    text: `### 🗄️ Database Administration (Oracle + PL/SQL + MongoDB)

* **Duration**: **60 Days (8 Weeks)** enterprise database administration.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: Oracle Database, PL/SQL, MongoDB, MySQL.

#### Core Modules:
1. **Relational Database Design**: Normalization, schemas, referential integrity.
2. **PL/SQL Mastery**: Stored procedures, functions, packages, triggers, cursors.
3. **NoSQL with MongoDB**: Collections, document modeling, aggregation pipelines.
4. **Performance Tuning**: Index optimization, query execution plans, memory buffers.
5. **Disaster Recovery**: Backups, replication, point-in-time recovery strategies.`,
    suggestions: [
      "I want to enroll in Database Administration and proceed with payment",
      "What are the career prospects for Database Admins?",
      "Show all available courses",
    ],
  },
  data_analyst: {
    text: `### 📊 Data Analyst (PowerBI + SQL + SAP + Python)

* **Duration**: **60 Days (12 Weeks)** business intelligence & analytics.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: Microsoft PowerBI, MySQL, Python (Pandas/NumPy), SAP BI.

#### Core Modules:
1. **PowerBI Visual Reporting**: Interactive dashboards, slicers, mobile layouts.
2. **DAX & Data Modeling**: Calculated columns, measures, relationship topologies.
3. **Advanced SQL**: Window functions, subqueries, aggregations, schema joins.
4. **Python Data Wrangling**: Pandas, NumPy, statistical distribution analysis.
5. **Enterprise Capstone**: Build an executive revenue intelligence dashboard for board presentation.`,
    suggestions: [
      "I want to enroll in Data Analyst with PowerBI and proceed with payment",
      "What is the difference between Data Analyst and Business Analyst?",
      "Show all available courses",
    ],
  },
  business_analyst: {
    text: `### 📋 Business Analyst (PowerBI + MySQL + BRD + Jira)

* **Duration**: **60 Days (8 Weeks)** strategy and requirements engineering.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: PowerBI, MySQL, Jira Agile Boards, BRD/PRD Documentation.

#### Core Modules:
1. **Business Analysis Methodologies**: Requirements gathering, gap analysis, stakeholder mapping.
2. **BRD & PRD Documentation**: Writing industry-standard Functional Specifications and User Stories.
3. **Agile & Jira Sprint Tracking**: Managing backlogs, sprint ceremonies, burndown charts.
4. **SQL for Analysts**: Querying operational databases without developer dependencies.
5. **PowerBI Executive Dashboards**: Visualizing KPIs, conversion funnels, and churn metrics.`,
    suggestions: [
      "I want to enroll in the Business Analyst program and proceed with payment",
      "Show all available courses",
    ],
  },
  genai: {
    text: `### 🤖 Generative AI, RAG & Agentic Systems

* **Duration**: **60 Days (2 Months)** cutting-edge AI engineering.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: Python, OpenAI API, Gemini SDK, LangChain, Pinecone / Chroma Vector DBs, FastAPI.

#### Core Modules:
1. **Prompt Engineering & Structured Outputs**: Few-shot prompting, JSON schemas, function calling.
2. **RAG Architecture**: Document chunking, vector embeddings, hybrid semantic search.
3. **Autonomous Agent Workflows**: Tool execution, multi-step reasoning, LangGraph state machines.
4. **Production LLMOps**: Latency optimization, prompt caching, evaluation guardrails.
5. **Capstone Project**: Deploy an end-to-end multi-agent coding assistant with live web browsing.`,
    suggestions: [
      "I want to enroll in Generative AI & Agents and proceed with payment",
      "Show all available courses",
    ],
  },
  laravel: {
    text: `### 🚀 Full-Stack Web Development (Laravel + PHP + MySQL)

* **Duration**: **60 Days (10 Weeks)** enterprise PHP web development.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: PHP, Laravel, MySQL, Bootstrap, JavaScript.

#### Core Modules:
1. **Modern PHP**: OOP patterns, namespace resolution, Composer package management.
2. **Laravel MVC Architecture**: Blade templating, routing, Eloquent ORM relationships.
3. **Authentication & Roles**: Multi-guard auth, middleware security, password resets.
4. **REST APIs & AJAX**: Building JSON APIs for frontends and mobile consumers.
5. **Deployment & Maintenance**: Server setup, cron jobs, database backups.`,
    suggestions: [
      "I want to enroll in Laravel Web Development and proceed with payment",
      "Show all available courses",
    ],
  },
  app_support: {
    text: `### 🛠️ Application Support & Cloud Ops (Linux + MySQL)

* **Duration**: **60 Days (8 Weeks)** technical support & cloud operations.
* **Tuition**: **₹0** — fully sponsored.
* **Tech Stack**: Linux, MySQL, Shell Scripting, Ubuntu, Git.

#### Core Modules:
1. **Linux Administration**: Command-line utilities, file permissions, daemon management.
2. **Bash Scripting**: Automated health checks, disk monitoring, log rotating.
3. **MySQL Troubleshooting**: Slow query log analysis, indexing, data restoration.
4. **Production Incident Management**: Debugging crash logs, triaging alerts, SLA compliance.
5. **Support Runbooks**: Writing escalation procedures and technical documentation.`,
    suggestions: [
      "I want to enroll in Application Support and proceed with payment",
      "Show all available courses",
    ],
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

* **Tamper-Proof Credential**: Each certificate carries a unique Certificate ID and QR code backed by digital signature verification.
* **LinkedIn Compatible**: One-click addition to your LinkedIn Licenses & Certifications profile.
* **Employer Instant Verification**: Recruiters and engineering leads can instantly validate completed capstones, course curricula, and evaluated competencies.
* **ID Format**: e.g., \`JAA-2026-XXXX\` printed on the bottom of your official credential.

Do you have a certificate ID you would like to verify right now?`,
  },
  enquiry: {
    text: `📞 **Get in Touch with Admissions**:

Ready to accelerate your tech career? Our admissions counselors and mentors are available for guidance:

* **Phone / WhatsApp**: +91 91729 11988
* **Office & Lab**: Pune, Maharashtra, India
* **Email**: [admissions@jarvisaiacademy.com](mailto:admissions@jarvisaiacademy.com)
* **Official Website**: [jarvisaiacademy.com](https://jarvisaiacademy.com)
* **Walk-In Hours**: Monday – Saturday, 10:00 AM – 7:00 PM IST

---

### 🌐 Official Social Channels
* 💼 **LinkedIn**: [@jarvisaiacademy](https://www.linkedin.com/company/jarvisaiacademy/)
* 📸 **Instagram**: [@jarvisaiacademy](https://www.instagram.com/jarvisaiacademy/)
* 🎥 **YouTube**: [@JarvisAIAcademy](https://www.youtube.com/@JarvisAIAcademy)
* 📘 **Facebook**: [@jarvisaiacademy](https://www.facebook.com/jarvisaiacademy/)
* 𝕏 **X (Twitter)**: [@jarvisaiacademy](https://x.com/jarvisaiacademy)

Drop your contact number or question here and an engineering advisor will get in touch with you directly!`,
    suggestions: [
      "What is the fee structure of courses?",
      "Tell me more about Super10 Elite batch with free course admission.",
      "How does ₹3,000 referral work?",
    ],
  },
  socials: {
    text: `### 🌐 Official Social Channels — Jarvis AI Academy

Connect with our community across all official channels for code walkthroughs, tech deep-dives, student success stories, and program announcements:

* 💼 **LinkedIn**: [@jarvisaiacademy](https://www.linkedin.com/company/jarvisaiacademy/) — *Alumni updates, hiring partner connections & official credentials*
* 📸 **Instagram**: [@jarvisaiacademy](https://www.instagram.com/jarvisaiacademy/) — *Campus life, project showcases & bite-sized software engineering tips*
* 🎥 **YouTube**: [@JarvisAIAcademy](https://www.youtube.com/@JarvisAIAcademy) — *In-depth code walkthroughs, full-stack architectural builds & tutorials*
* 📘 **Facebook**: [@jarvisaiacademy](https://www.facebook.com/jarvisaiacademy/) — *Community announcements, admissions webinars & news*
* 𝕏 **X (Twitter)**: [@jarvisaiacademy](https://x.com/jarvisaiacademy) — *AI news, tech discussions & founder updates*

* 🌐 **Official Website**: [jarvisaiacademy.com](https://jarvisaiacademy.com)  
* 📞 **Admissions Desk**: +91 91729 11988 | [admissions@jarvisaiacademy.com](mailto:admissions@jarvisaiacademy.com)`,
    suggestions: [
      "Tell me about the Super10 Elite Batch with 100% placement assurance",
      "What is the fee structure for the 60-day courses?",
      "How does the ₹3,000 Refer & Earn program work?",
    ],
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

Welcome to **Jarvis AI Academy**! By enrolling in any program, accessing our engineering portals, or utilizing our curriculum resources, you agree to comply with and be bound by the following Terms & Conditions:

---

### 1. Admissions, Enrollment & Program Structure
* **Duration:** All programs have an intensive **60-day duration**.
* **Prerequisites & Screening:** Admission into specialized programs—specifically our **Super10 Elite Batch**—requires successful completion of our baseline programming assessment and technical screening interview.
* **Attendance & Milestone Delivery:** Candidates are expected to maintain at least **85% live attendance** and complete scheduled capstone milestones to remain eligible for placement drives.

---

### 2. Intellectual Property Rights
* **Academy Course Materials:** All proprietary lectures, architectural blueprints, curated roadmaps, video guides, coding challenge solutions, and course frameworks are the exclusive intellectual property of Jarvis AI Academy.
* **Learner Projects & Repositories:** Any software or capstone built individually by the learner during the program remains **100% the learner's intellectual property**.

---

### 3. Refer & Earn Program Terms
* Referrers receive **₹3,000** for each referred candidate.
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
* **Academic Records:** Program attendance, code review feedback, assignment submissions, certificate issuance records.
* **Zero Data Selling:** Jarvis AI Academy never sells, rents, or monetizes student personal data to third-party advertisers.
* **Data Protection:** All data in transit is protected using modern **TLS 1.3** encryption. Sensitive records are encrypted with **AES-256**.

Contact Data Privacy Officer: [privacy@jarvisaiacademy.com](mailto:privacy@jarvisaiacademy.com)`,
  },
  payment_terms: {
    text: `# Payment Terms & Refund Policy — Jarvis AI Academy

**Effective Date:** January 1, 2025  
**Applies to:** Full-Stack AI & Web Engineering Program and Super10 Elite Batch

At **Jarvis AI Academy**, we maintain transparent, straightforward pricing with no hidden fees.

---

### 1. Transparent Fee Structure
* **Program Tuition:** **₹0** — every seat in all **60-day programs** is fully sponsored.
* **Duration:** **60 Days (2 Months)** live intensive training.
* **No Hidden Costs:** No examination fees, lab setup fees, or certification charges.
* **Taxes & Invoicing:** With a **₹0** tuition there is no taxable amount, so no GST applies.

---

### 2. 🎁 Refer & Earn Policy (₹3,000 Reward)
* Anyone can refer prospective candidates to Jarvis AI Academy.
* Referrer receives **₹3,000** cash reward once the referred student successfully completes the whole 60-day course.

---

### 3. Accepted Payment Methods
* **UPI & Net Banking:** Google Pay, PhonePe, Paytm, and all major Indian banking portals.
* **Credit & Debit Cards:** Visa, Mastercard, RuPay, and American Express.
* **Zero-Cost EMI Financing:** Flexible installment plans available.

---

### 4. 7-Day Money-Back Guarantee (Trial Period)
* If within the first **7 days** from your batch commencement date you decide the program is not the right fit, you are entitled to a **100% full refund**—no questions asked.
* Submit a written request to [admissions@jarvisaiacademy.com](mailto:admissions@jarvisaiacademy.com) within the 7-day window. Refunds are credited in **5–7 business days**.

For billing assistance: [finance@jarvisaiacademy.com](mailto:finance@jarvisaiacademy.com) | 📞 **+91 91729 11988**`,
    suggestions: [
      "I want to enroll in the upcoming program and proceed with payment",
      "Are zero-cost EMI installment plans available?",
      "How do I earn ₹3,000 by referring a friend?",
    ],
  },
  enroll: {
    text: `# Admissions & Enrollment Portal — ${siteConfig.name}

Welcome to the direct admissions and enrollment portal. Confirm your seat for the upcoming program with our transparent pricing and **7-day 100% money-back guarantee**.

### Available Program Tracks:
* **Program Duration**: **60 Days (60d / 2 Months)** for all courses.
* **Program Tuition**: **₹0** — fully sponsored, no GST applies.
* **Tracks**:
  * **Full-Stack AI & Web Engineering** (60 Days Live)
  * **Super10 Elite Program** (60 Days, 100% Placement Assurance)

---

### 🎁 Refer & Earn ₹3,000:
* Refer a friend or colleague to any Jarvis AI Academy program.
* Earn a **₹3,000** cash reward once your referred candidate completes the full 60-day course!

Please select your program below and proceed with the secure checkout. Your verified Tax Invoice & Receipt will be available for download immediately upon confirmation.`,
    suggestions: [
      "What are the accepted payment methods and EMI options?",
      "How does the 7-day 100% money-back guarantee work?",
      "Tell me about the ₹3,000 referral reward upon course completion",
    ],
  },
};

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
                    suggestions: suggestions,
                    showCourseCatalog: extraData?.showCourseCatalog,
                    enrollment: extraData?.enrollment,
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

    return {
      text: `Thank you for your question about **"${prompt}"**!\n\nAt **Jarvis AI Academy**, our programs feature:\n* **Duration**: Fast-track **60 Days (2 Months)** build-first training.\n* **Tuition**: **₹0** — every seat is fully sponsored.\n* **🎁 Refer & Earn**: Refer a student and receive **₹3,000** cash reward once they complete the full 60-day course!\n\n🌐 **Connect With Us Online**:\n* 💼 **LinkedIn**: [@jarvisaiacademy](https://www.linkedin.com/company/jarvisaiacademy/)\n* 📸 **Instagram**: [@jarvisaiacademy](https://www.instagram.com/jarvisaiacademy/)\n* 🎥 **YouTube**: [@JarvisAIAcademy](https://www.youtube.com/@JarvisAIAcademy)\n* 𝕏 **X (Twitter)**: [@jarvisaiacademy](https://x.com/jarvisaiacademy)\n* 📘 **Facebook**: [@jarvisaiacademy](https://www.facebook.com/jarvisaiacademy/)\n\nWould you like to explore our course syllabus, the **Super10** batch, or start enrollment?`,
      suggestions: [
        "What is the fee structure for the 60-day courses?",
        "Tell me about the Super10 Elite Program with 100% placement assurance",
        "How does the ₹3,000 Refer & Earn program work?",
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

      const userText = topicPrompts[topic] || `Tell me about ${topic}`;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
      };

      setMessages((prev) => [...prev, userMsg]);
      const data = academyKnowledge[topic] || determineReply(topic);

      setTimeout(() => {
        streamAIResponse(
          data.text,
          data.suggestions,
          { showCourseCatalog: data.showCourseCatalog }
        );
      }, 300);
    },
    [determineReply, streamAIResponse]
  );

  // Handle topic click from sidebar
  useEffect(() => {
    if (!activeTopic) return;
    openSection(activeTopic);
    onTopicHandled?.();
  }, [activeTopic, onTopicHandled, openSection]);

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
        className="flex-1 overflow-y-auto no-scrollbar pb-44 sm:pb-36 pt-2 sm:pt-4 relative z-0"
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

      {/* Floating Sticky Composer (Always on top with z-30) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none bg-gradient-to-t from-background via-background/95 to-transparent pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-3 px-3 sm:px-4 flex flex-col items-center transition-colors">
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
                className="whitespace-nowrap hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline transition-colors cursor-pointer"
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
