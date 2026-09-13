export interface CourseItem {
  id: string;
  enrollmentId?: "fullstack" | "super10";
  title: string;
  bannerTitle: string;
  bannerSubtitle: string;
  description: string;
  category: "all" | "web" | "ai" | "datascience" | "elite";
  categoryLabel: string;
  badge?: string;
  badgeType?: "bestseller" | "elite" | "popular" | "ai";
  duration: string;
  level: string;
  fee: string;
  amount: number;
  gradient: string;
  accentColor: string;
  techStack: string[];
  actionPrompt: string;
}

export const COURSE_CATEGORIES = [
  { id: "all", label: "All Courses" },
  { id: "web", label: "Web Development" },
  { id: "ai", label: "AI & ML" },
  { id: "datascience", label: "Data Science" },
  { id: "elite", label: "Super10 Elite" },
] as const;

export type CourseCategoryId = (typeof COURSE_CATEGORIES)[number]["id"];

export const COURSES_DATA: CourseItem[] = [
  {
    id: "fullstack",
    enrollmentId: "fullstack",
    title: "Full-Stack AI & Web Engineering",
    bannerTitle: "Full-Stack AI & Web Apps",
    bannerSubtitle: "Next.js 15 + FastAPI + Agentic AI",
    description: "Build production-ready web applications and autonomous AI systems with Next.js 15, React 19, FastAPI, PostgreSQL, and vector embeddings.",
    category: "web",
    categoryLabel: "Web Development",
    badge: "Bestseller",
    badgeType: "bestseller",
    duration: "60 Days (2 Months)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#0f172a] via-[#1e1b4b] to-[#0284c7]",
    accentColor: "text-sky-400",
    techStack: ["Next.js 15", "React 19", "FastAPI", "OpenAI API", "PostgreSQL"],
    actionPrompt: "I want to enroll in the Full-Stack AI & Web Engineering Cohort and proceed with payment",
  },
  {
    id: "super10",
    enrollmentId: "super10",
    title: "Super10 Elite Batch",
    bannerTitle: "Super10 Elite Batch",
    bannerSubtitle: "Strictly 10 Seats · 100% Placement",
    description: "High-intensity cohort capped strictly at 10 candidates. Includes 1-on-1 mentorship, daily commercial code reviews, and guaranteed job placement.",
    category: "elite",
    categoryLabel: "Super10 Elite",
    badge: "100% Placement",
    badgeType: "elite",
    duration: "60 Days Intensive",
    level: "Selective Cohort",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#451a03] via-[#7c2d12] to-[#ea580c]",
    accentColor: "text-amber-400",
    techStack: ["System Design", "Enterprise Capstones", "1-on-1 Architecture Reviews"],
    actionPrompt: "Tell me about the Super10 Elite Batch with 100% placement assurance",
  },
  {
    id: "datascience",
    title: "Python & Data Science Specialization",
    bannerTitle: "Data Science with Python",
    bannerSubtitle: "Analyze · Visualize · Deploy ML",
    description: "Master Python for data engineering, Pandas, NumPy, Scikit-Learn, data visualization dashboards, and automated machine learning model pipelines.",
    category: "datascience",
    categoryLabel: "Data Science",
    badge: "Practical ML",
    badgeType: "popular",
    duration: "60 Days (2 Months)",
    level: "Intermediate",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#022c22] via-[#064e3b] to-[#0d9488]",
    accentColor: "text-emerald-400",
    techStack: ["Python", "Pandas", "NumPy", "Scikit-Learn", "Model Deployment"],
    actionPrompt: "Tell me more about the Python & Data Science Specialization",
  },
  {
    id: "genai",
    title: "Generative AI & Agentic Systems",
    bannerTitle: "Generative AI & Agents",
    bannerSubtitle: "LLM APIs · RAG · Multi-Agent Workflows",
    description: "Deep dive into autonomous multi-agent architectures, function calling, vector databases, LangChain, and production GenAI pipelines.",
    category: "ai",
    categoryLabel: "AI & ML",
    badge: "Cutting-Edge AI",
    badgeType: "ai",
    duration: "60 Days (2 Months)",
    level: "Intermediate to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#2e1065] via-[#3b0764] to-[#7c3aed]",
    accentColor: "text-purple-400",
    techStack: ["OpenAI API", "Gemini SDK", "LangChain", "Vector DBs", "RAG"],
    actionPrompt: "Tell me more about Generative AI & Agentic Systems",
  },
  {
    id: "referral",
    title: "Refer & Earn ₹5,000 Program",
    bannerTitle: "Refer & Earn ₹5,000",
    bannerSubtitle: "Direct Cash Reward per Candidate",
    description: "Know someone interested in software engineering? Refer them to any 60-day cohort and receive ₹5,000 cash reward once they complete the course.",
    category: "elite",
    categoryLabel: "Rewards",
    badge: "🎁 ₹5,000 Reward",
    badgeType: "popular",
    duration: "All 60-Day Cohorts",
    level: "Open to Everyone",
    fee: "₹5,000 Reward",
    amount: 5000,
    gradient: "from-[#042f2e] via-[#115e59] to-[#059669]",
    accentColor: "text-teal-300",
    techStack: ["Instant UPI Transfer", "No Referral Caps", "Direct Payout"],
    actionPrompt: "How does the ₹5,000 Refer & Earn program work?",
  },
];
