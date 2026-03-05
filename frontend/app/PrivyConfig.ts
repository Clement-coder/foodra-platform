import type { PrivyClientConfig } from '@privy-io/react-auth';

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
 ethereum: {
    createOnLogin: 'users-without-wallets', 
  },    
  showWalletUIs: true,
  },


  loginMethods: ['email', 'google'],


  appearance: {
    showWalletLoginFirst: true,
    logo: '/foodra_logo.jpeg',
  },
};
