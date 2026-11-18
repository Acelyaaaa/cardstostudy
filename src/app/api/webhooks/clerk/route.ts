import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Handle user.created event
  if (body.type === "user.created") {
    try {
      const { id, email_addresses, first_name, last_name } = body.data;
      const email = email_addresses?.[0]?.email_address ?? "";
      const name =
        [first_name, last_name].filter(Boolean).join(" ") || "Student";

      await createUser(id, email, name);
      console.log(`✅ User created in DB: ${email}`);
    } catch (err) {
      console.error("Failed to create user:", err);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}