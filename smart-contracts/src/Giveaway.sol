// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Log, ILogAutomation } from "@chainlink/src/v0.8/automation/interfaces/ILogAutomation.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { VRFConsumerBaseV2Plus } from "@chainlink/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import { VRFV2PlusClient } from "@chainlink/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import { AggregatorV3Interface } from "@chainlink/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import { UntilThenERC20 } from "src/avalanche-airdrop/UntilThenERC20.sol";

contract Giveaway is ILogAutomation, VRFConsumerBaseV2Plus, ReentrancyGuard {
    error Giveaway__InvalidRequestId();
    error Giveaway__TransferFailed();
    error Giveaway__InvalidPrice();
    error Giveaway__NotForwarder();

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUMBER_OF_RANDOM_WORDS = 1;
    uint256 private constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 private constant PRECISION = 1e18;
    bytes32 public immutable i_keyHash;
    address public immutable i_priceFeed;
    bool public s_giveawayEnabled = true;
    uint256 public s_lastRequestId;
    uint256 public s_subscriptionId;
    uint32 public s_callbackGasLimit;
    uint256 public s_usdPrize = 100e18; // $100
    address public s_timeBasedforwarder;
    address public s_logTriggerforwarder;

    address[] public s_receivers;
    mapping(address user => uint256 amount) internal s_winners;

    event CallbackGasLimitUpdated(address indexed owner, uint32 callbackGasLimit);
    event SubscriptionIdUpdated(address indexed owner, uint256 subscriptionId);
    event GiveawayStatusUpdated(address indexed owner, bool newStatus);
    event ReceiverAddedToGiveaway(address indexed receiver);
    event RequestedRandomNumber(uint256 requestId);
    event NoReceiversForGiveaway();
    event GiveawayComplete(uint256 indexed requestId, address indexed winner, uint256 winnerId, uint256 prize);
    event WithdrawComplete(address indexed owner, uint256 amount);
    event PrizeUpdated(address indexed owner, uint256 amount);
    event ForwardersUpdated(address indexed owner, address newTimeBasedForwarder, address newLogTriggerForwarder);

    modifier onlyTimeBasedForwarder() {
        if (msg.sender != s_timeBasedforwarder && msg.sender != owner()) {
            revert Giveaway__NotForwarder();
        }
        _;
    }

    modifier onlyLogTriggerForwarder() {
        if (msg.sender != s_logTriggerforwarder && msg.sender != owner()) {
            revert Giveaway__NotForwarder();
        }
        _;
    }

    constructor(
        address vrfCoordinator,
        bytes32 gasLane,
        uint256 subscriptionId,
        uint32 callbackGasLimit,
        address priceFeed
    )
        payable
        VRFConsumerBaseV2Plus(vrfCoordinator)
    {
        i_keyHash = gasLane;
        s_subscriptionId = subscriptionId;
        s_callbackGasLimit = callbackGasLimit;
        i_priceFeed = priceFeed;
    }

    function updateForwarders(address newTimeBasedForwarder, address newLogTriggerForwarder) external onlyOwner {
        s_timeBasedforwarder = newTimeBasedForwarder;
        s_logTriggerforwarder = newLogTriggerForwarder;
        emit ForwardersUpdated(msg.sender, newTimeBasedForwarder, newLogTriggerForwarder);
    }

    function updatecallbackGasLimit(uint32 callbackGasLimit) external onlyOwner {
        s_callbackGasLimit = callbackGasLimit;
        emit CallbackGasLimitUpdated(msg.sender, callbackGasLimit);
    }

    function updateSubscriptionId(uint256 subscriptionId) external onlyOwner {
        s_subscriptionId = subscriptionId;
        emit SubscriptionIdUpdated(msg.sender, subscriptionId);
    }

    function updateGiveawayStatus(bool newStatus) external onlyOwner {
        s_giveawayEnabled = newStatus;
        emit GiveawayStatusUpdated(msg.sender, newStatus);
    }

    function updatePrize(uint256 usdAmount) external onlyOwner {
        s_usdPrize = usdAmount;
        emit PrizeUpdated(msg.sender, usdAmount);
    }

    function checkLog(
        Log calldata log,
        bytes memory
    )
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (s_giveawayEnabled) {
            upkeepNeeded = true;
            address receiverAddress = _bytes32ToAddress(log.topics[1]);
            performData = abi.encode(receiverAddress);
        }
    }

    /**
     * @notice Function called by the Upkeep that will add the receiver to the giveaway array
     * @param performData data including the receiver's address
     */
    function performUpkeep(bytes calldata performData) external override onlyLogTriggerForwarder {
        address giftReceiver = abi.decode(performData, (address));
        s_receivers.push(giftReceiver);

        emit ReceiverAddedToGiveaway(giftReceiver);
    }

    /**
     * @notice Function called by the Time Upkeep that chooses a winner for the Giveaway
     * @notice Function calls Chainlink VRF to choose a winner
     * @notice This function can only be called by a Chainlink Forward and the owner
     */
    function performGiveaway() external onlyTimeBasedForwarder {
        if (s_receivers.length == 0) {
            emit NoReceiversForGiveaway();
            return;
        }
        s_lastRequestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: i_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: s_callbackGasLimit,
                numWords: NUMBER_OF_RANDOM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({ nativePayment: false }))
            })
        );

        emit RequestedRandomNumber(s_lastRequestId);
    }

    receive() external payable { }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = msg.sender.call{ value: balance }("");
        if (!success) {
            revert Giveaway__TransferFailed();
        }
        emit WithdrawComplete(msg.sender, balance);
    }

    /**
     * @notice Function called by Chainlink after requesting random numbers
     * @param requestId Original request id
     * @param randomWords Random word used to choose a winner
     */
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override nonReentrant {
        if (requestId != s_lastRequestId) {
            revert Giveaway__InvalidRequestId();
        }

        if (s_receivers.length == 0) {
            emit NoReceiversForGiveaway();
            return;
        }

        uint256 winnerId = randomWords[0] % s_receivers.length;
        address winner = s_receivers[winnerId];

        uint256 prize = _usdToETH(s_usdPrize);
        s_winners[winner] += prize;

        delete s_receivers;

        (bool success,) = winner.call{ value: prize }("");
        if (!success) {
            revert Giveaway__TransferFailed();
        }

        emit GiveawayComplete(requestId, winner, winnerId, prize);
    }

    /**
     * @notice Converts the giveaway amount in USD to ETH
     * @param usdAmountInWei Value in ETH
     */
    function _usdToETH(uint256 usdAmountInWei) private view returns (uint256 ethAmount) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(i_priceFeed);
        (, int256 price,,,) = priceFeed.latestRoundData();
        if (price <= 0) {
            revert Giveaway__InvalidPrice();
        }

        return (usdAmountInWei * PRECISION) / (uint256(price) * ADDITIONAL_FEED_PRECISION);
    }

    function _bytes32ToAddress(bytes32 _address) private pure returns (address) {
        return address(uint160(uint256(_address)));
    }

    function getUserWins(address user) external view returns (uint256) {
        return s_winners[user];
    }
}
