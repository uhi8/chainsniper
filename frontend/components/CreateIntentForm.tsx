'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Target } from 'lucide-react'
import { DEPLOYED_ADDRESSES } from '@/lib/addresses'
import { SNIPER_HOOK_ABI, ERC20_ABI } from '@/lib/abis'

export function CreateIntentForm() {
    const { address, isConnected } = useAccount()
    const [amount, setAmount] = useState('')
    const [targetPrice, setTargetPrice] = useState('')
    const [hours, setHours] = useState('24')
    const [mounted, setMounted] = useState(false)

    // Approval Transaction
    const { writeContract: approve, data: approveHash, isPending: isApprovePending } = useWriteContract()
    const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash })

    // Creation Transaction
    const { writeContract: create, data: createHash, isPending: isCreatePending } = useWriteContract()
    const { isLoading: isCreateConfirming, isSuccess: isCreateConfirmed } = useWaitForTransactionReceipt({ hash: createHash })

    // Fetch USDC balance
    const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
        address: DEPLOYED_ADDRESSES.TOKEN0 as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && mounted,
            refetchInterval: 10000,
        },
    })

    // Fetch USDC allowance for SniperHook
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: DEPLOYED_ADDRESSES.TOKEN0 as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address ? [address, DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`] : undefined,
        query: {
            enabled: !!address && mounted,
            refetchInterval: 5000,
        },
    })

    const formattedBalance = usdcBalance ? formatUnits(usdcBalance as bigint, 6) : '0'
    const hasAllowance = allowance !== undefined && amount ? (allowance as bigint) >= parseUnits(amount || '0', 6) : false

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isCreateConfirmed) {
            alert('✅ Order Created Successfully! Check the Live Activity panel.')
            // Reset form
            setAmount('')
            setTargetPrice('')
            setHours('24')
            refetchBalance()
            refetchAllowance()
        }
    }, [isCreateConfirmed, refetchBalance, refetchAllowance])

    useEffect(() => {
        if (isApproveConfirmed) {
            refetchAllowance()
        }
    }, [isApproveConfirmed, refetchAllowance])

    const handleApprove = async () => {
        if (!isConnected || !amount) return
        approve({
            address: DEPLOYED_ADDRESSES.TOKEN0 as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`, parseUnits(amount, 6)],
        })
    }

    const handleCreateIntent = async () => {
        if (!isConnected || !amount || !targetPrice) return

        const expiry = Math.floor(Date.now() / 1000) + parseInt(hours) * 3600

        create({
            address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
            abi: SNIPER_HOOK_ABI,
            functionName: 'createIntent',
            args: [
                {
                    tokenIn: DEPLOYED_ADDRESSES.TOKEN0 as `0x${string}`,
                    tokenOut: DEPLOYED_ADDRESSES.TOKEN1 as `0x${string}`,
                    amountIn: parseUnits(amount, 6),
                    targetPrice: parseUnits(targetPrice, 8),
                    maxSlippageBps: 500,
                    expiry: BigInt(expiry),
                    targetTickHint: 0,
                },
            ],
        })
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-gray-100">Create Limit Order</h2>
            </div>

            <div className="space-y-3 flex-1">
                {/* Amount */}
                <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Amount (USDC)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100"
                        className="w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    {mounted && isConnected && (
                        <p className="text-[10px] text-gray-500 mt-1">
                            Balance: <span className="text-indigo-400 font-semibold">{formattedBalance} USDC</span>
                        </p>
                    )}
                </div>

                {/* Target Price */}
                <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Target ETH Price (USD)
                    </label>
                    <input
                        type="number"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="2000"
                        className="w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Expiry */}
                <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Expires In (Hours)
                    </label>
                    <input
                        type="number"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="24"
                        className="w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Submit */}
            {hasAllowance ? (
                <button
                    onClick={handleCreateIntent}
                    disabled={!isConnected || isCreatePending || isCreateConfirming || !amount || !targetPrice}
                    className="w-full mt-3 py-2.5 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isCreatePending || isCreateConfirming ? 'Creating...' : 'Create Order'}
                </button>
            ) : (
                <button
                    onClick={handleApprove}
                    disabled={!isConnected || isApprovePending || isApproveConfirming || !amount}
                    className="w-full mt-3 py-2.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isApprovePending || isApproveConfirming ? 'Approving...' : 'Approve USDC'}
                </button>
            )}

            {/* Only render connection message after mount to avoid hydration mismatch */}
            {mounted && !isConnected && (
                <p className="text-[10px] text-center text-gray-500 mt-2">
                    Connect wallet to create orders
                </p>
            )}
        </div>
    )
}
