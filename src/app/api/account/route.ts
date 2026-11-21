import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserByClerkId, deleteUser } from "@/lib/db";

export async function DELETE() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getUserByClerkId(clerkId);
    if (user) await deleteUser(user.id); 
    const client = await clerkClient();
    await client.users.deleteUser(clerkId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ error: "Couldn't delete your account. Please try again." }, { status: 500 });
  }
}