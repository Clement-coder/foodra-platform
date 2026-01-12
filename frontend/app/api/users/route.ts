
import { PrivyClient } from "@privy-io/server-auth";
import { NextResponse } from "next/server";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_SECRET_KEY!
);

export async function GET() {
  try {
    const users = await privy.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users from Privy:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
