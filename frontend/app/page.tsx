import { ConnectButton } from "@/components/ConnectButton";
import { CreateIntentForm } from "@/components/CreateIntentForm";
import { SniperMonitor } from "@/components/SniperMonitor";
import { LivePrice } from "@/components/LivePrice";
import { UserIntents } from "@/components/UserIntents";
import { Target } from "lucide-react";

export default function Home() {
  return (
    <main className="h-screen bg-[#0a0a0f] text-gray-200 overflow-hidden flex flex-col">
      {/* Background Grid */}
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1e2e 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full px-6 py-4">
        {/* Compact Header */}
        <header className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-lg">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                ChainSniper
              </h1>
              <p className="text-[10px] text-gray-500">Automated Limit Orders • Uniswap V4</p>
            </div>
          </div>
          <ConnectButton />
        </header>

        {/* Main Content Grid - 3 Columns */}
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Left: Live Price */}
          <div className="flex flex-col">
            <LivePrice />
          </div>

          {/* Center: Create Order Form & My Orders */}
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <CreateIntentForm />
            </div>
            <div className="h-1/2">
              <UserIntents />
            </div>
          </div>

          {/* Right: Activity Monitor */}
          <div className="flex flex-col">
            <SniperMonitor />
          </div>
        </div>

        {/* Compact Footer */}
        <footer className="mt-3 pt-2 border-t border-gray-800 text-center text-[10px] text-gray-600">
          <p>Unichain Sepolia • Reactive Network • Chainlink Oracle</p>
        </footer>
      </div>
    </main>
  );
}
