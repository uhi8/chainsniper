import { http, createConfig, fallback } from 'wagmi'
import { unichainSepolia } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

// Refined RPC list for Unichain Sepolia
// We use fallback to handle rate limits and 'method not whitelisted' errors
export const config = createConfig({
    chains: [unichainSepolia],
    transports: {
        [unichainSepolia.id]: fallback([
            http('https://sepolia.unichain.org', { batch: true }), 
            http('https://unichain-sepolia-rpc.publicnode.com'),
            http('https://unichain-sepolia.rpc.thirdweb.com'),
        ], { 
            rank: {
                interval: 30000, // Re-rank every 30s
            }
        }),
    },
})

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // Only retry once to avoid request storms
            retryDelay: 2000,
            staleTime: 10000, // 10s stale time
            refetchOnWindowFocus: false, // Prevent extra calls on tab switch
        },
    },
})
