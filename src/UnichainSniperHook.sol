// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "./interfaces/IERC20.sol";
import {SniperTypes} from "./libraries/SniperTypes.sol";

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {CurrencyLibrary, Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";

contract UnichainSniperHook is BaseHook, IUnlockCallback {
    using PoolIdLibrary for PoolKey;
    using SniperTypes for int24;
    using CurrencyLibrary for Currency;

    struct Bucket {
        uint256 totalAmountIn;
        uint256[] intentIds;
    }

    struct UnlockIntentPayload {
        uint256 intentId;
        address beneficiary;
        uint256 amountIn;
        bool zeroForOne;
        uint160 sqrtPriceLimitX96;
    }

    enum CallbackAction {
        FulfillIntent
    }

    error ZeroAddress();
    error InvalidAmount();
    error InvalidExpiry();
    error SlippageTooHigh();
    error UnknownIntent();
    error IntentInactive();
    error NotIntentOwner();
    error NotAuthorized();
    error IntentNotExpired();
    error StaleOracleData();
    error PriceConditionNotMet();
    error NotReactiveCaller();
    error TransferFailed(address token);
    error UnsupportedPair();
    error UnknownCallbackAction();

    event IntentCreated(
        uint256 indexed intentId,
        address indexed user,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        int24 targetTick,
        uint256 expiry,
        uint16 maxSlippageBps
    );

    event IntentCancelled(uint256 indexed intentId, address indexed user, address recipient);
    event IntentRefunded(uint256 indexed intentId, address indexed caller, address recipient);
    event IntentExecuted(
        uint256 indexed intentId, address indexed beneficiary, uint256 oraclePrice, uint256 answeredAt, bool fastPath
    );

    event MinAmountUpdated(uint256 newMinAmount);
    event MaxStalenessUpdated(uint256 newMaxStaleness);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    uint256 public constant MAX_BPS = SniperTypes.MAX_BPS;

    IERC20 public immutable token0;
    IERC20 public immutable token1;
    PoolKey public poolKeyConfig;
    PoolId public immutable poolId;

    address public owner;
    uint256 public nextIntentId = 1;
    uint256 public minAmountIn;
    uint256 public maxStaleness;
    int24 public immutable tickSpacing;

    mapping(uint256 => SniperTypes.Intent) private intents;
    mapping(uint256 => int24) private intentBucket;
    mapping(uint256 => uint256) private bucketIndex; // slot position + 1
    mapping(uint256 => uint256) public bucketShare;
    mapping(address => uint256) public userNonce;
    mapping(int24 => Bucket) private buckets;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    constructor(
        IPoolManager poolManager_,
        address token0_,
        address token1_,
        uint24 poolFee_,
        int24 poolTickSpacing_,
        uint256 minAmountIn_,
        uint256 maxStaleness_
    ) BaseHook(poolManager_) {
        if (address(poolManager_) == address(0)) revert ZeroAddress();
        if (token0_ == address(0) || token1_ == address(0)) revert ZeroAddress();
        if (token0_ >= token1_) revert UnsupportedPair();

        token0 = IERC20(token0_);
        token1 = IERC20(token1_);
        poolKeyConfig = PoolKey({
            currency0: Currency.wrap(token0_),
            currency1: Currency.wrap(token1_),
            fee: poolFee_,
            tickSpacing: poolTickSpacing_,
            hooks: IHooks(address(this))
        });
        poolId = poolKeyConfig.toId();
        tickSpacing = poolTickSpacing_;

        owner = msg.sender;
        minAmountIn = minAmountIn_;
        maxStaleness = maxStaleness_;

        emit OwnershipTransferred(address(0), msg.sender);
        emit MinAmountUpdated(minAmountIn_);
        emit MaxStalenessUpdated(maxStaleness_);
    }

    function createIntent(SniperTypes.CreateIntentParams calldata params) external returns (uint256 intentId) {
        if (params.tokenIn == address(0) || params.tokenOut == address(0)) revert ZeroAddress();
        if (params.tokenIn == params.tokenOut) revert InvalidAmount();
        if (params.amountIn < minAmountIn) revert InvalidAmount();
        if (params.expiry <= block.timestamp) revert InvalidExpiry();
        if (params.maxSlippageBps > MAX_BPS) revert SlippageTooHigh();

        intentId = nextIntentId++;
        SniperTypes.Intent storage intent = intents[intentId];

        intent.user = msg.sender;
        _assertValidPair(params.tokenIn, params.tokenOut);
        intent.tokenIn = params.tokenIn;
        intent.tokenOut = params.tokenOut;
        intent.amountIn = params.amountIn;
        intent.targetPrice = params.targetPrice;
        intent.maxSlippageBps = params.maxSlippageBps;
        intent.expiry = params.expiry;
        intent.nonce = ++userNonce[msg.sender];
        intent.createdAt = uint64(block.timestamp);

        int24 bucketTick = params.targetTickHint != 0
            ? SniperTypes.snapToSpacing(params.targetTickHint, tickSpacing)
            : SniperTypes.bucketForPrice(params.targetPrice, tickSpacing);
        intent.targetTick = bucketTick;

        _pullToken(intent.tokenIn, msg.sender, intent.amountIn);
        _addToBucket(intentId, bucketTick, intent.amountIn);

        emit IntentCreated(
            intentId,
            intent.user,
            intent.tokenIn,
            intent.tokenOut,
            intent.amountIn,
            intent.targetPrice,
            intent.targetTick,
            intent.expiry,
            intent.maxSlippageBps
        );
    }

    function cancelIntent(uint256 intentId, address recipient) external {
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.user == address(0)) revert UnknownIntent();
        if (intent.user != msg.sender) revert NotIntentOwner();
        _setCancelled(intent);
        _removeFromBucket(intentId);
        address target = recipient == address(0) ? intent.user : recipient;
        _releaseToken(intent.tokenIn, target, intent.amountIn);
        emit IntentCancelled(intentId, msg.sender, target);
    }

    function refundIntent(uint256 intentId, address recipient) external {
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.user == address(0)) revert UnknownIntent();
        if (intent.executed || intent.cancelled) revert IntentInactive();
        if (block.timestamp < intent.expiry) revert IntentNotExpired();
        intent.cancelled = true;
        _removeFromBucket(intentId);
        address target = recipient == address(0) ? intent.user : recipient;
        _releaseToken(intent.tokenIn, target, intent.amountIn);
        emit IntentRefunded(intentId, msg.sender, target);
    }

    function executeIntent(
        uint256 intentId,
        uint256 oraclePrice,
        uint256 answeredAt,
        address beneficiary,
        bool fastPath
    ) external onlyOwner {
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.user == address(0)) revert UnknownIntent();
        if (intent.executed || intent.cancelled) revert IntentInactive();
        if (intent.expiry <= block.timestamp) revert IntentNotExpired();
        if (answeredAt + maxStaleness < block.timestamp) revert StaleOracleData();
        if (oraclePrice < intent.targetPrice) revert PriceConditionNotMet();

        intent.executed = true;
        _removeFromBucket(intentId);
        address target = beneficiary == address(0) ? intent.user : beneficiary;

        bool zeroForOne = intent.tokenIn == address(token0);
        uint160 sqrtPriceLimitX96 = zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1;
        
        poolManager.unlock(
            abi.encode(CallbackAction.FulfillIntent, abi.encode(
                UnlockIntentPayload(intentId, target, intent.amountIn, zeroForOne, sqrtPriceLimitX96)
            ))
        );

        emit IntentExecuted(intentId, target, oraclePrice, answeredAt, fastPath);
    }

    function tryFastExecute(uint256 intentId, uint256 twapPrice, address beneficiary) external {
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.user == address(0)) revert UnknownIntent();
        if (intent.executed || intent.cancelled) revert IntentInactive();
        if (intent.expiry <= block.timestamp) revert IntentNotExpired();
        if (twapPrice < intent.targetPrice) revert PriceConditionNotMet();
        if (msg.sender != intent.user && msg.sender != owner) revert NotAuthorized();

        intent.executed = true;
        _removeFromBucket(intentId);
        address target = beneficiary == address(0) ? intent.user : beneficiary;
        
        bool zeroForOne = intent.tokenIn == address(token0);
        uint160 sqrtPriceLimitX96 = zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1;
        
        poolManager.unlock(
            abi.encode(CallbackAction.FulfillIntent, abi.encode(
                UnlockIntentPayload(intentId, target, intent.amountIn, zeroForOne, sqrtPriceLimitX96)
            ))
        );

        emit IntentExecuted(intentId, target, twapPrice, block.timestamp, true);
    }

    /**
     * @notice Enhanced execution handler for L1 automation triggers
     * @param intentId The intent to execute
     * @param oraclePrice Price from L1 Chainlink feed
     * @param triggeredAt Timestamp when L1 automation triggered
     * @param beneficiary Optional beneficiary override
     */
    function executeIntentFromL1(
        uint256 intentId,
        int256 oraclePrice,
        uint256 triggeredAt,
        address beneficiary
    ) external onlyOwner {
        // Validate L1 trigger is recent (within staleness window)
        if (block.timestamp - triggeredAt > maxStaleness) revert InvalidExpiry();
        
        // Execute the intent with L1 automation data
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.cancelled || intent.executed) revert IntentInactive();
        if (intent.expiry <= block.timestamp) revert InvalidExpiry();

        intent.executed = true;

        address finalBeneficiary = beneficiary == address(0) ? intent.user : beneficiary;
        bool zeroForOne = intent.tokenIn == address(token0);
        
        // Use simple price limits like other executeIntent functions
        uint160 sqrtPriceLimitX96 = zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1;

        bytes memory unlockData = abi.encode(
            UnlockIntentPayload({
                intentId: intentId,
                beneficiary: finalBeneficiary,
                amountIn: intent.amountIn,
                zeroForOne: zeroForOne,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            })
        );

        poolManager.unlock(unlockData);
        
        emit IntentExecuted(intentId, finalBeneficiary, uint256(oraclePrice), triggeredAt, false);
    }

    function unlockCallback(bytes calldata data) external override onlyPoolManager returns (bytes memory) {
        (CallbackAction action, bytes memory payload) = abi.decode(data, (CallbackAction, bytes));

        if (action == CallbackAction.FulfillIntent) {
            UnlockIntentPayload memory ctx = abi.decode(payload, (UnlockIntentPayload));
            _completeExecution(ctx.intentId, ctx.beneficiary, ctx.amountIn, ctx.zeroForOne, ctx.sqrtPriceLimitX96);
            return bytes("");
        }

        revert UnknownCallbackAction();
    }

    function setMinAmountIn(uint256 newMin) external onlyOwner {
        minAmountIn = newMin;
        emit MinAmountUpdated(newMin);
    }

    function setMaxStaleness(uint256 newMax) external onlyOwner {
        maxStaleness = newMax;
        emit MaxStalenessUpdated(newMax);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address previous = owner;
        owner = newOwner;
        emit OwnershipTransferred(previous, newOwner);
    }

    function getIntent(uint256 intentId) external view returns (SniperTypes.Intent memory) {
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.user == address(0)) revert UnknownIntent();
        return intent;
    }

    function bucketSummary(int24 tick) external view returns (SniperTypes.BucketSnapshot memory snapshot) {
        Bucket storage bucket = buckets[tick];
        snapshot = SniperTypes.BucketSnapshot({
            tick: tick, totalAmountIn: bucket.totalAmountIn, activeIntentCount: bucket.intentIds.length
        });
    }

    function bucketIntentIds(int24 tick) external view returns (uint256[] memory ids) {
        Bucket storage bucket = buckets[tick];
        ids = new uint256[](bucket.intentIds.length);
        for (uint256 i = 0; i < bucket.intentIds.length; i++) {
            ids[i] = bucket.intentIds[i];
        }
    }

    function _addToBucket(uint256 intentId, int24 tick, uint256 amount) internal {
        Bucket storage bucket = buckets[tick];
        bucket.totalAmountIn += amount;
        bucket.intentIds.push(intentId);
        bucketIndex[intentId] = bucket.intentIds.length;
        intentBucket[intentId] = tick;
        bucketShare[intentId] = amount;
    }

    function _removeFromBucket(uint256 intentId) internal {
        uint256 indexPlusOne = bucketIndex[intentId];
        if (indexPlusOne == 0) return;
        uint256 index = indexPlusOne - 1;
        int24 tick = intentBucket[intentId];
        Bucket storage bucket = buckets[tick];
        uint256 lastIndex = bucket.intentIds.length - 1;
        if (index != lastIndex) {
            uint256 swappedIntentId = bucket.intentIds[lastIndex];
            bucket.intentIds[index] = swappedIntentId;
            bucketIndex[swappedIntentId] = index + 1;
        }
        bucket.intentIds.pop();
        bucket.totalAmountIn =
            bucket.totalAmountIn > bucketShare[intentId] ? bucket.totalAmountIn - bucketShare[intentId] : 0;
        bucketIndex[intentId] = 0;
        bucketShare[intentId] = 0;
        intentBucket[intentId] = 0;
    }

    function _setCancelled(SniperTypes.Intent storage intent) internal {
        if (intent.executed || intent.cancelled) revert IntentInactive();
        intent.cancelled = true;
    }

    function _completeExecution(
        uint256 intentId,
        address beneficiary,
        uint256 amountIn,
        bool zeroForOne,
        uint160 sqrtPriceLimitX96
    ) internal {
        SniperTypes.Intent storage intent = intents[intentId];
        if (!intent.executed || intent.cancelled) revert IntentInactive();
        
        // Get currency addresses
        Currency inputCurrency = zeroForOne ? poolKeyConfig.currency0 : poolKeyConfig.currency1;
        Currency outputCurrency = zeroForOne ? poolKeyConfig.currency1 : poolKeyConfig.currency0;
        address inputToken = Currency.unwrap(inputCurrency);
        
        // Transfer the escrowed tokens to the pool manager first
        IERC20(inputToken).transfer(address(poolManager), amountIn);
        
        // Prepare swap parameters for exact input swap
        SwapParams memory swapParams = SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(amountIn), // Negative for exact input
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });
        
        // Perform the swap
        BalanceDelta swapDelta = poolManager.swap(poolKeyConfig, swapParams, "");
        
        // Calculate output amount from the swap delta
        uint256 outputAmount;
        if (zeroForOne) {
            outputAmount = uint256(uint128(swapDelta.amount1()));
        } else {
            outputAmount = uint256(uint128(swapDelta.amount0()));
        }
        
        // Use the PoolManager's take function to get the output tokens to the beneficiary
        if (outputAmount > 0) {
            poolManager.take(outputCurrency, beneficiary, outputAmount);
        }
    }

    function _assertValidPair(address tokenIn, address tokenOut) internal view {
        bool forward = tokenIn == address(token0) && tokenOut == address(token1);
        bool reverse = tokenIn == address(token1) && tokenOut == address(token0);
        if (!forward && !reverse) revert UnsupportedPair();
    }

    function _pullToken(address token, address from, uint256 value) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, address(this), value));
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed(token);
    }

    function _releaseToken(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) revert TransferFailed(token);
    }

    // ---------------------------------------------------------------------
    // Hook plumbing (stubs until swap logic is wired in a future iteration)
    // ---------------------------------------------------------------------

    function getHookPermissions() public pure override returns (Hooks.Permissions memory permissions) {
        permissions.beforeSwap = true;
        permissions.afterSwap = true;
    }

    function validateHookAddress(BaseHook) internal pure override {
        // TODO: enforce hook address bits once the CREATE2 deployer is wired in.
    }

    function _beforeSwap(address, PoolKey calldata, SwapParams calldata, bytes calldata)
        internal
        pure
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(address, PoolKey calldata, SwapParams calldata, BalanceDelta, bytes calldata)
        internal
        pure
        override
        returns (bytes4, int128)
    {
        return (IHooks.afterSwap.selector, 0);
    }
}
