// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {ReactiveL1Monitor} from "../src/ReactiveL1Monitor.sol";

/**
 * @title DeployReactiveL1MonitorScript
 * @notice Deploy ReactiveL1Monitor to Reactive Network (L1)
 * @dev Run: forge script script/DeployReactiveL1Monitor.s.sol --rpc-url $REACTIVE_RPC_URL --broadcast
 */
contract DeployReactiveL1MonitorScript is Script {
    function run() public {
        vm.startBroadcast();
        
        // Deploy ReactiveL1Monitor
        ReactiveL1Monitor monitor = new ReactiveL1Monitor();
        
        vm.stopBroadcast();
        
        // Log deployment address
        console.log("ReactiveL1Monitor deployed at:", address(monitor));
    }
}
