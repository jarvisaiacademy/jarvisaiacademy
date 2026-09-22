import { NextResponse } from "next/server";
import { getPublicCourses } from "@/lib/courses-server";

// The catalogue every visitor's browser used to subscribe to, served from one cached response
// instead.
//
// The client providers each held an `onSnapshot` for everyone, so a page load cost ~12
// Firestore reads — the twelve courses — for visitor and crawler alike, which is roughly 3,800
// page loads a day on the Spark free tier. Nothing about the catalogue is per-visitor, so
// `revalidate` does the job a live listener was doing and Firestore is read once per window no
// matter how much traffic arrives.
//
// The same window as `/courses`, the sitemap and `/llms.txt`, which read through the same
// helper, so a dashboard edit reaches the whole public surface at the same moment.
//
// The collection is public by `firestore.rules`, so this exposes nothing an anonymous visitor
// could not already read directly.
export const revalidate = 300;

export async function GET() {
  const courses = await getPublicCourses();
  return NextResponse.json({ courses });
}
