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
    const executorAddressMatch = envConfig.match(/L2_REACTIVE_EXECUTOR_ADDRESS=(.*)/)
    const hookAddressMatch = envConfig.match(/L2_SNIPER_HOOK_ADDRESS=(.*)/)

    if (deployerKeyMatch && deployerKeyMatch[1]) {
        process.env.DEPLOYER_PRIVATE_KEY = deployerKeyMatch[1].trim()
    }
    if (monitorAddressMatch && monitorAddressMatch[1]) {
        process.env.L1_REACTIVE_MONITOR_ADDRESS = monitorAddressMatch[1].trim()
    }
    if (executorAddressMatch && executorAddressMatch[1]) {
        process.env.L2_REACTIVE_EXECUTOR_ADDRESS = executorAddressMatch[1].trim()
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
const L2_HOOK_ADDRESS = process.env.L2_SNIPER_HOOK_ADDRESS as `0x${string}`

// Chain Definitions
const reactiveKopli = defineChain({
    id: 5318007,
    name: 'Lasna',
    nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
    rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev/'] } }
})

const unichainSepolia = defineChain({
    id: 1301,
    name: 'Unichain Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.unichain.org'] } }
})

// Clients
const reactiveClient = createPublicClient({ chain: reactiveKopli, transport: http() })
const unichainWallet = createWalletClient({
    chain: unichainSepolia,
    transport: http(),
    account: privateKeyToAccount(PRIVATE_KEY)
})

// ABI
const EXECUTOR_ABI = [{
    name: 'executeIntentFromL1',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
        { name: 'intentId', type: 'uint256' },
        { name: 'oraclePrice', type: 'uint256' }, // Changed from currentPrice int256
        { name: 'answeredAt', type: 'uint256' }, // Changed from triggeredAt
        { name: 'beneficiary', type: 'address' }
    ],
    outputs: []
}]

const PRICE_THRESHOLD_MET_EVENT = parseAbiItem(
    'event PriceThresholdMet(uint256 indexed intentId, int256 currentPrice, uint256 triggeredAt)'
)

console.log('🔗 Starting Execution Relay...')
console.log(`📡 Watching L1 Monitor: ${L1_MONITOR_ADDRESS}`)
console.log(`🎯 Relaying to L2 Hook: ${L2_HOOK_ADDRESS}`)

let lastProcessedBlock = 0n
const processedIntents = new Set<number>()

async function relayExecutions() {
    try {
        const currentBlock = await reactiveClient.getBlockNumber()

        // Get logs from last processed block to current
        let fromBlock: bigint
        if (lastProcessedBlock === 0n) {
            fromBlock = currentBlock - 5000n
        } else {
            fromBlock = lastProcessedBlock + 1n
        }

        // Ensure fromBlock <= currentBlock to avoid 'invalid range' error
        if (fromBlock > currentBlock) {
            return
        }

        const logs = await reactiveClient.getLogs({
            address: L1_MONITOR_ADDRESS,
            event: PRICE_THRESHOLD_MET_EVENT,
            fromBlock,
            toBlock: currentBlock
        })

        if (logs.length > 0) {
            console.log(`\n📬 Found ${logs.length} new execution event(s)`)
        }

        for (const log of logs) {
            const { intentId, currentPrice, triggeredAt } = log.args as {
                intentId: bigint
                currentPrice: bigint
                triggeredAt: bigint
            }

            const intentIdNum = Number(intentId)

            if (processedIntents.has(intentIdNum)) {
                continue
            }

            console.log(`\n🎯 Relaying Intent #${intentId}`)
            console.log(`   Price: $${Number(currentPrice) / 100000000}`)
            console.log(`   Timestamp: ${new Date(Number(triggeredAt) * 1000).toISOString()}`)
            console.log(`   ⏳ Calling L2 Executor...`)

            try {
                const hash = await unichainWallet.writeContract({
                    address: L2_HOOK_ADDRESS,
                    abi: EXECUTOR_ABI,
                    functionName: 'executeIntentFromL1',
                    args: [intentId, currentPrice, triggeredAt, '0x0000000000000000000000000000000000000000']
                })

                console.log(`   ✅ Executed! Tx: ${hash}`)
                console.log(`   🔗 https://sepolia.uniscan.xyz/tx/${hash}`)
                processedIntents.add(intentIdNum)
            } catch (error: any) {
                console.error(`   ❌ Execution failed:`, error.message)
            }
        }

        lastProcessedBlock = currentBlock
    } catch (error: any) {
        console.error('❌ Error in relay:', error.message)
    }
}

// Poll every 5 seconds
console.log('⏰ Polling every 5 seconds...\n')
setInterval(relayExecutions, 5000)
relayExecutions() // Initial check
