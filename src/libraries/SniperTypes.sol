// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

library SniperTypes {
    uint16 internal constant MAX_BPS = 10_000;

    error InvalidTickSpacing();
    error InvalidTargetPrice();

    struct Intent {
        address user;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 targetPrice;
        uint16 maxSlippageBps;
        uint256 expiry;
        uint256 nonce;
        bool executed;
        bool cancelled;
        int24 targetTick;
        uint64 createdAt;
    }

    struct CreateIntentParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 targetPrice;
        uint16 maxSlippageBps;
        uint256 expiry;
        int24 targetTickHint;
    }

    struct BucketSnapshot {
        int24 tick;
        uint256 totalAmountIn;
        uint256 activeIntentCount;
    }

    function snapToSpacing(int24 rawTick, int24 spacing) internal pure returns (int24) {
        if (spacing <= 0) revert InvalidTickSpacing();
        int24 remainder = rawTick % spacing;
        if (remainder == 0) return rawTick;
        if (rawTick >= 0) {
            return rawTick - remainder;
        }
        return rawTick - remainder - spacing;
    }

    function bucketForPrice(uint256 targetPrice, int24 spacing) internal pure returns (int24) {
        if (targetPrice == 0) revert InvalidTargetPrice();
        int24 pseudoTick = int24(int256(targetPrice / 1e14));
        return snapToSpacing(pseudoTick, spacing);
    }
}
