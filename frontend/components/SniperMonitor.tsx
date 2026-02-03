'use client'

import { useWatchContractEvent, usePublicClient, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { Activity, CheckCircle, XCircle } from 'lucide-react'
import { DEPLOYED_ADDRESSES } from '@/lib/addresses'
import { SNIPER_HOOK_ABI } from '@/lib/abis'

type LogEntry = {
    id: number
    timestamp: string
    message: string
    type: 'info' | 'success' | 'warning' | 'danger'
}

export function SniperMonitor() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    const [logs, setLogs] = useState<LogEntry[]>([])
    const { address } = useAccount()

    // Function to add a log entry
    const addLog = (message: string, type: LogEntry['type']) => {
        const now = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
        setLogs((prev) => {
            // Check for duplicates (by simple message match for now)
            if (prev.some(l => l.message === message)) return prev;
            return [...prev.slice(-30), { id: Date.now() + Math.random(), timestamp: now, message, type }]
        })
    }

    // Watch for new IntentCreated events
    useWatchContractEvent({
        address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
        abi: SNIPER_HOOK_ABI,
        eventName: 'IntentCreated',
        onLogs(logs) {
            logs.forEach((log) => {
                const args = log.args as any
                addLog(
                    `🆕 Intent #${args.intentId} created: ${Number(args.amountIn) / 1e6} USDC @ $${Number(args.targetPrice) / 1e8}`,
                    'info'
                )
            })
        },
    })

    // Watch for new IntentExecuted events
    useWatchContractEvent({
        address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
        abi: SNIPER_HOOK_ABI,
        eventName: 'IntentExecuted',
        onLogs(logs) {
            logs.forEach((log) => {
                const args = log.args as any
                addLog(
                    `🎯 Intent #${args.intentId} EXECUTED at $${Number(args.oraclePrice) / 1e8}`,
                    'success'
                )
            })
        },
    })

    // Fetch historical events on mount
    const publicClient = usePublicClient()

    useEffect(() => {
        const fetchHistory = async () => {
            if (!publicClient) return

            try {
                // Deployment block for current hook on Unichain Sepolia
                const DEPLOYMENT_BLOCK = BigInt(43168661)
                const currentBlock = await publicClient.getBlockNumber()

                // We'll fetch in 10k block chunks to respect RPC limits
                // For now, let's just fetch the most recent 10k, but starting from deployment
                const fromBlock = currentBlock - BigInt(9900) > DEPLOYMENT_BLOCK
                    ? currentBlock - BigInt(9900)
                    : DEPLOYMENT_BLOCK

                const creationLogs = await publicClient.getContractEvents({
                    address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
                    abi: SNIPER_HOOK_ABI,
                    eventName: 'IntentCreated',
                    fromBlock: fromBlock
                })

                const executionLogs = await publicClient.getContractEvents({
                    address: DEPLOYED_ADDRESSES.SNIPER_HOOK as `0x${string}`,
                    abi: SNIPER_HOOK_ABI,
                    eventName: 'IntentExecuted',
                    fromBlock: fromBlock
                })

                creationLogs.forEach(log => {
                    const args = log.args as any
                    addLog(
                        `Intent #${args.intentId} created: ${Number(args.amountIn) / 1e6} USDC @ $${Number(args.targetPrice) / 1e8}`,
                        'info'
                    )
                })

                executionLogs.forEach(log => {
                    const args = log.args as any
                    addLog(
                        `🎯 Intent #${args.intentId} EXECUTED at $${Number(args.oraclePrice) / 1e8}`,
                        'success'
                    )
                })
            } catch (err) {
                console.error("Error fetching history:", err)
            }
        }

        if (mounted) fetchHistory()
    }, [publicClient, mounted])

    const getIcon = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-3 h-3 text-green-400" />
            case 'danger':
                return <XCircle className="w-3 h-3 text-red-400" />
            default:
                return <Activity className="w-3 h-3 text-blue-400" />
        }
    }

    const getBgColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-500/10 border-green-500/30'
            case 'danger':
                return 'bg-red-500/10 border-red-500/30'
            default:
                return 'bg-blue-500/10 border-blue-500/30'
        }
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Live Activity
                </h3>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <Activity className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-xs">Waiting for events...</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className={`flex items-start gap-2 p-2 border rounded-lg ${getBgColor(log.type)}`}
                        >
                            {getIcon(log.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-400 font-mono">{log.timestamp}</p>
                                <p className="text-xs text-gray-200 mt-0.5 leading-tight">{log.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
