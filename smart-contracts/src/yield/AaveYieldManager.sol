// SPDX-License-Identifier: UNLINCENSED
pragma solidity ^0.8.30;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { YieldManager } from "./YieldManager.sol";

interface IWETHGateway {
    function depositETH(address pool, address onBehalfOf, uint16 referralCode) external payable;
    function withdrawETH(address pool, uint256 amount, address to) external;
}

interface IAavePool {
    function getReserveNormalizedIncome(address asset) external view returns (uint256);
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IAaveLendingPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
}

contract AaveYieldManager is YieldManager {
    using SafeERC20 for IERC20;

    uint16 public constant REFERRAL_CODE = 0; // No referral code

    event WithdrawETH(uint256 indexed giftId, address indexed recipient, uint256 amount);
    event WithdrawERC20(uint256 indexed giftId, address indexed recipient, uint256 amount);
    event DepositedETH(uint256 indexed giftId, uint256 amount, uint256 normalizedIncomeAtDeposit);
    event DepositedERC20(
        uint256 indexed giftId, address indexed sender, uint256 amount, uint256 normalizedIncomeAtDeposit
    );

    constructor(
        address _weth,
        address _yieldContract,
        address _wethATokenAddress,
        address _link,
        address _linkATokenAddress
    )
        YieldManager(_weth, _yieldContract, _wethATokenAddress, _link, _linkATokenAddress)
    { }

    // ETH Deposit
    function depositETH(uint256 giftId) external payable override nonReentrant onlyRole(DEPOSIT_WITHDRAW_ROLE) {
        require(s_giftDeposits[giftId].aTokenAmount == 0, "Gift already has deposit");
        require(msg.value > 0, "No ETH sent");

        uint256 aTokenBefore = IERC20(i_wethATokenAddress).balanceOf(address(this));

        IWETHGateway(i_weth).depositETH{ value: msg.value }(i_yieldContract, address(this), REFERRAL_CODE);

        uint256 aTokenAfter = IERC20(i_wethATokenAddress).balanceOf(address(this));
        uint256 aTokenReceived = aTokenAfter - aTokenBefore;

        uint256 normalizedIncomeNow = IAavePool(i_yieldContract).getReserveNormalizedIncome(i_weth);

        s_giftDeposits[giftId] =
            DepositInfo({ asset: i_weth, aTokenAmount: aTokenReceived, normalizedIncomeAtDeposit: normalizedIncomeNow });
        emit DepositedETH(giftId, msg.value, normalizedIncomeNow);
    }

    // ERC20 Deposit
    function depositERC20(
        address sender,
        uint256 giftId,
        uint256 amount
    )
        external
        override
        nonReentrant
        onlyRole(DEPOSIT_WITHDRAW_ROLE)
    {
        require(amount > 0, "Amount must be > 0");
        require(s_giftDeposits[giftId].aTokenAmount == 0, "Gift already has deposit");

        IERC20 token = IERC20(i_link);

        // Pull tokens from user
        token.safeTransferFrom(sender, address(this), amount);

        // Approve Aave LendingPool to pull tokens
        token.approve(i_yieldContract, amount);

        address aToken = i_linkATokenAddress;
        uint256 aTokenBefore = IERC20(aToken).balanceOf(address(this));

        IAaveLendingPool(i_yieldContract).supply(i_link, amount, address(this), REFERRAL_CODE);

        uint256 aTokenAfter = IERC20(aToken).balanceOf(address(this));
        uint256 aTokenReceived = aTokenAfter - aTokenBefore;

        uint256 normalizedIncomeNow = IAavePool(i_yieldContract).getReserveNormalizedIncome(i_link);

        s_giftDeposits[giftId] =
            DepositInfo({ asset: i_link, aTokenAmount: aTokenReceived, normalizedIncomeAtDeposit: normalizedIncomeNow });
        emit DepositedERC20(giftId, sender, amount, normalizedIncomeNow);
    }

    // Withdraw ETH
    function withdrawETH(
        uint256 giftId,
        uint256 amount,
        address recipient
    )
        external
        override
        nonReentrant
        onlyRole(DEPOSIT_WITHDRAW_ROLE)
    {
        DepositInfo storage info = s_giftDeposits[giftId];
        require(info.aTokenAmount > 0, "No deposit");
        require(info.asset == i_weth, "Deposit is not ETH");

        uint256 aTokenAmount = info.aTokenAmount;
        delete s_giftDeposits[giftId];

        IERC20(i_wethATokenAddress).approve(i_weth, aTokenAmount);

        IWETHGateway(i_weth).withdrawETH(i_yieldContract, aTokenAmount, address(this));
        (bool success,) = recipient.call{ value: amount }("");
        if (!success) {
            revert AaveYieldManager__TransferFailed();
        }
        emit WithdrawETH(giftId, recipient, amount);
    }

    // Withdraw ERC20
    function withdrawERC20(
        uint256 giftId,
        uint256 amount,
        address recipient
    )
        external
        override
        nonReentrant
        onlyRole(DEPOSIT_WITHDRAW_ROLE)
    {
        DepositInfo storage info = s_giftDeposits[giftId];
        require(info.aTokenAmount > 0, "No deposit");
        require(info.asset != i_weth, "Deposit is ETH, use withdrawETH");

        uint256 aTokenAmount = info.aTokenAmount;
        address asset = info.asset;
        delete s_giftDeposits[giftId];

        IAavePool(i_yieldContract).withdraw(asset, aTokenAmount, address(this));

        IERC20(asset).safeTransfer(recipient, amount);
        emit WithdrawERC20(giftId, recipient, amount);
    }

    // Calculate total redeemable amount (principal + yield)
    function getTotalToReedem(uint256 giftId) external view override returns (uint256) {
        DepositInfo storage info = s_giftDeposits[giftId];
        require(info.aTokenAmount > 0, "No deposit");

        if (info.normalizedIncomeAtDeposit == 0) {
            // If normalized income at deposit is 0, return the aToken amount directly
            // This happens in Sepolia with ETH deposits
            return info.aTokenAmount;
        }

        uint256 normalizedIncomeNow = IAavePool(i_yieldContract).getReserveNormalizedIncome(info.asset);

        // Scale by ratio of current normalized income over income at deposit time
        return (info.aTokenAmount * normalizedIncomeNow) / info.normalizedIncomeAtDeposit;
    }
}
