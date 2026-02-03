'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { DEPLOYED_ADDRESSES } from '@/lib/addresses'
import { SNIPER_HOOK_ABI } from '@/lib/abis'
import { RefreshCw, XCircle, Clock, CheckCircle } from 'lucide-react'

export function UserIntents() {
    const { address, isConnected } = useAccount()
    const [mounted, setMounted] = useState(false)
    const [intents, setIntents] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => { setMounted(true) }, [])

    const { data: nextIntentId, refetch: refetchNextId } = useReadContract({
        address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
        abi: SNIPER_HOOK_ABI,
        functionName: 'nextIntentId',
        query: {
            enabled: mounted && isConnected,
        }
    })

    const { writeContract: cancel, data: cancelHash } = useWriteContract()
    const { isLoading: isCancelling, isSuccess: isCancelled } = useWaitForTransactionReceipt({ hash: cancelHash })

    const fetchIntents = async () => {
        if (!nextIntentId || !address) return
        setLoading(true)
        const fetched: any[] = []
        const count = Number(nextIntentId)

        // We'll fetch the last 10 intents for now to stay efficient
        const start = Math.max(1, count - 10)
        for (let i = count - 1; i >= start; i--) {
            try {
                // This is a bit slow as it's sequential, but fine for small numbers
                // In production we'd use multicall
                const response = await fetch('/api/intent-check', {
                    method: 'POST',
                    body: JSON.stringify({ id: i })
                }).then(res => res.json())

                // Since we don't have a specific API yet, I'll just use wagmi's readContract logic
                // but for a loop in a component, it's better to just use a custom fetcher or multicall.
                // For this hackathon, let's keep it simple and just fetch the most recent one manually.
            } catch (e) { }
        }
        setLoading(false)
    }

    // Simplified for the hackathon: just track the last created intent or fetch via simple loop
    // Actually, I'll just use a few useReadContract calls for IDs 1 to 5 to keep it simple.

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <h2 className="text-sm font-bold text-gray-100">My Orders</h2>
                </div>
                {mounted && isConnected && (
                    <button
                        onClick={() => refetchNextId()}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {!isConnected ? (
                    <p className="text-xs text-gray-500 text-center mt-4">Connect wallet to view orders</p>
                ) : (
                    <IntentList nextId={Number(nextIntentId || 0)} userAddress={address as string} />
                )}
            </div>
        </div>
    )
}

function IntentList({ nextId, userAddress }: { nextId: number, userAddress: string }) {
    const ids = Array.from({ length: Math.min(nextId - 1, 5) }, (_, i) => nextId - 1 - i).filter(id => id > 0)

    if (ids.length === 0) {
        return <p className="text-xs text-gray-500 text-center mt-4">No orders found</p>
    }

    return (
        <>
            {ids.map(id => (
                <IntentItem key={id} id={id} userAddress={userAddress} />
            ))}
        </>
    )
}

function IntentItem({ id, userAddress }: { id: number, userAddress: string }) {
    const { data: intent, refetch } = useReadContract({
        address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
        abi: SNIPER_HOOK_ABI,
        functionName: 'getIntent',
        args: [BigInt(id)],
    })

    const { writeContract: cancel, data: cancelHash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: cancelHash })

    useEffect(() => {
        if (isConfirmed) {
            refetch()
        }
    }, [isConfirmed, refetch])

    if (!intent || (intent as any).user.toLowerCase() !== userAddress.toLowerCase()) return null

    const i = intent as any
    const isExpired = Number(i.expiry) < Math.floor(Date.now() / 1000)
    const status = i.executed ? 'Executed' : i.cancelled ? 'Cancelled' : isExpired ? 'Expired' : 'Active'

    return (
        <div className="p-2.5 bg-gray-900/40 border border-gray-700/50 rounded-lg">
            <div className="flex justify-between items-start mb-1.5">
                <span className="text-[10px] font-mono text-gray-500">#{id}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${status === 'Active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        status === 'Executed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                    {status}
                </span>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <p className="text-xs text-gray-200 font-semibold">
                        {formatUnits(i.amountIn, 6)} USDC @ ${formatUnits(i.targetPrice, 8)}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                        {isExpired ? 'Expired' : `Expires: ${new Date(Number(i.expiry) * 1000).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                </div>

                {status === 'Active' || status === 'Expired' ? (
                    <button
                        onClick={() => cancel({
                            address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
                            abi: SNIPER_HOOK_ABI,
                            functionName: 'cancelIntent',
                            args: [BigInt(id), userAddress as `0x${string}`]
                        })}
                        disabled={isPending || isConfirming}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Cancel & Refund"
                    >
                        {isPending || isConfirming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    </button>
                ) : status === 'Executed' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500/60" />
                ) : null}
            </div>
        </div>
    )
}
