"use client";

import { useEffect, ReactNode } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TestimonialPerson, setTestimonialPool } from "@/data/testimonials";

/**
 * Keeps the testimonials pool in step with Firestore.
 *
 * No context and no hook: the only consumer is the `testimonials` chat reply, which reads
 * the pool synchronously through `buildTestimonialsText()`. This component exists purely
 * to run the subscription and hand the result to that module store.
 *
 * Testimonials are public read-only content, so unlike courses there is no CRUD or admin
 * seeding to host — which is why this is one file rather than a provider plus a service.
 * The collection being empty is a valid state and the one the site starts in: the reply says
 * the academy has published none yet rather than quoting somebody.
 */
export function TestimonialsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, "testimonials"),
      (snap) => {
        setTestimonialPool(snap.docs.map((d) => d.data() as TestimonialPerson));
      },
      (err) => {
        console.warn("[TestimonialsProvider] Subscription failed, showing no testimonials:", err);
      }
    );

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
