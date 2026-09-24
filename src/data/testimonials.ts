/**
 * The alumni the testimonials reply quotes.
 *
 * The pool is hard-coded here rather than read from Firestore, for the same reason
 * `src/data/academy-knowledge.ts` carries its prose: the reply has to answer with the
 * database unreachable, and a `testimonials` collection that nothing writes to could only
 * ever make that answer emptier.
 *
 * **These twelve people do not exist.** Their names, employers and quotes were written to
 * demonstrate the reply, and their portraits under `public/testimonials/` are AI-generated,
 * not photographs of anyone. Replacing them with the academy's real alumni — their own
 * names, roles, employers and photographs, once they have agreed to be quoted — is a change
 * to this array alone.
 */
export interface TestimonialPerson {
  name: string;
  role: string;
  company: string;
  location: string;
  quote: string;
  /** Public path to the portrait. */
  photo: string;
}

export const TESTIMONIAL_POOL: TestimonialPerson[] = [
  {
    name: "Ananya Deshmukh",
    role: "Software Engineer",
    company: "Product startup",
    location: "Pune, Maharashtra",
    quote:
      "I came from a non-IT background, so I had a lot of doubt in the beginning. The daily project reviews kept me on track, and in 60 days I was writing full-stack code properly.",
    photo: "/testimonials/person-01.jpg",
  },
  {
    name: "Aditya Kulkarni",
    role: "Backend Engineer",
    company: "FinTech company",
    location: "Mumbai, Maharashtra",
    quote:
      "The system design mock interviews helped me explain my choices with more confidence.",
    photo: "/testimonials/person-02.jpg",
  },
  {
    name: "Sayali Patil",
    role: "Full Stack Developer",
    company: "Software studio",
    location: "Nagpur, Maharashtra",
    quote:
      "We started writing and building projects early, which helped me learn by doing instead of only watching lessons.",
    photo: "/testimonials/person-03.jpg",
  },
  {
    name: "Omkar Jadhav",
    role: "Data Engineer",
    company: "Data platform team",
    location: "Pune, Maharashtra",
    quote:
      "The capstone gave me practice planning and delivering a project in small, reviewable steps.",
    photo: "/testimonials/person-04.jpg",
  },
  {
    name: "Gauri Shinde",
    role: "Application Support Engineer",
    company: "Cloud services firm",
    location: "Nashik, Maharashtra",
    quote:
      "Working through debugging exercises with a mentor helped me get more comfortable investigating issues.",
    photo: "/testimonials/person-05.jpg",
  },
  {
    name: "Rohan More",
    role: "GenAI Engineer",
    company: "AI startup",
    location: "Mumbai, Maharashtra",
    quote:
      "Building a retrieval pipeline end to end gave me a project I could use to explain my approach in interviews.",
    photo: "/testimonials/person-06.jpg",
  },
  {
    name: "Prajakta Joshi",
    role: "DevOps Engineer",
    company: "SaaS company",
    location: "Pune, Maharashtra",
    quote:
      "Regular code reviews helped me build habits I can carry into future team projects.",
    photo: "/testimonials/person-07.jpg",
  },
  {
    name: "Sarthak Bhosale",
    role: "Backend AI Engineer",
    company: "Software company",
    location: "Thane, Maharashtra",
    quote:
      "Breaking work into finished tasks taught me to follow a project through instead of leaving pieces incomplete.",
    photo: "/testimonials/person-08.jpg",
  },
  {
    name: "Mitali Pawar",
    role: "Frontend Engineer",
    company: "Product company",
    location: "Kolhapur, Maharashtra",
    quote:
      "The frontend track started with the fundamentals and helped me build confidence as I moved into larger projects.",
    photo: "/testimonials/person-09.jpg",
  },
  {
    name: "Nikhil Chavan",
    role: "Database Administrator",
    company: "IT services firm",
    location: "Nagpur, Maharashtra",
    quote:
      "I joined knowing basic SQL. The exercises helped me read a query plan and understand how to improve a slow query.",
    photo: "/testimonials/person-10.jpg",
  },
  {
    name: "Isha Gawade",
    role: "Full Stack Engineer",
    company: "SaaS startup",
    location: "Chhatrapati Sambhajinagar, Maharashtra",
    quote:
      "The 60-day structure helped me stay consistent and finish the projects I started.",
    photo: "/testimonials/person-11.jpg",
  },
  {
    name: "Akash Wagh",
    role: "Software Engineer",
    company: "Technology company",
    location: "Pune, Maharashtra",
    quote:
      "Working on practical projects helped me build a portfolio that shows how I approach real engineering tasks.",
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
 *
 */
export function buildTestimonialsText(count = 3): string {
  const people = shuffle(TESTIMONIAL_POOL).slice(0, count);

  return [
    `🏆 **Illustrative Maharashtra Student Stories**:`,
    ``,
    `These fictional profiles and AI-generated portraits are examples, not verified alumni placements:`,
    ``,
    ...people.map(
      (person) =>
        `* ![](${person.photo}) **${person.name}** - ${person.role}, ${person.company} · ${person.location}  \n  *"${person.quote}"*`
    ),
  ].join("\n");
}
