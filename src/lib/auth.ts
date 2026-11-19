import { auth, currentUser } from "@clerk/nextjs/server";
import { createUser, getUserByClerkId } from "@/lib/db";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await getUserByClerkId(userId);
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses?.[0]?.emailAddress ??
    "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    "Student";

  return createUser(userId, email, name);
}