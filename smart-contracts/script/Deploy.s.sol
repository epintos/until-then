// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Script } from "forge-std/Script.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { IPFSFunctionsConsumer } from "src/IPFSFunctionsConsumer.sol";
import { IPFSFunctionsConsumerMock } from "test/mocks/IPFSFunctionsConsumerMock.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";

contract Deploy is Script {
    function run() external returns (UntilThenV1, GiftNFT, HelperConfig) {
        HelperConfig helperConfig = new HelperConfig();
        (
            address chainlinkFunctionRouter,
            bytes32 chainlinkFunctionDonId,
            uint64 chainlinkFunctionSubscriptionId,
            uint32 chainlinkFunctionGasLimit,
            address account,
            uint256 contentGiftFee,
            uint256 currencyGiftFee,
            bool mockConsumer
        ) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        GiftNFT giftNFT = new GiftNFT();
        address consumerAddress;
        if (mockConsumer) {
            IPFSFunctionsConsumerMock consumerContract = new IPFSFunctionsConsumerMock(address(giftNFT));
            consumerAddress = address(consumerContract);
        } else {
            IPFSFunctionsConsumer consumerContract = new IPFSFunctionsConsumer(
                address(giftNFT),
                chainlinkFunctionSubscriptionId,
                chainlinkFunctionRouter,
                chainlinkFunctionDonId,
                chainlinkFunctionGasLimit
            );
            consumerAddress = address(consumerContract);
        }

        UntilThenV1 untilThenV1 = new UntilThenV1(contentGiftFee, currencyGiftFee, address(giftNFT), consumerAddress);
        giftNFT.grantMintAndBurnRole(address(untilThenV1));
        giftNFT.grantUpdateContentRole(consumerAddress);
        giftNFT.transferOwnership(address(untilThenV1));
        Ownable(consumerAddress).transferOwnership(address(untilThenV1));
        vm.stopBroadcast();

        return (untilThenV1, giftNFT, helperConfig);
    }
}
