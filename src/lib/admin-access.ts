import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export async function requireAdmin(): Promise<void> {
  const uid = auth?.currentUser?.uid;
  if (!db || !uid) {
    throw new Error("Unauthorized: An authenticated admin account is required.");
  }

  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    throw new Error("Unauthorized: Only admin accounts can perform this action.");
  }
}
