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
| **L1 Monitor** | Reactive (Kopli) | `0x59315b3ffB558850259bB1C269966BF4dd1eb28E` |
| **L2 Executor** | Unichain Sepolia | `0x29BA007f6e604BF884968Ce11cB2D8e3b81A6284` |
| **L2 Hook** | Unichain Sepolia | `0xd3097577Fa07E7CCD6D53C81460C449D96f736cC` |
| **Pool Manager** | Unichain Sepolia | `0xC81462Fec8B23319F288047f8A03A57682a35C1A` |
| **USDC Token** | Unichain Sepolia | `0x31d0220469e10c4E71834a79b1f276d740d3768F` |
| **Frontend** | Local | `http://localhost:3001` |

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
│  │  • Subscribes to Chainlink ETH/USD feed                │ │
│  │  • Evaluates price conditions for registered intents   │ │
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

---

## 🚀 Quick Start (Testing)

### Prerequisites
1. **MetaMask/Rabby** wallet installed
2. **Unichain Sepolia** network added
3. **Test USDC** on Unichain Sepolia (`0x31d0220469e10c4E71834a79b1f276d740d3768F`)

### Create Your First Order
1. **Connect Wallet** to Unichain Sepolia
2. **Check Balance**: You should see your USDC balance below the amount field
3. **Create Order**:
   - Amount: `3 USDC` (minimum is 1 USDC)
   - Target Price: `2230` (or close to current price for testing)
4. **Approve Transaction**: Click "Approve USDC" first if prompted
5. **Monitor**: Watch the "Live Activity" panel for execution and the "My Orders" panel for your status

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
