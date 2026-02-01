// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {UnichainSniperHook} from "../src/UnichainSniperHook.sol";
import {SniperTypes} from "../src/libraries/SniperTypes.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {BalanceDelta, toBalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

contract UnichainSniperHookTest is Test {
    UnichainSniperHook internal hook;
    MockERC20 internal tokenIn;
    MockERC20 internal tokenOut;
    MockPoolManager internal poolManager;

    function setUp() public {
        poolManager = new MockPoolManager();
        tokenIn = new MockERC20("TokenIn", "TIN", 18);
        tokenOut = new MockERC20("TokenOut", "TOUT", 18);
        hook = new UnichainSniperHook(
            IPoolManager(address(poolManager)),
            address(tokenIn),
            address(tokenOut),
            3000,
            60,
            1e15,
            1800
        );
        
        // Set up user tokens
        tokenIn.mint(address(this), 1_000 ether);
        tokenIn.approve(address(hook), type(uint256).max);
        
        // Fund the MockPoolManager with tokenOut so it can perform swaps
        tokenOut.mint(address(poolManager), 10_000 ether);
        tokenIn.approve(address(poolManager), type(uint256).max);
    }

    function testCreateIntentTracksState() public {
        SniperTypes.CreateIntentParams memory params = createDefaultParams();
        uint256 id = hook.createIntent(params);

        SniperTypes.Intent memory stored = hook.getIntent(id);
        assertEq(stored.user, address(this));
        assertEq(stored.amountIn, params.amountIn);
        assertEq(stored.targetPrice, params.targetPrice);
        assertEq(tokenIn.balanceOf(address(hook)), params.amountIn);

        SniperTypes.BucketSnapshot memory snapshot = hook.bucketSummary(stored.targetTick);
        assertEq(snapshot.totalAmountIn, params.amountIn);
        assertEq(snapshot.activeIntentCount, 1);
    }

    function testCancelIntentReturnsFunds() public {
        SniperTypes.CreateIntentParams memory params = createDefaultParams();
        uint256 id = hook.createIntent(params);
        uint256 balanceBefore = tokenIn.balanceOf(address(this));

        hook.cancelIntent(id, address(0));

        assertEq(tokenIn.balanceOf(address(this)), balanceBefore + params.amountIn);
        vm.expectRevert(UnichainSniperHook.IntentInactive.selector);
        hook.refundIntent(id, address(0));
    }

    function testRefundIntentAfterExpiry() public {
        address alice = makeAddr("alice");
        tokenIn.mint(alice, 5 ether);
        vm.prank(alice);
        tokenIn.approve(address(hook), type(uint256).max);

        SniperTypes.CreateIntentParams memory params = createDefaultParams();
        params.amountIn = 2 ether;
        params.expiry = block.timestamp + 1 hours;

        vm.prank(alice);
        uint256 id = hook.createIntent(params);

        vm.warp(block.timestamp + 2 hours);
        address caller = makeAddr("refunder");
        vm.prank(caller);
        hook.refundIntent(id, address(0));

        assertEq(tokenIn.balanceOf(alice), 5 ether);
    }

    function testExecuteIntentRoutesThroughPoolManagerUnlock() public {
        SniperTypes.CreateIntentParams memory params = createDefaultParams();
        uint256 id = hook.createIntent(params);

        uint256 tokenInBalanceAfterCreate = tokenIn.balanceOf(address(this));
        uint256 initialTokenOutBalance = tokenOut.balanceOf(address(this));

        vm.prank(address(this));
        hook.executeIntent(id, params.targetPrice + 1, block.timestamp, address(0), false);

        // After swap execution: 
        // - tokenIn balance should remain the same (escrowed amount was already deducted during createIntent)
        // - tokenOut balance should increase (received from swap)
        assertEq(tokenIn.balanceOf(address(this)), tokenInBalanceAfterCreate);
        assertGt(tokenOut.balanceOf(address(this)), initialTokenOutBalance);
    }

    function createDefaultParams() internal view returns (SniperTypes.CreateIntentParams memory params) {
        params = SniperTypes.CreateIntentParams({
            tokenIn: address(tokenIn),
            tokenOut: address(tokenOut),
            amountIn: 1 ether,
            targetPrice: 1_500e8,
            maxSlippageBps: 500,
            expiry: block.timestamp + 1 days,
            targetTickHint: 0
        });
    }
}

contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public immutable decimals;

    uint256 public override totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) {
        name = name_;
        symbol = symbol_;
        decimals = decimals_;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= amount, "ALLOWANCE");
        _allowances[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public {
        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(_balances[from] >= amount, "BALANCE");
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract MockPoolManager {
    bytes public lastUnlockData;
    mapping(address => uint256) public balances;
    
    // Map to track token balances in the pool manager
    mapping(address => uint256) public tokenBalances;

    function unlock(bytes calldata data) external returns (bytes memory) {
        lastUnlockData = data;
        return IUnlockCallback(msg.sender).unlockCallback(data);
    }

    function swap(PoolKey memory key, SwapParams memory params, bytes calldata) 
        external returns (BalanceDelta) {
        // Mock swap: assume 1:1 swap for simplicity in tests
        int128 amountIn = int128(uint128(uint256(-params.amountSpecified)));
        int128 amountOut = amountIn; // 1:1 swap rate
        
        // Get the token addresses
        address token0 = Currency.unwrap(key.currency0);
        address token1 = Currency.unwrap(key.currency1);
        
        if (params.zeroForOne) {
            // Swapping token0 -> token1
            // Note: Hook has already transferred token0 to us
            // Track that we owe token1 to the hook
            tokenBalances[token1] += uint256(uint128(amountOut));
            return toBalanceDelta(-amountIn, amountOut);
        } else {
            // Swapping token1 -> token0  
            // Note: Hook has already transferred token1 to us
            tokenBalances[token0] += uint256(uint128(amountOut));
            return toBalanceDelta(amountOut, -amountIn);
        }
    }

    function sync(Currency) external pure {}

    function settle() external payable returns (uint256) {
        return msg.value;
    }

    function take(Currency currency, address to, uint256 amount) external {
        address tokenAddr = Currency.unwrap(currency);
        require(tokenBalances[tokenAddr] >= amount, "Insufficient balance to take");
        
        // Transfer the token to the recipient
        IERC20(tokenAddr).transfer(to, amount);
        tokenBalances[tokenAddr] -= amount;
    }
}
