import type { CourseItem } from "@/data/courses";
import { COURSES_DATA } from "@/data/courses";
import { siteConfig } from "@/config/site";

// Served at /llms.txt. Generated from COURSES_DATA so what an agent reads cannot
// drift from what the chat UI renders — the public site has no per-course routes,
// so the catalogue is described inline rather than linked.
export const dynamic = "force-static";

const bullet = (c: CourseItem) =>
  `- **${c.title}** — ${c.fee}, ${c.duration}, ${c.level}. ${c.description} Tech stack: ${c.techStack.join(", ")}.`;

const isReferral = (c: CourseItem) => c.id === "referral";
const courses = COURSES_DATA.filter((c) => !isReferral(c));
const referral = COURSES_DATA.filter(isReferral);

const body = `# ${siteConfig.name}

> ${siteConfig.name} is a 60-day, build-first software engineering bootcamp in Pune, India. It runs ${courses.length} cohort tracks — full-stack AI and web, frontend, backend, generative AI, data and business analysis, DevOps, database administration, application support and Laravel — each fully sponsored at ₹0 tuition. Its Super10 Elite batch is capped at 10 seats and carries a 100% placement assurance.

The site is an AI chat interface, not a set of articles. There are no per-course pages: the catalogue, pricing, the referral programme, testimonials and enrolment all render as replies inside a single-page chat. Treat the catalogue below as the site's authoritative content, and ${siteConfig.url}/ as its only public page. Admissions happen in the chat or by email; there is no public application form.

## Courses

${courses.map(bullet).join("\n")}

## Refer & Earn

${referral.map(bullet).join("\n")}

## Contact

- Email: ${siteConfig.contact.email}
- Finance and payments: ${siteConfig.contact.financeEmail}
- Phone: ${siteConfig.contact.phone}
- Location: Pune, Maharashtra, India

## Links

- [${siteConfig.name}](${siteConfig.url}/): the chat interface — the site's only public page
- [LinkedIn](${siteConfig.links.linkedin})
- [Instagram](${siteConfig.links.instagram})
- [YouTube](${siteConfig.links.youtube})
- [X](${siteConfig.links.twitter})
- [Facebook](${siteConfig.links.facebook})

## Optional

- [Settings](${siteConfig.url}/settings): language and theme preferences. Requires sign-in and is excluded from search engines.
`;

export function GET() {
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
