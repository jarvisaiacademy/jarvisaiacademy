/**
 * Maps sidebar topics/sections to their respective chat page URLs.
 * Matches user requirements:
 * - /cources/
 * - /super10/
 * - /certificate/
 * - /enquiry/
 * - /cource/<course-id> for each individual course
 */
export function topicToUrl(topic: string): string {
  if (!topic) return "/";
  if (topic === "courses") return "/cources";
  if (topic === "super10") return "/super10";
  if (topic === "certificate") return "/certificate";
  if (topic === "enquiry") return "/enquiry";
  if (topic === "referral") return "/referral";
  if (topic === "testimonials") return "/testimonials";
  // Individual course (or any other dynamic course ID)
  return `/cource/${topic}`;
}

/**
 * Parses a browser pathname into its corresponding chat topic.
 * Robust against trailing slashes and handles both phonetic/standard spellings:
 * - /cources, /courses -> "courses"
 * - /super10 -> "super10"
 * - /certificate -> "certificate"
 * - /enquiry, /enquery -> "enquiry"
 * - /referral, /referrals -> "referral"
 * - /testimonials -> "testimonials"
 * - /cource/:slug, /course/:slug, /cources/:slug, /courses/:slug -> ":slug"
 */
export function urlToTopic(pathname: string): string | null {
  if (!pathname || pathname === "/") return null;
  const clean = pathname.replace(/\/+$/, "");

  if (clean === "/cources" || clean === "/courses") return "courses";
  if (clean === "/super10") return "super10";
  if (clean === "/certificate") return "certificate";
  if (clean === "/enquiry" || clean === "/enquery") return "enquiry";
  if (clean === "/referral" || clean === "/referrals") return "referral";
  if (clean === "/testimonials") return "testimonials";

  const match = clean.match(/^\/(?:cource|course|cources|courses)\/([^/]+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  return null;
}
