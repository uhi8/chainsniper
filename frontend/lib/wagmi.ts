import { http, createConfig, fallback } from 'wagmi'
import { unichainSepolia } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

// Use multiple RPCs to avoid rate limits on Vercel
export const config = createConfig({
    chains: [unichainSepolia],
    transports: {
        [unichainSepolia.id]: fallback([
            http('https://sepolia.unichain.org'),
            http('https://unichain-sepolia.rpc.thirdweb.com'),
            http('https://unichain-sepolia-rpc.publicnode.com'),
        ], { rank: true }),
    },
})

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
            staleTime: 5000, // Consider data fresh for 5s to reduce redundant calls
        },
    },
})
