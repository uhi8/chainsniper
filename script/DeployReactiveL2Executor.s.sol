// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ReactiveL2Executor} from "../src/ReactiveL2Executor.sol";

/**
 * @title DeployReactiveL2ExecutorScript
 * @notice Deploy ReactiveL2Executor to L2 (Unichain)
 * @dev Run: forge script script/DeployReactiveL2Executor.s.sol --rpc-url $L2_RPC_URL --broadcast
 */
contract DeployReactiveL2ExecutorScript is Script {
    function run() public {
        // Get environment variables or use defaults
        address poolManager = vm.envOr(
            "POOL_MANAGER_ADDRESS",
            address(0x0000000000000000000000000000000000000001)
        );
        address l1Monitor = vm.envOr(
            "L1_MONITOR_ADDRESS",
            address(0x0000000000000000000000000000000000000002)
        );

        require(poolManager != address(0), "POOL_MANAGER_ADDRESS not set");
        require(l1Monitor != address(0), "L1_MONITOR_ADDRESS not set");

        vm.startBroadcast();

        address hook = vm.envOr("L2_SNIPER_HOOK_ADDRESS", address(0));
        require(hook != address(0), "L2_SNIPER_HOOK_ADDRESS not set");

        // Deploy ReactiveL2Executor
        ReactiveL2Executor executor = new ReactiveL2Executor(
            poolManager,
            l1Monitor,
            hook
        );

        vm.stopBroadcast();

        // Log deployment address
        console.log("ReactiveL2Executor deployed at:", address(executor));
        console.log("PoolManager:", poolManager);
        console.log("L1 Monitor:", l1Monitor);
    }
}
