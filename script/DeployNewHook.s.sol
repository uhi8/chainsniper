// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {UnichainSniperHook} from "../src/UnichainSniperHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

contract DeployNewHook is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        IPoolManager poolManager = IPoolManager(
            0xC81462Fec8B23319F288047f8A03A57682a35C1A
        );
        address owner = 0xd2df53D9791e98Db221842Dd085F4144014BBE2a;
        uint256 minAmount = 1000000; // 1 USDC (6 decimals)

        vm.startBroadcast(deployerPrivateKey);

        UnichainSniperHook hook = new UnichainSniperHook(
            poolManager,
            0x31d0220469e10c4E71834a79b1f276d740d3768F, // TOKEN0 (USDC) - checksummed
            0x4200000000000000000000000000000000000006, // TOKEN1 (WETH)
            3000, // poolFee
            60, // tickSpacing
            minAmount, // minAmountIn
            3600 // maxStaleness (1 hour)
        );

        console.log("New SniperHook deployed to:", address(hook));
        console.log("Minimum amount set to:", minAmount, "(1 USDC)");

        vm.stopBroadcast();
    }
}
