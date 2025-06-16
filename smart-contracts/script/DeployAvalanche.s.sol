// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Script } from "forge-std/Script.sol";

import { HelperConfig } from "script/HelperConfig.s.sol";
import { UntilThenERC20 } from "src/avalanche-airdrop/UntilThenERC20.sol";
import { Receiver } from "src/avalanche-airdrop/Receiver.sol";

contract Deploy is Script {
    function run() external returns (Receiver receiver, UntilThenERC20 token) {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,, HelperConfig.AvalancheAirdropConfig memory avalancheAirdropConfig,) =
            helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        if (avalancheAirdropConfig.ccipReceiver == address(0)) {
            receiver = new Receiver(
                avalancheAirdropConfig.ccipSourceChainSelector, avalancheAirdropConfig.ccipDestRouterAddress
            );
        } else {
            receiver = Receiver(avalancheAirdropConfig.ccipReceiver);
        }

        if (avalancheAirdropConfig.avalancheERC20TokenAddress == address(0)) {
            token = new UntilThenERC20();
        } else {
            token = UntilThenERC20(avalancheAirdropConfig.avalancheERC20TokenAddress);
        }
        token.grantMintAndBurnRole(address(receiver));
        vm.stopBroadcast();
    }
}

contract SetSender is Script {
    function run() external {
        HelperConfig helperConfig = new HelperConfig();
        (, address account,,,,, HelperConfig.AvalancheAirdropConfig memory avalancheAirdropConfig,) =
            helperConfig.activeNetworkConfig();

        vm.startBroadcast(account);
        Receiver receiver = Receiver(avalancheAirdropConfig.ccipReceiver);
        receiver.setSender(avalancheAirdropConfig.ccipSender);

        vm.stopBroadcast();
    }
}
