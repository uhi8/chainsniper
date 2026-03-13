import { createPublicClient, createWalletClient, http, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '../.env') })

const unichainSepolia = defineChain({
    id: 1301,
    name: 'Unichain Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://sepolia.unichain.org'] } }
})

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
const HOOK_ADDRESS = '0x699C19321188aB200194E8A2B6db19B43106E70F'

const client = createPublicClient({ chain: unichainSepolia, transport: http() })
const wallet = createWalletClient({
    chain: unichainSepolia,
    transport: http(),
    account: privateKeyToAccount(PRIVATE_KEY)
})

const abi = [{
    name: 'executeIntent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
        { name: 'intentId', type: 'uint256' },
        { name: 'oraclePrice', type: 'uint256' },
        { name: 'answeredAt', type: 'uint256' },
        { name: 'beneficiary', type: 'address' },
        { name: 'fastPath', type: 'bool' }
    ],
    outputs: []
}]

async function run() {
    console.log('Simulating executeIntent for #14...')
    try {
        await client.simulateContract({
            address: HOOK_ADDRESS,
            abi,
            functionName: 'executeIntent',
            args: [14n, 215000000000n, 1773883639n, '0x0000000000000000000000000000000000000000', false],
            account: privateKeyToAccount(PRIVATE_KEY)
        })
        console.log('✅ Simulation Success!')
    } catch (e: any) {
        console.error('❌ Simulation Failed:', e.message)
        if (e.data) console.error('Data:', e.data)
    }
}

run()
