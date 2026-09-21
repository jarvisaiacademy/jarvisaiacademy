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
    name: "Gurpreet Kaur",
    role: "Software Engineer",
    company: "Monzo",
    location: "London, UK",
    quote:
      "I came from a non-IT background, so I had a lot of doubt in the beginning. The daily project reviews kept me on track, and in 60 days I was writing full-stack code properly.",
    photo: "/testimonials/person-01.jpg",
  },
  {
    name: "Karthik Iyer",
    role: "Backend Engineer",
    company: "Stripe",
    location: "Austin, US",
    quote:
      "The system design mock interviews were the main reason I cleared my loop. We did them again and again until I could explain my choices without hesitating.",
    photo: "/testimonials/person-02.jpg",
  },
  {
    name: "Ananya Deshmukh",
    role: "Full Stack Developer",
    company: "Deliveroo",
    location: "Manchester, UK",
    quote:
      "In most courses you watch videos for a month before you touch anything real. Here we were writing production code from the first week itself.",
    photo: "/testimonials/person-03.jpg",
  },
  {
    name: "Farhan Qureshi",
    role: "Data Engineer",
    company: "Datadog",
    location: "Boston, US",
    quote:
      "The capstone felt like an actual sprint. By the time I joined my team, the way we worked was already familiar to me.",
    photo: "/testimonials/person-04.jpg",
  },
  {
    name: "Meghna Barman",
    role: "Application Support Engineer",
    company: "Ocado Technology",
    location: "Bristol, UK",
    quote:
      "Sitting with the mentors and debugging on live systems taught me more than any tutorial did. You pick up the shortcuts only when something is actually broken.",
    photo: "/testimonials/person-05.jpg",
  },
  {
    name: "Nithin Reddy",
    role: "GenAI Engineer",
    company: "Notion",
    location: "San Francisco, US",
    quote:
      "We built a retrieval pipeline end to end, not a toy one. That project is still the first thing I show in interviews.",
    photo: "/testimonials/person-06.jpg",
  },
  {
    name: "Sneha Nair",
    role: "DevOps Engineer",
    company: "Checkout.com",
    location: "London, UK",
    quote:
      "Getting my code reviewed every single day for 60 days changed the way I work. Those habits are what I use on every pull request now.",
    photo: "/testimonials/person-07.jpg",
  },
  {
    name: "Hardik Patel",
    role: "Backend AI Engineer",
    company: "Cloudflare",
    location: "Austin, US",
    quote:
      "The mentors did not let anything slide. No ticket was ever left half finished, and that standard stayed with me after the course.",
    photo: "/testimonials/person-08.jpg",
  },
  {
    name: "Ritika Rathore",
    role: "Frontend Engineer",
    company: "Wise",
    location: "Birmingham, UK",
    quote:
      "I came from a design background and was worried the coding part would go over my head. The frontend track started exactly where I was and built up from there.",
    photo: "/testimonials/person-09.jpg",
  },
  {
    name: "Debashish Mohanty",
    role: "Database Administrator",
    company: "Ramp",
    location: "New York, US",
    quote:
      "I joined knowing only basic SQL. By the end I could look at a slow query, understand the plan behind it and fix it.",
    photo: "/testimonials/person-10.jpg",
  },
  {
    name: "Tenzin Dolma",
    role: "Full Stack Engineer",
    company: "Figma",
    location: "Seattle, US",
    quote:
      "The 60-day structure made me finish what I started. That was the one skill I was missing, and it changed how I work.",
    photo: "/testimonials/person-11.jpg",
  },
  {
    name: "Suhas Gowda",
    role: "Software Engineer",
    company: "Sky",
    location: "Leeds, UK",
    quote:
      "Because we worked on live commercial projects, my portfolio had real work in it instead of practice exercises.",
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
 * Ends on the people, with no closing question — the offers that follow are the entry's
 * `suggestions`, rendered as follow-up chips. A question in the body here reads as part of
 * the answer and cannot be tapped.
 */
export function buildTestimonialsText(count = 3): string {
  const people = shuffle(TESTIMONIAL_POOL).slice(0, count);

  return [
    `🏆 **Student Success Stories & Placements**:`,
    ``,
    `Our alumni have moved into software and AI engineering roles across the UK and US:`,
    ``,
    ...people.map(
      (person) =>
        `* ![](${person.photo}) **${person.name}** - ${person.role}, ${person.company} · ${person.location}  \n  *"${person.quote}"*`
    ),
  ].join("\n");
}
