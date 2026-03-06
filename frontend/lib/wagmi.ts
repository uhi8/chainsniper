'use client'

import { http, createConfig } from 'wagmi'
import { unichainSepolia, sepolia } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

export const config = createConfig({
    chains: [unichainSepolia, sepolia],
    transports: {
        [unichainSepolia.id]: http('https://unichain-sepolia-rpc.publicnode.com'),
        [sepolia.id]: http('https://ethereum-sepolia.publicnode.com'),
    },
})

export const queryClient = new QueryClient()
