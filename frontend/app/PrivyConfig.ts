import type { PrivyClientConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
 ethereum: {
    createOnLogin: 'users-without-wallets', // ✅ Nested under ethereum
  },    
  showWalletUIs: true,
  },
  loginMethods: ['wallet', 'github', 'google', 'twitter', 'sms'],
  appearance: {
    showWalletLoginFirst: true,
    logo: '/foodra_logo.jpeg',
  },
};
