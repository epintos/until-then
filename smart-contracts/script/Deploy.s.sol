// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Script } from "forge-std/Script.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { IPFSFunctionsConsumer } from "src/IPFSFunctionsConsumer.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";
import { AaveYieldManager } from "src/yield/AaveYieldManager.sol";

import { RedeemAirdropAutomation } from "src/avalanche-airdrop/RedeemAirdropAutomation.sol";

contract Deploy is Script {
    function run() external returns (UntilThenV1, GiftNFT, HelperConfig, AaveYieldManager) {
        HelperConfig helperConfig = new HelperConfig();
        (
            HelperConfig.ChainlinkFunctionsConfig memory chainlinkFunctionsConfig,
            address account,
            uint256 contentGiftFee,
            uint256 currencyGiftFee,
            uint256 currencyGiftLinkFee,
            HelperConfig.AaveYieldConfig memory aaveYieldConfig,
        ) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        GiftNFT giftNFT = new GiftNFT();
        address consumerAddress = chainlinkFunctionsConfig.consumerAddress;
        if (consumerAddress == address(0)) {
            consumerAddress = new DeployFunctionConsumer().run();
        }
        AaveYieldManager aaveYieldManager = AaveYieldManager(payable(aaveYieldConfig.yieldManagerAddress));
        if (address(aaveYieldManager) == address(0)) {
            aaveYieldManager = new DeployAaveYieldManager().run();
        }

        UntilThenV1 untilThenV1 = new UntilThenV1(
            contentGiftFee,
            currencyGiftFee,
            currencyGiftLinkFee,
            address(giftNFT),
            consumerAddress,
            address(aaveYieldManager),
            aaveYieldConfig.linkAddress
        );
        aaveYieldManager.grantDepositWithdrawRole(address(untilThenV1));
        giftNFT.grantMintAndBurnRole(address(untilThenV1));
        giftNFT.grantUpdateContentRole(consumerAddress);
        giftNFT.transferOwnership(address(untilThenV1));
        IPFSFunctionsConsumer(consumerAddress).setGiftNFTContract(address(giftNFT));
        IPFSFunctionsConsumer(consumerAddress).grantSendRequestRole(address(untilThenV1));
        vm.stopBroadcast();

        return (untilThenV1, giftNFT, helperConfig, aaveYieldManager);
    }
}

contract DeployFunctionConsumer is Script {
    function run() external returns (address) {
        HelperConfig helperConfig = new HelperConfig();
        (HelperConfig.ChainlinkFunctionsConfig memory chainlinkFunctionsConfig, address account,,,,,) =
            helperConfig.activeNetworkConfig();
        // string memory source = vm.readFile("../../chainlink-function/src/source.js");

        vm.startBroadcast(account);
        IPFSFunctionsConsumer consumerContract = new IPFSFunctionsConsumer(
            chainlinkFunctionsConfig.subscriptionId,
            chainlinkFunctionsConfig.router,
            chainlinkFunctionsConfig.donId,
            chainlinkFunctionsConfig.gasLimit,
            chainlinkFunctionsConfig.encryptedSecretsUrls
        );
        // consumerContract.updateSource(source);
        vm.stopBroadcast();
        return address(consumerContract);
    }
}

contract DeployAaveYieldManager is Script {
    function run() external returns (AaveYieldManager) {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,, HelperConfig.AaveYieldConfig memory aaveYieldConfig,) =
            helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        AaveYieldManager aaveYieldManager = new AaveYieldManager(
            aaveYieldConfig.wethGatewayAddress,
            aaveYieldConfig.poolAddress,
            aaveYieldConfig.wethATokenAddress,
            aaveYieldConfig.linkAddress,
            aaveYieldConfig.linkATokenAddress
        );
        vm.stopBroadcast();
        return aaveYieldManager;
    }
}

// Set ccipReceiver first
contract DeployAirdropAutomation is Script {
    function run() external returns (RedeemAirdropAutomation sender) {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,, HelperConfig.AvalancheAirdropConfig memory avalancheAirdropConfig) =
            helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        if (avalancheAirdropConfig.ccipSender == address(0)) {
            sender = new RedeemAirdropAutomation(
                avalancheAirdropConfig.ccipReceiver,
                avalancheAirdropConfig.avalancheERC20TokenAddress,
                avalancheAirdropConfig.ccipSenderlinkAddress,
                avalancheAirdropConfig.ccipAvalancheChainSelector,
                avalancheAirdropConfig.ccipRouterAddress
            );
        } else {
            sender = RedeemAirdropAutomation(avalancheAirdropConfig.ccipSender);
        }

        vm.stopBroadcast();
    }
}
