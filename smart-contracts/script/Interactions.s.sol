// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Script, console } from "forge-std/Script.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Log } from "@chainlink/src/v0.8/automation/interfaces/ILogAutomation.sol";

import { UntilThenV1 } from "src/UntilThenV1.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { IPFSFunctionsConsumer } from "src/IPFSFunctionsConsumer.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";
import { AaveYieldManager } from "src/yield/AaveYieldManager.sol";
import { RedeemAirdropAutomation } from "src/avalanche-airdrop/RedeemAirdropAutomation.sol";

contract CreateGift is Script {
    string private constant GIFT_PRIVATE_CONTENT_HASH = "bafkreif4hee4u53zgr2ilqmk4csmtuh4btxmal2fdihxhnhyolp4biwbji";

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,,,, address untilThenV1Address) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        UntilThenV1(untilThenV1Address).createGift{ value: 0.015 ether }(
            account, block.timestamp + 1 minutes, GIFT_PRIVATE_CONTENT_HASH, false, 0
        );
        vm.stopBroadcast();
    }
}

contract CreateEmptyGift is Script {
    string private constant GIFT_PRIVATE_CONTENT_HASH = "bafkreif4hee4u53zgr2ilqmk4csmtuh4btxmal2fdihxhnhyolp4biwbji";

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,,,, address untilThenV1Address) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        UntilThenV1(untilThenV1Address).createGift{ value: 0.001 ether }(
            account, block.timestamp + 1 minutes, hex"", false, 0
        );
        vm.stopBroadcast();
    }
}

contract CreateGiftWithETHYield is Script {
    string private constant GIFT_PRIVATE_CONTENT_HASH = "bafkreif4hee4u53zgr2ilqmk4csmtuh4btxmal2fdihxhnhyolp4biwbji";

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,,,, address untilThenV1Address) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        UntilThenV1(untilThenV1Address).createGift{ value: 0.015 ether }(
            account, block.timestamp + 1 minutes, GIFT_PRIVATE_CONTENT_HASH, true, 0
        );
        vm.stopBroadcast();
    }
}

contract CreateGiftWithLinkYield is Script {
    string private constant GIFT_PRIVATE_CONTENT_HASH = "bafkreif4hee4u53zgr2ilqmk4csmtuh4btxmal2fdihxhnhyolp4biwbji";

    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,, HelperConfig.AaveYieldConfig memory aaveYieldConfig,,, address untilThenV1Address) =
            helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);

        IERC20(aaveYieldConfig.linkAddress).approve(aaveYieldConfig.yieldManagerAddress, 1 ether);

        UntilThenV1(untilThenV1Address).createGift{ value: 0.015 ether }(
            account, block.timestamp + 1 minutes, GIFT_PRIVATE_CONTENT_HASH, true, 1 ether
        );
        vm.stopBroadcast();
    }
}

contract ClaimGift is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,,,, address untilThenV1Address) = helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        UntilThenV1(untilThenV1Address).claimGift(UntilThenV1(untilThenV1Address).getTotalGifts());
        vm.stopBroadcast();
    }
}

contract Airdrop is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,, HelperConfig.AvalancheAirdropConfig memory avalancheAirdropConfig,,) =
            helperConfig.activeNetworkConfig();
        vm.startBroadcast(account);
        bytes32[] memory topics = new bytes32[](2);
        topics[0] = keccak256("GiftClaimed(address,uint256,uint256,uint256,bytes32)");
        topics[1] = bytes32(uint256(uint160(account)));
        Log memory log = Log({
            index: 0,
            timestamp: 0,
            txHash: 0,
            blockNumber: 0,
            blockHash: 0,
            source: 0x15E1CB9F78280D1301f78e98955E7355900c498B,
            topics: topics,
            data: hex""
        });
        RedeemAirdropAutomation sender = RedeemAirdropAutomation(avalancheAirdropConfig.ccipSender);
        (bool perform, bytes memory performData) = sender.checkLog(log, hex"");
        console.log("Perform:", perform);
        if (perform) {
            if (IERC20(avalancheAirdropConfig.ccipSenderlinkAddress).balanceOf(address(sender)) == 0) {
                IERC20(avalancheAirdropConfig.ccipSenderlinkAddress).transfer(address(sender), 5 ether);
            }
            sender.performUpkeep(performData);
        } else {
            console.log("Perform is false");
        }

        vm.stopBroadcast();
    }
}
