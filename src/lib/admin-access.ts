import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
  "sugatraj.2106@gmail.com,hivirajkadam@gmail.com,lalitspatil03@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
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
  const role = (userDoc.exists() ? userDoc.data().role : "") || "";
  if (role.toLowerCase().trim() !== "admin") {
    throw new Error("Unauthorized: Only admin accounts can perform this action.");
  }
}
