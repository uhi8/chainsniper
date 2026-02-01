## ChainSniper: Intent-Based Limit Order System for Uniswap V4

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

### Deployment

**Testnet Deployment (Reactive Network + Unichain):**

```bash
# Set environment variables
export REACTIVE_RPC_URL=https://rpc-dev.reactive.network
export UNICHAIN_RPC_URL=https://sepolia.unichain.org

# Deploy L1 Monitor
forge script script/DeployReactiveL1Monitor.s.sol \
  --rpc-url $REACTIVE_RPC_URL \
  --broadcast

# Deploy L2 Executor
forge script script/DeployReactiveL2Executor.s.sol \
  --rpc-url $UNICHAIN_RPC_URL \
  --broadcast

# Deploy Hook
forge script script/DeploySniperHook.s.sol \
  --rpc-url $UNICHAIN_RPC_URL \
  --broadcast
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
