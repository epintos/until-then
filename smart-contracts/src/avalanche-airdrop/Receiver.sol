// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

// Deploy to Base Sepolia

import { IRouterClient } from "@chainlink//src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink//src/v0.8/ccip/libraries/Client.sol";
import { CCIPReceiver } from "@chainlink//src/v0.8/ccip/applications/CCIPReceiver.sol";
import { IERC20 } from "@chainlink//src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from
    "@chainlink//src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract Receiver is CCIPReceiver, Ownable {
    error Receiver__NothingToWithdraw();
    error Receiver__NotAllowedForSourceChainOrSenderAddress(uint64 sourceChainSelector, address sender);
    error Receiver__FunctionCallFail();
    error Receiver__SenderNotSet();

    address public s_sender;

    uint64 public immutable i_sourceChainSelector;

    event MessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender, bytes data);
    event SenderUpdated(address newSender);

    constructor(
        uint64 sourceChainSelector,
        address destinationRouter
    )
        CCIPReceiver(destinationRouter)
        Ownable(msg.sender)
    {
        i_sourceChainSelector = sourceChainSelector;
    }

    function setSender(address sender) external onlyOwner {
        s_sender = sender;
        emit SenderUpdated(sender);
    }

    modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender) {
        if (s_sender == address(0)) {
            revert Receiver__SenderNotSet();
        }
        if (_sourceChainSelector != i_sourceChainSelector || _sender != s_sender) {
            revert Receiver__NotAllowedForSourceChainOrSenderAddress(_sourceChainSelector, _sender);
        }
        _;
    }

    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage)
        internal
        override
        onlyAllowlisted(any2EvmMessage.sourceChainSelector, abi.decode(any2EvmMessage.sender, (address)))
    {
        (address target, bytes memory functionCallData) = abi.decode(any2EvmMessage.data, (address, bytes));
        (bool success,) = target.call(functionCallData);

        if (!success) {
            revert Receiver__FunctionCallFail();
        }

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            any2EvmMessage.data
        );
    }
}
