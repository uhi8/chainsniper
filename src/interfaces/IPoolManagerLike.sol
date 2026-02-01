// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IPoolManagerLike {
    function lock(bytes calldata data) external returns (bytes memory);
}
