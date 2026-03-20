import type { NextApiRequest, NextApiResponse } from 'next'

// The RPC endpoint to proxy to
const TARGET_RPC = 'https://sepolia.unichain.org'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Forward the JSON-RPC request from the client to the official Unichain RPC
        const response = await fetch(TARGET_RPC, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        })

        const data = await response.json()

        // Relay the exact response back to the client
        return res.status(response.status).json(data)
    } catch (error: any) {
        console.error('RPC Proxy Error:', error)
        return res.status(500).json({ 
            jsonrpc: '2.0',
            id: req.body?.id || null,
            error: {
                code: -32603,
                message: 'Internal JSON-RPC error through proxy',
                data: error.message
            }
        })
    }
}
