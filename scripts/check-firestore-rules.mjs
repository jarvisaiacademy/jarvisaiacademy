/**
 * Asserts that firestore.rules denies what it claims to deny.
 *
 * The rules are the only thing protecting the roster, so a typo in them is the difference
 * between "learners see their own row" and "learners see everyone's". This drives the real
 * rules in the emulator and fails if any case comes out the other way.
 *
 *   pnpm exec firebase emulators:start --only firestore --project demo-jarvis-local
 *   pnpm check:rules
 *
 * The emulator is started separately rather than through `emulators:exec`, which bundles a
 * node that refuses to load this file as an ES module.
 *
 * Talks REST directly, with unsigned JWTs standing in for sign-in. That is deliberate: the
 * Firestore emulator reads the claims without checking the signature, so this needs no auth
 * emulator, no client SDK, and no login. `owner` is the emulator's bypass token and is used
 * only to clear up after a previous run.
 */
const PROJECT = process.env.GCLOUD_PROJECT || "demo-jarvis-local";
const HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
const BASE = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;

const ADMIN_EMAIL = "sugat@jarvisaiacademy.com";

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const now = Math.floor(Date.now() / 1000);

/** An unsigned token carrying the claims Firebase would put in a real ID token. */
const tokenFor = (uid, email) =>
  [b64({ alg: "none", typ: "JWT" }), b64({ aud: PROJECT, sub: uid, user_id: uid, email, email_verified: true, iat: now, exp: now + 3600 }), ""].join(".");

const studentOne = tokenFor("student-one", "student-one@example.com");
const studentTwo = tokenFor("student-two", "student-two@example.com");
const admin = tokenFor("admin-uid", ADMIN_EMAIL);
const guest = null;

/** Path to a document, from its segments. */
const docPath = (...segments) => `${BASE}/${segments.join("/")}`;

async function request(url, { method = "GET", token, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    // A denial answers with a body; anything else that is not JSON is not our concern.
  }
  return { status: res.status, body: parsed };
}

/** True when the response carries a permission denial, however it is shaped. */
function denied({ status, body }) {
  if (status === 403) return true;
  const blobs = Array.isArray(body) ? body : [body];
  return blobs.some((entry) => entry?.error?.status === "PERMISSION_DENIED");
}

const patch = (path, fields, token) =>
  request(path, { method: "PATCH", token, body: { fields } });
const get = (path, token) => request(path, { token });

const list = (collectionId, filterField, filterValue, token) =>
  request(`${BASE}:runQuery`, {
    method: "POST",
    token,
    body: {
      structuredQuery: {
        from: [{ collectionId }],
        ...(filterField
          ? {
              where: {
                fieldFilter: {
                  field: { fieldPath: filterField },
                  op: "EQUAL",
                  value: { stringValue: filterValue },
                },
              },
            }
          : {}),
      },
    },
  });

let passed = 0;
const failures = [];

async function check(label, expect, run) {
  let isDenied = false;
  let unexpected = false;
  try {
    const res = await run();
    isDenied = denied(res);
    // An error that is not a denial means the rules file failed to evaluate at all, which
    // is a different problem from a rule doing its job.
    unexpected = !isDenied && res.status >= 400;
  } catch (err) {
    unexpected = true;
    failures.push(`${label} — could not reach the emulator: ${err.message}`);
    return;
  }
  if (unexpected) {
    failures.push(`${label} — unexpected response, not a rules verdict`);
    return;
  }

  const allowed = !isDenied;
  if (allowed === expect) {
    passed += 1;
    console.log(`ok    ${label}${isDenied ? "  (permission-denied)" : ""}`);
  } else {
    failures.push(`${label} — expected ${expect ? "allow" : "deny"}, got ${allowed ? "allow" : "deny"}`);
    console.log(`FAIL  ${label}${isDenied ? "  (permission-denied)" : ""}`);
  }
}

// The emulator keeps state for as long as it runs, so start from a known shape. `owner`
// bypasses the rules; nothing below relies on it.
await patch(docPath("users", "student-one"), { role: { stringValue: "student" } }, "owner");
await patch(docPath("users", "student-two"), { role: { stringValue: "student" } }, "owner");

// --- a signed-in learner ---
await check("learner writes their own row", true, () =>
  patch(docPath("users", "student-one"), { role: { stringValue: "student" }, email: { stringValue: "student-one@example.com" } }, studentOne)
);
await check("learner reads their own row", true, () => get(docPath("users", "student-one"), studentOne));
await check("learner promotes themselves to admin", false, () =>
  patch(docPath("users", "student-one"), { role: { stringValue: "admin" } }, studentOne)
);
await check("learner reads another learner's row", false, () => get(docPath("users", "student-two"), studentOne));
await check("learner lists the whole roster", false, () => list("users", null, null, studentOne));
await check("learner deletes their own row", false, () => request(docPath("users", "student-one"), { method: "DELETE", token: studentOne }));

// --- assignments ---
await check("admin writes an assignment", true, () =>
  patch(docPath("assignments", "a1"), { studentId: { stringValue: "student-one" }, status: { stringValue: "active" } }, admin)
);
await check("learner lists their own assignments", true, () => list("assignments", "studentId", "student-one", studentOne));
await check("learner lists every assignment", false, () => list("assignments", null, null, studentOne));
await check("learner lists another learner's assignments", false, () => list("assignments", "studentId", "student-two", studentOne));
await check("learner writes their own assignment", false, () =>
  patch(docPath("assignments", "a2"), { studentId: { stringValue: "student-one" } }, studentOne)
);
await check("second learner lists the first learner's assignments", false, () => list("assignments", "studentId", "student-one", studentTwo));

// --- an admin ---
await check("admin reads any row", true, () => get(docPath("users", "student-two"), admin));
await check("admin lists the roster", true, () => list("users", null, null, admin));
await check("admin writes the catalogue", true, () =>
  patch(docPath("courses", "fullstack"), { title: { stringValue: "Full-Stack AI & Web Engineering" } }, admin)
);

// --- guests ---
await check("guest reads the public catalogue", true, () => get(docPath("courses", "fullstack"), guest));
await check("guest reads a roster row", false, () => get(docPath("users", "student-two"), guest));
await check("guest writes a roster row", false, () =>
  patch(docPath("users", "intruder"), { role: { stringValue: "student" } }, guest)
);
await check("guest lists the roster", false, () => list("users", null, null, guest));
await check("guest reads an unmapped collection", false, () => get(docPath("secrets", "x"), guest));

// --- a learner on collections that are not theirs ---
await check("learner reads the catalogue", true, () => get(docPath("courses", "fullstack"), studentOne));
await check("learner writes the catalogue", false, () =>
  patch(docPath("courses", "fullstack"), { title: { stringValue: "vandalised" } }, studentOne)
);

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
console.log("firestore.rules allows and denies what it should");
process.exit(0);
