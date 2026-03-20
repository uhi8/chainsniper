'use client'

import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'

export function LivePrice() {
    const [price, setPrice] = useState<number | null>(null)
    const [updatedAt, setUpdatedAt] = useState<number | null>(null)
    const [secondsAgo, setSecondsAgo] = useState<number | null>(null)
    const [isRefetching, setIsRefetching] = useState(false)
    const [isDemoMode, setIsDemoMode] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Manual fetch from local API
    const fetchPriceData = async () => {
        try {
            setIsRefetching(true)
            const res = await fetch('/api/price')
            const data = await res.json()
            if (data.price) {
                setPrice(data.price)
                setUpdatedAt(data.updatedAt)
                setIsDemoMode(data.source === 'demo')
            }
        } catch (e) {
            console.error('Failed to fetch price from API', e)
        } finally {
            setTimeout(() => setIsRefetching(false), 1000)
        }
    }

    // Handle client-side mounting
    useEffect(() => {
        setMounted(true)
        fetchPriceData()
    }, [])

    // Auto-refresh price every 60 seconds (ultra-stable for Vercel)
    useEffect(() => {
        if (!mounted) return

        const interval = setInterval(() => {
            fetchPriceData()
        }, 60000)

        return () => clearInterval(interval)
    }, [mounted])

    // Update "seconds ago" every second
    useEffect(() => {
        if (!mounted || !updatedAt) return

        const updateTime = () => {
            setSecondsAgo(Math.floor(Date.now() / 1000 - updatedAt))
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
        <div className={`bg-gradient-to-br border rounded-xl p-4 h-full flex flex-col transition-all duration-500 ${
            isDemoMode 
            ? 'from-amber-500/20 to-orange-600/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
            : 'from-blue-500/10 to-indigo-600/10 border-blue-500/30'
        }`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isDemoMode ? 'text-amber-400' : 'text-blue-400'}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${isDemoMode ? 'text-amber-300' : 'text-blue-300'}`}>
                        {isDemoMode ? '🧪 Demo Mode Active' : 'Live Price Feed'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isDemoMode ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <span className={`text-[10px] ${isDemoMode ? 'text-amber-400' : 'text-green-400'}`}>
                        {isDemoMode ? 'Simulating' : 'Real-time'}
                    </span>
                </div>
            </div>

            {!price ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center">
                    <div className="text-center bg-gray-900/40 py-4 rounded-xl border border-gray-700/30 backdrop-blur-sm mb-4">
                        <div className={`text-4xl font-bold mb-1 ${isDemoMode ? 'text-amber-400' : 'text-gray-100'}`}>
                            ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">ETH / USD PAIR</div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        {secondsAgo !== null && (
                            <p className="text-[10px] text-gray-500 font-medium">
                                Last Updated: <span className="text-gray-300">{secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}m ${secondsAgo % 60}s`} ago</span>
                            </p>
                        )}
                        {isRefetching && (
                            <div className="flex items-center gap-2 py-1 px-3 bg-blue-500/10 rounded-full border border-blue-500/20">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping" />
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Syncing...</span>
                            </div>
                        )}
                        {!price && !isRefetching && mounted && (
                            <div className="flex items-center gap-2 py-1 px-3 bg-amber-500/10 rounded-full border border-amber-500/20">
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter">⚠️ RPC Lag</span>
                            </div>
                        )}
                    </div>
                    
                    <div className={`mt-auto pt-4 border-t ${isDemoMode ? 'border-amber-500/20' : 'border-blue-500/20'}`}>
                        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                            {isDemoMode 
                                ? <span className="text-amber-300/80 font-medium">🛠️ Manual price control enabled for demo</span>
                                : <span className="opacity-80">💡 Hook triggers below <span className="text-blue-300 font-bold">${price.toFixed(2)}</span></span>
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
