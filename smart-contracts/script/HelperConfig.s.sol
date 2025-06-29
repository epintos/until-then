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
        AvalancheAirdropConfig avalancheAirdropConfig;
        GiveawayConfig giveawayConfig;
        address untilThenV1Address;
    }

    struct AvalancheAirdropConfig {
        address ccipSender;
        address ccipReceiver;
        address avalancheERC20TokenAddress;
        address ccipSenderlinkAddress;
        uint64 ccipAvalancheChainSelector;
        uint64 ccipSourceChainSelector;
        address ccipSourceRouterAddress;
        address ccipDestRouterAddress;
    }

    struct GiveawayConfig {
        address vrfCoordinator;
        bytes32 gasLane;
        uint256 subscriptionId;
        uint32 callbackGasLimit;
        address priceFeed;
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
    address internal constant SEPOLIA_AAVE_YIELD_MANAGER = 0x9bC2359CF283BF2B91b96aD9491d9A8Fc1f13123;

    uint256 internal constant SEPOLIA_CHAIN_ID = 11_155_111;
    uint256 internal constant AVALANCHE_FUJI_CHAIN_ID = 43_113;
    uint256 internal constant ANVIL_CHAIN_ID = 31_337;
    uint256 internal CONTENT_GIFT_FEE = 0.01 ether;
    uint256 internal CURRENCY_GIFT_FEE = 0.0001 ether;
    uint256 internal CURRENCY_GIFT_LINK_FEE = 0.05 ether;

    // Avalance airdrop
    address internal constant CCIP_SEPOLIA_SENDER_ADDRESS = 0x30DCDaFD1B0B2C702FE67d1bF0f61821970BB7aA;
    address internal constant CCIP_AVALANCHE_RECEIVER_ADDRESS = 0xC17778DaC70f33d58a6D594bC1aD7f58a4F5Fa4B;
    address internal constant AVALANCHE_ERC2O_TOKEN_ADDRESS = 0x3164d84A42ec935f620d73a2e22C8b3E2Cb049aE;
    // https://docs.chain.link/resources/link-token-contracts#ethereum-testnet-sepolia
    address internal constant CCIP_SEPOLIA_LINK_ADDRESS = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
    // https://docs.chain.link/ccip/directory/testnet/chain/avalanche-fuji-testnet
    uint64 internal constant CCIP_AVALANCHE_FUJI_TESTNET_CHAIN_SELECTOR = 14_767_482_510_784_806_043;
    // https://docs.chain.link/ccip/directory/testnet/chain/ethereum-testnet-sepolia
    uint64 internal constant CCIP_SEPOLIA_CHAIN_SELECTOR = 16_015_286_601_757_825_753;
    // https://docs.chain.link/ccip/directory/testnet/chain/ethereum-testnet-sepolia
    address internal constant CCIP_SEPOLIA_ROUTER_ADDRESS = 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59;
    address internal constant CCIP_AVALANCHE_FUJI_ROUTER_ADDRESS = 0xF694E193200268f9a4868e4Aa017A0118C9a8177;

    // Giveaway
    address internal constant SEPOLIA_VRF_COORDINATOR = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;
    bytes32 internal constant SEPOLIA_GAS_LANE = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 internal constant VRF_CALLBACK_GAS_LIMIT = 500_000;
    uint256 internal constant VRF_SUBSCRIPTION_ID =
        33_417_377_138_417_000_668_359_383_073_717_148_462_378_291_091_203_326_927_501_459_759_537_206_218_812;
    address internal constant ETH_USD_PRICE_FEED = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

    address internal constant UNTIL_THEN_V1_ADDRESS_SEPOLIA = 0xefA2408BDc98e783440A1B27d72827cec8A399d8;

    NetworkConfig public activeNetworkConfig;

    constructor() {
        if (block.chainid == SEPOLIA_CHAIN_ID) {
            activeNetworkConfig = _getSepoliaETHConfig();
        } else if (block.chainid == ANVIL_CHAIN_ID) {
            activeNetworkConfig = _getOrCreateAnvilETHConfig();
        } else if (block.chainid == AVALANCHE_FUJI_CHAIN_ID) {
            activeNetworkConfig = _getSepoliaETHConfig();
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
            }),
            avalancheAirdropConfig: AvalancheAirdropConfig({
                ccipSender: CCIP_SEPOLIA_SENDER_ADDRESS,
                ccipReceiver: CCIP_AVALANCHE_RECEIVER_ADDRESS,
                avalancheERC20TokenAddress: AVALANCHE_ERC2O_TOKEN_ADDRESS,
                ccipSenderlinkAddress: CCIP_SEPOLIA_LINK_ADDRESS,
                ccipAvalancheChainSelector: CCIP_AVALANCHE_FUJI_TESTNET_CHAIN_SELECTOR,
                ccipSourceChainSelector: CCIP_SEPOLIA_CHAIN_SELECTOR,
                ccipSourceRouterAddress: CCIP_SEPOLIA_ROUTER_ADDRESS,
                ccipDestRouterAddress: CCIP_AVALANCHE_FUJI_ROUTER_ADDRESS
            }),
            giveawayConfig: GiveawayConfig({
                vrfCoordinator: SEPOLIA_VRF_COORDINATOR,
                gasLane: SEPOLIA_GAS_LANE,
                subscriptionId: VRF_SUBSCRIPTION_ID,
                callbackGasLimit: VRF_CALLBACK_GAS_LIMIT,
                priceFeed: ETH_USD_PRICE_FEED
            }),
            untilThenV1Address: UNTIL_THEN_V1_ADDRESS_SEPOLIA
        });
    }

    // TODO: Complete to be able to run tests and debug some contracts in Anvil.
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
            }),
            avalancheAirdropConfig: AvalancheAirdropConfig({
                ccipSender: address(0),
                ccipReceiver: address(0),
                avalancheERC20TokenAddress: address(0),
                ccipSenderlinkAddress: address(0),
                ccipAvalancheChainSelector: 0,
                ccipSourceChainSelector: 0,
                ccipSourceRouterAddress: address(0),
                ccipDestRouterAddress: address(0)
            }),
            giveawayConfig: GiveawayConfig({
                vrfCoordinator: address(0),
                gasLane: hex"",
                subscriptionId: 0,
                callbackGasLimit: 100,
                priceFeed: address(0)
            }),
            untilThenV1Address: address(0)
        });
    }
}
