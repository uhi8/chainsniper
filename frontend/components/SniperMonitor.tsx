'use client'

import { useWatchContractEvent, usePublicClient, useAccount } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { Activity, CheckCircle, XCircle, Search, Cpu, Target, Zap, Shield, Radar } from 'lucide-react'
import { unichainSepolia } from 'wagmi/chains'
import { DEPLOYED_ADDRESSES } from '@/lib/addresses'
import { SNIPER_HOOK_ABI } from '@/lib/abis'

type LogEntry = {
    id: number
    timestamp: string
    message: string
    type: 'info' | 'success' | 'warning' | 'danger'
    blockNumber?: number
}

export function SniperMonitor() {
    const [mounted, setMounted] = useState(false)
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [currentBlock, setCurrentBlock] = useState<number>(0)
    const [stats, setStats] = useState({ targets: 0, hits: 0 })
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => { setMounted(true) }, [])

    // Smooth scroll to bottom on new logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    // Utility to add a premium log
    const addLog = (message: string, type: LogEntry['type'], blockNumber?: number) => {
        const now = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
        setLogs((prev) => {
            if (prev.some(l => l.message === message && l.type === type)) return prev;
            return [...prev.slice(-40), { id: Date.now() + Math.random(), timestamp: now, message, type, blockNumber }]
        })
    }

    const publicClient = usePublicClient({ chainId: unichainSepolia.id })

    // Replace watchBlockNumber with a slow 30s manual interval to stop the request storm
    useEffect(() => {
        if (!publicClient || !mounted) return
        
        const fetchBlock = async () => {
            try {
                const block = await publicClient.getBlockNumber()
                setCurrentBlock(Number(block))
            } catch (e) {
                console.error("Scout: Block sync failed", e)
            }
        }

        fetchBlock()
        const interval = setInterval(fetchBlock, 30000)

        // Handle Demo Mode Crash Simulation
        const handleDemoCrash = () => {
            setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
            addLog(
                `🎯 DIRECT HIT: Intent #772 executed at $1,850.42 (Demo Simulation)`,
                'success',
                currentBlock || 47118000
            );
        };

        window.addEventListener('demo-trigger-crash', handleDemoCrash);

        return () => {
            clearInterval(interval);
            window.removeEventListener('demo-trigger-crash', handleDemoCrash);
        }
    }, [publicClient, mounted, currentBlock])

    // Watch for Event: IntentCreated
    useWatchContractEvent({
        address: DEPLOYED_ADDRESSES.SNIPER_HOOK_L2 as `0x${string}`,
        abi: SNIPER_HOOK_ABI,
        eventName: 'IntentCreated',
        chainId: unichainSepolia.id,
        onLogs(logs) {
            logs.forEach((log) => {
                const args = log.args as any
                setStats(prev => ({ ...prev, targets: prev.targets + 1 }))
                addLog(
                    `📡 NEW TARGET: Intent #${args.intentId} | ${Number(args.amountIn) / 1e6} USDC @ $${Number(args.targetPrice) / 1e8}`,
                    'info',
                    Number(log.blockNumber)
                )
            })
        },
        pollingInterval: 60000, // 60s
    })

    // Watch for Event: IntentExecuted
    useWatchContractEvent({
        address: DEPLOYED_ADDRESSES.SNIPER_HOOK_L2 as `0x${string}`,
        abi: SNIPER_HOOK_ABI,
        eventName: 'IntentExecuted',
        chainId: unichainSepolia.id,
        onLogs(logs) {
            logs.forEach((log) => {
                const args = log.args as any
                setStats(prev => ({ targets: Math.max(0, prev.targets - 1), hits: prev.hits + 1 }))
                addLog(
                    `🎯 DIRECT HIT: Intent #${args.intentId} executed at $${Number(args.oraclePrice) / 1e8}`,
                    'success',
                    Number(log.blockNumber)
                )
            })
        },
        pollingInterval: 60000, // 60s
    })

    if (!mounted) return null

    return (
        <div className="bg-[#0c0c14] border border-indigo-500/20 rounded-xl overflow-hidden h-full flex flex-col shadow-[0_0_30px_rgba(79,70,229,0.1)]">
            {/* Header: Radar & Metrics */}
            <div className="p-4 border-b border-indigo-500/10 bg-indigo-500/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            {/* Radar Animation */}
                            <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full" />
                            <div className="absolute inset-0 border-2 border-indigo-500/40 rounded-full animate-ping" />
                            <div className="absolute inset-0 border-t-2 border-indigo-400 rounded-full animate-spin duration-1000" />
                            <Radar className="absolute inset-0 m-auto w-5 h-5 text-indigo-400 opacity-50" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-white tracking-[0.2em] uppercase">The Scout</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400/80 uppercase">System Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest mb-0.5">Scanning Block</div>
                        <div className="text-sm font-mono font-bold text-white tracking-widest">
                            {currentBlock || '-------'}
                        </div>
                    </div>
                </div>

                {/* Sub-Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="w-3 h-3 text-indigo-400" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Targets</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-white">{stats.targets}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-emerald-400" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Hits</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-white">{stats.hits}</span>
                    </div>
                </div>
            </div>

            {/* Terminal Logs */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-2.5 scrollbar-hide"
            >
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale">
                        <Search className="w-8 h-8 mb-2 animate-bounce" />
                        <p className="tracking-widest uppercase font-bold text-[10px]">Awaiting Uplink...</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className={`group relative pl-3 border-l-2 transition-all duration-300 ${
                                log.type === 'success' ? 'border-emerald-500 bg-emerald-500/5' : 
                                log.type === 'danger' ? 'border-red-500 bg-red-500/5' : 
                                'border-indigo-500/20 hover:border-indigo-500/50'
                            } p-2 rounded-r-md`}
                        >
                            <div className="flex items-center justify-between mb-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className={`${log.type === 'success' ? 'text-emerald-400' : 'text-indigo-400'} font-bold`}>
                                    @{log.timestamp}
                                </span>
                                {log.blockNumber && (
                                    <span className="text-[9px] text-gray-500">
                                        BLK: {log.blockNumber}
                                    </span>
                                )}
                            </div>
                            <p className={`${
                                log.type === 'success' ? 'text-emerald-300 font-bold' : 
                                log.type === 'danger' ? 'text-red-400' : 
                                'text-gray-300'
                            } leading-relaxed`}>
                                {log.message}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Terminal Decoration */}
            <div className="p-2 border-t border-indigo-500/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-indigo-500 opacity-40" />
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">Chainlink Feed v0.8.24</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-indigo-500/30 rounded-full" />
                    <div className="w-1 h-1 bg-indigo-500/30 rounded-full" />
                    <div className="w-1 h-1 bg-indigo-500/30 rounded-full" />
                </div>
            </div>
        </div>
    )
}
