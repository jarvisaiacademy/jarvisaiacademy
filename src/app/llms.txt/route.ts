import type { CourseItem } from "@/data/courses";
import { getPublicCourses } from "@/lib/courses-server";
import { siteConfig } from "@/config/site";

// Served at /llms.txt, generated from the Firestore catalogue through
// getPublicCourses() so what an agent reads cannot drift from what the chat UI
// renders. Every track also has a public page, so the catalogue is both described
// inline (below) and linked.
export const revalidate = 300;

const bullet = (c: CourseItem) =>
  `- **${c.title}** — ${c.fee}, ${c.duration}, ${c.level}. ${c.description} Tech stack: ${c.techStack.join(", ")}.`;

const isReferral = (c: CourseItem) => c.id === "referral";

const courseUrl = (c: CourseItem) => `${siteConfig.url}/courses/${c.id}`;

export async function GET() {
  const all = await getPublicCourses();
  const courses = all.filter((c) => !isReferral(c));
  const referral = all.filter(isReferral);

  const body = `# ${siteConfig.name}

> ${siteConfig.name} is a 60-day, build-first software engineering bootcamp in Pune, India. It runs ${courses.length} program tracks — full-stack AI and web, frontend, backend, generative AI, data and business analysis, DevOps, database administration, application support and Laravel — each at ₹30,000 all-inclusive tuition. Its Super10 Elite batch is the one fully sponsored track (₹0), capped at 10 seats, and carries a 100% placement assurance.

The site is an AI chat interface, not a set of articles. Pricing, the referral programme, testimonials and enrolment all render as replies inside the chat at ${siteConfig.url}/. Each program additionally has a page carrying its fee, duration, curriculum and technology stack — prefer those for anything a single program owns. The catalogue below remains the authoritative index. Admissions happen in the chat or by email; there is no public application form.

## Courses

${courses.map(bullet).join("\n")}

## Refer & Earn

${referral.map(bullet).join("\n")}

## Course pages

- [All courses](${siteConfig.url}/courses)
${all.map((c) => `- [${c.title}](${courseUrl(c)})`).join("\n")}

## Contact

- Email: ${siteConfig.contact.email}
- Finance and payments: ${siteConfig.contact.financeEmail}
- Phone: ${siteConfig.contact.phone}
- Location: Pune, Maharashtra, India

## Links

- [${siteConfig.name}](${siteConfig.url}/): the chat interface, where admissions happen
- [Courses](${siteConfig.url}/courses): every program on one page
- [LinkedIn](${siteConfig.links.linkedin})
- [Instagram](${siteConfig.links.instagram})
- [YouTube](${siteConfig.links.youtube})
- [X](${siteConfig.links.twitter})
- [Facebook](${siteConfig.links.facebook})

## Optional

- [Settings](${siteConfig.url}/settings): language and theme preferences. Requires sign-in and is excluded from search engines.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
