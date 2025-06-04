//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract UntilThenV1 is Ownable {
    /// ERRORS
    error UntilThenV1__ReceiverCannotBeZeroAddress();
    error UntilThenV1__InvalidGiftFee();
    error UntilThenV1__InvalidcontentHash();
    error UntilThenV1__ReleaseTimestampCannotBeInThePast();
    error UntilThenV1__TransferFailed();
    error UntilThenV1__NotEnoughERC20Allowance(uint256 currentAllowance);
    error UntilThenV1__InvalidNFTAddress();
    error UntilThenV1__SenderDoesNotOwnNFT();
    error UntilThenV1__InvalidYieldStrategy();

    /// TYPES
    enum GiftStatus {
        ABSENT,
        PENDING,
        CLAIMED
    }

    enum AvailableYieldStrategies {
        NONE,
        AAVE,
        COMPOUND
    }

    struct YieldStrategy {
        AvailableYieldStrategies strategy;
        address yieldToken;
    }

    struct Gift {
        uint256 id;
        GiftStatus status;
        address sender;
        address receiver;
        uint256 amount;
        uint256 releaseTimestamp;
        bytes contentHash;
        YieldStrategy yieldStrategy;
        uint256 nftClaimedId;
    }

    /// STATE VARIABLES
    uint256 private totalGifts;

    mapping(address receiver => Gift[] gifts) private receiverGifts;
    mapping(address sender => Gift[] gifts) private senderGifts;
    mapping(uint256 id => Gift gift) private gifts;

    // @notice Base token deposited for gifts
    mapping(address sender => uint256 amount) private amountDeposited;

    // @notice fee when sending only content
    uint256 private contentGiftFee;

    // @notice fee when sending currency, token or an NFT
    uint256 private currencyGiftFee;

    /// EVENTS
    event GiftCreated(address indexed sender, address indexed receiver, uint256 giftId);
    event Withdraw(address indexed receiver, uint256 amount);

    /// FUNCTIONS

    // CONSTRUCTOR
    constructor(uint256 _contentGiftFee, uint256 _currencyGiftFee) Ownable(msg.sender) {
        contentGiftFee = _contentGiftFee;
        currencyGiftFee = _currencyGiftFee;
    }

    // EXTERNAL FUNCTIONS
    function createGift(
        address receiver,
        uint256 releaseTimestamp,
        bytes calldata contentHash,
        AvailableYieldStrategies yieldStrategy
    )
        external
        payable
        returns (uint256 giftId)
    {
        if (receiver == address(0)) {
            revert UntilThenV1__ReceiverCannotBeZeroAddress();
        }
        if (releaseTimestamp < block.timestamp) {
            revert UntilThenV1__ReleaseTimestampCannotBeInThePast();
        }

        if (msg.value == 0) {
            revert UntilThenV1__InvalidGiftFee();
        }

        bool yield;
        if (
            yieldStrategy != AvailableYieldStrategies.AAVE && yieldStrategy != AvailableYieldStrategies.COMPOUND
                && yieldStrategy != AvailableYieldStrategies.NONE
        ) {
            revert UntilThenV1__InvalidYieldStrategy();
        }

        yield = (yieldStrategy == AvailableYieldStrategies.AAVE || yieldStrategy == AvailableYieldStrategies.COMPOUND);

        giftId = ++totalGifts;
        Gift memory gift = Gift({
            id: giftId,
            status: GiftStatus.PENDING,
            sender: msg.sender,
            receiver: receiver,
            amount: _deductFee(msg.value, contentHash.length != 0, yield),
            releaseTimestamp: releaseTimestamp,
            contentHash: contentHash,
            yieldStrategy: YieldStrategy({
                strategy: yieldStrategy,
                yieldToken: address(0) // TODO
             }),
            nftClaimedId: 0
        });
        gifts[giftId] = gift;
        senderGifts[msg.sender].push(gift);
        receiverGifts[receiver].push(gift);
        // TODO: Yield
        emit GiftCreated(msg.sender, receiver, giftId);
    }

    function withdrawBalance() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = payable(msg.sender).call{ value: balance }("");
        if (!success) {
            revert UntilThenV1__TransferFailed();
        }
        emit Withdraw(msg.sender, balance);
    }

    // PRIVATE & INTERNAL FUNCTIONS
    function _deductFee(uint256 amount, bool isContent, bool isYield) private view returns (uint256) {
        // Deduct content fee if content is present
        if (isContent) {
            if (amount < contentGiftFee) {
                revert UntilThenV1__InvalidGiftFee();
            }
            amount -= contentGiftFee;
        }

        // Deduct currency fee if there is still amount left and not using yield
        if (amount > 0 && !isYield) {
            if (amount < currencyGiftFee) {
                revert UntilThenV1__InvalidGiftFee();
            }
            amount -= currencyGiftFee;
        }
        return amount;
    }

    // PUBLIC & EXTERNAL VIEW FUNCTIONS
    function getTotalGifts() external view returns (uint256) {
        return totalGifts;
    }

    function getGiftById(uint256 id) external view returns (Gift memory) {
        return gifts[id];
    }

    function getSenderGifts(address sender) external view returns (Gift[] memory) {
        return senderGifts[sender];
    }

    function getReceiverGifts(address receiver) external view returns (Gift[] memory) {
        return receiverGifts[receiver];
    }
}
