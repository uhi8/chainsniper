'use client'

import { useReadContract } from 'wagmi'
import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { sepolia } from 'wagmi/chains'

const CHAINLINK_ETH_USD = '0x694AA1769357215DE4FAC081bf1f309aDC325306'

const CHAINLINK_ABI = [
    {
        inputs: [],
        name: 'latestRoundData',
        outputs: [
            { internalType: 'uint80', name: 'roundId', type: 'uint80' },
            { internalType: 'int256', name: 'answer', type: 'int256' },
            { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
            { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
            { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const

export function LivePrice() {
    const [minutesAgo, setMinutesAgo] = useState<number | null>(null)
    const [mounted, setMounted] = useState(false)

    const { data, isLoading, refetch } = useReadContract({
        address: CHAINLINK_ETH_USD,
        abi: CHAINLINK_ABI,
        functionName: 'latestRoundData',
        chainId: sepolia.id,
    })

    const price = data ? Number(data[1]) / 1e8 : null
    const updatedAt = data ? Number(data[3]) : null

    // Handle client-side mounting
    useEffect(() => {
        setMounted(true)
    }, [])

    // Auto-refresh price every 10 seconds
    useEffect(() => {
        if (!mounted) return

        const interval = setInterval(() => {
            refetch()
        }, 10000)

        return () => clearInterval(interval)
    }, [mounted, refetch])

    // Update "minutes ago" every second
    useEffect(() => {
        if (!mounted || !updatedAt) return

        const updateTime = () => {
            setMinutesAgo(Math.floor((Date.now() / 1000 - updatedAt) / 60))
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)

        return () => clearInterval(interval)
    }, [mounted, updatedAt])

    if (!mounted) {
        return (
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/30 rounded-xl p-4 h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/30 rounded-xl p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                        Live Price
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-400">Auto-Refresh</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : price ? (
                <div className="flex-1 flex flex-col justify-center">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-100 mb-1">
                            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-400 mb-4">ETH/USD</div>
                        {minutesAgo !== null && (
                            <p className="text-[10px] text-gray-500 mb-4">
                                Updated {minutesAgo}m ago
                            </p>
                        )}
                    </div>
                    <div className="mt-auto pt-3 border-t border-blue-500/20">
                        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                            💡 Set target below <span className="text-blue-300 font-semibold">${price.toFixed(2)}</span> to test
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-red-400">Failed to fetch</p>
                </div>
            )}
        </div>
    )
}
