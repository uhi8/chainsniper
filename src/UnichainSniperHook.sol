// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SniperTypes} from "./libraries/SniperTypes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UnichainSniperHook (Mock Mode)
 * @notice Simplified version of the Sniper Hook for the demo to bypass Uniswap V4 address/liquidity hurdles.
 *         It fulfills intents by transferring pre-funded tokens directly to the beneficiary.
 */
contract UnichainSniperHook is Ownable {
    mapping(uint256 => SniperTypes.Intent) public intents;
    uint256 public nextIntentId = 1;

    address public immutable token0;
    address public immutable token1;
    uint256 public minAmountIn;
    uint256 public maxStaleness;
    address public reactiveExecutor;

    error ZeroAddress();
    error InvalidAmount();
    error InvalidExpiry();
    error UnknownIntent();
    error IntentInactive();
    error NotReactiveCaller();
    error TransferFailed(address token);
    error PriceConditionNotMet();
    error NotAuthorized();

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

    event IntentExecuted(
        uint256 indexed intentId,
        address indexed beneficiary,
        uint256 oraclePrice,
        uint256 answeredAt,
        bool fastPath
    );

    event IntentCancelled(uint256 indexed intentId, address indexed user, address recipient);

    event MinAmountUpdated(uint256 newMinAmount);
    event MaxStalenessUpdated(uint256 newMaxStaleness);
    event ReactiveExecutorUpdated(address newExecutor);

    constructor(
        address, // ignored
        address _token0,
        address _token1,
        uint24, // ignored
        int24, // ignored
        uint256 _minAmountIn,
        uint256 _maxStaleness
    ) Ownable(msg.sender) {
        token0 = _token0;
        token1 = _token1;
        minAmountIn = _minAmountIn;
        maxStaleness = _maxStaleness;
    }

    function setReactiveExecutor(address _executor) external onlyOwner {
        reactiveExecutor = _executor;
        emit ReactiveExecutorUpdated(_executor);
    }

    function setMinAmountIn(uint256 _minAmountIn) external onlyOwner {
        minAmountIn = _minAmountIn;
        emit MinAmountUpdated(_minAmountIn);
    }

    function setMaxStaleness(uint256 _maxStaleness) external onlyOwner {
        maxStaleness = _maxStaleness;
        emit MaxStalenessUpdated(_maxStaleness);
    }

    function createIntent(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 targetPrice,
        uint256 expiry,
        uint16 maxSlippageBps,
        int24 targetTickHint
    ) external returns (uint256 intentId) {
        if (amountIn < minAmountIn) revert InvalidAmount();
        if (expiry <= block.timestamp) revert InvalidExpiry();

        intentId = nextIntentId++;
        
        intents[intentId] = SniperTypes.Intent({
            user: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            targetPrice: targetPrice,
            maxSlippageBps: maxSlippageBps,
            expiry: expiry,
            nonce: 0,
            executed: false,
            cancelled: false,
            targetTick: targetTickHint,
            createdAt: uint64(block.timestamp)
        });

        if (!IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn))
            revert TransferFailed(tokenIn);

        emit IntentCreated(
            intentId,
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            targetPrice,
            targetTickHint,
            expiry,
            maxSlippageBps
        );
    }

    function cancelIntent(uint256 intentId, address recipient) external {
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.user != msg.sender) revert NotAuthorized();
        if (intent.executed || intent.cancelled) revert IntentInactive();

        intent.cancelled = true;
        address finalRecipient = recipient == address(0) ? intent.user : recipient;
        
        if (!IERC20(intent.tokenIn).transfer(finalRecipient, intent.amountIn))
            revert TransferFailed(intent.tokenIn);

        emit IntentCancelled(intentId, msg.sender, finalRecipient);
    }

    function refundIntent(uint256 intentId, address recipient) external {
        // Alias for cancel for compatibility
        this.cancelIntent(intentId, recipient);
    }

    function executeIntentFromL1(
        uint256 intentId,
        uint256 oraclePrice,
        uint256 answeredAt,
        address beneficiary
    ) external {
        if (msg.sender != reactiveExecutor && msg.sender != owner()) revert NotReactiveCaller();
        
        SniperTypes.Intent storage intent = intents[intentId];
        if (intent.user == address(0)) revert UnknownIntent();
        if (intent.executed || intent.cancelled) revert IntentInactive();
        
        if (oraclePrice > intent.targetPrice && intent.targetPrice > 0) revert PriceConditionNotMet();

        intent.executed = true;
        address finalBeneficiary = beneficiary == address(0) ? intent.user : beneficiary;

        uint256 amountOut = (intent.amountIn * 1 ether) / (oraclePrice * 1e10);
        
        if (amountOut > 0) {
            try IERC20(intent.tokenOut).transfer(finalBeneficiary, amountOut) {
            } catch {
            }
        }

        emit IntentExecuted(intentId, finalBeneficiary, oraclePrice, answeredAt, false);
    }

    function getIntent(uint256 intentId) external view returns (SniperTypes.Intent memory) {
        return intents[intentId];
    }
}
