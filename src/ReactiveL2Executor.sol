// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AbstractReactive} from "reactive-lib/abstract-base/AbstractReactive.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";
import {IPoolManagerLike} from "./interfaces/IPoolManagerLike.sol";

/**
 * @title ReactiveL2Executor
 * @notice L2 (Unichain) reactive contract that executes swaps based on price conditions from L1
 * @dev Extends AbstractReactive to integrate with Reactive Network
 *      Receives price update callbacks from L1 via Reactive Network and executes swaps
 *      - Main instance runs on Reactive Network (receives callbacks)
 *      - ReactVM copy processes events (auto-deployed by Reactive Network)
 */
contract ReactiveL2Executor is AbstractReactive {
    // ============ ERRORS ============
    error ZeroAddress();
    error IntentNotFound();
    error IntentAlreadyExecuted();
    error InvalidPriceFeed();
    error InsufficientFunds();
    error SwapFailed();
    error NotL1Monitor();

    // ============ EVENTS ============
    event IntentExecuted(
        uint256 indexed intentId,
        address indexed user,
        int256 price,
        uint256 amountOut
    );

    event L1MonitorUpdated(address indexed newMonitor);
    event SwapExecuted(uint256 indexed intentId, uint256 amountIn, uint256 amountOut);

    // ============ STRUCTS ============
    struct StoredIntent {
        uint256 intentId;
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        int24 targetTick;
        bool executed;
        uint256 createdAt;
    }

    // ============ STATE VARIABLES ============
    address public owner;
    address public l1Monitor; // L1 ReactiveL1Monitor contract address
    uint256 public l1ChainId; // Ethereum mainnet (1)
    IPoolManagerLike public poolManager;

    mapping(uint256 => StoredIntent) public intents;
    mapping(uint256 => bool) public executedIntents;

    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyReactiveNetwork() {
        // This ensures we're running on Reactive Network (not ReactVM)
        require(!vm, "Only on Reactive Network");
        _;
    }

    // ============ CONSTRUCTOR ============
    /**
     * @notice Constructor initializes the L2 executor
     * @param poolManager_ Address of Unichain PoolManager
     * @param l1Monitor_ Address of L1 ReactiveL1Monitor
     */
    constructor(address poolManager_, address l1Monitor_) {
        require(poolManager_ != address(0), "Invalid pool manager");
        require(l1Monitor_ != address(0), "Invalid L1 monitor");

        owner = msg.sender;
        poolManager = IPoolManagerLike(poolManager_);
        l1Monitor = l1Monitor_;
        l1ChainId = 1; // Ethereum mainnet
    }

    // ============ REACTIVE INTERFACE ============

    /**
     * @notice React to price updates from L1 via Reactive Network
     * @dev Called by Reactive Network when L1 price condition is met
     *      Executes the swap on L2 with the updated price information
     * @param log Contains callback data from L1 monitor
     */
    function react(IReactive.LogRecord calldata log) external override onlyReactiveNetwork {
        // Verify this callback is from the L1 monitor
        require(log._contract == l1Monitor, "Invalid source");
        require(log.chain_id == l1ChainId, "Invalid chain");

        // Decode the callback payload
        (uint256 intentId, int256 currentPrice, uint256 updatedAt, int24 targetTick) = _decodeCallbackData(
            log.data
        );

        // Execute the swap
        _executeSwap(intentId, currentPrice, updatedAt, targetTick);
    }

    // ============ MANAGEMENT FUNCTIONS ============

    /**
     * @notice Store an intent locally for later execution
     * @param intentId Intent ID
     * @param user Original user
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Amount to swap
     * @param targetTick Target tick
     */
    function storeIntent(
        uint256 intentId,
        address user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        int24 targetTick
    ) external onlyOwner {
        require(user != address(0), "Zero user");
        require(tokenIn != address(0), "Zero token in");
        require(tokenOut != address(0), "Zero token out");
        require(amountIn > 0, "Zero amount");

        intents[intentId] = StoredIntent({
            intentId: intentId,
            user: user,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            targetTick: targetTick,
            executed: false,
            createdAt: block.timestamp
        });
    }

    /**
     * @notice Set the L1 monitor address
     * @param newMonitor Address of ReactiveL1Monitor on L1
     */
    function setL1Monitor(address newMonitor) external onlyOwner {
        require(newMonitor != address(0), "Zero address");
        l1Monitor = newMonitor;
        emit L1MonitorUpdated(newMonitor);
    }

    /**
     * @notice Update pool manager address
     * @param newPoolManager New pool manager address
     */
    function setPoolManager(address newPoolManager) external onlyOwner {
        require(newPoolManager != address(0), "Zero address");
        poolManager = IPoolManagerLike(newPoolManager);
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @notice Decode callback data from L1
     * @param data Encoded callback data
     * @return intentId The intent to execute
     * @return currentPrice Current price that triggered execution
     * @return updatedAt Timestamp of price update
     * @return targetTick Target tick for the swap
     */
    function _decodeCallbackData(bytes calldata data)
        internal
        pure
        returns (uint256 intentId, int256 currentPrice, uint256 updatedAt, int24 targetTick)
    {
        require(data.length >= 128, "Invalid callback data");

        intentId = uint256(bytes32(data[0:32]));
        currentPrice = int256(uint256(bytes32(data[32:64])));
        updatedAt = uint256(bytes32(data[64:96]));
        // Convert bytes to int24 via uint24
        targetTick = int24(uint24(uint256(bytes32(data[96:128]))));
    }

    /**
     * @notice Execute the swap based on price update
     * @param intentId The intent to execute
     * @param currentPrice Price from L1
     * @param updatedAt Timestamp of price
     * @param targetTick Target tick
     */
    function _executeSwap(uint256 intentId, int256 currentPrice, uint256 updatedAt, int24 targetTick) internal {
        StoredIntent storage intent = intents[intentId];
        require(intent.user != address(0), "Intent not found");
        require(!intent.executed, "Already executed");

        // Mark as executed
        intent.executed = true;
        executedIntents[intentId] = true;

        // In a real implementation, you would:
        // 1. Verify sufficient token balance
        // 2. Execute swap through Unichain PoolManager
        // 3. Send output tokens to beneficiary

        // For now, emit the event indicating execution
        emit IntentExecuted(intentId, intent.user, currentPrice, 0);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get intent details
     * @param intentId Intent ID
     * @return intent The stored intent
     */
    function getIntent(uint256 intentId) external view returns (StoredIntent memory) {
        return intents[intentId];
    }

    /**
     * @notice Check if intent has been executed
     * @param intentId Intent ID
     * @return true if executed
     */
    function isIntentExecuted(uint256 intentId) external view returns (bool) {
        return executedIntents[intentId];
    }
}
