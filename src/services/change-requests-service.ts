import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CHANGE_REQUESTS_COLLECTION, ChangeRequest } from "@/data/change-requests";
import { checkIsAdmin } from "@/providers/auth-provider";

/** The fields a requester supplies; the rest are filled in here. */
export interface ChangeRequestInput {
  replyKey: string;
  requestedText: string;
  note?: string;
  screenshotUrl?: string;
}

/**
 * Subscribe to the change-request queue. Admin-only to read, so a non-admin's listener
 * would only ever receive permission-denied.
 *
 * Newest first, with the open ones above the done ones — the queue's whole job is to show
 * what is still waiting, and a finished request is only there as a record that it happened.
 */
export function subscribeChangeRequestsFromFirestore(
  onUpdate: (requests: ChangeRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  try {
    return onSnapshot(
      query(collection(db, CHANGE_REQUESTS_COLLECTION)),
      (snapshot) => {
        const requests: ChangeRequest[] = [];
        snapshot.forEach((docSnap) => {
          requests.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ChangeRequest, "id">),
          });
        });
        requests.sort(
          (a, b) =>
            Number(a.done) - Number(b.done) ||
            (b.createdAt || "").localeCompare(a.createdAt || "")
        );
        onUpdate(requests);
      },
      (err) => {
        console.error("[ChangeRequestsService] Firestore onSnapshot error:", err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.error("[ChangeRequestsService] Failed to set up the request listener:", err);
    return null;
  }
}

/**
 * File a request. `requestedBy` is the signed-in admin's own address, which is also what the
 * guard checks — an admin cannot file one in somebody else's name.
 */
export async function createChangeRequestInFirestore(
  input: ChangeRequestInput,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can request a change.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  await addDoc(collection(db, CHANGE_REQUESTS_COLLECTION), {
    replyKey: input.replyKey,
    requestedText: input.requestedText.trim(),
    note: input.note?.trim() ?? "",
    screenshotUrl: input.screenshotUrl?.trim() ?? "",
    requestedBy: userEmail ?? "",
    createdAt: new Date().toISOString(),
    done: false,
  });
}

/**
 * Tick a request off, or put it back. Deliberately the only state it has: the decided
 * workflow is a list with a done toggle, and a status machine would invent approvals
 * nobody is making.
 */
export async function setChangeRequestDoneInFirestore(
  requestId: string,
  done: boolean,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can close a request.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  await updateDoc(doc(db, CHANGE_REQUESTS_COLLECTION, requestId), { done });
}
