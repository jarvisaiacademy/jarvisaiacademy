export interface CourseItem {
  id: string;
  number: string;
  enrollmentId?: "fullstack" | "super10" | string;
  title: string;
  bannerTitle: string;
  bannerSubtitle: string;
  description: string;
  category: "all" | "web" | "ai" | "datascience" | "devops" | "database" | "elite";
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
  techIcons: string[];
  topics: string[];
  actionPrompt: string;
  /** Admin-editable Markdown template for the chat bot reply. Supports {title}, {duration},
   *  {fee}, {description}, {categoryLabel}, {techStack}, {topics} interpolation. When absent,
   *  the chat falls back to the auto-generated template. */
  chatResponse?: string;
  // Absent means active, so the twelve seeded entries and any doc already in Firestore
  // need no migration — a course only carries this once an admin has retired it.
  status?: CourseStatus;
  // Teacher ids only. A teacher's name lives in the `teachers` collection, which is
  // admin-only to read, so a public course page never has it.
  teacherIds?: string[];
  // Audit trail
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export type CourseStatus = "active" | "inactive";

/**
 * How a course's stack is drawn: the logos when there are any, the names otherwise.
 *
 * Shared rather than worked out per surface — the courses tab and the detail page both used to
 * decide this separately — so a course cannot show logos in one place and words in another.
 *
 * The names win nothing here. `techIcons` is derived from `techStack` by name, so a name the map
 * does not know (OpenAI, RAG) is absent from the logos and shows its initials chip instead of a
 * brand. A stack with no icons at all is drawn as text, because there would be nothing to draw.
 */
export function stackDisplay(course: Pick<CourseItem, "techIcons">): "icons" | "text" {
  return course.techIcons.length > 0 ? "icons" : "text";
}

export const COURSE_CATEGORIES = [
  { id: "all", label: "All Courses" },
  { id: "web", label: "Web & Full-Stack" },
  { id: "ai", label: "AI & Data Science" },
  { id: "devops", label: "DevOps & Cloud" },
  { id: "database", label: "Database & Systems" },
  { id: "elite", label: "Super10 Elite" },
] as const;

export type CourseCategoryId = (typeof COURSE_CATEGORIES)[number]["id"];

// The vocabulary the three free-text course fields are drawn from, offered as suggestions rather
// than a fence — the editor's picker takes whatever an admin types as well, which is what lets a
// value be retired from these lists without orphaning a course that still carries it.
//
// Curated, not scraped. Everything the seeded courses use is here except two values that belong
// to the `referral` entry rather than a course — "All 60-Day Programs" and "Open to Everyone" are
// the referral programme's own copy. The rest of each list is what an admin reaches for next.
export const COURSE_DURATIONS = [
  "60 Days (2 Months)",
  "60 Days (8 Weeks)",
  "60 Days (10 Weeks)",
  "60 Days (12 Weeks)",
  "60 Days Intensive",
  "90 Days (3 Months)",
  "45 Days (6 Weeks)",
  "Self-Paced",
] as const;

export const COURSE_LEVELS = [
  "Beginner to Adv",
  "Beginner to Intermediate",
  "Intermediate to Adv",
  "Selective Program",
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

/**
 * What the Tech Stack picker offers, grouped by the order the academy teaches them.
 *
 * A fence, unlike the three lists above. A stack name is what draws a logo and what the public
 * page prints, and freehand typing is how "TailwindCSS" and "Tailwind CSS" become two different
 * technologies with one logo between them.
 *
 * Every entry either has a mark in `DevIcon` or takes its initials chip, so no row is blank. A
 * course already holding a name that is not here keeps it — the editor adds the course's own
 * entries to this list — so nothing an admin saved becomes unsayable, and this array is the only
 * way the vocabulary grows.
 */
export const TECH_STACK_OPTIONS = [
  // Languages & markup
  "JavaScript",
  "TypeScript",
  "Python",
  "PHP",
  "Java",
  "C#",
  "Go",
  "Rust",
  "HTML5",
  "CSS3",
  // Frontend
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Svelte",
  "Tailwind CSS",
  "Bootstrap",
  "SASS",
  // Backend
  "FastAPI",
  "Django",
  "Flask",
  "Node.js",
  "Express",
  "Laravel",
  "Spring",
  // Databases
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "SQLite",
  "Oracle",
  "PL/SQL",
  // Cloud & DevOps
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Linux",
  "Ubuntu",
  "Git",
  "GitHub",
  "Jira",
  "Netlify",
  // Data & AI
  "TensorFlow",
  "PyTorch",
  "Pandas",
  "NumPy",
  "Jupyter",
  "PowerBI",
  "OpenAI",
  "RAG",
  "System Design",
] as const;

export const COURSE_BADGES = [
  "Bestseller",
  "Popular",
  "High Demand",
  "100% Placement",
  "Cloud Certified",
  "Core Backend",
  "Cutting-Edge AI",
  "New Batch",
  "Limited Seats",
  "Trending",
  "🎁 ₹3,000 Reward",
] as const;

export const COURSES_DATA: CourseItem[] = [
  {
    id: "fullstack",
    number: "01",
    enrollmentId: "fullstack",
    title: "Full-Stack AI & Web Engineering",
    bannerTitle: "Full-Stack AI & Web Apps",
    bannerSubtitle: "Next.js 15 + React 19 + FastAPI + AI Agents",
    description: "Build production-ready web applications and autonomous AI systems with Next.js 15 App Router, React 19, FastAPI, PostgreSQL, and vector embeddings.",
    category: "web",
    categoryLabel: "Web & Full-Stack",
    badge: "Bestseller",
    badgeType: "bestseller",
    duration: "60 Days (2 Months)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#0f172a] via-[#1e1b4b] to-[#0284c7]",
    accentColor: "text-sky-400",
    techStack: ["Next.js 15", "React 19", "FastAPI", "PostgreSQL", "Python"],
    techIcons: ["nextjs", "react", "fastapi", "postgresql", "python"],
    topics: [
      "Next.js 15 Server Components & Actions",
      "FastAPI Async Microservices",
      "PostgreSQL & Schema Optimization",
      "AI Vector Embeddings & RAG",
      "Authentication & JWT Security",
      "Production Cloud Deployment",
    ],
    actionPrompt: "I want to enroll in the Full-Stack AI & Web Engineering Program and proceed with payment",
  },
  {
    id: "super10",
    number: "02",
    enrollmentId: "super10",
    title: "Super10 Elite Batch (100% Placement)",
    bannerTitle: "Super10 Elite Batch",
    bannerSubtitle: "Strictly 10 Seats · 100% Placement Assurance",
    description: "High-intensity program capped strictly at 10 candidates. Includes 1-on-1 mentorship, daily commercial code reviews, distributed system design, and guaranteed job placement.",
    category: "elite",
    categoryLabel: "Super10 Elite",
    badge: "100% Placement",
    badgeType: "elite",
    duration: "60 Days Intensive",
    level: "Selective Program",
    fee: "₹0",
    amount: 0,
    gradient: "from-[#451a03] via-[#7c2d12] to-[#ea580c]",
    accentColor: "text-amber-400",
    techStack: ["System Design", "AWS", "Docker", "Kubernetes", "PostgreSQL"],
    techIcons: ["aws", "docker", "kubernetes", "postgresql"],
    topics: [
      "Enterprise Distributed System Design",
      "Microservices Architecture & Scaling",
      "Live Commercial Capstones",
      "Daily Senior Architect Code Audits",
      "1-on-1 Personalized Mentorship",
      "100% Guaranteed Job Placement",
    ],
    actionPrompt: "Tell me about the Super10 Elite Batch with 100% placement assurance",
  },
  {
    id: "frontend-react",
    number: "03",
    title: "Frontend Engineering (ReactJS + Tailwind)",
    bannerTitle: "Frontend Engineering",
    bannerSubtitle: "ReactJS · Tailwind CSS · TypeScript · Responsive UI",
    description: "Master modern frontend engineering: responsive UI design, component architecture, state management with Hooks/Context, Tailwind styling, and production web performance.",
    category: "web",
    categoryLabel: "Web & Full-Stack",
    badge: "Popular",
    badgeType: "popular",
    duration: "60 Days (8 Weeks)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#1e1b4b] via-[#312e81] to-[#4338ca]",
    accentColor: "text-purple-400",
    techStack: ["React", "Tailwind CSS", "TypeScript", "JavaScript", "HTML5"],
    techIcons: ["react", "tailwindcss", "typescript", "javascript", "html5", "css3"],
    topics: [
      "ReactJS Component Architecture",
      "State Management (Hooks & Context)",
      "Tailwind CSS Utility-First Styling",
      "Responsive Layouts & Mobile First",
      "Modern JavaScript (ES6+) & TypeScript",
      "Routing, API Fetching & Vite",
    ],
    actionPrompt: "Tell me about the Frontend Engineering course with React and Tailwind CSS",
    chatResponse: `### ⚛️ Frontend Engineering (ReactJS + Tailwind CSS)
    
* **Duration**: **60 Days (8 Weeks)** hands-on training.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: React 19, Tailwind CSS, TypeScript, modern ES6+ JavaScript, HTML5 & CSS3.

#### Core Modules:
1. **Semantic HTML5 & Responsive CSS3**: Modern layout patterns, Flexbox, Grid, CSS animations.
2. **Modern JavaScript (ES6+) & TypeScript**: Closures, async/await, DOM APIs, strict typing.
3. **ReactJS Architecture**: Component hierarchy, Props, custom Hooks, Context API.
4. **Tailwind CSS Utility Design**: Rapid UI styling, dark mode configuration, mobile-first design.
5. **Production Capstone**: Build a high-performance responsive web dashboard with live API integration.

* **🎁 Refer & Earn**: Refer a friend to this course and earn **₹3,000** once they complete!`,
  },
  {
    id: "backend-python",
    number: "04",
    title: "Backend Engineering (Python + FastAPI + Django)",
    bannerTitle: "Backend & API Engineering",
    bannerSubtitle: "Python · FastAPI · Django · REST APIs",
    description: "Architect robust, high-throughput APIs and microservices using Python frameworks, asynchronous programming, JWT security, and relational database management.",
    category: "web",
    categoryLabel: "Web & Full-Stack",
    badge: "Core Backend",
    badgeType: "popular",
    duration: "60 Days (10 Weeks)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#064e3b] via-[#047857] to-[#059669]",
    accentColor: "text-emerald-400",
    techStack: ["Python", "FastAPI", "Django", "PostgreSQL"],
    techIcons: ["python", "fastapi", "django", "postgresql"],
    topics: [
      "Python Programming & OOP",
      "FastAPI Async REST APIs & OpenAPI",
      "Django ORM, Admin & Architecture",
      "JWT Authentication & Middleware",
      "PostgreSQL Queries & Transactions",
      "Automated Testing & Deployment",
    ],
    actionPrompt: "Tell me about the Backend Engineering course with Python, FastAPI, and Django",
    chatResponse: `### 🐍 Backend Engineering (Python + FastAPI + Django)

* **Duration**: **60 Days (10 Weeks)** intensive API engineering.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: Python, FastAPI, Django, PostgreSQL, REST APIs, JWT Auth.

#### Core Modules:
1. **Advanced Python**: OOP, decorators, generators, async concurrency.
2. **FastAPI Asynchronous APIs**: Pydantic models, OpenAPI documentation, async endpoints.
3. **Django Framework**: ORM relations, admin dashboard, auth middleware.
4. **PostgreSQL Database**: Indexing, migrations, query optimization.
5. **Live Capstone**: Architect a scalable microservice with real-time authentication and payment processing.

* **🎁 Refer & Earn**: Refer a student and receive **₹3,000** upon course completion!`,
  },
  {
    id: "genai",
    number: "05",
    title: "Generative AI, RAG & Agentic Systems",
    bannerTitle: "Generative AI & Agents",
    bannerSubtitle: "LLM APIs · RAG · Multi-Agent Workflows",
    description: "Deep dive into prompt engineering, autonomous multi-agent architectures, retrieval-augmented generation (RAG), vector databases, and production GenAI pipelines.",
    category: "ai",
    categoryLabel: "AI & Data Science",
    badge: "Cutting-Edge AI",
    badgeType: "ai",
    duration: "60 Days (2 Months)",
    level: "Intermediate to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#2e1065] via-[#3b0764] to-[#7c3aed]",
    accentColor: "text-purple-400",
    techStack: ["Python", "TensorFlow", "FastAPI", "OpenAI"],
    techIcons: ["python", "tensorflow", "fastapi"],
    topics: [
      "Prompt Engineering Design Patterns",
      "LLM Tool Calling & Structured Outputs",
      "RAG Architecture & Chunking Strategies",
      "Vector Databases & Semantic Search",
      "Multi-Agent Workflows & LangGraph",
      "Production Evaluation & Guardrails",
    ],
    actionPrompt: "Tell me more about Generative AI, RAG & Agentic Systems",
    chatResponse: `### 🤖 Generative AI, RAG & Agentic Systems

* **Duration**: **60 Days (2 Months)** cutting-edge AI engineering.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: Python, OpenAI API, Gemini SDK, LangChain, Pinecone / Chroma Vector DBs, FastAPI.

#### Core Modules:
1. **Prompt Engineering & Structured Outputs**: Few-shot prompting, JSON schemas, function calling.
2. **RAG Architecture**: Document chunking, vector embeddings, hybrid semantic search.
3. **Autonomous Agent Workflows**: Tool execution, multi-step reasoning, LangGraph state machines.
4. **Production LLMOps**: Latency optimization, prompt caching, evaluation guardrails.
5. **Capstone Project**: Deploy an end-to-end multi-agent coding assistant with live web browsing.`,
  },
  {
    id: "data-analyst",
    number: "06",
    title: "Data Analyst (PowerBI + SQL + SAP + Python)",
    bannerTitle: "Data Analytics & BI",
    bannerSubtitle: "PowerBI · SQL · SAP BI · Python",
    description: "Master enterprise data analysis, interactive PowerBI dashboard design, complex SQL queries, SAP business intelligence data integration, and automated Python analytics.",
    category: "ai",
    categoryLabel: "AI & Data Science",
    badge: "High Demand",
    badgeType: "popular",
    duration: "60 Days (12 Weeks)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#022c22] via-[#064e3b] to-[#0d9488]",
    accentColor: "text-emerald-400",
    techStack: ["PowerBI", "MySQL", "Python", "Pandas", "NumPy"],
    techIcons: ["powerbi", "mysql", "python", "pandas", "numpy"],
    topics: [
      "PowerBI Executive Dashboard Creation",
      "DAX Expressions & Data Modeling",
      "SQL Querying & Optimization",
      "SAP Business Intelligence Flows",
      "Python Data Wrangling (Pandas/NumPy)",
      "Predictive Analytics & KPI Reports",
    ],
    actionPrompt: "Tell me about the Data Analyst course with PowerBI, SQL, and Python",
    chatResponse: `### 📊 Data Analyst (PowerBI + SQL + SAP + Python)

* **Duration**: **60 Days (12 Weeks)** business intelligence & analytics.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: Microsoft PowerBI, MySQL, Python (Pandas/NumPy), SAP BI.

#### Core Modules:
1. **PowerBI Visual Reporting**: Interactive dashboards, slicers, mobile layouts.
2. **DAX & Data Modeling**: Calculated columns, measures, relationship topologies.
3. **Advanced SQL**: Window functions, subqueries, aggregations, schema joins.
4. **Python Data Wrangling**: Pandas, NumPy, statistical distribution analysis.
5. **Enterprise Capstone**: Build an executive revenue intelligence dashboard for board presentation.`,
  },
  {
    id: "business-analyst",
    number: "07",
    title: "Business Analyst (PowerBI + MySQL + BRD + Jira)",
    bannerTitle: "Business Analysis & Agile",
    bannerSubtitle: "PowerBI · MySQL · BRD · Jira Sprint Boards",
    description: "Bridge business requirements and engineering deliverables. Learn BRD/PRD documentation, Agile sprint planning in Jira, SQL data querying, and stakeholder executive reporting.",
    category: "ai",
    categoryLabel: "AI & Data Science",
    duration: "60 Days (8 Weeks)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#78350f] via-[#92400e] to-[#b45309]",
    accentColor: "text-amber-400",
    techStack: ["PowerBI", "MySQL", "Jira"],
    techIcons: ["powerbi", "mysql", "jira"],
    topics: [
      "Business Analysis Fundamentals",
      "BRD & PRD Documentation Standards",
      "Agile & Jira Sprint Management",
      "MySQL Data Queries for Analysts",
      "PowerBI Visual KPI Dashboards",
      "Stakeholder Communication & Use Cases",
    ],
    actionPrompt: "Tell me about the Business Analyst program with PowerBI, MySQL, and BRD",
    chatResponse: `### 📋 Business Analyst (PowerBI + MySQL + BRD + Jira)

* **Duration**: **60 Days (8 Weeks)** strategy and requirements engineering.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: PowerBI, MySQL, Jira Agile Boards, BRD/PRD Documentation.

#### Core Modules:
1. **Business Analysis Methodologies**: Requirements gathering, gap analysis, stakeholder mapping.
2. **BRD & PRD Documentation**: Writing industry-standard Functional Specifications and User Stories.
3. **Agile & Jira Sprint Tracking**: Managing backlogs, sprint ceremonies, burndown charts.
4. **SQL for Analysts**: Querying operational databases without developer dependencies.
5. **PowerBI Executive Dashboards**: Visualizing KPIs, conversion funnels, and churn metrics.`,
  },
  {
    id: "devops-aws",
    number: "08",
    title: "DevOps & Cloud Engineer (AWS + Docker + CI/CD)",
    bannerTitle: "DevOps & Cloud Automation",
    bannerSubtitle: "AWS · Docker · Kubernetes · CI/CD · Linux",
    description: "Master cloud infrastructure automation, Docker containerization, AWS core architecture, Kubernetes orchestration, CI/CD automated deployment pipelines, and zero-downtime releases.",
    category: "devops",
    categoryLabel: "DevOps & Cloud",
    badge: "Cloud Certified",
    badgeType: "popular",
    duration: "60 Days (10 Weeks)",
    level: "Intermediate to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#311042] via-[#4a1d6d] to-[#6b21a8]",
    accentColor: "text-purple-400",
    techStack: ["AWS", "Docker", "Kubernetes", "Linux", "Git", "Netlify"],
    techIcons: ["aws", "docker", "kubernetes", "linux", "git", "netlify"],
    topics: [
      "AWS Core Infrastructure (EC2, S3, IAM, VPC)",
      "Docker Containerization & Multi-stage Builds",
      "Kubernetes Clusters & Deployments",
      "GitHub Actions & CI/CD Pipelines",
      "Infrastructure as Code",
      "Production Monitoring & Log Systems",
    ],
    actionPrompt: "Tell me about the DevOps Engineering course with AWS and Docker",
    chatResponse: `### ☁️ DevOps & Cloud Engineering (AWS + Docker + CI/CD)

* **Duration**: **60 Days (10 Weeks)** cloud automation.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: AWS (EC2, S3, IAM, VPC), Docker, Kubernetes, Linux, GitHub Actions CI/CD.

#### Core Modules:
1. **Linux Systems & Shell Scripting**: Server management, permissions, automated bash scripts.
2. **Docker Containers**: Containerizing full-stack apps, multi-stage Dockerfiles, Docker Compose.
3. **AWS Core Architecture**: Deploying on AWS EC2, S3 asset delivery, IAM security.
4. **Kubernetes Basics**: Pods, services, deployments, and cluster management.
5. **CI/CD Pipelines**: Automated GitHub Actions testing and zero-downtime releases.

* **🎁 Refer & Earn**: Earn **₹3,000** cash reward for every referral who completes the course!`,
  },
  {
    id: "database-admin",
    number: "09",
    title: "Database Admin (Oracle + PL/SQL + MongoDB)",
    bannerTitle: "Database Administration",
    bannerSubtitle: "Oracle · PL/SQL · MongoDB · MySQL",
    description: "Master relational and NoSQL database management: complex PL/SQL stored procedures, indexing, performance tuning, transaction isolation, and enterprise disaster recovery.",
    category: "database",
    categoryLabel: "Database & Systems",
    duration: "60 Days (8 Weeks)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#1e293b] via-[#334155] to-[#475569]",
    accentColor: "text-slate-300",
    techStack: ["Oracle", "PL/SQL", "MongoDB", "MySQL"],
    techIcons: ["oracle", "mongodb", "mysql"],
    topics: [
      "Database Architecture & Storage Engines",
      "PL/SQL Stored Procedures & Triggers",
      "MongoDB Collections, Documents & Aggregations",
      "Query Indexing & Performance Tuning",
      "Backup, Replication & Recovery",
      "Database Security & Access Control",
    ],
    actionPrompt: "Tell me about the Database Administration course with Oracle, PL/SQL, and MongoDB",
    chatResponse: `### 🗄️ Database Administration (Oracle + PL/SQL + MongoDB)

* **Duration**: **60 Days (8 Weeks)** enterprise database administration.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: Oracle Database, PL/SQL, MongoDB, MySQL.

#### Core Modules:
1. **Relational Database Design**: Normalization, schemas, referential integrity.
2. **PL/SQL Mastery**: Stored procedures, functions, packages, triggers, cursors.
3. **NoSQL with MongoDB**: Collections, document modeling, aggregation pipelines.
4. **Performance Tuning**: Index optimization, query execution plans, memory buffers.
5. **Disaster Recovery**: Backups, replication, point-in-time recovery strategies.`,
  },
  {
    id: "app-support",
    number: "10",
    title: "Application Support & Cloud Ops (Linux + MySQL)",
    bannerTitle: "App Support & Systems",
    bannerSubtitle: "Linux · MySQL · Shell Scripting · Troubleshooting",
    description: "Become an enterprise application support specialist: Linux server administration, shell scripting, MySQL query debugging, server logs analysis, and production incident management.",
    category: "database",
    categoryLabel: "Database & Systems",
    duration: "60 Days (8 Weeks)",
    level: "Beginner to Intermediate",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#3b120c] via-[#7c2d12] to-[#c2410c]",
    accentColor: "text-orange-400",
    techStack: ["Linux", "MySQL", "Git", "Ubuntu"],
    techIcons: ["linux", "mysql", "git", "ubuntu"],
    topics: [
      "Linux Administration & Shell Scripting",
      "MySQL Database Maintenance & Fixes",
      "Server Log Analysis & Debugging",
      "Process Management & Networking Basics",
      "Production Incident Response",
      "Support Documentation & SLAs",
    ],
    actionPrompt: "Tell me about the Application Support course with Linux and MySQL",
    chatResponse: `### 🛠️ Application Support & Cloud Ops (Linux + MySQL)

* **Duration**: **60 Days (8 Weeks)** technical support & cloud operations.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: Linux, MySQL, Shell Scripting, Ubuntu, Git.

#### Core Modules:
1. **Linux Administration**: Command-line utilities, file permissions, daemon management.
2. **Bash Scripting**: Automated health checks, disk monitoring, log rotating.
3. **MySQL Troubleshooting**: Slow query log analysis, indexing, data restoration.
4. **Production Incident Management**: Debugging crash logs, triaging alerts, SLA compliance.
5. **Support Runbooks**: Writing escalation procedures and technical documentation.`,
  },
  {
    id: "web-laravel",
    number: "11",
    title: "Full-Stack Web (Laravel + PHP + MySQL)",
    bannerTitle: "PHP & Laravel Full-Stack",
    bannerSubtitle: "Laravel · PHP · MySQL · Bootstrap",
    description: "Build robust web portals and business applications using modern PHP, Laravel MVC architecture, Eloquent ORM, MySQL relational tables, and responsive Bootstrap interfaces.",
    category: "web",
    categoryLabel: "Web & Full-Stack",
    duration: "60 Days (10 Weeks)",
    level: "Beginner to Adv",
    fee: "₹30,000",
    amount: 30000,
    gradient: "from-[#831843] via-[#9d174d] to-[#be185d]",
    accentColor: "text-pink-400",
    techStack: ["PHP", "Laravel", "MySQL", "Bootstrap", "JavaScript"],
    techIcons: ["php", "laravel", "mysql", "bootstrap", "javascript"],
    topics: [
      "Modern PHP Programming & OOP",
      "Laravel MVC Framework & Routing",
      "Eloquent ORM, Migrations & Seeds",
      "Authentication, Security & Middleware",
      "RESTful APIs & Backend Logic",
      "Responsive Bootstrap UI Layouts",
    ],
    actionPrompt: "Tell me about the Web Development course with Laravel, PHP, and MySQL",
    chatResponse: `### 🚀 Full-Stack Web Development (Laravel + PHP + MySQL)

* **Duration**: **60 Days (10 Weeks)** enterprise PHP web development.
* **Tuition**: **₹30,000** all-inclusive.
* **Tech Stack**: PHP, Laravel, MySQL, Bootstrap, JavaScript.

#### Core Modules:
1. **Modern PHP**: OOP patterns, namespace resolution, Composer package management.
2. **Laravel MVC Architecture**: Blade templating, routing, Eloquent ORM relationships.
3. **Authentication & Roles**: Multi-guard auth, middleware security, password resets.
4. **REST APIs & AJAX**: Building JSON APIs for frontends and mobile consumers.
5. **Deployment & Maintenance**: Server setup, cron jobs, database backups.`,
  },
  {
    id: "referral",
    number: "12",
    title: "Refer & Earn ₹3,000 Program",
    bannerTitle: "Refer & Earn ₹3,000",
    bannerSubtitle: "Direct Cash Reward per Enrolled Candidate",
    description: "Know someone aiming to break into software engineering? Refer them to any 60-day program at Jarvis AI Academy and earn ₹3,000 cash reward once they complete the course.",
    category: "elite",
    categoryLabel: "Super10 Elite",
    badge: "🎁 ₹3,000 Reward",
    badgeType: "popular",
    duration: "All 60-Day Programs",
    level: "Open to Everyone",
    fee: "₹3,000 Reward",
    amount: 3000,
    gradient: "from-[#042f2e] via-[#115e59] to-[#059669]",
    accentColor: "text-teal-300",
    techStack: ["Instant UPI Transfer", "No Referral Caps", "Direct Payout"],
    techIcons: [],
    topics: [
      "₹3,000 Cash Reward per Referral",
      "Disbursed upon Course Completion",
      "No Cap on Number of Referrals",
      "Direct UPI or Bank Account Transfer",
      "Transparent Tracking via Admissions",
    ],
    actionPrompt: "How does the ₹3,000 Refer & Earn program work?",
  },
];
