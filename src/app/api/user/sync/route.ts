import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createUser, getUserByClerkId } from "@/lib/db";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await getUserByClerkId(userId);
    if (existing) {
      return NextResponse.json({ user: existing, created: false });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "No user" }, { status: 404 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      "Student";

    const user = await createUser(userId, email, name);
    return NextResponse.json({ user, created: true });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}