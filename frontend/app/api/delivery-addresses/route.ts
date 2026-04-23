import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertSelfOrAdmin, AuthError, requireAuthenticatedUser } from "@/lib/serverAuth";

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
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    const auth = await requireAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || auth.user.id;
    assertSelfOrAdmin(auth.user, userId);

    const { data, error } = await supabase
      .from("delivery_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data?.map(fmt) ?? []);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

    const auth = await requireAuthenticatedUser(request);
    const body = await request.json();
    const { fullName, phone, addressLine, streetLine2, landmark, city, state, country, countryCode, isDefault } = body;

    if (isDefault) {
      await supabase.from("delivery_addresses").update({ is_default: false }).eq("user_id", auth.user.id);
    }

    const { data, error } = await supabase
      .from("delivery_addresses")
      .insert({
        user_id: auth.user.id,
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
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}
