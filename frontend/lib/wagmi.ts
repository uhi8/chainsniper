import { http, createConfig, fallback } from 'wagmi'
import { unichainSepolia } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

// Use our local RPC proxy to bypass Vercel IP blocking and CORS
export const config = createConfig({
    chains: [unichainSepolia],
    transports: {
        // The first transport is our local server-side proxy
        [unichainSepolia.id]: fallback([
            http('/api/rpc', { batch: true }), 
            http('https://unichain-sepolia-rpc.publicnode.com'),
        ], { 
            rank: {
                interval: 60000, // Re-rank every 1 minute
            }
        }),
    },
})

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, 
            retryDelay: 5000, // Wait 5s between retries
            staleTime: 60000, // Consider data fresh for 1 minute
            gcTime: 300000, // Keep in cache for 5 minutes
            refetchOnWindowFocus: false,
        },
    },
})
