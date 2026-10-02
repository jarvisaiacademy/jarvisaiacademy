/**
 * Proves every catalogue entry reaches the right knowledge-base section.
 *
 * The sidebar rows send `course.id`, which is not a knowledge-base key, so
 * `openSection` asks for the programme by title and lets `determineReply` route it.
 * The public programme pages skip the router and read `COURSE_KB_KEY` directly, so
 * the two paths can disagree about a programme without either one looking wrong.
 *
 * This pulls the real branch chain out of chat-canvas.tsx and the real key map out
 * of academy-knowledge.ts (rather than restating either, which would drift) and
 * asserts they agree, section by section.
 */
import fs from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const src = fs.readFileSync(`${ROOT}/src/components/chat/chat-canvas.tsx`, "utf8");
const kb = fs.readFileSync(`${ROOT}/src/data/academy-knowledge.ts`, "utf8");
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
  .replace(/academyKnowledge\.(\w+)/g, '"$1"')
  .replace(/\((\w+): string\)/g, "($1)");
const determineReply = new Function("prompt", body);

// --- catalogue ids and titles ----------------------------------------------
const courses = [...catalogue.matchAll(/id: "([^"]+)",\s*\n\s*number:[\s\S]*?title: "([^"]+)"/g)].map(
  (m) => ({ id: m[1], title: m[2] })
);
const byId = Object.fromEntries(courses.map((c) => [c.id, c]));

// --- the sections, and the map the public pages read ------------------------
const sections = new Set([...kb.matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));

const mapStart = kb.indexOf("export const COURSE_KB_KEY");
if (mapStart === -1) throw new Error("COURSE_KB_KEY not found");
const expected = Object.fromEntries(
  [
    ...kb
      .slice(mapStart, kb.indexOf("};", mapStart))
      .matchAll(/^\s{2}"?([\w-]+)"?: "(\w+)",$/gm),
  ].map((m) => [m[1], m[2]])
);

// The rows the sidebar actually renders (`DEDICATED_ROWS` excludes these two).
const DEDICATED = new Set(["super10", "referral"]);
const ROWS = courses.map((c) => c.id).filter((id) => !DEDICATED.has(id));
let failures = 0;

// Every catalogue entry needs a page target, whether or not the sidebar lists it.
for (const { id } of courses) {
  if (!expected[id]) {
    console.error(`FAIL  ${id} has no COURSE_KB_KEY entry — /courses/${id} has no answer`);
    failures++;
  } else if (!sections.has(expected[id])) {
    console.error(`FAIL  ${id} maps to "${expected[id]}", which is not a section`);
    failures++;
  }
}

for (const id of ROWS) {
  const course = byId[id];
  if (!course) {
    console.error(`FAIL  ${id}: not found in COURSES_DATA`);
    failures++;
    continue;
  }
  // The chat's keyword router and the page's explicit map must name the same
  // section, or the sidebar and the public page tell different stories.
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
