import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const fmt = (a: any) => ({
  id: a.id,
  userId: a.user_id,
  fullName: a.full_name,
  phone: a.phone,
  addressLine: a.address_line,
  streetLine2: a.street_line2 || null,
  landmark: a.landmark || null,
  city: a.city,
  state: a.state,
  country: a.country,
  countryCode: a.country_code,
  isDefault: a.is_default,
  createdAt: a.created_at,
});

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("delivery_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data?.map(fmt) ?? []);
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json();
  const { userId, fullName, phone, addressLine, streetLine2, landmark, city, state, country, countryCode, isDefault } = body;

  if (isDefault) {
    await supabase.from("delivery_addresses").update({ is_default: false }).eq("user_id", userId);
  }

  const { data, error } = await supabase
    .from("delivery_addresses")
    .insert({
      user_id: userId,
      full_name: fullName,
      phone,
      address_line: addressLine,
      street_line2: streetLine2 || null,
      landmark: landmark || null,
      city,
      state,
      country: country || "Nigeria",
      country_code: countryCode || "NG",
      is_default: isDefault ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(fmt(data));
}
