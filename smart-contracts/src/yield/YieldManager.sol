// SPDX-License-Identifier: UNLINCENSED
pragma solidity ^0.8.30;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IYieldManager {
    function depositETH(uint256 giftId) external payable;
    function withdrawETH(uint256 giftId, uint256 amount, address recipient) external;
    function depositERC20(address sender, uint256 giftId, uint256 amount) external;
    function withdrawERC20(uint256 giftId, uint256 amount, address recipient) external;
    function withdrawERC20Balance(address token, uint256 amount) external;
    function withdrawETHBalance(uint256 amount) external;
    function getTotalToReedem(uint256 giftId) external view returns (uint256);
}

abstract contract YieldManager is IYieldManager, Ownable, AccessControl, ReentrancyGuard {
    /// ERRORS
    error AaveYieldManager__TransferFailed();

    address public immutable i_weth;
    address public immutable i_yieldContract;
    address public immutable i_wethATokenAddress;
    address public immutable i_link;
    address public immutable i_linkATokenAddress;
    bytes32 public constant DEPOSIT_WITHDRAW_ROLE = keccak256("DEPOSIT_WITHDRAW_ROLE");

    struct DepositInfo {
        address asset;
        uint256 aTokenAmount;
        uint256 normalizedIncomeAtDeposit;
    }

    mapping(uint256 giftId => DepositInfo info) public s_giftDeposits;

    event Withdraw(address indexed receiver, uint256 amount);

    constructor(
        address _weth,
        address _yieldcontract,
        address _wethATokenAddress,
        address _link,
        address _linkATokenAddress
    )
        Ownable(msg.sender)
    {
        i_weth = _weth;
        i_yieldContract = _yieldcontract;
        i_wethATokenAddress = _wethATokenAddress;
        i_link = _link;
        i_linkATokenAddress = _linkATokenAddress;
    }

    function grantDepositWithdrawRole(address account) external onlyOwner {
        _grantRole(DEPOSIT_WITHDRAW_ROLE, account);
    }

    receive() external payable { }

    function withdrawERC20Balance(address token, uint256 amount) external onlyOwner {
        if (amount == type(uint256).max) {
            amount = IERC20(token).balanceOf(address(this));
        }
        bool success = IERC20(token).transfer(msg.sender, amount);
        if (!success) {
            revert AaveYieldManager__TransferFailed();
        }
        emit Withdraw(msg.sender, amount);
    }

    function withdrawETHBalance(uint256 amount) external onlyOwner {
        if (amount == type(uint256).max) {
            amount = address(this).balance;
        }
        (bool success,) = payable(msg.sender).call{ value: amount }("");
        if (!success) {
            revert AaveYieldManager__TransferFailed();
        }
        emit Withdraw(msg.sender, amount);
    }
}
