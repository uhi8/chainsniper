// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    AbstractReactive
} from "reactive-lib/abstract-base/AbstractReactive.sol";
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
        bool isBuy; // True if buying ETH (Input = USDC), False if selling ETH (Input = WETH)
        uint256 registeredAt;
    }

    // ============ CONSTANTS ============
    // Chainlink PriceUpdated event signature
    // event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt)
    bytes32 public constant PRICE_UPDATED_TOPIC =
        keccak256("AnswerUpdated(int256,uint256,uint256)");

    // Unichain L2 IntentCreated event signature
    bytes32 public constant INTENT_CREATED_TOPIC =
        keccak256(
            "IntentCreated(uint256,address,address,address,uint256,uint256,int24,uint256,uint16)"
        );

    // L2 (Unichain) chain ID
    uint256 public constant L2_CHAIN_ID = 1301; // Unichain Sepolia
    address public constant SNIPER_HOOK_L2 =
        0x74c6A89d15dfe86F77091ED9460786901031bB01;

    // ============ STATE VARIABLES ============
    address public owner;
    address public l2Executor; // L2 ReactiveL2Executor contract address
    uint256 public l1ChainId; // Ethereum Sepolia

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
    constructor() payable {
        owner = msg.sender;
        l1ChainId = 11155111; // Ethereum Sepolia

        // Subscribe to L2 IntentCreated events immediately
        // NOTE: Unichain Sepolia (1301) not yet supported by Reactive Mainnet.
        // Disabling direct subscription for now. Intents must be registered manually or via relayer.
        /*
        service.subscribe(
            L2_CHAIN_ID,
            SNIPER_HOOK_L2,
            uint256(INTENT_CREATED_TOPIC),
            0, // topic_1 (intentId) - subscribe to all
            0, // topic_2 (user) - subscribe to all
            0 // topic_3 (tokenIn) - subscribe to all
        );
        */
    }

    // ============ REACTIVE INTERFACE ============

    /**
     * @notice React to Chainlink price updates from the Reactive Network
     * @dev Called automatically by Reactive Network when subscribed events occur
     * @param log Contains the event data from the blockchain
     */
    function react(
        IReactive.LogRecord calldata log
    ) external override onlyReactiveNetwork {
        if (log.chain_id == L2_CHAIN_ID && log._contract == SNIPER_HOOK_L2) {
            if (bytes32(log.topic_0) == INTENT_CREATED_TOPIC) {
                _syncIntentFromL2(log);
            }
            return;
        }

        // Handle L1 Price Monitoring
        if (log.chain_id == l1ChainId && subscribedFeeds[log._contract]) {
            (int256 currentPrice, uint256 updatedAt) = _decodePriceData(
                log.data
            );
            _processIntentForPrice(log._contract, currentPrice, updatedAt);
        }
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
            isBuy: true,
            registeredAt: block.timestamp
        });

        // Subscribe to this price feed if not already subscribed
        if (!subscribedFeeds[priceFeed]) {
            _subscribeToPriceFeed(priceFeed);
        }

        emit IntentRegistered(
            intentId,
            priceFeed,
            targetPrice,
            expiry,
            targetTick
        );
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

    /**
     * @notice Manually trigger intent execution for testing/demo purposes
     * @dev Bypasses Reactive Network subscription for testnet limitations
     * @param intentId The intent ID to trigger
     * @param mockPrice The price to use for triggering (8 decimals)
     */
    function triggerIntentForTest(
        uint256 intentId,
        int256 mockPrice
    ) external onlyOwner {
        RegisteredIntent storage intent = intents[intentId];
        require(intent.intentId != 0, "Intent not registered");
        require(!intent.triggered, "Already triggered");
        require(block.timestamp <= intent.expiry, "Intent expired");

        // Price condition met! Trigger execution
        intent.triggered = true;

        // Encode callback payload for L2 execution
        bytes memory payload = abi.encode(
            intentId,
            mockPrice,
            block.timestamp,
            intent.targetTick
        );

        // Emit callback that will be picked up by L2 executor
        emit Callback(L2_CHAIN_ID, l2Executor, 100000, payload);
        emit PriceThresholdMet(intentId, mockPrice, block.timestamp);
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
            l1ChainId, // Ethereum mainnet
            priceFeed, // Chainlink aggregator address
            uint256(PRICE_UPDATED_TOPIC), // AnswerUpdated event signature
            0, // No second topic filter
            0, // No third topic filter
            0 // No fourth topic filter
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
    function _decodePriceData(
        bytes calldata data
    ) internal pure returns (int256 currentPrice, uint256 updatedAt) {
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
    function _processIntentForPrice(
        address priceFeed,
        int256 currentPrice,
        uint256 updatedAt
    ) internal {
        // Process each intent matched to this feed
        // Optimized: Only search up to 20 for the demo to avoid gas errors
        for (uint256 i = 1; i <= 20; i++) {
            RegisteredIntent storage intent = intents[i];

            if (intent.priceFeed != priceFeed) continue;
            if (intent.triggered) continue;
            if (block.timestamp > intent.expiry) continue;

            // Bidirectional Triggering Logic
            bool conditionMet = false;
            if (intent.isBuy) {
                // Buy the Dip: Trigger if Current Price <= Target Price
                // e.g. Target $2000, Current $1999 -> Trigger
                if (currentPrice <= intent.targetPrice) conditionMet = true;
            } else {
                // Sell High / Take Profit: Trigger if Current Price >= Target Price
                // e.g. Target $3000, Current $3001 -> Trigger
                if (currentPrice >= intent.targetPrice) conditionMet = true;
            }

            if (!conditionMet) continue;

            // Price condition met! Trigger execution
            intent.triggered = true;

            // Encode callback payload for L2 execution
            bytes memory payload = abi.encode(
                i, // intentId
                currentPrice, // price that triggered
                updatedAt, // timestamp
                intent.targetTick
            );

            // Emit callback that will be picked up by L2 executor
            emit Callback(L2_CHAIN_ID, l2Executor, 100000, payload);

            emit PriceThresholdMet(i, currentPrice, updatedAt);
        }
    }

    /**
     * @notice Synchronize intent from L2 event to the L1 monitor state
     * @param log The L2 log record
     */
    function _syncIntentFromL2(IReactive.LogRecord calldata log) internal {
        // event IntentCreated(uint256 indexed intentId, address indexed user, address indexed tokenIn, ...)
        uint256 intentId = uint256(log.topic_1);

        // Decode non-indexed data: address tokenOut, uint256 amountIn, uint256 targetPrice, int24 targetTick, uint256 expiry, uint16 maxSlippageBps
        (, , uint256 targetPrice, int24 targetTick, uint256 expiry, ) = abi
            .decode(
                log.data,
                (address, uint256, uint256, int24, uint256, uint16)
            );

        address tokenIn = address(uint160(uint256(log.topic_3)));

        // Determine direction:
        // Token0 = USDC (0x31d0...)
        // Token1 = WETH (0x4200...)
        // If tokenIn == USDC, we are swapping USDC -> ETH (Buying ETH)
        // If tokenIn == WETH, we are swapping ETH -> USDC (Selling ETH)

        // Address check for USDC on Unichain Sepolia
        bool isBuy = (tokenIn == 0x31d0220469e10c4E71834a79b1f276d740d3768F);

        // For hackathon: Hardcode ETH/USD feed if swapping WETH (0x4200...0006)
        address priceFeed = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

        intents[intentId] = RegisteredIntent({
            intentId: intentId,
            targetPrice: int256(targetPrice),
            expiry: expiry,
            targetTick: targetTick,
            priceFeed: priceFeed,
            triggered: false,
            isBuy: isBuy,
            registeredAt: block.timestamp
        });

        if (!subscribedFeeds[priceFeed]) {
            _subscribeToPriceFeed(priceFeed);
        }

        emit IntentRegistered(
            intentId,
            priceFeed,
            int256(targetPrice),
            expiry,
            targetTick
        );
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get intent details
     * @param intentId Intent ID
     * @return intent The intent details
     */
    function getIntent(
        uint256 intentId
    ) external view returns (RegisteredIntent memory) {
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
