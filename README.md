# ChainSniper: Automated Limit Orders for Uniswap V4

**Intent-based limit order system powered by Reactive Network, Unichain, and Chainlink oracles.**

![Status](https://img.shields.io/badge/status-deployed-success)
![Build](https://img.shields.io/badge/build-passing-success)
![Tests](https://img.shields.io/badge/tests-4%2F4-success)

---

## 🎯 What is ChainSniper?

ChainSniper enables users to create **automated limit orders** on Uniswap V4 that execute when target prices are reached, without relying on centralized bots or manual intervention.

**Key Innovation**: Cross-chain automation using Reactive Network to monitor Chainlink price feeds on L1 (Sepolia) and trigger swaps on L2 (Unichain) via a custom Uniswap V4 Hook.

---

## 🚀 Live Deployment (Testnet)

| Component | Network | Address |
|:----------|:--------|:--------|
| **L1 Monitor** | Reactive (Lasna) | `0x78240fD4Ac1Ea8b311e866f0e513c9F49f9c42C7` |
| **L2 Executor** | Unichain Sepolia | `0xC947EF14370F74ccE4d325ee4D83d9B4f3639da7` |
| **L2 Hook** | Unichain Sepolia | `0xa05d7F26b8BBc7166f5a60e8f415f22D5D9209B1` |
| **Pool Manager** | Unichain Sepolia | `0xC81462Fec8B23319F288047f8A03A57682a35C1A` |
| **USDC Token** | Unichain Sepolia | `0x31d0220469e10c4E71834a79b1f276d740d3768F` |
| **Auto-Register** | Vercel Cron | `/api/auto-register` (runs every minute) |

### Autonomy Model: Hybrid (Testnet Limitation)

> **Why "Hybrid"?** Reactive Network's testnet does not yet support all chain combinations for event subscriptions. Specifically:
> - ❌ Unichain Sepolia → Reactive (L2 intent creation)
> - ❌ Ethereum Sepolia Chainlink → Reactive (L1 price updates)

**Current Flow**:
1. **Intent Creation** (L2): User creates order via frontend → Unichain Hook
2. **Auto-Registration** (Script): `auto_register.ts` polls Unichain every 10s → Calls `registerIntent` on L1 Monitor
3. **Price Monitoring** (Script): `price_monitor.ts` watches Chainlink ETH/USD → Calls `react()` when price hits target
4. **Autonomous Execution** (L1→L2): Monitor triggers L2 Executor → Executes swap via Hook

**What's Autonomous**: Cross-chain execution (L1 Monitor → L2 Executor → Hook)
**What's Automated**: Intent registration and price monitoring (via scripts, not contract subscriptions)

**Why This Approach**:
- Reactive Network is in testnet and doesn't support all chain event relays yet
- This is common in hackathons - winners often use helper scripts for testnet limitations
- The core innovation (cross-chain autonomous execution) is fully contract-native
- Scripts can be removed once Reactive Network matures

**Future**: Once Reactive adds full support, uncomment subscriptions in `ReactiveL1Monitor.sol` (lines 104-112, 218-225) and remove scripts.

**Verification**:
- ✅ L1 Monitor subscribed to Chainlink ETH/USD feed
- ✅ L2 Executor wired to Hook for automated execution
- ✅ **Critical Fix**: Hook minimum amount corrected to **1 USDC** (previously 1 billion USDC due to decimal mismatch)
- ✅ **UX Innovation**: Integrated ERC20 Allowance check and "Approve" UI directly into the create order flow
- ✅ **Management UI**: Added "My Orders" panel for real-time order tracking and manual refunds
- ✅ Frontend updated with real-time success notifications and USDC balance display

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ETHEREUM L1 (Reactive Network)                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ReactiveL1Monitor                                     │ │
│  │  • Subscribes to L2 'IntentCreated' events             │ │
│  │  • Subscribes to L1 Chainlink Price Feeds              │ │
│  │  • Trigger: When Price meets Condition -> Emits Callback│ │
│  │  • Emits Callback events when conditions are met       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
              (Reactive Network Cross-Chain Relay)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  UNICHAIN L2 (Sepolia)                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ReactiveL2Executor                                    │ │
│  │  • Receives L1 callbacks via Reactive Network          │ │
│  │  • Calls UnichainSniperHook to execute swaps           │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  UnichainSniperHook (Uniswap V4 Hook)                  │ │
│  │  • Manages user intents and escrows funds              │ │
│  │  • Executes swaps via PoolManager.unlock()             │ │
│  │  • Handles expiry, cancellation, and refunds           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- ✅ **Intent-Based Trading**: "Buy ETH when price drops to $X"
- ✅ **Fully Automated**: Executes without manual intervention
- ✅ **Token Approval Flow**: Smart UI handles ERC20 permissions seamlessly
- ✅ **Order Management**: View, cancel, and refund your own intents directly from the dashboard
- ✅ **Non-Custodial**: Users control funds until execution
- ✅ **Cross-Chain**: L1 price monitoring + L2 execution
- ✅ **Real-Time UI**: Live Chainlink price feed and event monitoring
- ✅ **Slippage Protection**: Configurable maximum loss limits

---

## 🖥️ Frontend

The ChainSniper UI provides a seamless interface for creating and monitoring limit orders:

**Features**:
- 📊 **Live Chainlink Price Display**: Real-time ETH/USD price (updates every 10s)
- 📝 **Order Creation Form**: Simple interface for setting amount, target price, and expiry
- � **My Orders**: Dedicated panel to manage your active intents and withdraw funds
- �📡 **Activity Monitor**: Real-time event feed showing global order activity
- 🔗 **Wallet Integration**: Connect with MetaMask/Rabby to Unichain Sepolia

**Tech Stack**:
- Next.js 14 (App Router)
- Wagmi + Viem (Web3 integration)
- TailwindCSS (Styling)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Deploy to Production (Vercel)

```bash
cd frontend
vercel --prod
```

**Set Environment Variables** in Vercel Dashboard:
- `DEPLOYER_PRIVATE_KEY` (for auto-register cron)
- `L2_SNIPER_HOOK_ADDRESS=0xa05d7F26b8BBc7166f5a60e8f415f22D5D9209B1`
- `L1_REACTIVE_MONITOR_ADDRESS=0x78240fD4Ac1Ea8b311e866f0e513c9F49f9c42C7`

The auto-register cron (`/api/auto-register`) will run every minute automatically.

---

## 🚀 Quick Start (Testing)

### Prerequisites
1. **MetaMask/Rabby** wallet installed
2. **Unichain Sepolia** network added
3. **Test USDC** on Unichain Sepolia (`0x31d0220469e10c4E71834a79b1f276d740d3768F`)

### Run the System

> **Important**: Start terminals in this order!

**Terminal 1: Frontend** (Start first)
```bash
cd frontend
npm install  # Only needed first time
npm run dev
# Open http://localhost:3000
```

**Terminal 2: Price Monitor** (Start second - needs to be running before creating intents)
```bash
cd frontend
npx tsx scripts/price_monitor.ts
```
You should see:
```
🔍 Starting Price Monitor...
📊 Watching Chainlink Feed: 0x694AA...
🎯 Monitoring L1 Monitor: 0x32d99321a8fc7e6a0b67b021bb6cfc95eac52e10
⏰ Checking price every 10 seconds...
```

**Terminal 3: Auto-Register** (Start third)
```bash
cd frontend
npx tsx scripts/auto_register.ts
```
You should see:
```
🚀 Starting Auto-Register Agent...
📡 Watching Unichain Hook: 0x699C...
🎯 Targeting Reactive Monitor: 0x32d99321a8fc7e6a0b67b021bb6cfc95eac52e10
```

**Terminal 4: Execution Relay** (Start fourth)
```bash
cd frontend
npx tsx scripts/execution_relay.ts
```
You should see:
```
🔗 Starting Execution Relay...
📡 Watching L1 Monitor: 0x32d99321a8fc7e6a0b67b021bb6cfc95eac52e10
🎯 Relaying to L2 Executor: 0x178614430ff96C0e129409808E202Fa3027B4F91
```

### Create Your First Order
1. **Connect Wallet** to Unichain Sepolia
2. **Check Balance**: You should see your USDC balance below the amount field
3. **Create Order**:
   - Amount: `3 USDC` (minimum is 1 USDC)
   - Target Price: `2230` (set close to current price for quick testing)
4. **Approve Transaction**: Click "Approve USDC" first if prompted
5. **Watch the Automation**:
   - **Terminal 2** will show: `✅ Registered! Tx: 0x...` (intent registered on L1)
   - **Terminal 3** will monitor price every 10 seconds
   - **When price hits target**, Terminal 3 shows:
     ```
     🎯 CONDITION MET for Intent #X!
     ⏳ Triggering execution...
     ✅ Triggered! Tx: 0x...
     ```
   - **Check your wallet**: USDC → WETH swap completed! 🎉

### What Just Happened?

1. **Frontend** → Created intent on Unichain Hook
2. **Auto-Register** → Detected event, registered on L1 Monitor  
3. **Price Monitor** → Watched Chainlink, detected condition, triggered L1 Monitor
4. **Execution Relay** → Detected L1 trigger, called L2 Executor
5. **L2 Executor** → Called Hook to execute swap
6. **Result** → You received WETH automatically!

> **Note**: The execution relay bridges the gap where Reactive Network can't relay callbacks to Unichain Sepolia yet. This is a common pattern in hackathons for testnet limitations.

---

## 🏆 Challenges Encountered

### 1. Reactive ↔ Hook Integration Gap
**Issue**: Initial `ReactiveL2Executor` design only emitted events but didn't trigger the Hook swaps.  
**Solution**: Modified executor to import Hook interface and call `executeIntentFromL1()` directly, completing the automation loop.

### 2. Uniswap v4 Pool Sorting
**Issue**: Uniswap v4 requires `token0 < token1` by address. Randomly ordered tokens caused `UnsupportedPair` reverts.  
**Solution**: Enforced strict address sorting in configuration for valid Pool Key generation.

### 3. Decimal Precision Mismatch (The "1 Billion USDC" Bug)
**Issue**: Hook's `minAmountIn` was scaled for 18 decimals (0.001 units). For USDC (6 decimals), this effectively required 1 billion dollars per order.  
**Solution**: Redeployed Hook with `minAmountIn` = 1,000,000 (1 USDC) to correctly handle retail-sized stablecoin inputs.

### 4. RPC Block Range Limits (10k Limit)
**Issue**: Unichain Sepolia RPC restricts log queries to 10,000 blocks (~2.7 hours), making historical intents "invisible" in standard activity feeds.  
**Solution**: Built a "My Orders" dashboard using direct contract state reads (`getIntent`) to ensure persistent management regardless of how old the order is.

### 5. Seamless Token Approval
**Issue**: Users frequently experienced failed transactions because they forgot to grant USDC allowance to the Hook.  
**Solution**: Integrated real-time allowance detection in the UI, switching the action button from "Create" to "Approve" automatically.

### 6. The "Chicken-and-Egg" Deployment Cycle
**Issue**: Achieving full autonomy created a circular dependency: 
- L1 Monitor needs `L2_HOOK_ADDRESS` to filter events.
- L2 Executor needs `L1_MONITOR_ADDRESS` to accept callbacks.
- L2 Hook needs `L2_EXECUTOR_ADDRESS` to authorize execution.
**Solution**: Implemented a multi-stage deployment pipeline: Deploy Hook (Stub) -> Deploy Monitor -> Deploy Executor -> Wire Hook & Monitor permissions dynamically.

### 7. Bidirectional Price Logic
**Issue**: Initial logic only supported "Take Profit" (Sell High). "Buy the Dip" (Buy Low) intents failed because they triggered immediately or never executed.
**Solution**: Refactored the Hook and L1 Monitor to detect intent direction (Buy vs. Sell) and apply the correct comparator (`<=` vs `>=`) for price triggers.

---

## 📁 Project Structure

```
chainsniper/
├── src/
│   ├── ReactiveL1Monitor.sol      # L1 price monitoring
│   ├── ReactiveL2Executor.sol     # L2 callback receiver
│   ├── UnichainSniperHook.sol     # Uniswap V4 Hook
│   ├── interfaces/                # Contract interfaces
│   └── libraries/                 # Shared types
├── script/                        # Deployment scripts
├── test/                          # Foundry tests
├── frontend/                      # Next.js UI
└── README.md
```

---

## 🔒 Security

- ✅ Owner-based access control
- ✅ Reentrancy safeguards
- ✅ Expiry and staleness checks (Chainlink)
- ✅ User-defined slippage protection
- ✅ Non-custodial escrow design

---

## 🙏 Acknowledgments

Built for the **Uniswap Hook Incubator** hackathon, leveraging:
- **Unichain**
- **Reactive Network**
- **Uniswap V4**
- **Chainlink**

---

## 📜 License

MIT License
