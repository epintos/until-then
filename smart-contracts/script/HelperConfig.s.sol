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
        address consumerAddress;
        bytes encryptedSecretsUrls;
    }

    address internal constant SEPOLIA_CHAINLINK_FUNCTION_ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 internal constant SEPOLIA_CHAINLINK_DON_ID =
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    uint64 internal constant SEPOLIA_CHAINLINK_FUNCTION_SUBSCRIPTION_ID = 4929;
    address internal constant SEPOLIA_CONSUMER_ADDRESS = 0x999b14Fbe409C853cF520dd46421c7C2f31680d5;
    uint32 internal constant CHAINLINK_FUNCTION_GAS_LIMIT = 300_000;
    bytes internal constant ENCRYPTED_SECRETS_URLS =
        hex"743f6fc1b42c834c4271091a7003826803347280efc67b4e1c213e1120b87cf69cdf14ad4edc8e7a53eb973ce38b10b07b70c49e664c75e3f16343344525aa081bc015cd19eb886692ab3d7825de5691a0abd11f556684120167d7ef295ecc693d30633593af35abef8311ea5bc69a1c99793283d3f7bf8f6f3c1ff0bd06985b80faae47ddb1f8ffda3d79b680f268fa65574d26633effda792e0c86cb1a4323cd";

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
            consumerAddress: SEPOLIA_CONSUMER_ADDRESS,
            encryptedSecretsUrls: ENCRYPTED_SECRETS_URLS
        });
    }

    function _getOrCreateAnvilETHConfig() internal returns (NetworkConfig memory) {
        if (activeNetworkConfig.chainlinkFunctionRouter != address(0)) {
            return activeNetworkConfig;
        }

        vm.startBroadcast(msg.sender);
        IPFSFunctionsConsumerMock consumerContract = new IPFSFunctionsConsumerMock();
        vm.stopBroadcast();

        return NetworkConfig({
            chainlinkFunctionRouter: address(0),
            chainlinkFunctionDonId: 0,
            chainlinkFunctionSubscriptionId: 0,
            chainlinkFunctionGasLimit: CHAINLINK_FUNCTION_GAS_LIMIT,
            account: msg.sender,
            contentGiftFee: CONTENT_GIFT_FEE,
            currencyGiftFee: CURRENCY_GIFT_FEE,
            consumerAddress: address(consumerContract),
            encryptedSecretsUrls: ""
        });
    }
}
