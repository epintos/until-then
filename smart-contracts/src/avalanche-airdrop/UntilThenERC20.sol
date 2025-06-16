//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

contract UntilThenERC20 is ERC20, AccessControl, Ownable {
    bytes32 public constant MINT_AND_BURN_ROLE = keccak256("MINT_AND_BURN_ROLE");

    constructor() ERC20("Until Then", "UNTIL") Ownable(msg.sender) { }

    function grantMintAndBurnRole(address account) external onlyOwner {
        _grantRole(MINT_AND_BURN_ROLE, account);
    }

    function mint(address receiver, uint256 amount) external onlyRole(MINT_AND_BURN_ROLE) {
        _mint(receiver, amount);
    }

    function burn(address owner, uint256 amount) external onlyRole(MINT_AND_BURN_ROLE) {
        _burn(owner, amount);
    }
}
