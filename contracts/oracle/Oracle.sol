// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

/**
* @title HOOD Oracle 
* @author Newton Poudel
**/


contract Oracle {
    string public name = "Oracle";
    address public owner;
    mapping(string => mapping(string => uint256)) internal reference_data;
    
    event PriceSet(
        string indexed _quote,
        string indexed _base,
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
    * Returns the price for _quote/_base set in the contract
    * reference_data["ETH"]["USD"]
    */    
    function get_reference_data(string memory _quote, string memory _base)
    public view returns(uint256) {
        return reference_data[_quote][_base];
    }

    /*
    * Sets the price for _quote/_base
    * Only owner can call this method
    * PriceSet eventlog
    */
    function set_reference_data(string memory _quote, string memory _base, uint _price) public onlyOwner {
        reference_data[_quote][_base] = _price;
        emit PriceSet(_quote, _base, _price);
    }
}
