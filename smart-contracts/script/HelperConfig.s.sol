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

    struct ChainlinkFunctionsConfig {
        address router;
        bytes32 donId;
        uint64 subscriptionId;
        uint32 gasLimit;
        bytes encryptedSecretsUrls;
        address consumerAddress;
    }

    struct AaveYieldConfig {
        address poolAddress;
        address wethGatewayAddress;
        address wethATokenAddress;
        address linkAddress;
        address linkATokenAddress;
        address yieldManagerAddress;
    }

    struct NetworkConfig {
        ChainlinkFunctionsConfig chainlinkFunctionsConfig;
        address account;
        uint256 contentGiftFee;
        uint256 currencyGiftFee;
        uint256 currencyGiftLinkFee;
        AaveYieldConfig aaveYieldConfig;
    }

    // Chainlink Functions
    address internal constant SEPOLIA_CHAINLINK_FUNCTION_ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 internal constant SEPOLIA_CHAINLINK_DON_ID =
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    uint64 internal constant SEPOLIA_CHAINLINK_FUNCTION_SUBSCRIPTION_ID = 4929;
    address internal constant SEPOLIA_CONSUMER_ADDRESS = 0x999b14Fbe409C853cF520dd46421c7C2f31680d5;
    uint32 internal constant CHAINLINK_FUNCTION_GAS_LIMIT = 300_000;
    bytes internal constant ENCRYPTED_SECRETS_URLS =
        hex"743f6fc1b42c834c4271091a7003826803347280efc67b4e1c213e1120b87cf69cdf14ad4edc8e7a53eb973ce38b10b07b70c49e664c75e3f16343344525aa081bc015cd19eb886692ab3d7825de5691a0abd11f556684120167d7ef295ecc693d30633593af35abef8311ea5bc69a1c99793283d3f7bf8f6f3c1ff0bd06985b80faae47ddb1f8ffda3d79b680f268fa65574d26633effda792e0c86cb1a4323cd";

    // https://aave.com/docs/resources/addresses
    address internal constant SEPOLIA_AAVE_POOL_ADDRESS = 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951;
    address internal constant SEPOLIA_AAVE_WETH_GATEWAY_ADDRESS = 0x387d311e47e80b498169e6fb51d3193167d89F7D;
    address internal constant SEPOLIA_AAVE_WETH_ATOKEN_ADDRESS = 0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830;
    address internal constant SEPOLIA_AAVE_LINK_ADDRESS = 0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5;
    address internal constant SEPOLIA_AAVE_LINK_ATOKEN_ADDRESS = 0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24;
    address internal constant SEPOLIA_AAVE_YIELD_MANAGER = 0xd39A3a6cB80cE9e1c000027EF5f515Df6ed393df;

    uint256 internal constant SEPOLIA_CHAIN_ID = 11_155_111;
    uint256 internal constant ANVIL_CHAIN_ID = 31_337;
    uint256 internal CONTENT_GIFT_FEE = 0.01 ether;
    uint256 internal CURRENCY_GIFT_FEE = 0.0001 ether;
    uint256 internal CURRENCY_GIFT_LINK_FEE = 0.05 ether;

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
            chainlinkFunctionsConfig: ChainlinkFunctionsConfig({
                router: SEPOLIA_CHAINLINK_FUNCTION_ROUTER,
                donId: SEPOLIA_CHAINLINK_DON_ID,
                subscriptionId: SEPOLIA_CHAINLINK_FUNCTION_SUBSCRIPTION_ID,
                gasLimit: CHAINLINK_FUNCTION_GAS_LIMIT,
                encryptedSecretsUrls: ENCRYPTED_SECRETS_URLS,
                consumerAddress: SEPOLIA_CONSUMER_ADDRESS
            }),
            account: vm.envAddress("SEPOLIA_ACCOUNT_ADDRESS"),
            contentGiftFee: CONTENT_GIFT_FEE,
            currencyGiftFee: CURRENCY_GIFT_FEE,
            currencyGiftLinkFee: CURRENCY_GIFT_LINK_FEE,
            aaveYieldConfig: AaveYieldConfig({
                poolAddress: SEPOLIA_AAVE_POOL_ADDRESS,
                wethGatewayAddress: SEPOLIA_AAVE_WETH_GATEWAY_ADDRESS,
                wethATokenAddress: SEPOLIA_AAVE_WETH_ATOKEN_ADDRESS,
                linkAddress: SEPOLIA_AAVE_LINK_ADDRESS,
                linkATokenAddress: SEPOLIA_AAVE_LINK_ATOKEN_ADDRESS,
                yieldManagerAddress: SEPOLIA_AAVE_YIELD_MANAGER
            })
        });
    }

    function _getOrCreateAnvilETHConfig() internal returns (NetworkConfig memory) {
        if (activeNetworkConfig.chainlinkFunctionsConfig.router != address(0)) {
            return activeNetworkConfig;
        }

        vm.startBroadcast(msg.sender);
        IPFSFunctionsConsumerMock consumerContract = new IPFSFunctionsConsumerMock();
        vm.stopBroadcast();

        return NetworkConfig({
            chainlinkFunctionsConfig: ChainlinkFunctionsConfig({
                router: address(consumerContract),
                donId: 0,
                subscriptionId: 0,
                gasLimit: CHAINLINK_FUNCTION_GAS_LIMIT,
                encryptedSecretsUrls: ENCRYPTED_SECRETS_URLS,
                consumerAddress: address(consumerContract)
            }),
            account: msg.sender,
            contentGiftFee: CONTENT_GIFT_FEE,
            currencyGiftFee: CURRENCY_GIFT_FEE,
            currencyGiftLinkFee: CURRENCY_GIFT_LINK_FEE,
            aaveYieldConfig: AaveYieldConfig({
                poolAddress: address(0),
                wethGatewayAddress: address(0),
                wethATokenAddress: address(0),
                linkAddress: address(0),
                linkATokenAddress: address(0),
                yieldManagerAddress: address(0)
            })
        });
    }
}
