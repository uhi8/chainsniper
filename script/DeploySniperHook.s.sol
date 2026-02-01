// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {UnichainSniperHook} from "../src/UnichainSniperHook.sol";

contract DeploySniperHookScript is Script {
    function run() external returns (UnichainSniperHook hook) {
        IPoolManager poolManager = IPoolManager(vm.envAddress("POOL_MANAGER"));
        address token0 = vm.envAddress("TOKEN0");
        address token1 = vm.envAddress("TOKEN1");
        uint256 poolFeeRaw = vm.envOr("POOL_FEE", uint256(3000));
        require(poolFeeRaw <= type(uint24).max, "fee too large");
        uint24 poolFee = uint24(poolFeeRaw);
        uint256 minAmountIn = vm.envOr("MIN_AMOUNT_IN", uint256(1e16));
        uint256 maxStaleness = vm.envOr("MAX_STALENESS", uint256(1800));
        int256 tickSpacingRaw = vm.envOr("TICK_SPACING", int256(60));
        int24 tickSpacing = int24(tickSpacingRaw);

        vm.startBroadcast();
        hook = new UnichainSniperHook(
            poolManager, token0, token1, poolFee, tickSpacing, minAmountIn, maxStaleness
        );
        vm.stopBroadcast();
    }
}
