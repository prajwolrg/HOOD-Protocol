// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

/**
* @title HOOD Oracle 
* @author Newton Poudel
**/


contract Oracle {
    string public name = "Oracle";
    address public owner;
    mapping(address => uint256) internal reference_data; // [QUOTE] => BASE USD
    
    event PriceSet(
        address indexed _quote,
        uint256 indexed _price);

    constructor() public {
        owner = msg.sender;
    }
    
    /*
    * Modifier
    * Only owner/ contract deployer can call method which has this modifier
    */
    modifier onlyOwner() {
        require(msg.sender == owner, "Oracle: Sender not owner error");
        _;
    }

    /*
    * Returns the price for _quote set in the contract in terma os uSD
    * reference_data["ETH"]["USD"]
    */    
    function get_reference_data(address _quote)
    public view returns(uint256) {
        return reference_data[_quote];
    }

    /*
    * Sets the price for _quote in terms of USD
    * Only owner can call this method
    * PriceSet eventlog
    */
    function set_reference_data(address _quote, uint _price) public onlyOwner {
        reference_data[_quote] = _price;
        emit PriceSet(_quote, _price);
    }
}
