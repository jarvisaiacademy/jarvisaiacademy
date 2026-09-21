/**
 * The alumni the testimonials reply quotes.
 *
 * There is no pool in this file. The people live in the `testimonials` collection, written
 * by `pnpm seed:content` from `scripts/seed-data/testimonials.mjs` and read here by
 * `TestimonialsProvider`. The seed that used to sit here was twelve invented graduates with
 * AI-generated portraits, and because it was also the fallback it served as the live content
 * — the chat quoted people who do not exist for as long as Firestore was empty.
 *
 * So the pool starts empty and the reply says so. A missing collection now reads as "no
 * testimonials yet" rather than as a reason to invent some.
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

/**
 * The live pool, swapped in by TestimonialsProvider once Firestore has answered.
 *
 * A mutable module variable rather than a parameter because `buildTestimonialsText` is
 * called synchronously from a getter in `academy-knowledge.ts`. This is the same
 * store shape as `src/lib/admission-card-effect.ts`.
 */
let pool: TestimonialPerson[] = [];

export function setTestimonialPool(next: TestimonialPerson[]): void {
  pool = next;
}

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
 * With nothing published this says exactly that. It deliberately does not quote anybody,
 * and it does not claim alumni exist either — the honest answer is that the academy has
 * none to show yet, which is also what a prospective student needs to know.
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
  if (pool.length === 0) {
    return [
      `🏆 **Student Success Stories & Placements**:`,
      ``,
      `We publish alumni outcomes here once graduates have agreed to be named and quoted. Nothing is up yet, so rather than show you a testimonial we cannot stand behind, ask the admissions desk for reference contacts from the most recent batch.`,
    ].join("\n");
  }

  const people = shuffle(pool).slice(0, count);

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
