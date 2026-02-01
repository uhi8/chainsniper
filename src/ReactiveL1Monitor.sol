// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AbstractReactive} from "reactive-lib/abstract-base/AbstractReactive.sol";
import {IReactive} from "reactive-lib/interfaces/IReactive.sol";

/**
 * @title ReactiveL1Monitor
 * @notice Reactive contract on L1 (Ethereum) that monitors Chainlink price feeds
 * @dev Extends AbstractReactive to integrate with Reactive Network
 *      Subscribes to Chainlink PriceUpdated events and triggers L2 execution via Reactive Network
 *      - Runs on Reactive Network (main instance)
 *      - Also deployed on ReactVM for event processing (copied automatically)
 */
contract ReactiveL1Monitor is AbstractReactive {
    // ============ ERRORS ============
    error ZeroAddress();
    error IntentNotFound();
    error InvalidChainId();
    error InvalidPriceFeed();
    error PriceConditionNotMet();

    // ============ EVENTS ============
    event IntentRegistered(
        uint256 indexed intentId,
        address indexed priceFeed,
        int256 targetPrice,
        uint256 expiry,
        int24 targetTick
    );

    event PriceThresholdMet(
        uint256 indexed intentId,
        int256 currentPrice,
        uint256 triggeredAt
    );

    event PriceFeedSubscribed(address indexed feed);
    event L2ExecutorUpdated(address indexed newExecutor);

    // ============ STRUCTS ============
    struct RegisteredIntent {
        uint256 intentId;
        int256 targetPrice;
        uint256 expiry;
        int24 targetTick;
        address priceFeed;
        bool triggered;
        uint256 registeredAt;
    }

    // ============ CONSTANTS ============
    // Chainlink PriceUpdated event signature
    // event LatestRoundData(indexed uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, indexed uint80 answeredInRound)
    // We'll subscribe to the broader Update events
    bytes32 public constant PRICE_UPDATED_TOPIC = keccak256("AnswerUpdated(int256,uint256,uint256)");

    // L2 (Optimism/Unichain) chain ID
    uint256 public constant L2_CHAIN_ID = 7777777; // Unichain mainnet or testnet

    // ============ STATE VARIABLES ============
    address public owner;
    address public l2Executor; // L2 ReactiveL2Executor contract address
    uint256 public l1ChainId; // Ethereum mainnet (1)

    mapping(uint256 => RegisteredIntent) public intents;
    mapping(address => bool) public subscribedFeeds;
    mapping(bytes32 => uint256) public feedToIntentId; // priceFeed + encoded data -> intentId

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
     * @notice Constructor sets up the reactive contract
     * @dev This is deployed on both Reactive Network and ReactVM
     *      Use vm flag to distinguish between environments
     */
    constructor() {
        owner = msg.sender;
        l1ChainId = 1; // Ethereum mainnet
    }

    // ============ REACTIVE INTERFACE ============

    /**
     * @notice React to Chainlink price updates from the Reactive Network
     * @dev Called automatically by Reactive Network when subscribed events occur
     * @param log Contains the event data from the blockchain
     */
    function react(IReactive.LogRecord calldata log) external override onlyReactiveNetwork {
        // Verify this is from a price feed we're monitoring
        require(subscribedFeeds[log._contract], "Unknown price feed");

        // Decode the price data from the log
        // Chainlink LatestRoundData structure in log.data:
        // roundId (32), answer (32), startedAt (32), updatedAt (32), answeredInRound (32)
        (int256 currentPrice, uint256 updatedAt) = _decodePriceData(log.data);

        // Find the intent this price update relates to
        bytes32 feedKey = keccak256(abi.encode(log._contract));
        // Note: In production, you'd need a more sophisticated mapping for multiple intents per feed
        // For now, we'll iterate through intents (this is simplified)
        
        // Process all intents for this price feed
        _processIntentForPrice(log._contract, currentPrice, updatedAt);
    }

    // ============ MANAGEMENT FUNCTIONS ============

    /**
     * @notice Register an intent with a target price on a specific price feed
     * @param intentId ID of the intent from L2
     * @param priceFeed Address of Chainlink price feed
     * @param targetPrice Target price that triggers execution
     * @param expiry When the intent expires
     * @param targetTick Optional target tick hint
     */
    function registerIntent(
        uint256 intentId,
        address priceFeed,
        int256 targetPrice,
        uint256 expiry,
        int24 targetTick
    ) external onlyOwner {
        require(priceFeed != address(0), "Invalid price feed");
        require(expiry > block.timestamp, "Expiry in past");
        require(targetPrice > 0, "Invalid target price");

        intents[intentId] = RegisteredIntent({
            intentId: intentId,
            targetPrice: targetPrice,
            expiry: expiry,
            targetTick: targetTick,
            priceFeed: priceFeed,
            triggered: false,
            registeredAt: block.timestamp
        });

        // Subscribe to this price feed if not already subscribed
        if (!subscribedFeeds[priceFeed]) {
            _subscribeToPriceFeed(priceFeed);
        }

        emit IntentRegistered(intentId, priceFeed, targetPrice, expiry, targetTick);
    }

    /**
     * @notice Set the L2 executor address
     * @param newExecutor Address of ReactiveL2Executor on L2
     */
    function setL2Executor(address newExecutor) external onlyOwner {
        require(newExecutor != address(0), "Zero address");
        l2Executor = newExecutor;
        emit L2ExecutorUpdated(newExecutor);
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
     * @notice Subscribe to price feed events via Reactive Network
     * @param priceFeed Address of the Chainlink price feed
     */
    function _subscribeToPriceFeed(address priceFeed) internal {
        // Subscribe to AnswerUpdated events from Chainlink aggregator
        // This tells the Reactive Network to watch this contract for the PriceUpdated event
        service.subscribe(
            l1ChainId,                      // Ethereum mainnet
            priceFeed,                      // Chainlink aggregator address
            uint256(PRICE_UPDATED_TOPIC),   // AnswerUpdated event signature
            0,                              // No second topic filter
            0,                              // No third topic filter
            0                               // No fourth topic filter
        );

        subscribedFeeds[priceFeed] = true;
        emit PriceFeedSubscribed(priceFeed);
    }

    /**
     * @notice Decode Chainlink price data from log
     * @param data Raw event data containing price information
     * @return currentPrice The decoded price
     * @return updatedAt The timestamp of the price
     */
    function _decodePriceData(bytes calldata data)
        internal
        pure
        returns (int256 currentPrice, uint256 updatedAt)
    {
        // Decode AnswerUpdated(int256 current, uint256 roundId, uint256 updatedAt)
        // In Solidity logs, indexed parameters are in topics, non-indexed in data
        require(data.length >= 64, "Invalid data length");

        currentPrice = int256(uint256(bytes32(data[0:32])));
        updatedAt = uint256(bytes32(data[32:64]));
    }

    /**
     * @notice Process all intents that may be triggered by a price update
     * @param priceFeed The price feed that was updated
     * @param currentPrice The new price
     * @param updatedAt Timestamp of the price
     */
    function _processIntentForPrice(address priceFeed, int256 currentPrice, uint256 updatedAt) internal {
        // In production, you'd have a mapping of feed -> intentIds to check
        // For this example, we iterate through recent intents
        // This is inefficient and should be optimized with proper indexing

        // Check each intent's price feed
        for (uint256 i = 1; i < 1000; i++) { // Simplified loop - in production use proper enumeration
            RegisteredIntent storage intent = intents[i];
            
            if (intent.priceFeed != priceFeed) continue;
            if (intent.triggered) continue;
            if (block.timestamp > intent.expiry) continue;
            if (currentPrice < intent.targetPrice) continue;

            // Price condition met! Trigger execution
            intent.triggered = true;

            // Encode callback payload for L2 execution
            bytes memory payload = abi.encode(
                i,              // intentId
                currentPrice,   // price that triggered
                updatedAt,      // timestamp
                intent.targetTick
            );

            // Emit callback that will be picked up by L2 executor
            emit Callback(L2_CHAIN_ID, l2Executor, 100000, payload);

            emit PriceThresholdMet(i, currentPrice, updatedAt);
        }
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get intent details
     * @param intentId Intent ID
     * @return intent The intent details
     */
    function getIntent(uint256 intentId) external view returns (RegisteredIntent memory) {
        return intents[intentId];
    }

    /**
     * @notice Check if a feed is subscribed
     * @param priceFeed Feed address
     * @return true if subscribed
     */
    function isFeedSubscribed(address priceFeed) external view returns (bool) {
        return subscribedFeeds[priceFeed];
    }
}
