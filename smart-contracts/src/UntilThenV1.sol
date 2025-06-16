//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { console } from "forge-std/console.sol";
import { GiftNFT } from "src/GiftNFT.sol";
import { IPFSFunctionsConsumer } from "src/IPFSFunctionsConsumer.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { IYieldManager } from "src/yield/YieldManager.sol";

contract UntilThenV1 is Ownable, ReentrancyGuard {
    /// ERRORS
    error UntilThenV1__ReceiverCannotBeZeroAddress();
    error UntilThenV1__InvalidGiftFee();
    error UntilThenV1__TransferFailed();
    error UntilThenV1__GiftDoesNotExist();
    error UntilThenV1__GiftHasBeenClaimedAlready();
    error UntilThenV1__NotAuthorizedToClaimGift();
    error UntilThenV1__GiftCannotBeClaimedYet();
    error UntilThenV1__CannotBeZeroAddress();
    error UntilThenV1__InvalidYieldStrategiesLength();
    error UntilThenV1__InvalidYieldFee();

    /// TYPES
    enum GiftStatus {
        ABSENT,
        PENDING,
        CLAIMED
    }

    struct Gift {
        uint256 id;
        uint256 amount;
        uint256 releaseTimestamp;
        uint256 nftClaimedId;
        GiftStatus status;
        address sender;
        address receiver;
        bool isYield;
        bool linkYield;
        string contentHash;
    }

    /// STATE VARIABLES
    uint256 internal totalGifts;
    GiftNFT internal giftNFTContract;
    IPFSFunctionsConsumer internal ipfsFunctionsConsumer;
    mapping(address receiver => Gift[] gifts) internal receiverGifts;
    mapping(address sender => Gift[] gifts) internal senderGifts;
    mapping(uint256 id => Gift gift) internal gifts;
    mapping(string yieldCode => IYieldManager yieldManager) public yieldManagers;

    // @notice Base token deposited for gifts
    mapping(address sender => uint256 amount) internal amountDeposited;

    // @notice fee when sending only content
    uint256 internal contentGiftFee;

    // @notice fee when sending currency, token or an NFT
    uint256 internal currencyGiftFee;
    uint256 internal currencyGiftLinkFee;

    uint256 internal yieldFeePercentage = 10;

    IYieldManager public yieldManager;
    address public linkTokenAddress;

    /// EVENTS
    event GiftCreated(address indexed sender, address indexed receiver, uint256 giftId);
    event Withdraw(address indexed receiver, uint256 amount);
    event GiftClaimed(
        address indexed receiver, uint256 indexed giftId, uint256 giftAmountToClaim, uint256 nftId, bytes32 requestId
    );
    event YieldFeePercentageUpdated(uint256 newYieldFeePercentage);

    /// FUNCTIONS

    // CONSTRUCTOR
    constructor(
        uint256 _contentGiftFee,
        uint256 _currencyGiftFee,
        uint256 _currencyGiftLinkFee,
        address _giftNFTContract,
        address _ipfsFunctionsConsumer,
        address _yieldManager,
        address _linkTokenAddress
    )
        Ownable(msg.sender)
    {
        contentGiftFee = _contentGiftFee;
        currencyGiftFee = _currencyGiftFee;
        currencyGiftLinkFee = _currencyGiftLinkFee;
        giftNFTContract = GiftNFT(_giftNFTContract);
        ipfsFunctionsConsumer = IPFSFunctionsConsumer(_ipfsFunctionsConsumer);
        yieldManager = IYieldManager(_yieldManager);
        linkTokenAddress = _linkTokenAddress;
    }

    function updateIPFSFunctionsConsumer(address _ipfsFunctionsConsumer) external onlyOwner {
        if (_ipfsFunctionsConsumer == address(0)) {
            revert UntilThenV1__CannotBeZeroAddress();
        }
        ipfsFunctionsConsumer = IPFSFunctionsConsumer(_ipfsFunctionsConsumer);
    }

    function updateYieldFeePercentage(uint256 newYieldFeePercentage) external onlyOwner {
        if (newYieldFeePercentage > 100) {
            revert UntilThenV1__InvalidYieldFee();
        }
        yieldFeePercentage = newYieldFeePercentage;
        emit YieldFeePercentageUpdated(newYieldFeePercentage);
    }

    // EXTERNAL FUNCTIONS
    // @dev users must approve link token to AaveYieldManager before calling this function
    function createGift(
        address receiver,
        uint256 releaseTimestamp,
        string calldata contentHash,
        bool yield,
        uint256 erc20Amount
    )
        external
        payable
        returns (uint256 giftId)
    {
        if (receiver == address(0)) {
            revert UntilThenV1__ReceiverCannotBeZeroAddress();
        }

        if (msg.value == 0) {
            revert UntilThenV1__InvalidGiftFee();
        }

        giftId = ++totalGifts;
        bool linkYield = erc20Amount > 0;
        uint256 amount;
        if (erc20Amount > 0 && yield) {
            // ETH is only used to pay the fees. Any extra amount is not refunded.
            _deductFee(msg.value, bytes(contentHash).length != 0, yield);
            amount = erc20Amount;
        } else {
            amount = _deductFee(msg.value, bytes(contentHash).length != 0, yield);
        }
        Gift memory gift = Gift({
            id: giftId,
            status: GiftStatus.PENDING,
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            releaseTimestamp: releaseTimestamp,
            contentHash: contentHash,
            linkYield: linkYield,
            isYield: yield,
            nftClaimedId: 0
        });
        gifts[giftId] = gift;
        senderGifts[msg.sender].push(gift);
        receiverGifts[receiver].push(gift);
        if (yield) {
            if (linkYield) {
                yieldManager.depositERC20(gift.sender, giftId, erc20Amount);
            } else {
                yieldManager.depositETH{ value: gift.amount }(giftId);
            }
        }
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

        nftId = giftNFTContract.mint(msg.sender, gift.id);
        gift.nftClaimedId = nftId;

        uint256 giftAmountToClaim = gift.amount;
        if (gift.isYield) {
            uint256 withdrawAmount = yieldManager.getTotalToReedem(giftId);
            uint256 yieldGain = withdrawAmount > gift.amount ? withdrawAmount - gift.amount : 0;
            uint256 yieldFee = (yieldGain * yieldFeePercentage) / 100;
            if (gift.linkYield) {
                giftAmountToClaim = gift.amount - (currencyGiftLinkFee > yieldFee ? currencyGiftLinkFee : yieldFee);
                yieldManager.withdrawERC20(giftId, giftAmountToClaim, gift.receiver);
            } else {
                giftAmountToClaim = gift.amount - (currencyGiftFee > yieldFee ? currencyGiftFee : yieldFee);
                yieldManager.withdrawETH(giftId, giftAmountToClaim, gift.receiver);
            }
        } else if (giftAmountToClaim > 0) {
            (bool success,) = msg.sender.call{ value: giftAmountToClaim }("");
            if (!success) {
                revert UntilThenV1__TransferFailed();
            }
        }
        bytes32 requestId;
        if (bytes(gift.contentHash).length > 0) {
            string[] memory args = new string[](3);
            args[0] = string(gift.contentHash);
            args[1] = Strings.toHexString(uint160(gift.sender), 20);
            args[2] = Strings.toHexString(uint160(gift.receiver), 20);
            ipfsFunctionsConsumer.sendRequest(nftId, args);
        }

        emit GiftClaimed(msg.sender, giftId, giftAmountToClaim, nftId, requestId);
        return nftId;
    }

    function sendConsumerRequest(
        uint256 nftId,
        address sender,
        address receiver,
        string calldata contentHash
    )
        external
        onlyOwner
    {
        string[] memory args = new string[](3);
        args[0] = string(contentHash);
        args[1] = Strings.toHexString(uint160(sender), 20);
        args[2] = Strings.toHexString(uint160(receiver), 20);
        ipfsFunctionsConsumer.sendRequest(nftId, args);
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
    function _deductFee(uint256 ethAmount, bool isContent, bool isYield) private view returns (uint256) {
        // Deduct content fee if content is present
        if (isContent) {
            if (ethAmount < contentGiftFee) {
                revert UntilThenV1__InvalidGiftFee();
            }
            ethAmount -= contentGiftFee;
        }

        // Deduct currency fee if there is still amount left and not using yield
        if (ethAmount > 0 && !isYield) {
            if (ethAmount < currencyGiftFee) {
                revert UntilThenV1__InvalidGiftFee();
            }
            ethAmount -= currencyGiftFee;
        }
        return ethAmount;
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

    function getIPFSConsumer() external view returns (address) {
        return address(ipfsFunctionsConsumer);
    }
}
