// SDPX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Script } from "forge-std/Script.sol";

import { IPFSFunctionsConsumerMock } from "test/mocks/IPFSFunctionsConsumerMock.sol";

/**
 * @title HelperConfig
 * @author @epintos
 * @notice Simple contract that includes setup configuration for Sepolia and Anvil
 */
contract HelperConfig is Script {
    error HelperConfig__InvalidChainId();

    struct NetworkConfig {
        address chainlinkFunctionRouter;
        bytes32 chainlinkFunctionDonId;
        uint64 chainlinkFunctionSubscriptionId;
        uint32 chainlinkFunctionGasLimit;
        address account;
        uint256 contentGiftFee;
        uint256 currencyGiftFee;
        bool mockConsumer;
    }

    address internal constant SEPOLIA_CHAINLINK_FUNCTION_ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 internal constant SEPOLIA_CHAINLINK_DON_ID =
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    uint64 internal constant SEPOLIA_CHAINLINK_FUNCTION_SUBSCRIPTION_ID = 1_000_000;
    uint32 internal constant CHAINLINK_FUNCTION_GAS_LIMIT = 300_000;

    uint256 internal constant SEPOLIA_CHAIN_ID = 11_155_111;
    uint256 internal constant ANVIL_CHAIN_ID = 31_337;
    uint256 internal CONTENT_GIFT_FEE = 0.01 ether;
    uint256 internal CURRENCY_GIFT_FEE = 0.0001 ether;

    NetworkConfig public activeNetworkConfig;

    constructor() {
        if (block.chainid == SEPOLIA_CHAIN_ID) {
            activeNetworkConfig = _getSepoliaETHConfig();
        } else if (block.chainid == ANVIL_CHAIN_ID) {
            activeNetworkConfig = _getOrCreateAnvilETHConfig();
        } else {
            revert HelperConfig__InvalidChainId();
        }
    }

    function _getSepoliaETHConfig() internal view returns (NetworkConfig memory) {
        return NetworkConfig({
            chainlinkFunctionRouter: SEPOLIA_CHAINLINK_FUNCTION_ROUTER,
            chainlinkFunctionDonId: SEPOLIA_CHAINLINK_DON_ID,
            chainlinkFunctionSubscriptionId: SEPOLIA_CHAINLINK_FUNCTION_SUBSCRIPTION_ID,
            chainlinkFunctionGasLimit: CHAINLINK_FUNCTION_GAS_LIMIT,
            account: vm.envAddress("SEPOLIA_ACCOUNT_ADDRESS"),
            contentGiftFee: CONTENT_GIFT_FEE,
            currencyGiftFee: CURRENCY_GIFT_FEE,
            mockConsumer: false
        });
    }

    function _getOrCreateAnvilETHConfig() internal view returns (NetworkConfig memory) {
        if (activeNetworkConfig.chainlinkFunctionRouter != address(0)) {
            return activeNetworkConfig;
        }

        return NetworkConfig({
            chainlinkFunctionRouter: address(0),
            chainlinkFunctionDonId: 0,
            chainlinkFunctionSubscriptionId: 0,
            chainlinkFunctionGasLimit: CHAINLINK_FUNCTION_GAS_LIMIT,
            account: msg.sender,
            contentGiftFee: CONTENT_GIFT_FEE,
            currencyGiftFee: CURRENCY_GIFT_FEE,
            mockConsumer: true
        });
    }
}
