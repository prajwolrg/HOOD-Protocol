// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import "../tokens/HoodToken.sol";
import "hardhat/console.sol";
import "../configuration/AddressProvider.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../utils/WadRayMath.sol";

contract RewardDistribution{

	using WadRayMath for uint256;
    using SafeMath for uint256;

    address public admin;
    uint public DAILY_TOKENS = 10000 * 1e18;
    uint public SECONDS_PER_DAY = 86400;
    uint public rewardTimestamp;
    AddressProvider public addressProvider;

    constructor(address _addressProvider) public {
        admin = msg.sender;
        rewardTimestamp = block.timestamp;
        addressProvider = AddressProvider(_addressProvider);
    }

    function initialize() external onlyAdmin {
        HoodToken hoodToken = HoodToken(addressProvider.getHoodToken());
        hoodToken.mintDailyRewards();
    }

    modifier onlyAdmin () {
		require(msg.sender == admin,
			"Caller must be admin");
		_;
	}

    mapping(address => uint) public assetConfig;
    mapping(address => mapping(address => uint)) internal userIndex;
    mapping(address => uint) internal assetIndex;
    mapping(address => uint) internal lastUpdateTimestamp;
    mapping(address => mapping(address => uint)) internal unclaimedRewards;
    address[] public assetList;    

    function initializeAssetConfig(address _asset, uint _percentage) 
    external onlyAdmin {
        bool inAssetList = false;
        for (uint i = 0; i < assetList.length; i++) {
            if (assetList[i] == _asset) {
                inAssetList = true;
            }
        }
        if (inAssetList == false) {
            assetList.push(_asset);
        }        
        // asset has been added to assetList
        assetConfig[_asset] = _percentage;
        lastUpdateTimestamp[_asset] = block.timestamp;
        checkOverHundred();
    }

    function checkOverHundred() internal {
        uint256 sum = 0;
        for (uint i = 0; i < assetList.length; i++) {
            address _asset = assetList[i];
            sum = sum.add(assetConfig[_asset]);
        }
        require(sum <= WadRayMath.wad(), "The sum cannot exceed 100%");
    }

    struct LocalVariable {
        address xasset;
        uint xuserIndex;
        uint xassetIndex;
        uint xunclaimedRewards;
        uint xemission;
        uint xbalance;
        uint xtotal;
        uint xtempNewAssetIndex;
        uint xaccruedRewards;
    }

    function mintDailyRewards() internal{
        uint currentTime = block.timestamp;
        HoodToken hoodToken = HoodToken(addressProvider.getHoodToken());
        if ((currentTime - rewardTimestamp) > SECONDS_PER_DAY) {
            hoodToken.mintDailyRewards();
            rewardTimestamp = currentTime;
        }
    }

    function claimRewards() external {
        mintDailyRewards();
        address user = msg.sender; 
        HoodToken hoodToken = HoodToken(addressProvider.getHoodToken());
        uint totalRewards = getRewards(user);
        hoodToken.transfer(user, totalRewards);
    }

    function getRewards(address _user) public view returns(uint256) {
        uint256 totalRewards = 0;
        LocalVariable memory vars;
        for (uint i = 0; i < assetList.length; i++) {
            vars.xasset = assetList[i];
            vars.xassetIndex = assetIndex[vars.xasset];
            vars.xuserIndex = userIndex[_user][vars.xasset];
            vars.xunclaimedRewards = unclaimedRewards[_user][vars.xasset];
            totalRewards.add(vars.xunclaimedRewards);

            vars.xemission = getEmissionPerSecond(vars.xasset);

            ERC20Detailed token = ERC20Detailed(vars.xasset);

            vars.xbalance = token.balanceOf(_user);
            vars.xtotal = token.totalSupply();

            vars.xtempNewAssetIndex = getAssetIndex(vars.xassetIndex, vars.xemission, block.timestamp, vars.xtotal);
            vars.xaccruedRewards = getRewardInternal(vars.xbalance, vars.xuserIndex, vars.xtempNewAssetIndex);
            totalRewards = totalRewards.add(vars.xaccruedRewards);
        }
        return totalRewards;
    }

    function handleAction(address _user, uint _balance, uint _total) external {
        address _asset = msg.sender;
        bool inAssetList = false;
        for (uint i = 0; i < assetList.length; i++) {
            if (assetList[i] == _asset) {
                inAssetList= true;
            }
        }
        require(inAssetList == true, "Not a valid asset");
        uint _unclaimedRewards = updateStateInternal(_asset, _user, _balance, _total);
        unclaimedRewards[_user][_asset] = unclaimedRewards[_user][_asset].add(_unclaimedRewards);
    }

    function updateStateInternal(
        address _asset, address _user, uint _balance, uint _total
    ) internal returns(uint) {
        uint _userIndex = userIndex[_user][_asset]; // 0
        uint _accruedRewards = 0; // 0
        uint newAssetIndex = updateAssetStateInternal(_asset, _total); 
        assetIndex[_asset] = newAssetIndex;
        if (_userIndex != newAssetIndex) {
            if (_balance > 0) {
                _accruedRewards = getRewardInternal(_balance, _userIndex, newAssetIndex);
            }
            userIndex[_user][_asset] = newAssetIndex;
        }
        return _accruedRewards;
    }

    function updateAssetStateInternal(address _asset, uint _total) internal returns (uint256) {
        uint beforeIndex = assetIndex[_asset]; //0
        uint _lastUpdateTimestamp = lastUpdateTimestamp[_asset];  // initialize
        uint currentTime = block.timestamp; //

        if (_lastUpdateTimestamp == currentTime) {
            return beforeIndex;
        }
        uint emission = getEmissionPerSecond(_asset); // 0.023
        uint newIndex = getAssetIndex(beforeIndex, emission, _lastUpdateTimestamp, _total); 
        lastUpdateTimestamp[_asset] = currentTime;
        return newIndex;
    }

    function getEmissionPerSecond(address _asset) public view returns (uint) {
        uint assetPercentage = assetConfig[_asset];
        uint assetDistributionPerDay = DAILY_TOKENS.wadMul(assetPercentage);
        return assetDistributionPerDay.div(SECONDS_PER_DAY);
    }

    function getAssetList() public view returns(address[] memory) {
        address[] memory list = new address[](assetList.length);
        for (uint i = 0; i < assetList.length; i++) {
            list[i] = assetList[i];
        }
        return list;
    }

    function getAssetPercentage(address _asset) public view returns(uint) {
        return assetConfig[_asset];
    }

    function getAssetIndex(uint index, uint emission, uint timestamp, uint total) internal view returns (uint) {      
        uint currentTime = block.timestamp;
        if ((emission == 0) || (total == 0)) {
            return index;
        } else {
            uint timeDiff = currentTime - timestamp + 10;
            return index.add(emission.mul(timeDiff).wadDiv(total));
        }
    }

    function getRewardInternal(uint _balance, uint _userIndex, uint _assetIndex) internal view returns (uint) {
        return _balance.wadMul(_assetIndex.sub(_userIndex));
    }
}