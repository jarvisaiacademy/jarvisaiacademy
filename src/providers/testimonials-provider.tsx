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
 */
export function TestimonialsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, "testimonials"),
      (snap) => {
        // An empty collection means "not seeded yet", not "no testimonials".
        // setTestimonialPool enforces the same rule; this avoids the call entirely.
        if (snap.empty) return;
        setTestimonialPool(snap.docs.map((d) => d.data() as TestimonialPerson));
      },
      (err) => {
        console.warn("[TestimonialsProvider] Subscription error, keeping the seed pool:", err);
      }
    );

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
