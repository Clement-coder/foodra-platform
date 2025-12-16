import { base, baseSepolia } from 'viem/chains';
import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
