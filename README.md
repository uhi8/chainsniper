## Unichain Sniper Contracts

This repository contains the smart-contract work for **Unichain Sniper**, an intent-based limit-order hook that targets Uniswap v4 pools on Unichain (Optimism stack). The goal is to escrow user funds inside the hook, rely on Chainlink L1 prices (forwarded through Reactive Network automation), and execute swaps only when oracle-based conditions are met. The implementation tracks PRD v1.0 dated Jan 31, 2026.

### Repository layout

- `src/UnichainSniperHook.sol` – core hook contract that stores intents, escrows funds, interacts with Reactive triggers, and exposes fast-path execution.
- `src/libraries/SniperTypes.sol` – shared structs/helpers for intents, buckets, and tick math.
- `src/interfaces/` – lightweight interfaces used by the hook (ERC20, Reactive messenger, PoolManager shim).
- `script/DeploySniperHook.s.sol` – Forge script that deploys the hook using environment variables for pool manager, Reactive messenger, etc.
- `test/UnichainSniperHook.t.sol` – Foundry tests that cover escrow, cancellation, and refunds with mocks.

The repository now vendors Uniswap's `v4-core` and `v4-periphery` libraries so the hook can implement the real `IHooks` + `IUnlockCallback` surfaces and prepare for PoolManager integrations.

### Requirements

- [Foundry](https://book.getfoundry.sh/) (ensure `forge`, `cast`, and `anvil` are on your PATH).
- Git submodules for dependencies (`forge-std` is already installed by `forge init`).

### Getting started

Install dependencies (if new clones):

```bash
forge install
```

Build and run tests:

```bash
forge build
forge test -vv
```

Format Solidity code before committing:

```bash
forge fmt
```

### Running the deployment script

The deployment script expects the following environment variables (use `.env` or export them before running `forge script`):

| Variable | Description |
| --- | --- |
| `POOL_MANAGER` | Address of the Uniswap v4 `PoolManager` on Unichain. |
| `TOKEN0` / `TOKEN1` | ERC20 addresses for the ordered pool pair (must satisfy `TOKEN0 < TOKEN1`). |
| `POOL_FEE` | Pool fee tier in hundredths of a bip (e.g., `3000` for 0.3%). |
| `REACTIVE_MESSENGER` | Reactive Network messenger/inbox contract allowed to trigger executions (optional during local testing). |
| `MIN_AMOUNT_IN` | Minimum escrow size in wei. |
| `MAX_STALENESS` | Maximum allowable Chainlink data age in seconds. |
| `TICK_SPACING` | Tick spacing for the target pool (e.g., 60 for 0.3% fee tier). |

Example:

```bash
export POOL_MANAGER=0x4200000000000000000000000000000000000006
export TOKEN0=0x0000000000000000000000000000000000000000
export TOKEN1=0x0000000000000000000000000000000000000000
export POOL_FEE=3000
export REACTIVE_MESSENGER=0x0000000000000000000000000000000000000000
export MIN_AMOUNT_IN=1000000000000000
export MAX_STALENESS=1800
export TICK_SPACING=60
forge script script/DeploySniperHook.s.sol:DeploySniperHookScript \
	--rpc-url $UNICHAIN_RPC \
	--private-key $DEPLOYER_KEY \
	--broadcast
```

### Next steps

- Integrate the real Uniswap v4 hook interfaces and PoolManager lock callbacks once the upstream packages are added.
- Connect the L1 Reactive automation contract so `executeIntent` is invoked by verified cross-chain messages.
- Expand the test suite with fuzzing for bucket accounting, TWAP fast-path validation, and slippage math.
