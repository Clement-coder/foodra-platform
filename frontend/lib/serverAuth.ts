import "server-only"

import { PrivyClient } from "@privy-io/server-auth"
import { getSupabaseAdminClient } from "./supabaseAdmin"

type Role = "farmer" | "buyer" | "admin"

export type DbUser = {
  id: string
  privy_id: string
  role: Role
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  wallet_address?: string | null
  phone?: string | null
  location?: string | null
  is_verified?: boolean | null
}

export class AuthError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let privyClient: PrivyClient | null = null

function getPrivyClient() {
  if (privyClient) return privyClient

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const appSecret = process.env.PRIVY_SECRET_KEY

  if (!appId || !appSecret) {
    throw new AuthError(500, "Privy server auth is not configured")
  }

  privyClient = new PrivyClient(appId, appSecret)
  return privyClient
}

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization")
  if (!header) throw new AuthError(401, "Missing Authorization header")

  const token = header.replace(/^Bearer\s+/i, "").trim()
  if (!token) throw new AuthError(401, "Missing bearer token")
  return token
}

export async function verifyPrivyToken(request: Request) {
  const client = getPrivyClient()
  const token = getBearerToken(request)
  return client.verifyAuthToken(token)
}

export async function requireAuthenticatedUser(request: Request) {
  const claims = await verifyPrivyToken(request)
  const supabase = getSupabaseAdminClient()
  if (!supabase) throw new AuthError(500, "DB unavailable")

  const { data: user, error } = await supabase
    .from("users")
    .select("id, privy_id, role, name, email, avatar_url, wallet_address, phone, location, is_verified")
    .eq("privy_id", claims.userId)
    .single()

  if (error || !user) {
    throw new AuthError(403, "User account not found")
  }

  return {
    claims,
    user: user as DbUser,
  }
}

export async function requireAdminUser(request: Request) {
  const auth = await requireAuthenticatedUser(request)
  if (auth.user.role !== "admin") {
    throw new AuthError(403, "Forbidden")
  }
  return auth
}

export function assertSelfOrAdmin(actor: DbUser, targetUserId: string) {
  if (actor.role === "admin") return
  if (actor.id !== targetUserId) {
    throw new AuthError(403, "Forbidden")
  }
}

export function assertRole(actor: DbUser, roles: Role[]) {
  if (!roles.includes(actor.role)) {
    throw new AuthError(403, "Forbidden")
  }
}
