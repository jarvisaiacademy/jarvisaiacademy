import { doc, onSnapshot, setDoc, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  SETTINGS_COLLECTION,
  SETTINGS_DOC_ID,
} from "@/data/app-settings";
import { checkIsAdmin } from "@/providers/auth-provider";

/**
 * The academy's settings document.
 *
 * A fixed document id rather than a query, because there is exactly one settings document.
 * That is the only difference from the collection subscribers beside this file; the guards
 * and the error handling are the same shape.
 */

/**
 * Subscribe to the settings document.
 *
 * A document that does not exist yet is not an error and not "empty": it means nobody has
 * saved, so the caller is handed the defaults. `null` means Firestore itself is unavailable
 * and the caller should stop waiting.
 */
export function subscribeSettingsFromFirestore(
  onUpdate: (settings: AppSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  try {
    return onSnapshot(
      doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID),
      (snap) => {
        // Spread over the defaults rather than replacing them, so a document written before a
        // field existed still yields a complete object instead of one with a hole in it.
        onUpdate(
          snap.exists()
            ? { ...DEFAULT_APP_SETTINGS, ...(snap.data() as Partial<AppSettings>) }
            : DEFAULT_APP_SETTINGS
        );
      },
      (err) => {
        console.error("[SettingsService] Firestore onSnapshot error:", err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.error("[SettingsService] Failed to set up the settings listener:", err);
    return null;
  }
}

/**
 * Save settings. Strictly restricted to verified admins.
 *
 * `merge: true` because these fields share one document, so a partial write is what an update
 * means here. A whole-document replace is the failure mode that costs the academy its GSTIN.
 */
export async function updateSettingsInFirestore(
  updates: Partial<AppSettings>,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can change the academy settings.");
  }

  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), updates, { merge: true });
}
