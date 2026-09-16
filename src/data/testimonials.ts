/**
 * The alumni shown by the testimonials reply.
 *
 * These are placeholders, pending the academy's real graduates. When those arrive, replace
 * the pool with their names, roles and employers, and point `avatarUrl` at their photos
 * instead of DiceBear.
 *
 * Until then the avatars are DiceBear illustrations derived from the name, so no real
 * person's likeness is used and there is no image licence to track.
 */
export interface TestimonialPerson {
  name: string;
  role: string;
  company: string;
  location: string;
  quote: string;
  /** DiceBear `personas` hair variant, picked to match the name (see `avatarUrl`). */
  hair: string;
}

export const TESTIMONIAL_POOL: TestimonialPerson[] = [
  {
    name: "Gurpreet Kaur",
    role: "Software Engineer",
    company: "Monzo",
    location: "London, UK",
    quote:
      "Transitioned from a non-IT background to full-stack development in 60 days. The live project reviews made all the difference.",
    hair: "long",
  },
  {
    name: "Karthik Iyer",
    role: "Backend Engineer",
    company: "Stripe",
    location: "Austin, US",
    quote:
      "The system design mock interviews were what got me through the loop.",
    hair: "shortCombover",
  },
  {
    name: "Ananya Deshmukh",
    role: "Full Stack Developer",
    company: "Deliveroo",
    location: "Manchester, UK",
    quote:
      "Unlike regular courses, we wrote production code from week one.",
    hair: "bobCut",
  },
  {
    name: "Farhan Qureshi",
    role: "Data Engineer",
    company: "Datadog",
    location: "Boston, US",
    quote:
      "The capstone was the closest thing to a real sprint I had done before joining a team.",
    hair: "shortComboverChops",
  },
  {
    name: "Meghna Barman",
    role: "Application Support Engineer",
    company: "Ocado Technology",
    location: "Bristol, UK",
    quote:
      "Debugging alongside mentors on live systems taught me more than any tutorial.",
    hair: "extraLong",
  },
  {
    name: "Nithin Reddy",
    role: "GenAI Engineer",
    company: "Notion",
    location: "San Francisco, US",
    quote:
      "We shipped a retrieval pipeline end to end. That project is still the first thing I show in interviews.",
    hair: "curly",
  },
  {
    name: "Sneha Nair",
    role: "DevOps Engineer",
    company: "Checkout.com",
    location: "London, UK",
    quote:
      "60 days of daily code review built the habits I now use on every pull request.",
    hair: "bobBangs",
  },
  {
    name: "Hardik Patel",
    role: "Backend AI Engineer",
    company: "Cloudflare",
    location: "Austin, US",
    quote:
      "The mentorship was relentless in the best way — no ticket was ever left half done.",
    hair: "buzzcut",
  },
  {
    name: "Ritika Rathore",
    role: "Frontend Engineer",
    company: "Wise",
    location: "Birmingham, UK",
    quote:
      "Coming from a design background, the frontend track met me exactly where I was.",
    hair: "pigtails",
  },
  {
    name: "Debashish Mohanty",
    role: "Database Administrator",
    company: "Ramp",
    location: "New York, US",
    quote:
      "I arrived knowing basic SQL and left able to reason about query plans and replication.",
    hair: "shortCombover",
  },
  {
    name: "Tenzin Dolma",
    role: "Full Stack Engineer",
    company: "Figma",
    location: "Seattle, US",
    quote:
      "The 60-day structure forced me to finish things. That was the skill I was missing.",
    hair: "straightBun",
  },
  {
    name: "Suhas Gowda",
    role: "Software Engineer",
    company: "Sky",
    location: "Leeds, UK",
    quote:
      "Live commercial projects meant my portfolio was made of work, not exercises.",
    hair: "shortComboverChops",
  },
];

const AVATAR_STYLE = "personas";

/** Natural dark hair only — the style's own palette is mostly fantasy colours (pink, lilac). */
const HAIR_COLORS = "2c1b18,362c47,4a312c,6c4545";

/** The style defaults to a wider palette, but its palest tone reads washed out at this size. */
const SKIN_COLORS = "e7a391,e5a07e,d78774,b16a5b,92594b,623d36";

/**
 * Seeded by the name, so one person always gets the same illustration — plus the hair
 * variant pinned in the pool.
 *
 * The style has no gender option (no DiceBear style does), so `seed` alone gives every
 * feature at random and the illustration has nothing to do with the name: a woman could
 * grow facial hair, and hair was a uniform draw from all 20 variants. Pinning `hair` and
 * zeroing `facialHairProbability` is what ties the face to the name.
 *
 * The remaining pins are because this style's defaults include a few options that would
 * look wrong on a professional testimonial — pink hair, closed or sunglasses eyes, and a
 * pacifier mouth. Everything else (skin tone, clothes colour, the seeded pick within each
 * pinned list) still varies per person.
 */
export const avatarUrl = (person: TestimonialPerson) =>
  `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg` +
  `?seed=${encodeURIComponent(person.name)}` +
  `&hair=${person.hair}` +
  `&hairColor=${HAIR_COLORS}` +
  `&skinColor=${SKIN_COLORS}` +
  `&eyes=open` +
  `&mouth=smile,bigSmile,smirk` +
  `&facialHairProbability=0`;

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
    `Our alumni have moved into software and AI engineering roles across the UK and US:`,
    ``,
    ...people.map(
      (person) =>
        `* ![](${avatarUrl(person)}) **${person.name}** — ${person.role}, ${person.company} · ${person.location}  \n  *"${person.quote}"*`
    ),
    ``,
    `Would you like to connect with an alumnus or see our hiring partner companies?`,
  ].join("\n");
}
