export const SNIPER_HOOK_ABI = [
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "address", "name": "tokenIn", "type": "address" },
                    { "internalType": "address", "name": "tokenOut", "type": "address" },
                    { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                    { "internalType": "uint256", "name": "targetPrice", "type": "uint256" },
                    { "internalType": "uint16", "name": "maxSlippageBps", "type": "uint16" },
                    { "internalType": "uint256", "name": "expiry", "type": "uint256" },
                    { "internalType": "int24", "name": "targetTickHint", "type": "int24" }
                ],
                "internalType": "struct SniperTypes.CreateIntentParams",
                "name": "params",
                "type": "tuple"
            }
        ],
        "name": "createIntent",
        "outputs": [{ "internalType": "uint256", "name": "intentId", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "intentId", "type": "uint256" }],
        "name": "getIntent",
        "outputs": [
            {
                "components": [
                    { "internalType": "address", "name": "user", "type": "address" },
                    { "internalType": "address", "name": "tokenIn", "type": "address" },
                    { "internalType": "address", "name": "tokenOut", "type": "address" },
                    { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                    { "internalType": "uint256", "name": "targetPrice", "type": "uint256" },
                    { "internalType": "uint16", "name": "maxSlippageBps", "type": "uint16" },
                    { "internalType": "uint256", "name": "expiry", "type": "uint256" },
                    { "internalType": "uint256", "name": "nonce", "type": "uint256" },
                    { "internalType": "int24", "name": "targetTick", "type": "int24" },
                    { "internalType": "bool", "name": "executed", "type": "bool" },
                    { "internalType": "bool", "name": "cancelled", "type": "bool" },
                    { "internalType": "uint64", "name": "createdAt", "type": "uint64" }
                ],
                "internalType": "struct SniperTypes.Intent",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "nextIntentId",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "intentId", "type": "uint256" },
            { "internalType": "address", "name": "recipient", "type": "address" }
        ],
        "name": "cancelIntent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "intentId", "type": "uint256" },
            { "internalType": "address", "name": "recipient", "type": "address" }
        ],
        "name": "refundIntent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "intentId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "tokenIn", "type": "address" },
            { "indexed": false, "internalType": "address", "name": "tokenOut", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "targetPrice", "type": "uint256" },
            { "indexed": false, "internalType": "int24", "name": "targetTick", "type": "int24" },
            { "indexed": false, "internalType": "uint256", "name": "expiry", "type": "uint256" },
            { "indexed": false, "internalType": "uint16", "name": "maxSlippageBps", "type": "uint16" }
        ],
        "name": "IntentCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "intentId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "beneficiary", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "oraclePrice", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "answeredAt", "type": "uint256" },
            { "indexed": false, "internalType": "bool", "name": "fastPath", "type": "bool" }
        ],
        "name": "IntentExecuted",
        "type": "event"
    }
] as const

export const ERC20_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "address", "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const
