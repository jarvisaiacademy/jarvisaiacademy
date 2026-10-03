import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/** Must stay in sync with the email list in `firestore.rules` → `isAdmin()`. */
export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
  "sugatraj.2106@gmail.com,hivirajkadam@gmail.com,lalitspatil03@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

function normalizeRole(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

export async function requireAdmin(): Promise<void> {
  const currentUser = auth?.currentUser;
  const uid = currentUser?.uid;
  if (!db || !uid) {
    throw new Error("Unauthorized: An authenticated admin account is required.");
  }

  if (currentUser?.email && checkIsAdmin(currentUser.email)) {
    return;
  }

  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists() || normalizeRole(userDoc.data().role) !== "admin") {
    throw new Error("Unauthorized: Only admin accounts can perform this action.");
  }
}
