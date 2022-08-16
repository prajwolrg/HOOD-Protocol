// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

/**
* @title HOOD ERC20 Debt Token
* @author Newton Poudel
**/

import "../configuration/AddressProvider.sol";
import "../lending-pool/LendingPoolCore.sol";
import "hardhat/console.sol";
import "../utils/WadRayMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";


contract DToken is ERC20, ERC20Detailed {
    uint256 public constant UINT_MAX_VALUE = uint256(-1);
    using WadRayMath for uint256;

    AddressProvider private addressProvider;
    LendingPoolCore private core;
    // LendingPool private pool;

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
        core = LendingPoolCore(addressProvider.getLendingPoolCore());
    }

    modifier onlyLendingPoolCore() {
        require(
            msg.sender == address(core), 
            "Caller is not lending pool address"
        );
        _;
    }

    event MintOnBorrow(address indexed account, uint amount);
    event BurnOnRepay(address indexed account, uint amount);

    function transfer(address _to, uint256 _amount) public returns(bool) {
        return false;
    }

    function transferFrom(address _from, address _to, uint256 _amount) public returns(bool) {
        return false;
    }

    function mintOnBorrow(address _account, uint256 _amount) 
        external 
        onlyLendingPoolCore
    {
        cumulateBalanceInternal(_account);
    	_mint(_account, _amount);
        uint256 currentBalance = balanceOf(_account);
        uint256 _totalSupply = totalSupply();
    	emit MintOnBorrow(_account, _amount);
    }

    function burnOnRepay(address _account, uint256 _amount)
        external 
        onlyLendingPoolCore 
    {
        cumulateBalanceInternal(_account);
        _burn(_account, _amount);
        if (balanceOf(_account) == 0) {
            resetOnZeroBalance(_account);
        }
        uint256 currentBalance = balanceOf(_account);
        uint256 _totalSupply = totalSupply();
        emit BurnOnRepay(_account, _amount);
    }

    function principalBalanceOf(address _account) public view returns (uint principalBalance) {
    	return super.balanceOf(_account);
    }

    function balanceOf(address _account) public view returns (uint) {
    	uint principalBalance = super.balanceOf(_account);
        return calculateCumulateBalanceInternal(_account, principalBalance);
    }

    function principalTotalSupply() public view returns(uint256) {
        return super.totalSupply();
    }

    function totalSupply() public view returns(uint256) {
        uint256 currentPrincipalTotalSupply = principalTotalSupply();
        if (currentPrincipalTotalSupply == 0) {
            return 0;
        }
        uint256 assetIndex = core.getReserveNormalizedDebt(underlyingTokenAddress);
        uint256 cumulatedIndex = core.getReserveBorrowCumulativeIndex(underlyingTokenAddress);
        return currentPrincipalTotalSupply.wadToRay().rayMul(assetIndex).rayDiv(cumulatedIndex).rayToWad(); 
    }

    function cumulateBalanceInternal( address _user) 
        internal 
        returns(uint256, uint256, uint256, uint256) {
            uint256 prevPrincipalBalance = super.balanceOf(_user);
            uint256 balanceIncrease = balanceOf(_user).sub(prevPrincipalBalance);
            if (balanceIncrease > 0) {
                _mint(_user, balanceIncrease);
            }
            uint index = userIndexes[_user] = core.getReserveNormalizedDebt(underlyingTokenAddress);
            return (
                prevPrincipalBalance, 
                prevPrincipalBalance.add(balanceIncrease), 
                balanceIncrease, 
                index
            );
        }

    function calculateCumulateBalanceInternal(
        address _user, 
        uint256 _balance
    ) internal view returns (uint256) {
        uint userIndex = userIndexes[_user];
        if (userIndex == 0) {
            return 0;
        } else {
            uint assetIndex = core.getReserveNormalizedDebt(underlyingTokenAddress);
            return _balance.wadToRay().rayMul(assetIndex).rayDiv(userIndex).rayToWad();
        }
    }

    function getUserIndex(address _user) external view returns(uint256) {
        return userIndexes[_user];
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