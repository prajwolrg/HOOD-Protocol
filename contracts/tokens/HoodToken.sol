pragma solidity ^0.5.0;

/**
* @title HOOD ERC2 Token
* Used for rewards
* @author Newton Poudel
**/

import "../configuration/AddressProvider.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";

contract HoodToken is ERC20, ERC20Detailed, ERC20Mintable {
    AddressProvider public addressProvider;
    uint private DAILY_REWARD = 10000 * 1e18;

    constructor(address _addressProvider) ERC20Detailed("HOOD Token", "hood", 18) public {
        addressProvider = AddressProvider(_addressProvider);
    }

    function mintDailyRewards() external {
        address rewardDistribution = addressProvider.getRewardDistribution();
        require(msg.sender == rewardDistribution, "Only rewards contract can mint");
        _mint(rewardDistribution, DAILY_REWARD);        
    }
}
