import type { PrivyClientConfig } from '@privy-io/react-auth';
import { baseSepolia } from 'viem/chains';

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
    showWalletUIs: true,
  },
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia],
  loginMethods: ['email', 'google', 'wallet'],
  appearance: {
    showWalletLoginFirst: true,
    logo: '/foodra_logo.jpeg',
  },
};
