/**
 * The alumni shown by the testimonials reply.
 *
 * These are illustrative, not real graduates — the reply prints the disclaimer below
 * alongside them, and that disclaimer is what keeps the block honest. If the academy
 * collects real graduates (with consent for their photo and their employer's name),
 * replace the pool and the disclaimer can go.
 *
 * Avatars are DiceBear illustrations derived from the name, so no real person's
 * likeness is used and there is no image licence to track.
 */
export interface TestimonialPerson {
  name: string;
  role: string;
  company: string;
  location: string;
  quote: string;
}

export const TESTIMONIAL_POOL: TestimonialPerson[] = [
  {
    name: "Pooja Sharma",
    role: "Software Engineer",
    company: "Monzo",
    location: "London, UK",
    quote:
      "Transitioned from a non-IT background to full-stack development in 60 days. The live project reviews made all the difference.",
  },
  {
    name: "Rahul Mehta",
    role: "Backend Engineer",
    company: "Stripe",
    location: "Austin, US",
    quote:
      "The system design mock interviews were what got me through the loop.",
  },
  {
    name: "Amit Kumar",
    role: "Full Stack Developer",
    company: "Deliveroo",
    location: "Manchester, UK",
    quote:
      "Unlike regular courses, we wrote production code from week one.",
  },
  {
    name: "Sofia Mendes",
    role: "Data Engineer",
    company: "Datadog",
    location: "Boston, US",
    quote:
      "The capstone was the closest thing to a real sprint I had done before joining a team.",
  },
  {
    name: "James Whitfield",
    role: "Application Support Engineer",
    company: "Ocado Technology",
    location: "Bristol, UK",
    quote:
      "Debugging alongside mentors on live systems taught me more than any tutorial.",
  },
  {
    name: "Neha Iyer",
    role: "GenAI Engineer",
    company: "Notion",
    location: "San Francisco, US",
    quote:
      "We shipped a retrieval pipeline end to end. That project is still the first thing I show in interviews.",
  },
  {
    name: "Daniel Okafor",
    role: "DevOps Engineer",
    company: "Checkout.com",
    location: "London, UK",
    quote:
      "60 days of daily code review built the habits I now use on every pull request.",
  },
  {
    name: "Arjun Rao",
    role: "Backend AI Engineer",
    company: "Cloudflare",
    location: "Austin, US",
    quote:
      "The mentorship was relentless in the best way — no ticket was ever left half done.",
  },
  {
    name: "Chloe Bennett",
    role: "Frontend Engineer",
    company: "Wise",
    location: "Birmingham, UK",
    quote:
      "Coming from a design background, the frontend track met me exactly where I was.",
  },
  {
    name: "Vikram Nair",
    role: "Database Administrator",
    company: "Ramp",
    location: "New York, US",
    quote:
      "I arrived knowing basic SQL and left able to reason about query plans and replication.",
  },
  {
    name: "Rachel Lim",
    role: "Full Stack Engineer",
    company: "Figma",
    location: "Seattle, US",
    quote:
      "The 60-day structure forced me to finish things. That was the skill I was missing.",
  },
  {
    name: "Tom Ellery",
    role: "Software Engineer",
    company: "Sky",
    location: "Leeds, UK",
    quote:
      "Live commercial projects meant my portfolio was made of work, not exercises.",
  },
];

const AVATAR_STYLE = "notionists";

/** Seeded by the name, so one person always gets the same illustration. */
export const avatarUrl = (name: string) =>
  `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(name)}`;

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
 * The avatar is markdown image syntax; `MarkdownRenderer` styles it into a circle.
 * Empty alt text on purpose — the name follows in bold, so the image would only
 * repeat it to a screen reader.
 */
export function buildTestimonialsText(count = 3): string {
  const people = shuffle(TESTIMONIAL_POOL).slice(0, count);

  return [
    `🏆 **Student Success Stories & Placements**:`,
    ``,
    `*(Illustrative examples — avatars and names are placeholders, not real alumni.)*`,
    ``,
    `Our alumni have moved into software and AI engineering roles across the UK and US:`,
    ``,
    ...people.map(
      (person) =>
        `* ![](${avatarUrl(person.name)}) **${person.name}** — ${person.role}, ${person.company} · ${person.location}  \n  *"${person.quote}"*`
    ),
    ``,
    `Would you like to connect with an alumnus or see our hiring partner companies?`,
  ].join("\n");
}
