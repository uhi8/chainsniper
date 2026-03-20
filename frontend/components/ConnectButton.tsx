'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ConnectButton() {
    const { address, isConnected } = useAccount()
    const { connectors, connect } = useConnect()
    const { disconnect } = useDisconnect()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="w-32 h-10 bg-gray-900 animate-pulse rounded-lg" />

    if (isConnected && address) {
        return (
            <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg hover:border-red-500/50 transition-all"
            >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-gray-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <LogOut className="w-3.5 h-3.5 text-red-400" />
            </button>
        )
    }

    return (
        <div className="flex gap-2">
            {connectors.map((connector) => (
                <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:border-indigo-500/50 transition-all text-[11px] font-bold text-gray-200"
                >
                    <Wallet className="w-3 h-3 text-indigo-400" />
                    {connector.name}
                </button>
            ))}
        </div>
    )
}
