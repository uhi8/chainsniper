import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const CHAINLINK_FEED = '0x694AA1769357215DE4FAC081bf1f309aDC325306' // ETH/USD Sepolia
const CHAINLINK_ABI = [{
    name: 'latestRoundData',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
        { name: 'roundId', type: 'uint80' },
        { name: 'answer', type: 'int256' },
        { name: 'startedAt', type: 'uint256' },
        { name: 'updatedAt', type: 'uint256' },
        { name: 'answeredInRound', type: 'uint80' }
    ]
}]

const client = createPublicClient({
    chain: sepolia,
    transport: http('https://ethereum-sepolia.publicnode.com')
})

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const demoPricePath = path.resolve(process.cwd(), 'scripts/demo_price.json')
        
        if (fs.existsSync(demoPricePath)) {
            const demoData = JSON.parse(fs.readFileSync(demoPricePath, 'utf-8'))
            return res.status(200).json({
                price: parseFloat(demoData.price),
                updatedAt: Math.floor(demoData.updatedAt / 1000),
                source: 'demo'
            })
        }

        // Fetch real price
        const data = await client.readContract({
            address: CHAINLINK_FEED,
            abi: CHAINLINK_ABI,
            functionName: 'latestRoundData'
        }) as [bigint, bigint, bigint, bigint, bigint]

        return res.status(200).json({
            price: Number(data[1]) / 1e8,
            updatedAt: Number(data[3]),
            source: 'chainlink'
        })
    } catch (error: any) {
        console.error('Error in price API:', error)
        return res.status(500).json({ error: 'Failed to fetch price' })
    }
}
