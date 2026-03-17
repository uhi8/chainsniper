'use client'

import { http, createConfig } from 'wagmi'
import { unichainSepolia, sepolia } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

export const config = createConfig({
    chains: [unichainSepolia],
    transports: {
        [unichainSepolia.id]: http('https://sepolia.unichain.org'),
    },
})

export const queryClient = new QueryClient()
