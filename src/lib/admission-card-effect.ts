"use client";

import { useSyncExternalStore } from "react";

/**
 * Which cursor-following effect the admissions card wears. All of them are built and one is
 * picked from a switch inside the card, so the choice has to be shared: the card renders
 * under every answer, and setting it on one copy must not leave the rest behind.
 *
 * A module store rather than context, because the cards are scattered through the
 * transcript with no single owner above them.
 */
export type AdmissionCardEffect = "orb" | "border" | "library" | "loop" | "cycle";

/**
 * What the card wears. Deliberately not persisted: this is set in code, so the deployed site
 * shows the effect named here rather than whatever a visitor's browser once stored.
 */
const DEFAULT_EFFECT: AdmissionCardEffect = "loop";

const listeners = new Set<() => void>();
let current: AdmissionCardEffect | null = null;

function getSnapshot(): AdmissionCardEffect {
  if (current === null) current = DEFAULT_EFFECT;
  return current;
}

/** Rendered on the server and during hydration, then corrected — see useSyncExternalStore. */
function getServerSnapshot(): AdmissionCardEffect {
  return DEFAULT_EFFECT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAdmissionCardEffect(next: AdmissionCardEffect) {
  current = next;
  for (const listener of listeners) listener();
}

export function useAdmissionCardEffect() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
