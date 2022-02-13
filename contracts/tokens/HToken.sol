// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

/**
* @title HOOD ERC20 Token
* @author Newton Poudel
**/

import "../configuration/AddressProvider.sol";
import "../lending-pool/LendingPool.sol";
import "hardhat/console.sol";
import "../utils/WadRayMath.sol";
import "../lending-pool/LendingPoolCore.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";


contract HToken is ERC20, ERC20Detailed {
    uint256 public constant UINT_MAX_VALUE = uint256(-1);
    using WadRayMath for uint256;

    AddressProvider private addressProvider;
    LendingPoolCore private core;
    LendingPool private pool;

    address public underlyingTokenAddress;
    mapping(address => uint256) private userIndexes;

    constructor(
    	string memory _name,
    	string memory _symbol,
        uint8 _decimals,
        address _addressesProvider,
        address _underlyingTokenAddress
    	) ERC20Detailed(_name, _symbol, _decimals) public {
            
        addressProvider = AddressProvider(_addressesProvider);
        underlyingTokenAddress = _underlyingTokenAddress;
        pool = LendingPool(addressProvider.getLendingPool());
        core = LendingPoolCore(addressProvider.getLendingPoolCore());
    }

    modifier onlyLendingPool() {
        require(
            msg.sender == address(pool), 
            "Caller is not lending pool address"
        );
        _;
    }

    event Redeem(address indexed account, uint amount);
    event MintOnDeposit(address indexed account, uint amount);
    event BurnOnRedeem(address indexed account, uint amount);

    function mintOnDeposit(address _account, uint256 _amount) 
        external 
       onlyLendingPool
    {
        cumulateBalanceInternal(_account);
    	_mint(_account, _amount);
    	emit MintOnDeposit(_account, _amount);
    }

    function burnOnRedeem(address _account, uint256 _amount) internal {
        cumulateBalanceInternal(_account);
        _burn(_account, _amount);
        emit BurnOnRedeem(_account, _amount);
    }

    function principalBalanceOf(address _account) public view returns (uint principalBalance) {
    	return super.balanceOf(_account);
    }

    function balanceOf(address _account) public view returns (uint) {
    	uint principalBalance = principalBalanceOf(_account);
        return calculateCumulateBalanceInternal(_account, principalBalance);
    }

    function principalTotalSupply() public view returns (uint) {
        return super.totalSupply();
    }

    function totalSupply() public view returns(uint) {
        uint256 currentPrincipalTotalSupply = principalTotalSupply();
        if (currentPrincipalTotalSupply == 0) {
            return 0;
        }
        uint256 assetIndex = core.getReserveNormalizedIncome(underlyingTokenAddress);
        return currentPrincipalTotalSupply.wadToRay().rayMul(assetIndex).rayToWad();
    }

    function cumulateBalanceInternal( address _user) 
        internal 
        returns(uint256, uint256, uint256, uint256) {
            uint256 prevPrincipalBalance = super.balanceOf(_user);
            uint256 balanceIncrease = balanceOf(_user).sub(prevPrincipalBalance);
            if (balanceIncrease > 0) {
                _mint(_user, balanceIncrease);
            }
            uint index = userIndexes[_user] = core.getReserveNormalizedIncome(underlyingTokenAddress);
            return (
                prevPrincipalBalance, 
                prevPrincipalBalance.add(balanceIncrease), 
                balanceIncrease, 
                index
            );
        }

    function calculateCumulateBalanceInternal(address _account, uint256 _balance)
    internal view returns(uint256) {
        uint256 userIndex = userIndexes[_account];
        if (userIndex == 0) {
            return 0;
        } else {
            uint assetIndex = core.getReserveNormalizedIncome(underlyingTokenAddress);
            return _balance.wadToRay().rayMul(assetIndex).rayDiv(userIndex).rayToWad();
        }
    }

    function getUserIndex(address _user) external view returns(uint256) {
        return userIndexes[_user];
    }

    function redeem(uint256 _amount) external {
        address payable _user = msg.sender;
        uint256 balance = balanceOf(_user);
        uint amountToRedeem = _amount;

        if (_amount == UINT_MAX_VALUE) {
            amountToRedeem = balance;
        }

        require(amountToRedeem <= balance, "Insufficent balance to withdraw");
        
        // require(core.isBalanceDecreaseAllowed(underlyingTokenAddress, msg.sender, amountToRedeem), "Redeem not allowed");

        burnOnRedeem(msg.sender, amountToRedeem);

        if (balance.sub(amountToRedeem) == 0) {
            resetOnZeroBalance(msg.sender);
        }

        pool.redeem(underlyingTokenAddress, _user, amountToRedeem);
        emit Redeem(msg.sender, amountToRedeem);
    }

    function resetOnZeroBalance(address _user) internal returns(bool) {
        uint256 balance = balanceOf(_user);
        if (balance == 0) {
            userIndexes[_user] = 0;
            return true;
        } else {
            return false;
        }

    }
}