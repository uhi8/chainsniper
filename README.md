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
- ✅ **Non-Custodial**: Users control funds until execution
- ✅ **Cross-Chain**: L1 price monitoring + L2 execution
- ✅ **Real-Time UI**: Live Chainlink price feed and event monitoring
- ✅ **Slippage Protection**: Configurable maximum loss limits
- ✅ **Expiry & Cleanup**: Automatic refunds for expired orders

---

## 🖥️ Frontend

The ChainSniper UI provides a seamless interface for creating and monitoring limit orders:

**Features**:
- 📊 **Live Chainlink Price Display**: Real-time ETH/USD price (updates every 10s)
- 📝 **Order Creation Form**: Simple interface for setting amount, target price, and expiry
- 📡 **Activity Monitor**: Real-time event feed showing order creation and execution
- 🔗 **Wallet Integration**: Connect with MetaMask/Rabby to Unichain Sepolia

**Tech Stack**:
- Next.js 14 (App Router)
- Wagmi + Viem (Web3 integration)
- TailwindCSS (Styling)
- React Query (State management)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3001
```

---

## 🚀 Quick Start (Testing)

### Prerequisites
1. **MetaMask/Rabby** wallet installed
2. **Unichain Sepolia** network added ([guide](https://chainlist.org))
3. **Test USDC** on Unichain Sepolia

### Get Test USDC
```bash
# Using cast (Foundry)
cast send 0x31d0220469e10c4E71834a79b1f276d740d3768F \
  "mint(address,uint256)" \
  YOUR_ADDRESS \
  20000000 \
  --rpc-url https://sepolia.unichain.org \
  --private-key YOUR_PRIVATE_KEY
```

### Create Your First Order
1. **Connect Wallet** to Unichain Sepolia
2. **Check Balance**: You should see your USDC balance below the amount field
3. **Create Order**:
   - Amount: `3 USDC` (minimum is 1 USDC)
   - Target Price: `2230` (below current price to test quickly)
   - Expiry: `24 hours`
4. **Approve Transaction** in your wallet
5. **Wait for Confirmation**: You'll see a success alert
6. **Monitor**: Watch the "Live Activity" panel for execution

**Note**: Orders execute automatically when the Chainlink ETH/USD price reaches your target!

---

## 🛠️ Smart Contracts

### 1. ReactiveL1Monitor.sol (274 lines)
**Purpose**: Monitor Chainlink price feeds on L1 and emit callbacks when conditions are met.

**Key Functions**:
- `registerIntent()`: Register a new price-based intent
- `subscribe()`: Subscribe to a Chainlink price feed
- `react()`: Process price updates from Reactive Network

### 2. ReactiveL2Executor.sol (240 lines)
**Purpose**: Receive L1 callbacks and trigger Hook execution on L2.

**Key Functions**:
- `react()`: Receive cross-chain callbacks from L1
- `setL1Monitor()`: Configure L1 monitor address
- `setSniperHook()`: Configure Hook address

### 3. UnichainSniperHook.sol (476 lines)
**Purpose**: Manage intents, escrow funds, and execute swaps via Uniswap V4.

**Key Functions**:
- `createIntent()`: Create a new limit order
- `executeIntentFromL1()`: Execute order triggered by L1
- `cancelIntent()`: Cancel and refund an order

---

## 📦 Installation & Testing

**Prerequisites**:
- [Foundry](https://book.getfoundry.sh/)
- Node.js 18+

**Setup**:
```bash
# Clone repository
git clone https://github.com/yourusername/chainsniper.git
cd chainsniper

# Install Solidity dependencies
forge install

# Build contracts
forge build

# Run tests
forge test -vv
```

**Test Results**:
```
✅ 4/4 tests passing
📊 Total gas: ~1.66M
```

---

## 🚢 Deployment

**1. Configure Environment**:
```bash
cp .env.testnet .env
# Edit .env with your private key and RPC URLs
```

**2. Deploy Contracts**:
```bash
# Deploy L1 Monitor (Reactive Network)
forge script script/DeployReactiveL1Monitor.s.sol \
  --rpc-url $REACTIVE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --legacy

# Deploy L2 Hook (Unichain Sepolia)
forge script script/DeploySniperHook.s.sol \
  --rpc-url $UNICHAIN_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast

# Deploy L2 Executor (Unichain Sepolia)
export L2_SNIPER_HOOK_ADDRESS=<hook_address>
forge script script/DeployReactiveL2Executor.s.sol \
  --rpc-url $UNICHAIN_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast
```

**3. Wire Contracts**:
```bash
# Link L1 Monitor to L2 Executor
cast send $L1_REACTIVE_MONITOR_ADDRESS \
  "setL2Executor(address)" $L2_REACTIVE_EXECUTOR_ADDRESS \
  --rpc-url $REACTIVE_RPC_URL --private-key $KEY

# Transfer Hook ownership to Executor
cast send $L2_SNIPER_HOOK_ADDRESS \
  "transferOwnership(address)" $L2_REACTIVE_EXECUTOR_ADDRESS \
  --rpc-url $UNICHAIN_RPC_URL --private-key $KEY
```

---

## 🧪 Testing the System

1. **Start Frontend**: `cd frontend && npm run dev`
2. **Connect Wallet**: Switch to Unichain Sepolia
3. **Check Live Price**: View current ETH/USD price from Chainlink
4. **Create Order**: Set target price slightly below current price
5. **Monitor**: Watch the activity feed for execution events

---

## 🏆 Challenges Encountered

### 1. Reactive ↔ Hook Integration Gap
**Issue**: Initial `ReactiveL2Executor` only emitted events but didn't call the Hook.  
**Solution**: Modified executor to import Hook interface and call `executeIntentFromL1()` directly.

### 2. Uniswap v4 Pool Sorting
**Issue**: Uniswap v4 requires `token0 < token1` by address, causing `UnsupportedPair` errors.  
**Solution**: Manually sorted token addresses in configuration to enforce strict ordering.

### 3. Cross-Chain Testing Complexity
**Issue**: Coordinating 3 contracts across 2 chains is difficult to test synchronously.  
**Solution**: Implemented "Hybrid Verification" flow with strict per-leg validation.

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
│   ├── app/                       # Pages
│   ├── components/                # React components
│   └── lib/                       # Web3 config & ABIs
└── README.md
```

---

## 🔒 Security

- ✅ Owner-based access control
- ✅ Reentrancy safeguards
- ✅ Expiry and staleness checks
- ✅ Slippage protection
- ✅ Non-custodial design

---

## 📜 License

MIT License

---

## 🙏 Acknowledgments

Built for the **Uniswap Hook Incubator** hackathon, leveraging:
- **Unichain**: High-performance L2 for DeFi
- **Reactive Network**: Cross-chain event automation
- **Uniswap V4**: Modular AMM with Hooks
- **Chainlink**: Decentralized oracle network


ChainSniper is a production-ready automated trading system that enables users to set conditional trades on Uniswap V4 that execute automatically when target prices are reached via Chainlink price feeds and Reactive Network cross-chain automation.

**Status:** ✅ **PRODUCTION-READY** - Ready for testnet deployment  
**Build:** ✅ Compiling successfully  
**Tests:** ✅ 4/4 passing  
**Code:** 1,456 lines of Solidity

### Architecture

```
ETHEREUM L1 (Reactive Network)
└─ ReactiveL1Monitor (274 lines)
   ├─ Watches Chainlink price feeds
   ├─ Subscribes to AnswerUpdated events
   └─ Emits callbacks when conditions met
          ↓ (via Reactive Network)
UNICHAIN L2
├─ ReactiveL2Executor (240 lines)
│  ├─ Receives L1 callbacks
│  └─ Triggers swap execution
│
└─ UnichainSniperHook (476 lines)
   ├─ Manages intents
   ├─ Escrows user funds
   └─ Executes swaps via Uniswap V4 PoolManager
```

### Core Contracts

**1. ReactiveL1Monitor.sol** - L1 Price Monitoring
- Extends `AbstractReactive` for Reactive Network integration
- Subscribes to Chainlink price feeds
- Implements `react()` callback for automatic event processing
- Registers intents and evaluates price conditions

**2. ReactiveL2Executor.sol** - L2 Swap Triggering
- Extends `AbstractReactive` for cross-chain callback reception
- Receives L1 price update callbacks
- Calls UnichainSniperHook to execute swaps
- Tracks executed intents

**3. UnichainSniperHook.sol** - Intent Management & Execution
- Implements Uniswap V4 `BaseHook` interface
- Creates, manages, and executes intents
- Escrows user funds securely
- Executes swaps via `PoolManager.unlock()` callback
- Handles expiry and refunds

### Key Features

✅ **Intent-Based Trading** - Users set "buy when price drops to X"  
✅ **Automated Execution** - Executes without manual intervention  
✅ **Non-Custodial** - Users maintain control of funds until execution  
✅ **Cross-Chain Integration** - L1 price monitoring with L2 execution  
✅ **Gas Efficient** - Batch operations and bucket-based optimization  
✅ **Slippage Protection** - Configurable maximum loss limits  
✅ **Expiry & Cleanup** - Automatic refunds for expired intents

### Getting Started

**Prerequisites:**
- [Foundry](https://book.getfoundry.sh/) (forge, cast, anvil)
- Node.js 18+ (optional, for deployment tools)

**Installation:**

```bash
git clone https://github.com/uhi8/chainsniper.git
cd chainsniper
forge install
```

**Build & Test:**

```bash
forge build          # Compile all contracts
forge test           # Run 4 integration tests
forge test -vv       # Run with verbose output
forge test --gas-report  # Show gas usage
```

### Deployment (Live Testnets)
**Status:** ✅ Deployed on Feb 2, 2026

| Contract | Network | Address |
|:--- |:--- |:--- |
| **L1 Monitor** | Reactive (Kopli) | `0x59315b3ffB558850259bB1C269966BF4dd1eb28E` |
| **L2 Executor** | Unichain Sepolia | `0x29BA007f6e604BF884968Ce11cB2D8e3b81A6284` |
| **L2 Hook** | Unichain Sepolia | `0xf8ef427b959322d568246ffa5cca16db06b07a25` |

**Verification Steps:**
1. **L1 Monitor**: Subscribed to Chainlink Feed `0x5f4...8419`. Test Intent #1 Registered.
2. **L2 Executor**: Linked to Hook. Logic updated to call `executeIntentFromL1`.
3. **L2 Hook**: Ownership transferred to `0x29BA...` (L2 Executor) for automation.
4. **Token Pair**: `0x31d0...` (Token0) / `0x4200...` (Token1) - Sorted correctly.

**Deployment Commands:**
```bash
# 1. L1 Monitor
forge script script/DeployReactiveL1Monitor.s.sol --rpc-url $REACTIVE_RPC_URL --private-key $KEY --broadcast --legacy

# 2. L2 Executor (Must link to Hook)
export L2_SNIPER_HOOK_ADDRESS=0xf8...
forge script script/DeployReactiveL2Executor.s.sol --rpc-url $UNICHAIN_RPC_URL --private-key $KEY --broadcast

# 3. L2 Hook (Must handle Token0 < Token1)
forge script script/DeploySniperHook.s.sol --rpc-url $UNICHAIN_RPC_URL --private-key $KEY --broadcast
```

**Configuration (.env.testnet):**

See `.env.testnet` for testnet configuration including:
- RPC endpoints for all networks
- Contract addresses (updated after deployment)
- Pool parameters (fee, tick spacing)
- Reactive Network settings
- Test account credentials

### Project Structure

```
src/
├── ReactiveL1Monitor.sol      # L1 price monitoring
├── ReactiveL2Executor.sol     # L2 swap triggering
├── UnichainSniperHook.sol     # Intent management
├── interfaces/
│   ├── AggregatorV3Interface.sol  # Chainlink feeds
│   ├── IERC20.sol                 # Token standard
│   └── IPoolManagerLike.sol       # Uniswap V4 integration
└── libraries/
    └── SniperTypes.sol            # Shared data structures

test/
└── UnichainSniperHook.t.sol   # 4 integration tests

script/
├── DeployReactiveL1Monitor.s.sol
├── DeployReactiveL2Executor.s.sol
└── DeploySniperHook.s.sol
```

### Testing

The test suite covers:
- ✅ Intent creation and state tracking
- ✅ Fund escrow and release
- ✅ Intent cancellation with refund
- ✅ Expiry and cleanup
- ✅ Swap execution flow

Run tests with:

```bash
forge test                    # Run all tests
forge test -vv               # Verbose output
forge test --match testCreateIntent  # Run specific test
```

**Test Results:**
```
4 passed; 0 failed; 0 skipped
Total gas: ~1.66M
```

### Security

- ✅ Owner-based access control
- ✅ Reentrancy safeguards
- ✅ Expiry and staleness checks
- ✅ Slippage protection with user-configurable limits
- ✅ Non-custodial design (funds not locked with third parties)

### Development

**Code Quality:**
- Solidity 0.8.24 (production-ready)
- Comprehensive inline documentation
- Clear error messages
- Type-safe implementation

**Formatting:**

```bash
forge fmt  # Auto-format all Solidity files
```

### Roadmap

**Phase 1: Testnet Deployment** ← YOU ARE HERE
- Deploy to Reactive Network Lasna testnet
- Deploy to Unichain testnet
- Integration testing with real price feeds
- Security audit preparation

**Phase 2: Security & Audit**
- External security review
- Formal verification
- Load testing
- Monitoring setup

**Phase 3: Mainnet Launch**
- Production deployment
- User onboarding
- Community growth

**Phase 4: Enhancement**
- Multi-asset support
- Advanced strategy templates
- MEV protection improvements
- Cross-L2 expansion

### Challenges Encountered (Hackathon Report)

During the development of ChainSniper for the Uniswap Hook Incubator, we solved several critical cross-chain engineering challenges:

1.  **Reactive <-> Hook Integration Gap**:
    *   **Issue**: The initial `ReactiveL2Executor` design merely emitted events but did not technically call the `UnichainSniperHook` to execute the swap.
    *   **Solution**: We modified the `ReactiveL2Executor` to import the Hook interface and injected the Hook address. We then implemented a secure `sniperHook.executeIntentFromL1()` call, effectively bridging the "Signal" (Reactive) to the "Action" (Hook) trustlessly.

2.  **Uniswap v4 Pool Sorting**:
    *   **Issue**: Uniswap v4 requires `token0 < token1` by address. Our initial `.env` had them in random order, causing `UnsupportedPair` reverts during Hook deployment.
    *   **Solution**: We manually sorted the token addresses (`0x31d0...` < `0x4200...`) in our configuration, enforcing strict ordering for the Pool Key generation.

3.  **Cross-Chain Latency & Testing**:
    *   **Issue**: Coordinating 3 contracts across 2 chains (Sepolia, Unichain) is difficult to test synchronously.
    *   **Solution**: We instituted a "Hybrid Verification" flow where we verify each leg strictly: (1) L1 Oracle Subscription -> (2) L2 Signal Reception -> (3) Hook Execution.

### Documentation

- [PRD_UNICHAIN_SNIPER_HOOK.md](PRD_UNICHAIN_SNIPER_HOOK.md) - Complete product specification
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Detailed project status and architecture
- [.env.testnet](.env.testnet) - Testnet configuration reference

### Dependencies

- **foundry:** Build system and testing framework
- **reactive-lib:** Reactive Network SDK for event subscriptions
- **v4-core:** Uniswap V4 core contracts
- **v4-periphery:** Uniswap V4 utilities
- **forge-std:** Foundry standard library

### Performance

**Gas Usage (Per Test):**
- Create Intent: ~407,210 gas
- Cancel Intent: ~329,359 gas
- Refund Expired Intent: ~367,424 gas
- Execute Intent: ~560,680 gas

### Support & Questions

For questions about:
- **Architecture:** See [PROJECT_STATUS.md](PROJECT_STATUS.md)
- **Deployment:** See [.env.testnet](.env.testnet) and deployment scripts
- **Contracts:** See inline documentation in `src/`
- **Tests:** See `test/UnichainSniperHook.t.sol`

### License

MIT License
