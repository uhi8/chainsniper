# Task: ChainSniper 2.0 Implementation

## 🏗️ Phase 1: Smart Contracts
- [x] Add `priorityScore` and `reputation` to `SniperTypes.Intent`
- [x] Implement `boostIntent(uint256 id)` (via x402 monitor)
- [x] Implement `Piggyback Execution` in `beforeSwap` callbacks
- [/] Refactor `executeIntent` to process ranked priority

## 📡 Phase 2: Reactive Network
- [x] **New Contract**: `ReactiveL1Monitor.sol` (Updated with Autonomous Logic + Bidirectional)
- [x] **New Contract**: `UnichainSniperHook.sol` (Updated with Executor Role)
- [x] **New Script**: `DeployReactiveL1Monitor.s.sol` (Updated)
- [x] **New Script**: `DeploySniperHook.s.sol` (Updated)
chain

## 🖥️ Phase 3: Frontend Evolution
- [ ] Add "Priority Boost" button with x402 payment flow
- [ ] Add "Global Rank" indicator for active orders
