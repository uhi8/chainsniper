import { http, createConfig } from 'wagmi'
import { unichainSepolia } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'

// FORCE ONLY LOCAL PROXY to stop browser-level request storms
export const config = createConfig({
    chains: [unichainSepolia],
    connectors: [
        injected(),
        metaMask(),
        coinbaseWallet(),
    ],
    transports: {
        [unichainSepolia.id]: http('/api/rpc', { 
            batch: true,
            timeout: 30000, 
        }),
    },
    pollingInterval: 60000, 
})

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 0, // Disable retries to stop request storms
            staleTime: 120000, // 2 minutes stale time
            gcTime: 600000, // 10 minutes cache
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        },
    },
})
