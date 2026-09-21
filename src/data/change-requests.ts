// Lives here rather than in the service so the dashboard can name the collection and
// the type without importing the service that writes it.
export const CHANGE_REQUESTS_COLLECTION = "changeRequests";

/**
 * A request to change public-facing copy that is **hard-coded in `src/`**, and which no
 * dashboard edit can therefore reach: the assistant's replies in
 * `src/data/academy-knowledge.ts`, the alumni pool in `src/data/testimonials.ts`, the prose
 * in `src/app/llms.txt/route.ts`. The app stores the request and shows it to a developer;
 * it never edits the codebase. Everything the dashboard already edits — courses, teachers,
 * settings — belongs in those tabs instead, not here.
 *
 * `replyKey` names the reply in `academyKnowledge` this is about. It is picked from
 * `REPLY_KEYS` rather than typed, so a request cannot point at a reply that does not exist.
 *
 * `requestedText` is the replacement **verbatim**. The reviewer's own wording is the
 * authority — a developer copies it across, and rephrasing it on the way would be the
 * request being quietly overruled.
 *
 * `screenshotUrl` is a link, not an upload: an annotated screenshot usually says what
 * "make this friendlier" cannot, but storing images would mean Firebase Storage, its rules
 * and its bill for a queue this size.
 *
 * `createdAt` is an ISO string, matching `TeacherRecord`, and not a Firestore
 * `serverTimestamp()`: the sentinel reads back as `null` on the pending local write, so a
 * freshly filed request would render a blank date until the server acknowledged it.
 */
export interface ChangeRequest {
  id: string;
  replyKey: string;
  requestedText: string;
  note: string;
  screenshotUrl: string;
  requestedBy: string;
  createdAt: string;
  done: boolean;
}
