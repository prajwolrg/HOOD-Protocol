pragma solidity ^0.5.0;

/**
* @title Greeter Token
* Used to create a reserve
* @author Newton Poudel
**/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

contract Greeter is ERC20, ERC20Detailed, ERC20Mintable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
        ) ERC20Detailed(_name, _symbol, _decimals) public {
    }
}