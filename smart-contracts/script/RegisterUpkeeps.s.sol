// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.30;

import { LinkTokenInterface } from "@chainlink/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import { Script, console } from "forge-std/Script.sol";
import { HelperConfig } from "script/HelperConfig.s.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// struct LogTriggerConfig {
//     address contractAddress; // must have address that will be emitting the log
//     uint8 filterSelector; // must have filtserSelector, denoting  which topics apply to filter ex 000, 101,
// 111...only
//         // last 3 bits apply
//     bytes32 topic0; // must have signature of the emitted event
//     bytes32 topic1; // optional filter on indexed topic 1
//     bytes32 topic2; // optional filter on indexed topic 2
//     bytes32 topic3; // optional filter on indexed topic 3
// }

struct RegistrationParams {
    string name;
    bytes encryptedEmail;
    address upkeepContract;
    uint32 gasLimit;
    address adminAddress;
    uint8 triggerType;
    bytes checkData;
    bytes triggerConfig;
    bytes offchainConfig;
    uint96 amount;
}

/**
 * string name = "test upkeep";
 * bytes encryptedEmail = 0x;
 * address upkeepContract = 0x...;
 * uint32 gasLimit = 500000;
 * address adminAddress = 0x....;
 * uint8 triggerType = 0;
 * bytes checkData = 0x;
 * bytes triggerConfig = 0x;
 * bytes offchainConfig = 0x;
 * uint96 amount = 1000000000000000000;
 */
interface AutomationRegistrarInterface {
    function registerUpkeep(RegistrationParams calldata requestParams) external returns (uint256);
}

// https://docs.chain.link/chainlink-automation/guides/register-upkeep-in-contract
contract RegisterUpkeeps is Script {
    function run() public {
        HelperConfig helperConfig = new HelperConfig();
        (
            ,
            address account,
            ,
            ,
            ,
            ,
            HelperConfig.AvalancheAirdropConfig memory avalancheAirdropConfig,
            ,
            address untilThenV1Address
        ) = helperConfig.activeNetworkConfig();
        AutomationRegistrarInterface registrar =
            AutomationRegistrarInterface(0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976);
        uint96 funds = 10 ether;

        vm.startBroadcast(account);
        RegistrationParams memory params = RegistrationParams({
            name: "UntilThen Airdrop",
            encryptedEmail: hex"",
            upkeepContract: avalancheAirdropConfig.ccipSender,
            gasLimit: 500_000,
            adminAddress: account,
            triggerType: 1,
            checkData: hex"",
            triggerConfig: abi.encode(
                untilThenV1Address,
                0,
                keccak256("GiftClaimed(address,uint256,uint256,uint256,bytes32)"),
                bytes32(0),
                bytes32(0),
                bytes32(0)
            ),
            offchainConfig: hex"",
            amount: funds
        });
        IERC20(avalancheAirdropConfig.ccipSenderlinkAddress).approve(address(registrar), funds);
        uint256 upkeepID = registrar.registerUpkeep(params);
        vm.stopBroadcast();

        if (upkeepID != 0) {
            console.log("Upkeep created:", upkeepID);
        } else {
            revert("auto-approve disabled");
        }
    }
}
