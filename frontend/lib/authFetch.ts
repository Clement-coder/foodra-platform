export type AccessTokenProvider = () => Promise<string | null>

export async function authFetch(
  getAccessToken: AccessTokenProvider,
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const token = await getAccessToken()
  const headers = new Headers(init.headers)

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
