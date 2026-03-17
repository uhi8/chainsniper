import { createPublicClient, createWalletClient, http, parseAbiItem, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Vercel Serverless Function for Auto-Registration
// This runs every 10 seconds via Vercel Cron

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
const SNIPER_HOOK_ADDRESS = process.env.L2_SNIPER_HOOK_ADDRESS as `0x${string}`
const L1_MONITOR_ADDRESS = process.env.L1_REACTIVE_MONITOR_ADDRESS as `0x${string}`
const PRICE_FEED = '0x694AA1769357215DE4FAC081bf1f309aDC325306'

const unichainSepolia = defineChain({
    id: 1301,
    name: 'Unichain Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://unichain-sepolia-rpc.publicnode.com'] } }
})

const reactiveKopli = defineChain({
    id: 5318007,
    name: 'Reactive Kopli',
    nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
    rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev/'] } }
})

const INTENT_CREATED_EVENT = parseAbiItem(
    'event IntentCreated(uint256 indexed intentId, address indexed user, address indexed tokenIn, address tokenOut, uint256 amountIn, uint256 targetPrice, int24 targetTick, uint256 expiry, uint16 maxSlippageBps)'
)

const REGISTER_INTENT_ABI = [{
    name: 'registerIntent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
        { name: 'intentId', type: 'uint256' },
        { name: 'priceFeed', type: 'address' },
        { name: 'targetPrice', type: 'int256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'targetTick', type: 'int24' }
    ],
    outputs: []
}]

// Track processed intents (in-memory, resets on cold start)
const processedIntents = new Set<string>()

export default async function handler(req: any, res: any) {
    try {
        const unichainClient = createPublicClient({ chain: unichainSepolia, transport: http() })
        const reactiveWallet = createWalletClient({
            chain: reactiveKopli,
            transport: http(),
            account: privateKeyToAccount(PRIVATE_KEY)
        })

        // Get latest block
        const latestBlock = await unichainClient.getBlockNumber()
        const fromBlock = latestBlock - 100n // Check last 100 blocks (~5 minutes)

        // Fetch recent IntentCreated events
        const logs = await unichainClient.getLogs({
            address: SNIPER_HOOK_ADDRESS,
            event: INTENT_CREATED_EVENT,
            fromBlock,
            toBlock: latestBlock
        })

        const registered = []

        for (const log of logs) {
            const { intentId, targetPrice, expiry, targetTick } = log.args
            if (!intentId) continue

            const key = `${intentId}`
            if (processedIntents.has(key)) continue

            console.log(`🔔 Registering Intent #${intentId}`)

            const hash = await reactiveWallet.writeContract({
                address: L1_MONITOR_ADDRESS,
                abi: REGISTER_INTENT_ABI,
                functionName: 'registerIntent',
                args: [intentId, PRICE_FEED, targetPrice, expiry, targetTick]
            })

            processedIntents.add(key)
            registered.push({ intentId: intentId.toString(), tx: hash })
        }

        res.status(200).json({
            success: true,
            registered,
            checkedBlocks: `${fromBlock} - ${latestBlock}`
        })
    } catch (error: any) {
        console.error('❌ Error:', error)
        res.status(500).json({ error: error.message })
    }
}
