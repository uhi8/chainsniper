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
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy ReactiveL1Monitor with funding for subscriptions
        ReactiveL1Monitor monitor = new ReactiveL1Monitor{value: 0.1 ether}();

        vm.stopBroadcast();

        // Log deployment address
        console.log("ReactiveL1Monitor deployed at:", address(monitor));
    }
}
