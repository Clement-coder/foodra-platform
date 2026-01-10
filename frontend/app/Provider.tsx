 "use client" 
 
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
// IMPORTANT: import these from '@privy-io/wagmi', not directly from 'wagmi'
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';

import { privyConfig } from './PrivyConfig';
import { wagmiConfig } from './WagmiConfig';
import { initializeSampleData } from '../lib/sampleData';

import { usePrivy } from '@privy-io/react-auth';

const queryClient = new QueryClient();


export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeSampleData();
  }, []);

  return (
    <PrivyProvider
      appId="cmj73kjr5029pjo0dwokzl29l"
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <SmartWalletsProvider>
          <WagmiProvider config={wagmiConfig}>
            {children}
          </WagmiProvider>
        </SmartWalletsProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
