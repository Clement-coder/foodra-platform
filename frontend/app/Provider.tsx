 "use client" 
 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider } from '@privy-io/react-auth';
// IMPORTANT: import these from '@privy-io/wagmi', not directly from 'wagmi'
import { WagmiProvider, createConfig } from '@privy-io/wagmi';

import { privyConfig } from './PrivyConfig';
import { wagmiConfig } from './WagmiConfig';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId="cmj73kjr5029pjo0dwokzl29l" config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
