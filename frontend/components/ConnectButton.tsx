'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Wallet, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

export function ConnectButton() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Prevent hydration mismatch by only rendering after mount
    if (!mounted) {
        return (
            <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/30 rounded-lg opacity-50"
            >
                <Wallet className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-gray-200">Loading...</span>
            </button>
        )
    }

    if (isConnected && address) {
        return (
            <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg hover:border-red-500/50 transition-all"
            >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-mono text-gray-300">
                    {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <LogOut className="w-4 h-4 text-red-400" />
            </button>
        )
    }

    return (
        <button
            onClick={() => connect({ connector: injected() })}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/30 rounded-lg hover:border-indigo-500/50 transition-all"
        >
            <Wallet className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-gray-200">Connect Wallet</span>
        </button>
    )
}
