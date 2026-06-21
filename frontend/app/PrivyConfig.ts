import type { PrivyClientConfig } from "@privy-io/react-auth"

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "google"],
  appearance: {
    showWalletLoginFirst: false,
    logo: "/foodra_logo.jpeg",
  },
}
