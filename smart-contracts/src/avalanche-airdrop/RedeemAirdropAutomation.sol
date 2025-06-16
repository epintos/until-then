// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Log, ILogAutomation } from "@chainlink/src/v0.8/automation/interfaces/ILogAutomation.sol";
import { IRouterClient } from "@chainlink/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/src/v0.8/ccip/libraries/Client.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { UntilThenERC20 } from "src/avalanche-airdrop/UntilThenERC20.sol";

contract RedeemAirdropAutomation is ILogAutomation, Ownable {
    using SafeERC20 for IERC20;

    error RedeemAirdropAutomation__InsufficientBalance(address linkToken, uint256 linkBalance, uint256 ccipFee);
    error RedeemAirdropAutomation__ReceiverCannotBeZeroAddress();
    error RedeemAirdropAutomation__ERC20CannotBeZeroAddress();

    address public immutable i_linkToken;
    uint256 public s_redeemed;
    uint256 public s_airdropLimit = 100;
    uint256 public s_airdropAmount = 500 ether;
    address public s_receiverAddress; // Receiver in Avalanche
    address public s_erc20Address; // ERC20 token in Avalanche
    IRouterClient public immutable i_router;
    uint64 public immutable i_destinationChainSelector;
    uint256 public s_gasLimit = 200_000;

    event AirdropAmountUpdated(address indexed owner, uint256 newAirdropAmount);
    event AirdropLimitUpdated(address indexed owner, uint256 newAirdropLimit);
    event ReceiverUpdated(address indexed owner, address newReceiver);
    event AirdropTriggered(
        address indexed airdropReceiverAddress,
        bytes32 messageId,
        uint64 i_destinationChainSelector,
        address receiver,
        uint256 ccipFee
    );
    event LinkWithdrawn(address indexed owner, uint256 amount);
    event GasLimitUpdated(address indexed owner, uint256 newGasLimit);

    constructor(
        address receiverAddress,
        address erc20Address,
        address linkToken,
        uint64 destinationChainSelector,
        address routeraddress
    )
        Ownable(msg.sender)
    {
        if (receiverAddress == address(0)) {
            revert RedeemAirdropAutomation__ReceiverCannotBeZeroAddress();
        }
        if (erc20Address == address(0)) {
            revert RedeemAirdropAutomation__ERC20CannotBeZeroAddress();
        }
        s_receiverAddress = receiverAddress;
        s_erc20Address = erc20Address;
        i_linkToken = linkToken;
        i_destinationChainSelector = destinationChainSelector;
        i_router = IRouterClient(routeraddress);
    }

    function updateReceiver(address receiver) external onlyOwner {
        s_receiverAddress = receiver;
        emit ReceiverUpdated(msg.sender, receiver);
    }

    function updateAirdropAmount(uint256 newAirdropAmount) external onlyOwner {
        s_airdropAmount = newAirdropAmount;
        emit AirdropAmountUpdated(msg.sender, newAirdropAmount);
    }

    function updateAirdropLimit(uint256 newAirdropLimit) external onlyOwner {
        s_airdropLimit = newAirdropLimit;
        emit AirdropLimitUpdated(msg.sender, newAirdropLimit);
    }

    function checkLog(
        Log calldata log,
        bytes memory
    )
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (s_redeemed < s_airdropLimit) {
            upkeepNeeded = true;
            address receiverAddress = _bytes32ToAddress(log.topics[1]);
            performData = abi.encode(receiverAddress);
        }
    }

    function updateGasLimit(uint256 newGasLimit) external onlyOwner {
        s_gasLimit = newGasLimit;
        emit GasLimitUpdated(msg.sender, newGasLimit);
    }

    function performUpkeep(bytes calldata performData) external override {
        s_redeemed += 1;
        address airdropReceiver = abi.decode(performData, (address));
        bytes memory mintFunctionCalldata =
            abi.encodeWithSelector(UntilThenERC20.mint.selector, airdropReceiver, s_airdropAmount);

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(s_receiverAddress),
            data: abi.encode(s_erc20Address, mintFunctionCalldata),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV2({ gasLimit: s_gasLimit, allowOutOfOrderExecution: true })),
            feeToken: address(i_linkToken)
        });

        uint256 ccipFee = i_router.getFee(i_destinationChainSelector, message);
        uint256 linkBalance = IERC20(i_linkToken).balanceOf(address(this));
        if (ccipFee > linkBalance) {
            revert RedeemAirdropAutomation__InsufficientBalance(i_linkToken, linkBalance, ccipFee);
        }

        IERC20(i_linkToken).approve(address(i_router), ccipFee);

        bytes32 messageId = i_router.ccipSend(i_destinationChainSelector, message);

        emit AirdropTriggered(airdropReceiver, messageId, i_destinationChainSelector, s_receiverAddress, ccipFee);
    }

    function _bytes32ToAddress(bytes32 _address) private pure returns (address) {
        return address(uint160(uint256(_address)));
    }

    function withdrawLink() external onlyOwner {
        uint256 balance = IERC20(i_linkToken).balanceOf(address(this));
        if (balance > 0) {
            IERC20(i_linkToken).safeTransfer(msg.sender, balance);
            emit LinkWithdrawn(msg.sender, balance);
        }
    }
}
