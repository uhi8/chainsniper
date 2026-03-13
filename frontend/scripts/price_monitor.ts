import { createPublicClient, createWalletClient, http, defineChain, parseAbiItem } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import fs from 'fs'
import path from 'path'

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')

    const deployerKeyMatch = envConfig.match(/DEPLOYER_PRIVATE_KEY=(.*)/)
    const monitorAddressMatch = envConfig.match(/L1_REACTIVE_MONITOR_ADDRESS=(.*)/)
    const hookAddressMatch = envConfig.match(/L2_SNIPER_HOOK_ADDRESS=(.*)/)

    if (deployerKeyMatch && deployerKeyMatch[1]) {
        process.env.DEPLOYER_PRIVATE_KEY = deployerKeyMatch[1].trim()
    }
    if (monitorAddressMatch && monitorAddressMatch[1]) {
        process.env.L1_REACTIVE_MONITOR_ADDRESS = monitorAddressMatch[1].trim()
    }
    if (hookAddressMatch && hookAddressMatch[1]) {
        process.env.L2_SNIPER_HOOK_ADDRESS = hookAddressMatch[1].trim()
    }
}

let privateKey = process.env.DEPLOYER_PRIVATE_KEY
if (privateKey && !privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`
}

const PRIVATE_KEY = privateKey as `0x${string}`
const L1_MONITOR_ADDRESS = process.env.L1_REACTIVE_MONITOR_ADDRESS as `0x${string}`
const CHAINLINK_FEED = '0x694AA1769357215DE4FAC081bf1f309aDC325306' // ETH/USD Sepolia
const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com'
const REACTIVE_RPC = 'https://lasna-rpc.rnk.dev/'

// Chain Definitions
const sepolia = defineChain({
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [SEPOLIA_RPC] } }
})

const reactiveKopli = defineChain({
    id: 5318007,
    name: 'Lasna',
    nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
    rpcUrls: { default: { http: [REACTIVE_RPC] } }
})

// Clients
const sepoliaClient = createPublicClient({ chain: sepolia, transport: http() })
const reactiveClient = createPublicClient({ chain: reactiveKopli, transport: http() })
const reactiveWallet = createWalletClient({
    chain: reactiveKopli,
    transport: http(),
    account: privateKeyToAccount(PRIVATE_KEY)
})

// ABIs
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

const MONITOR_ABI = [
    {
        name: 'testTriggerIntent',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'intentId', type: 'uint256' },
            { name: 'mockPrice', type: 'int256' }
        ],
        outputs: []
    },
    {
        name: 'intents',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [
            { name: 'intentId', type: 'uint256' },
            { name: 'targetPrice', type: 'int256' },
            { name: 'expiry', type: 'uint256' },
            { name: 'targetTick', type: 'int24' },
            { name: 'priceFeed', type: 'address' },
            { name: 'triggered', type: 'bool' },
            { name: 'isBuy', type: 'bool' },
            { name: 'registeredAt', type: 'uint256' }
        ]
    }
]

const ANSWER_UPDATED_TOPIC = '0x0559884fd3a460db3073b7fc896cc77986f16e378210ded43186175bf646fc5f'

console.log('🔍 Starting Price Monitor...')
console.log(`📊 Watching Chainlink Feed: ${CHAINLINK_FEED}`)
console.log(`🎯 Monitoring L1 Monitor: ${L1_MONITOR_ADDRESS}`)

let lastPrice = 0n
let lastRoundId = 0n
const processedIntents = new Set<number>()

async function checkPrice() {
    try {
        // Get latest price from Chainlink
        let currentPrice: bigint
        let roundId: bigint = 0n

        const demoPricePath = path.resolve(__dirname, 'demo_price.json')
        if (fs.existsSync(demoPricePath)) {
            const demoData = JSON.parse(fs.readFileSync(demoPricePath, 'utf-8'))
            currentPrice = BigInt(Math.floor(Number(demoData.price) * 100000000))
            console.log(`\n🧪 DEMO MODE: Using price from file: $${demoData.price}`)
        } else {
            const [rId, answer] = await sepoliaClient.readContract({
                address: CHAINLINK_FEED,
                abi: CHAINLINK_ABI,
                functionName: 'latestRoundData'
            }) as [bigint, bigint, bigint, bigint, bigint]
            currentPrice = answer
            roundId = rId
        }

        const priceUSD = Number(currentPrice) / 100000000

        // Only log if price changed
        if (currentPrice !== lastPrice) {
            if (roundId > 0n) {
                console.log(`\n💰 Price Update: $${priceUSD.toFixed(2)} (Round ${roundId})`)
            } else {
                console.log(`\n💰 Price Update: $${priceUSD.toFixed(2)}`)
            }
            lastPrice = currentPrice
        }

        // Check intents (1-10 for now, can be expanded)
        for (let intentId = 1; intentId <= 20; intentId++) {
            if (processedIntents.has(intentId)) continue;

            try {
                const intent = await reactiveClient.readContract({
                    address: L1_MONITOR_ADDRESS,
                    abi: MONITOR_ABI,
                    functionName: 'intents',
                    args: [BigInt(intentId)]
                }) as [bigint, bigint, bigint, number, string, boolean, boolean, bigint]

                const [id, targetPrice, expiry, targetTick, priceFeed, triggered, isBuy, registeredAt] = intent

                // Skip if not registered or already triggered
                if (id === 0n || triggered) continue

                // Skip if expired
                if (expiry < BigInt(Math.floor(Date.now() / 1000))) {
                    console.log(`⏰ Intent #${intentId} expired`)
                    processedIntents.add(intentId)
                    continue
                }

                // Check if price condition is met
                const targetUSD = Number(targetPrice) / 100000000
                const conditionMet = isBuy
                    ? currentPrice <= targetPrice  // Buy when price drops
                    : currentPrice >= targetPrice  // Sell when price rises

                if (conditionMet) {
                    console.log(`\n🎯 CONDITION MET for Intent #${intentId}!`)
                    console.log(`   Type: ${isBuy ? 'BUY' : 'SELL'}`)
                    console.log(`   Target: $${targetUSD.toFixed(2)}`)
                    console.log(`   Current: $${priceUSD.toFixed(2)}`)
                    console.log(`   ⏳ Triggering execution...`)


                    // Call testTriggerIntent() on L1 Monitor
                    const hash = await reactiveWallet.writeContract({
                        address: L1_MONITOR_ADDRESS,
                        abi: MONITOR_ABI,
                        functionName: 'testTriggerIntent',
                        args: [
                            BigInt(intentId),
                            currentPrice
                        ],
                        maxFeePerGas: 150000000000n, // 150 gwei (Lasna base is 100 gwei)
                        maxPriorityFeePerGas: 2000000000n, // 2 gwei
                    })

                    console.log(`   ✅ Triggered! Tx: ${hash}`)
                    processedIntents.add(intentId)
                }
            } catch (err: any) {
                // Intent doesn't exist, skip silently
                if (!err.message?.includes('execution reverted')) {
                    console.error(`Error checking intent ${intentId}:`, err.message)
                }
            }
        }
    } catch (error: any) {
        console.error('❌ Error in price check:', error.message)
    }
}

// Check price every 10 seconds
console.log('⏰ Checking price every 10 seconds...\n')
setInterval(checkPrice, 10000)
checkPrice() // Initial check
