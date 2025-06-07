// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Script } from "forge-std/Script.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { IPFSFunctionsConsumer } from "src/IPFSFunctionsConsumer.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";

contract Deploy is Script {
    function run() external returns (UntilThenV1, GiftNFT, HelperConfig) {
        HelperConfig helperConfig = new HelperConfig();
        (,,,, address account, uint256 contentGiftFee, uint256 currencyGiftFee, address consumerAddress,) =
            helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        GiftNFT giftNFT = new GiftNFT();
        if (consumerAddress == address(0)) {
            consumerAddress = new DeployFunctionConsumer().run();
        }

        UntilThenV1 untilThenV1 = new UntilThenV1(contentGiftFee, currencyGiftFee, address(giftNFT), consumerAddress);
        giftNFT.grantMintAndBurnRole(address(untilThenV1));
        giftNFT.grantUpdateContentRole(consumerAddress);
        giftNFT.transferOwnership(address(untilThenV1));
        IPFSFunctionsConsumer(consumerAddress).setGiftNFTContract(address(giftNFT));
        IPFSFunctionsConsumer(consumerAddress).grantSendRequestRole(address(untilThenV1));
        vm.stopBroadcast();

        return (untilThenV1, giftNFT, helperConfig);
    }
}

contract DeployFunctionConsumer is Script {
    function run() external returns (address) {
        HelperConfig helperConfig = new HelperConfig();
        (
            address chainlinkFunctionRouter,
            bytes32 chainlinkFunctionDonId,
            uint64 chainlinkFunctionSubscriptionId,
            uint32 chainlinkFunctionGasLimit,
            address account,
            ,
            ,
            ,
            bytes memory encryptedSecretsUrls
        ) = helperConfig.activeNetworkConfig();
        string memory source = vm.readFile("../../chainlink-function/src/source.js");

        vm.startBroadcast(account);
        IPFSFunctionsConsumer consumerContract = new IPFSFunctionsConsumer(
            chainlinkFunctionSubscriptionId,
            chainlinkFunctionRouter,
            chainlinkFunctionDonId,
            chainlinkFunctionGasLimit,
            encryptedSecretsUrls
        );
        consumerContract.updateSource(source);
        vm.stopBroadcast();
        return address(consumerContract);
    }
}
