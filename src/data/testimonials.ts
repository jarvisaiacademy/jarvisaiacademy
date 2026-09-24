/**
 * Fictional profiles and AI-generated portraits used to demonstrate the testimonial reply.
 * Replacing these with real alumni details requires their consent.
 */
export interface TestimonialPerson {
  name: string;
  role: string;
  company: string;
  location: string;
  course: string;
  quote: string;
  /** Public path to the portrait. */
  photo: string;
}

export const TESTIMONIAL_POOL: TestimonialPerson[] = [
  {
    name: "Ananya Nair",
    role: "Software Engineer",
    company: "Product startup",
    location: "Kochi, Kerala",
    course: "Full-Stack AI & Web Engineering",
    quote:
      "After completing Full-Stack AI & Web Engineering, I could explain how the frontend, API, and data layer fit together in the projects I built.",
    photo: "/testimonials/person-01.jpg",
  },
  {
    name: "Arjun Reddy",
    role: "Backend Engineer",
    company: "FinTech company",
    location: "Hyderabad, Telangana",
    course: "Backend Engineering (Python + FastAPI + Django)",
    quote:
      "Completing Backend Engineering gave me hands-on practice building REST APIs with FastAPI and working through database-backed features.",
    photo: "/testimonials/person-02.jpg",
  },
  {
    name: "Kavya Iyer",
    role: "Frontend Developer",
    company: "Software studio",
    location: "Chennai, Tamil Nadu",
    course: "Frontend Engineering (ReactJS + Tailwind)",
    quote:
      "After completing Frontend Engineering, I could build responsive React screens and explain the choices I made in each project.",
    photo: "/testimonials/person-03.jpg",
  },
  {
    name: "Aarav Das",
    role: "Data Analyst",
    company: "Data platform team",
    location: "Guwahati, Assam",
    course: "Data Analyst (PowerBI + SQL + SAP + Python)",
    quote:
      "Completing the Data Analyst course helped me turn SQL and PowerBI exercises into a dashboard project I can walk through.",
    photo: "/testimonials/person-04.jpg",
  },
  {
    name: "Meera Sharma",
    role: "Application Support Engineer",
    company: "Cloud services firm",
    location: "Jaipur, Rajasthan",
    course: "Application Support & Cloud Ops (Linux + MySQL)",
    quote:
      "After completing Application Support & Cloud Ops, I became more systematic about reading Linux logs and investigating MySQL issues.",
    photo: "/testimonials/person-05.jpg",
  },
  {
    name: "Rohan Verma",
    role: "GenAI Engineer",
    company: "AI startup",
    location: "Lucknow, Uttar Pradesh",
    course: "Generative AI, RAG & Agentic Systems",
    quote:
      "Completing Generative AI, RAG & Agentic Systems gave me a project where I can explain the retrieval steps and trade-offs.",
    photo: "/testimonials/person-06.jpg",
  },
  {
    name: "Ishita Singh",
    role: "DevOps Engineer",
    company: "SaaS company",
    location: "New Delhi, Delhi",
    course: "DevOps & Cloud Engineer (AWS + Docker + CI/CD)",
    quote:
      "After completing DevOps & Cloud Engineer, I could describe how Docker, AWS, and CI/CD fit together in a deployment pipeline.",
    photo: "/testimonials/person-07.jpg",
  },
  {
    name: "Sarthak Bose",
    role: "Software Engineer",
    company: "Software company",
    location: "Kolkata, West Bengal",
    course: "Super10 Elite Batch (100% Placement)",
    quote:
      "Completing the Super10 Elite Batch gave me practice reviewing code, working through capstones, and discussing system design.",
    photo: "/testimonials/person-08.jpg",
  },
  {
    name: "Priya Rao",
    role: "Business Analyst",
    company: "Product company",
    location: "Bengaluru, Karnataka",
    course: "Business Analyst (PowerBI + MySQL + BRD + Jira)",
    quote:
      "After completing the Business Analyst course, I could connect requirements, SQL queries, and dashboard findings in a project.",
    photo: "/testimonials/person-09.jpg",
  },
  {
    name: "Aman Kumar",
    role: "Database Administrator",
    company: "IT services firm",
    location: "Patna, Bihar",
    course: "Database Admin (Oracle + PL/SQL + MongoDB)",
    quote:
      "Completing Database Admin helped me read query plans and understand practical ways to improve a slow query.",
    photo: "/testimonials/person-10.jpg",
  },
  {
    name: "Ayesha Khan",
    role: "Laravel Developer",
    company: "SaaS startup",
    location: "Bhopal, Madhya Pradesh",
    course: "Full-Stack Web (Laravel + PHP + MySQL)",
    quote:
      "After completing Full-Stack Web, I could build a Laravel feature from its database model through to the user-facing page.",
    photo: "/testimonials/person-11.jpg",
  },
  {
    name: "Naveen Reddy",
    role: "Full Stack Engineer",
    company: "Technology company",
    location: "Visakhapatnam, Andhra Pradesh",
    course: "Full-Stack AI & Web Engineering",
    quote:
      "Completing Full-Stack AI & Web Engineering helped me build a portfolio project and explain the engineering decisions behind it.",
    photo: "/testimonials/person-12.jpg",
  },
];

/** Fisher-Yates, so a fresh sample can come out in a different order every time. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draws `count` people at random and renders them as markdown. Called per reply, so
 * asking for testimonials twice does not produce the same three faces.
 *
 * The portrait is markdown image syntax; `MarkdownRenderer` styles it into a circle.
 * Empty alt text on purpose — the name follows in bold, so the image would only
 * repeat it to a screen reader.
 */
export function buildTestimonialsText(count = 3): string {
  const people = shuffle(TESTIMONIAL_POOL).slice(0, count);

  return [
    `🏆 **Learner Journeys from Across India**:`,
    ``,
    `Fictional sample profiles and course completions; not real alumni or placement outcomes.`,
    ``,
    ...people.map(
      (person) =>
        `* ![](${person.photo}) **${person.name}** - ${person.role}, ${person.company} · ${person.location}  \n  **Course completed:** ${person.course}  \n  *"${person.quote}"*`
    ),
  ].join("\n");
}
