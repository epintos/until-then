// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Script } from "forge-std/Script.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { IPFSFunctionsConsumer } from "src/IPFSFunctionsConsumer.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";

contract CreateGift is Script {
    UntilThenV1 private constant UNTIL_THEN_V1_CONTRACT = UntilThenV1(0x0A101f9F99f2730655A02522237B11FF768E84fC);
    string private constant GIFT_PRIVATE_CONTENT_HASH = "bafkreif4hee4u53zgr2ilqmk4csmtuh4btxmal2fdihxhnhyolp4biwbji";

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        UNTIL_THEN_V1_CONTRACT.createGift{ value: 0.015 ether }(
            account, block.timestamp + 1 minutes, GIFT_PRIVATE_CONTENT_HASH, false, 0
        );
        vm.stopBroadcast();
    }
}

contract CreateGiftWithLink is Script {
    UntilThenV1 private constant UNTIL_THEN_V1_CONTRACT = UntilThenV1(0x0A101f9F99f2730655A02522237B11FF768E84fC);
    string private constant GIFT_PRIVATE_CONTENT_HASH = "bafkreif4hee4u53zgr2ilqmk4csmtuh4btxmal2fdihxhnhyolp4biwbji";

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        UNTIL_THEN_V1_CONTRACT.createGift(
            account, block.timestamp + 1 minutes, GIFT_PRIVATE_CONTENT_HASH, true, 0.015 ether
        );
        vm.stopBroadcast();
    }
}

contract ClaimGift is Script {
    UntilThenV1 private constant UNTIL_THEN_V1_CONTRACT = UntilThenV1(0x0A101f9F99f2730655A02522237B11FF768E84fC);

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        UNTIL_THEN_V1_CONTRACT.claimGift(UNTIL_THEN_V1_CONTRACT.getTotalGifts());
        vm.stopBroadcast();
    }
}
