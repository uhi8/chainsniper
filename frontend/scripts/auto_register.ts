
import { createPublicClient, createWalletClient, http, parseAbiItem, defineChain, parseEventLogs } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
// Load environment variables
const envPath = path.resolve(__dirname, '../../.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')

    // Parse all required variables
    const deployerKeyMatch = envConfig.match(/DEPLOYER_PRIVATE_KEY=(.*)/)
    const hookAddressMatch = envConfig.match(/L2_SNIPER_HOOK_ADDRESS=(.*)/)
    const monitorAddressMatch = envConfig.match(/L1_REACTIVE_MONITOR_ADDRESS=(.*)/)

    if (deployerKeyMatch && deployerKeyMatch[1]) {
        process.env.DEPLOYER_PRIVATE_KEY = deployerKeyMatch[1].trim()
    }
    if (hookAddressMatch && hookAddressMatch[1]) {
        process.env.L2_SNIPER_HOOK_ADDRESS = hookAddressMatch[1].trim()
    }
    if (monitorAddressMatch && monitorAddressMatch[1]) {
        process.env.L1_REACTIVE_MONITOR_ADDRESS = monitorAddressMatch[1].trim()
    }
}

// Configuration
let privateKey = process.env.DEPLOYER_PRIVATE_KEY
console.log('DEBUG: Loaded Key Length:', privateKey ? privateKey.length : 'undefined')

if (privateKey && !privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`
}
const PRIVATE_KEY = privateKey
const UNICHAIN_RPC = 'https://unichain-sepolia-rpc.publicnode.com'
const REACTIVE_RPC = 'https://lasna-rpc.rnk.dev/'

// Addresses
const SNIPER_HOOK_ADDRESS = process.env.L2_SNIPER_HOOK_ADDRESS
const L1_MONITOR_ADDRESS = process.env.L1_REACTIVE_MONITOR_ADDRESS

if (!PRIVATE_KEY || !SNIPER_HOOK_ADDRESS || !L1_MONITOR_ADDRESS) {
    console.error('❌ Missing environment variables')
    process.exit(1)
}

// Chain Definitions
const unichainSepolia = defineChain({
    id: 1301,
    name: 'Unichain Sepolia',
    network: 'unichain-sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [UNICHAIN_RPC] } }
})

const reactiveKopli = defineChain({
    id: 5318007,
    name: 'Lasna',
    network: 'reactive-kopli',
    nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
    rpcUrls: { default: { http: [REACTIVE_RPC] } }
})

// Clients
const unichainClient = createPublicClient({ chain: unichainSepolia, transport: http() })
const reactiveWallet = createWalletClient({
    chain: reactiveKopli,
    transport: http(),
    account: privateKeyToAccount(PRIVATE_KEY as `0x${string}`)
})

console.log('🚀 Starting Auto-Register Agent...')
console.log(`📡 Watching Unichain Hook: ${SNIPER_HOOK_ADDRESS}`)
console.log(`🎯 Targeting Reactive Monitor: ${L1_MONITOR_ADDRESS}`)

// Event ABI
const INTENT_CREATED_EVENT = parseAbiItem(
    'event IntentCreated(uint256 indexed intentId, address indexed user, address indexed tokenIn, address tokenOut, uint256 amountIn, uint256 targetPrice, int24 targetTick, uint256 expiry, uint16 maxSlippageBps)'
)

// Register Function ABI
const REGISTER_INTENT_ABI = [
    {
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
    }
]

// Chainlink Feed (ETH/USD)
const PRICE_FEED = '0x694AA1769357215DE4FAC081bf1f309aDC325306'

// Watcher
unichainClient.watchEvent({
    address: SNIPER_HOOK_ADDRESS as `0x${string}`,
    event: INTENT_CREATED_EVENT,
    onLogs: async (logs) => {
        for (const log of logs) {
            const { intentId, targetPrice, expiry, targetTick } = log.args

            if (!intentId) continue

            console.log(`\n🔔 New Intent Detected: #${intentId}`)
            console.log(`   Target Price: $${Number(targetPrice) / 100000000}`)

            try {
                console.log('   ⏳ Registering on Reactive Network...')
                const hash = await reactiveWallet.writeContract({
                    address: L1_MONITOR_ADDRESS as `0x${string}`,
                    abi: REGISTER_INTENT_ABI,
                    functionName: 'registerIntent',
                    args: [
                        intentId,
                        PRICE_FEED,
                        targetPrice,
                        expiry,
                        targetTick
                    ]
                })
                console.log(`   ✅ Registered! Tx: ${hash}`)
            } catch (error) {
                console.error('   ❌ Registration Failed:', error)
            }
        }
    }
})
