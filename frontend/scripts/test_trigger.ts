import { createWalletClient, http, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import fs from 'fs'
import path from 'path'

// Load environment variables
const envPath = path.resolve(process.cwd(), '../.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')

    const deployerKeyMatch = envConfig.match(/DEPLOYER_PRIVATE_KEY=(.*)/)
    const monitorAddressMatch = envConfig.match(/L1_REACTIVE_MONITOR_ADDRESS=(.*)/)

    if (deployerKeyMatch && deployerKeyMatch[1]) {
        process.env.DEPLOYER_PRIVATE_KEY = deployerKeyMatch[1].trim()
    }
    if (monitorAddressMatch && monitorAddressMatch[1]) {
        process.env.L1_REACTIVE_MONITOR_ADDRESS = monitorAddressMatch[1].trim()
    }
}

let privateKey = process.env.DEPLOYER_PRIVATE_KEY
if (privateKey && !privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`
}

const PRIVATE_KEY = privateKey as `0x${string}`
const L1_MONITOR_ADDRESS = process.env.L1_REACTIVE_MONITOR_ADDRESS as `0x${string}`

const reactiveKopli = defineChain({
    id: 5318007,
    name: 'Reactive Kopli',
    nativeCurrency: { name: 'Reactive', symbol: 'REACT', decimals: 18 },
    rpcUrls: { default: { http: ['https://lasna-rpc.rnk.dev/'] } }
})

const reactiveWallet = createWalletClient({
    chain: reactiveKopli,
    transport: http(),
    account: privateKeyToAccount(PRIVATE_KEY)
})

const TEST_TRIGGER_ABI = [{
    name: 'testTriggerIntent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
        { name: 'intentId', type: 'uint256' },
        { name: 'mockPrice', type: 'int256' }
    ],
    outputs: []
}]

// Get intent ID and price from command line
const intentId = process.argv[2]
const mockPrice = process.argv[3]

if (!intentId || !mockPrice) {
    console.log('Usage: npx tsx scripts/test_trigger.ts <intentId> <mockPrice>')
    console.log('Example: npx tsx scripts/test_trigger.ts 5 226000000000')
    console.log('         (Triggers intent #5 with price $2260.00)')
    process.exit(1)
}

console.log(`🎯 Manually triggering intent #${intentId} with price $${Number(mockPrice) / 100000000}...`)

reactiveWallet.writeContract({
    address: L1_MONITOR_ADDRESS,
    abi: TEST_TRIGGER_ABI,
    functionName: 'testTriggerIntent',
    args: [BigInt(intentId), BigInt(mockPrice)]
}).then(hash => {
    console.log(`✅ Triggered! Tx: ${hash}`)
    console.log(`🔗 View on Reactive Explorer: https://testnet.reactscan.net/tx/${hash}`)
}).catch(error => {
    console.error('❌ Error:', error.message)
})
