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

const STORAGE_KEY = "jarvis:admission-card-effect";

/** The orb is the one that stays if nobody ever touches the switch. */
const DEFAULT_EFFECT: AdmissionCardEffect = "orb";

const KNOWN: readonly AdmissionCardEffect[] = ["orb", "border", "library", "loop", "cycle"];

const listeners = new Set<() => void>();
let current: AdmissionCardEffect | null = null;

function read(): AdmissionCardEffect {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Validated rather than cast: a value written by an older build would otherwise survive a
    // reload and leave the card rendering an effect that no longer exists.
    return KNOWN.includes(stored as AdmissionCardEffect)
      ? (stored as AdmissionCardEffect)
      : DEFAULT_EFFECT;
  } catch {
    return DEFAULT_EFFECT;
  }
}

function getSnapshot(): AdmissionCardEffect {
  if (current === null) current = read();
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
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode or a blocked store: the choice just will not outlive the tab.
  }
  for (const listener of listeners) listener();
}

export function useAdmissionCardEffect() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
