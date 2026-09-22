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

const ADMIN_EMAIL = "sugatraj.2106@gmail.com";

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const now = Math.floor(Date.now() / 1000);

/** An unsigned token carrying the claims Firebase would put in a real ID token. */
const tokenFor = (uid, email) =>
  [b64({ alg: "none", typ: "JWT" }), b64({ aud: PROJECT, sub: uid, user_id: uid, email, email_verified: true, iat: now, exp: now + 3600 }), ""].join(".");

const studentOne = tokenFor("student-one", "student-one@example.com");
const bannedStudent = tokenFor("student-banned", "student-banned@example.com");
const super10Student = tokenFor("student-super", "student-super@example.com");
const facultyStudent = tokenFor("student-faculty", "student-faculty@example.com");
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
await patch(
  docPath("users", "student-banned"),
  { role: { stringValue: "student" }, status: { stringValue: "banned" } },
  "owner"
);
await patch(
  docPath("users", "student-super"),
  { role: { stringValue: "student" }, is_super10: { booleanValue: true } },
  "owner"
);
await patch(
  docPath("users", "student-faculty"),
  { role: { stringValue: "student" }, is_teacher: { booleanValue: true } },
  "owner"
);

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

// --- the fields that belong to the admin ---
// The self-update path exists so a name or avatar can refresh on sign-in. If it were not
// fenced, a banned candidate could clear their own ban from the browser console.
//
// Note these bodies carry `role` and the fenced field explicitly. This harness PATCHes
// without an update mask, so the body *is* the resulting document — which is how the
// client's `setDoc(..., { merge: true })` behaves too, once the stored fields are inlined.
await check("banned learner un-bans themselves", false, () =>
  patch(
    docPath("users", "student-banned"),
    { role: { stringValue: "student" }, status: { stringValue: "active" } },
    bannedStudent
  )
);
await check("banned learner rewrites their row keeping the ban", true, () =>
  patch(
    docPath("users", "student-banned"),
    { role: { stringValue: "student" }, status: { stringValue: "banned" }, name: { stringValue: "Renamed" } },
    bannedStudent
  )
);
await check("learner awards themselves Super10", false, () =>
  patch(
    docPath("users", "student-one"),
    { role: { stringValue: "student" }, is_super10: { booleanValue: true } },
    studentOne
  )
);
await check("learner strips their own Super10 flag", false, () =>
  patch(
    docPath("users", "student-super"),
    { role: { stringValue: "student" }, is_super10: { booleanValue: false } },
    super10Student
  )
);
// The flag is fenced, not the row: a Super10 learner is otherwise an ordinary learner.
await check("Super10 learner edits their own name", true, () =>
  patch(
    docPath("users", "student-super"),
    { role: { stringValue: "student" }, is_super10: { booleanValue: true }, name: { stringValue: "Renamed" } },
    super10Student
  )
);
// Faculty is the third admin-owned field. It is what `accountRoleOf` reads to put an account
// on the Teachers page, so a self-write here would let a learner hand themselves the role.
await check("learner marks themselves faculty", false, () =>
  patch(
    docPath("users", "student-one"),
    { role: { stringValue: "student" }, is_teacher: { booleanValue: true } },
    studentOne
  )
);
// The same self-grant on a *create* — a uid with no document yet, so the write is the row's
// first. Distinct uids, because if the first case were wrongly allowed it would leave a
// document behind and quietly turn the second into an update, testing the wrong path.
await check("new learner creates their own row as faculty", false, () =>
  patch(
    docPath("users", "student-fresh-a"),
    { role: { stringValue: "student" }, is_teacher: { booleanValue: true } },
    tokenFor("student-fresh-a", "student-fresh-a@example.com")
  )
);
await check("new learner creates their own row with a Super10 seat", false, () =>
  patch(
    docPath("users", "student-fresh-b"),
    { role: { stringValue: "student" }, is_super10: { booleanValue: true } },
    tokenFor("student-fresh-b", "student-fresh-b@example.com")
  )
);
// The control for the two above: an ordinary first write still lands, defaults and all.
await check("new learner creates their own row", true, () =>
  patch(
    docPath("users", "student-fresh-c"),
    {
      role: { stringValue: "student" },
      is_teacher: { booleanValue: false },
      is_super10: { booleanValue: false },
    },
    tokenFor("student-fresh-c", "student-fresh-c@example.com")
  )
);
// But it is fenced like the others, not a lock on the row: a teacher still refreshes normally.
await check("faculty learner edits their own name", true, () =>
  patch(
    docPath("users", "student-faculty"),
    { role: { stringValue: "student" }, is_teacher: { booleanValue: true }, name: { stringValue: "Renamed" } },
    facultyStudent
  )
);
await check("faculty learner strips their own faculty mark", false, () =>
  patch(
    docPath("users", "student-faculty"),
    { role: { stringValue: "student" }, is_teacher: { booleanValue: false } },
    facultyStudent
  )
);
// The default the app writes on every sign-in (`ROSTER_FIELD_DEFAULTS` in
// src/services/students-service.ts). It has to be allowed, or the write is a silent no-op:
// `where('is_teacher','==',false)` skips a row where the field is absent, so an account that
// never carried the flag is missing from the Students page until this lands on its own row.
// The deny case directly above is the other half — this may fill in a default, never clear one.
await check("learner writes the roster defaults onto their own row", true, () =>
  patch(
    docPath("users", "student-one"),
    {
      role: { stringValue: "student" },
      email: { stringValue: "student-one@example.com" },
      is_teacher: { booleanValue: false },
      status: { stringValue: "active" },
    },
    studentOne
  )
);

// --- an admin ---
await check("admin reads any row", true, () => get(docPath("users", "student-two"), admin));
await check("admin lists the roster", true, () => list("users", null, null, admin));
await check("admin writes the catalogue", true, () =>
  patch(docPath("courses", "fullstack"), { title: { stringValue: "Full-Stack AI & Web Engineering" } }, admin)
);
// The other half of the fence above: an admin is the one who may move these two fields.
await check("admin bans a candidate", true, () =>
  patch(docPath("users", "student-one"), { status: { stringValue: "banned" } }, admin)
);
await check("admin grants Super10", true, () =>
  patch(docPath("users", "student-two"), { is_super10: { booleanValue: true } }, admin)
);

// --- the collections the app no longer touches ---
// `teachers`, `changeRequests` and `assignments` were removed along with their features. No
// stanza covers them, so they fall to the catch-all and are closed to everyone — deliberately
// including an admin, since nothing writes them any more and a stanza reappearing here would
// be the sign that the feature had been put back without its rule.
for (const collectionId of ["teachers", "changeRequests", "assignments"]) {
  await check(`admin reads ${collectionId}`, false, () =>
    get(docPath(collectionId, "x1"), admin)
  );
  await check(`admin writes ${collectionId}`, false, () =>
    patch(docPath(collectionId, "x1"), { name: { stringValue: "vandalised" } }, admin)
  );
  await check(`learner reads ${collectionId}`, false, () =>
    get(docPath(collectionId, "x1"), studentOne)
  );
  await check(`learner writes ${collectionId}`, false, () =>
    patch(docPath(collectionId, "x1"), { name: { stringValue: "vandalised" } }, studentOne)
  );
}

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

// --- testimonials: closed on purpose ---
// The alumni live in `src/data/testimonials.ts` and are never read from Firestore, so the
// collection falls to the catch-all. If someone later puts them back in the database, these
// two flip and should be rewritten as the public-read pair they were before.
await check("guest reads a testimonial", false, () =>
  get(docPath("testimonials", "gurpreet-kaur"), guest)
);
await check("learner writes a testimonial", false, () =>
  patch(docPath("testimonials", "gurpreet-kaur"), { quote: { stringValue: "vandalised" } }, studentOne)
);

// --- settings: every value in it is advertised publicly, so reads are open and writes are not ---
await check("admin writes the settings", true, () =>
  patch(
    docPath("settings", "app"),
    { referralReward: { integerValue: "3000" }, gstin: { stringValue: "27AABCJ1988Z1Z9" } },
    admin
  )
);
await check("guest reads the settings", true, () => get(docPath("settings", "app"), guest));
await check("learner reads the settings", true, () => get(docPath("settings", "app"), studentOne));
await check("learner writes the settings", false, () =>
  patch(docPath("settings", "app"), { referralReward: { integerValue: "9999" } }, studentOne)
);
await check("guest creates a settings doc", false, () =>
  patch(docPath("settings", "intruder"), { gstin: { stringValue: "x" } }, guest)
);

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}
console.log("firestore.rules allows and denies what it should");
process.exit(0);
