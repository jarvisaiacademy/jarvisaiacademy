import { cache } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  SETTINGS_COLLECTION,
  SETTINGS_DOC_ID,
} from "@/data/app-settings";

/**
 * The academy settings as the public read path should serve them.
 *
 * Deliberately not `settings-service.ts`: that file imports `checkIsAdmin` from
 * `auth-provider.tsx`, which is a Client Component, so pulling it in here would drag the
 * browser auth graph into the server render.
 *
 * The settings are public by rules — the reward, the seat cap, the GSTIN and the money-back
 * window are all advertised already — so this needs no credential and no admin check.
 *
 * `cache()` dedupes the read within a single render pass. It is per-request, so it cannot go
 * stale; the staleness window belongs to the route handler's `revalidate`.
 */
export const getPublicSettings = cache(async (): Promise<AppSettings> => {
  if (!db) return DEFAULT_APP_SETTINGS;

  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID));
    if (!snap.exists()) return DEFAULT_APP_SETTINGS;
    // Spread over the defaults rather than replacing them, so a document written before a
    // field existed still yields a complete object instead of one with a hole in it.
    return { ...DEFAULT_APP_SETTINGS, ...(snap.data() as Partial<AppSettings>) };
  } catch (err) {
    // Falling back silently would make a broken read look like a working one.
    console.warn("[settings] Firestore read failed, serving the built-in settings:", err);
    return DEFAULT_APP_SETTINGS;
  }
});
