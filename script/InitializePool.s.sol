// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract InitializePool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        IPoolManager poolManager = IPoolManager(0x00B036B58a818B1BC34d502D3fE730Db729e62AC);
        address lpRouterAddr = vm.envAddress("LP_ROUTER");
        
        address hook = 0xA41401Da5A0DC595e957CD974Eab559FbE8159c9;
        address token0 = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
        address token1 = 0x4200000000000000000000000000000000000006;
        
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(hook)
        });

        vm.startBroadcast(deployerPrivateKey);

        uint160 sqrtPriceX96 = 3681498305602927814400000; 
        try poolManager.initialize(key, sqrtPriceX96) returns (int24 tick) {
            console.log("Pool initialized at tick:", tick);
        } catch {
            console.log("Pool already initialized.");
        }

        IERC20(token0).approve(lpRouterAddr, 1000 * 1e6);
        IERC20(token1).approve(lpRouterAddr, 100 ether);

        (bool success, ) = lpRouterAddr.call(
            abi.encodeWithSignature(
                "modifyLiquidity((address,address,uint24,int24,address),(int24,int24,int256,bytes32),bytes)",
                key,
                int24(-60000), int24(60000), int256(10_000_000e18), bytes32(0),
                new bytes(0)
            )
        );
        require(success, "modifyLiquidity failed");

        console.log("Liquidity added!");
        vm.stopBroadcast();
    }
}
