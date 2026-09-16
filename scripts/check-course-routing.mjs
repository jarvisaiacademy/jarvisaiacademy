/**
 * Proves the sidebar's course rows reach the right knowledge-base section.
 *
 * The rows send `course.id`, which is not a knowledge-base key, so `openSection`
 * asks for the programme by title and lets `determineReply` route it. This pulls
 * that real branch chain out of chat-canvas.tsx (rather than restating it, which
 * would drift) and asserts each catalogue title lands on its own section.
 */
import fs from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const src = fs.readFileSync(`${ROOT}/src/components/chat/chat-canvas.tsx`, "utf8");
const catalogue = fs.readFileSync(`${ROOT}/src/data/courses.ts`, "utf8");

// --- pull `determineReply`'s branch chain -----------------------------------
const decl = src.indexOf("const determineReply");
const arrowBrace = src.indexOf("{", src.indexOf("=>", decl));
let depth = 0;
let end = -1;
for (let i = arrowBrace; i < src.length; i++) {
  if (src[i] === "{") depth++;
  else if (src[i] === "}" && --depth === 0) {
    end = i;
    break;
  }
}
if (end === -1) throw new Error("could not find the end of determineReply");

const body = src
  .slice(arrowBrace + 1, end)
  .replace(/academyKnowledge\.(\w+)/g, '"$1"');
const determineReply = new Function("prompt", body);

// --- catalogue ids and titles ----------------------------------------------
const courses = [...catalogue.matchAll(/id: "([^"]+)",\s*\n\s*number:[\s\S]*?title: "([^"]+)"/g)].map(
  (m) => ({ id: m[1], title: m[2] })
);
const byId = Object.fromEntries(courses.map((c) => [c.id, c]));

const expected = {
  fullstack: "courses", // no dedicated section — the catalogue is its answer
  "frontend-react": "frontend",
  "backend-python": "backend",
  genai: "genai",
  "data-analyst": "data_analyst",
  "business-analyst": "business_analyst",
  "devops-aws": "devops",
  "database-admin": "database",
  "app-support": "app_support",
  "web-laravel": "laravel",
};

// The rows the sidebar actually renders (`DEDICATED_ROWS` excludes these two).
const ROWS = Object.keys(expected);
let failures = 0;

const sections = new Set([...src.matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));

for (const id of ROWS) {
  const course = byId[id];
  if (!course) {
    console.error(`FAIL  ${id}: not found in COURSES_DATA`);
    failures++;
    continue;
  }
  const got = determineReply(`Tell me about ${course.title}`);
  const want = expected[id];
  const ok = got === want;
  if (!ok) failures++;

  // A course row must never open the checkout, quote fees, or pitch the referral
  // reward instead of describing the programme it names.
  if (["enroll", "payment_terms", "referral", "super10", "sponsored"].includes(got)) {
    console.error(`FAIL  ${id} routed to "${got}" — that is a different answer entirely`);
    failures++;
  }
  if (!sections.has(got)) {
    console.error(`FAIL  ${id} -> "${got}" is not a section in academyKnowledge`);
    failures++;
  }

  console.log(`${ok ? "ok  " : "FAIL"}  ${course.title}\n        -> ${got} (want ${want})`);
}

if (ROWS.length !== 10 || courses.length !== 12) {
  console.error(`FAIL  parsed ${courses.length} catalogue entries, expected 12`);
  failures++;
}
if (sections.size < 18) {
  console.error(`FAIL  parsed only ${sections.size} knowledge sections`);
  failures++;
}

console.log(failures ? `\n${failures} failure(s)` : `\nall ${ROWS.length} course rows route correctly`);
process.exit(failures ? 1 : 0);
