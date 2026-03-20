import type { NextApiRequest, NextApiResponse } from 'next'

const TARGET_RPC = 'https://sepolia.unichain.org'

// Simple in-memory cache to deduplicate identical RPC calls within a short window
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 2000 // 2 seconds

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    // Create a cache key from the request body (method + params)
    const cacheKey = JSON.stringify(req.body)
    const cached = cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.status(200).json(cached.data)
    }

    try {
        const response = await fetch(TARGET_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: cacheKey,
        })

        const data = await response.json()

        // Cache successful responses for a short duration
        if (response.ok && !data.error) {
            cache.set(cacheKey, { data, timestamp: Date.now() })
        }

        return res.status(response.status).json(data)
    } catch (error: any) {
        return res.status(500).json({ 
            jsonrpc: '2.0',
            id: req.body?.id || null,
            error: { code: -32603, message: 'Proxy Error', data: error.message }
        })
    }
}
