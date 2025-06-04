//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { console } from "forge-std/console.sol";
import { GiftNFT } from "src/GiftNFT.sol";

contract UntilThenV1 is Ownable, ReentrancyGuard {
    /// ERRORS
    error UntilThenV1__ReceiverCannotBeZeroAddress();
    error UntilThenV1__InvalidGiftFee();
    error UntilThenV1__ReleaseTimestampCannotBeInThePast();
    error UntilThenV1__TransferFailed();
    error UntilThenV1__InvalidYieldStrategy();
    error UntilThenV1__GiftDoesNotExist();
    error UntilThenV1__GiftHasBeenClaimedAlready();
    error UntilThenV1__NotAuthorizedToClaimGift();
    error UntilThenV1__GiftCannotBeClaimedYet();

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
    uint256 internal totalGifts;
    GiftNFT internal giftNFTContract;
    mapping(address receiver => Gift[] gifts) internal receiverGifts;
    mapping(address sender => Gift[] gifts) internal senderGifts;
    mapping(uint256 id => Gift gift) internal gifts;

    // @notice Base token deposited for gifts
    mapping(address sender => uint256 amount) internal amountDeposited;

    // @notice fee when sending only content
    uint256 internal contentGiftFee;

    // @notice fee when sending currency, token or an NFT
    uint256 internal currencyGiftFee;

    /// EVENTS
    event GiftCreated(address indexed sender, address indexed receiver, uint256 giftId);
    event Withdraw(address indexed receiver, uint256 amount);
    event GiftClaimed(
        address indexed receiver, uint256 indexed giftId, uint256 giftAmountToClaim, uint256 nftId, bytes contentHash
    );

    /// FUNCTIONS

    // CONSTRUCTOR
    constructor(uint256 _contentGiftFee, uint256 _currencyGiftFee, address _giftNFTContract) Ownable(msg.sender) {
        contentGiftFee = _contentGiftFee;
        currencyGiftFee = _currencyGiftFee;
        giftNFTContract = GiftNFT(_giftNFTContract);
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

    function claimGift(uint256 giftId) external nonReentrant returns (uint256 nftId) {
        Gift storage gift = gifts[giftId];
        if (gift.status == GiftStatus.ABSENT) {
            revert UntilThenV1__GiftDoesNotExist();
        }

        if (gift.status == GiftStatus.CLAIMED) {
            revert UntilThenV1__GiftHasBeenClaimedAlready();
        }
        if (gift.receiver != msg.sender) {
            revert UntilThenV1__NotAuthorizedToClaimGift();
        }
        if (gift.releaseTimestamp > block.timestamp) {
            revert UntilThenV1__GiftCannotBeClaimedYet();
        }

        gift.status = GiftStatus.CLAIMED;

        // TODO: Unyield token. Get fee
        uint256 giftAmountToClaim = gift.amount;

        nftId = giftNFTContract.mint(msg.sender, gift.id, gift.contentHash);
        gift.nftClaimedId = nftId;

        if (gift.yieldStrategy.strategy == AvailableYieldStrategies.NONE) {
            (bool success,) = msg.sender.call{ value: giftAmountToClaim }("");
            if (!success) {
                revert UntilThenV1__TransferFailed();
            }
        }
        emit GiftClaimed(msg.sender, giftId, giftAmountToClaim, nftId, gift.contentHash);
        return nftId;
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
