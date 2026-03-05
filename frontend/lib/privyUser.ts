type LinkedAccount = {
  type?: string
  picture?: string
  name?: string
  email?: string
}

type PrivyUserLike = {
  linkedAccounts?: LinkedAccount[]
  picture?: string
  google?: {
    photoUrl?: string
    name?: string
    email?: string
  }
}

export function getGoogleLinkedAccount(user: PrivyUserLike | null | undefined): LinkedAccount | undefined {
  return user?.linkedAccounts?.find((account) => account?.type === "google")
}

export function getPrivyProfilePicture(user: PrivyUserLike | null | undefined): string | undefined {
  const googleAccount = getGoogleLinkedAccount(user)
  return googleAccount?.picture || user?.picture || user?.google?.photoUrl
}
