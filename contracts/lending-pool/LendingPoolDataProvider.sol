// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../utils/WadRayMath.sol";
import "../tokens/HToken.sol";
import "../tokens/DToken.sol";
import "./LendingPoolCore.sol";
import "hardhat/console.sol";
import "../oracle/Oracle.sol";
import "../configuration/AddressProvider.sol";

/** 
* @title LendingPool Data Provider
* @author Newton Poudel
**/

contract LendingPoolDataProvider {
	using WadRayMath for uint256;
    using SafeMath for uint256;
    
    AddressProvider public addressProvider;
    LendingPoolCore public core;

	constructor(address _addressesProvider) public {
        addressProvider = AddressProvider(_addressesProvider);
    }

    function initialize() external {
        core = LendingPoolCore(addressProvider.getLendingPoolCore());
	}

    function getReserveData(address _reserve) public view returns
    	(
            uint lastUpdateTimestamp,
			uint borrowRate,
			uint liquidityRate,
			uint totalLiquidity,
			uint availableLiquidity,
			uint totalBorrows,
			uint borrowCumulativeIndex,
			uint liquidityCumulativeIndex,
			address hTokenAddress,
			address dTokenAddress
        )
    {
    	lastUpdateTimestamp = core.getReserveLastUpdateTimestamp(_reserve);
		borrowRate = core.getReserveBorrowRate(_reserve);
		liquidityRate = core.getReserveLiquidityRate(_reserve);
		totalLiquidity = core.getReserveTotalLiquidity(_reserve);
		availableLiquidity = core.getReserveAvailableLiquidity(_reserve);
		totalBorrows = core.getReserveTotalBorrows(_reserve);
		borrowCumulativeIndex = core.getReserveBorrowCumulativeIndex(_reserve);
		liquidityCumulativeIndex = core.getReserveLiquidityCumulativeIndex(_reserve);
		hTokenAddress = core.getReserveHTokenAddress(_reserve);
		dTokenAddress = core.getReserveDTokenAddress(_reserve);
    }

    function getAllReserves() public view returns(address[] memory) {
    	return core.getAllReserveList();
    }

    function getUserReserveData(address _reserve, address _user) public view returns
    	(
    		uint256 totalLiquidity, 
    		uint256 totalBorrows,
            uint256 totalLiquidityUSD,
            uint256 totalBorrowsUSD,
            uint256 lastUpdateTimestamp
    	) 
    {
        Oracle oracle = Oracle(addressProvider.getPriceOracle());
        uint256 unitPrice = oracle.get_reference_data(_reserve);
    	totalLiquidity = HToken(core.getReserveHTokenAddress(_reserve)).balanceOf(_user);
		totalBorrows = DToken(core.getReserveDTokenAddress(_reserve)).balanceOf(_user);
        totalLiquidityUSD = totalLiquidity.wadMul(unitPrice);
        totalBorrowsUSD = totalBorrows.wadMul(unitPrice);
        lastUpdateTimestamp = core.getReserveLastUserUpdateTimestamp(_reserve, _user);
    }

     struct SystemLevelLocalVariable {
        uint256 totalBorrows;
        uint256 totalLiquidity;
        uint256 borrowRate;
        uint256 liquidityRate;
        address reserveAddress;
        uint256 reservePriceInUSD;
        uint256 totalLiquidityUSD;
        uint256 totalBorrowsUSD;
    }

    function getSystemLevelInfo() public view returns 
        (
            uint totalLiquidity,
            uint totalBorrows,
            uint liquidityRate,
            uint borrowRate
        )
    {
        SystemLevelLocalVariable memory vars;
        Oracle oracle = Oracle(addressProvider.getPriceOracle());
        address[] memory reserveList = getAllReserves();
        uint len = reserveList.length;

        for(uint8 i = 0; i < len; i++ ) {
            vars.reserveAddress = reserveList[i];
            (,vars.borrowRate, vars.liquidityRate, vars.totalLiquidity,,vars.totalBorrows,,,,) = getReserveData(vars.reserveAddress);
            vars.reservePriceInUSD = oracle.get_reference_data(vars.reserveAddress);
            vars.totalLiquidityUSD = vars.totalLiquidity.wadMul(vars.reservePriceInUSD);
            vars.totalBorrowsUSD = vars.totalBorrows.wadMul(vars.reservePriceInUSD);
            totalLiquidity += vars.totalLiquidityUSD;
            totalBorrows += vars.totalBorrowsUSD;
            liquidityRate += vars.liquidityRate;
            borrowRate += vars.borrowRate;
        }
        liquidityRate = liquidityRate.div(len);
        borrowRate = borrowRate.div(len);
    }

     // local variable
    struct UserDataLocalVariable {
        address reserveAddress;
        uint reservePriceInUSD;
        uint reserveHTokenBalance;
        uint reserveDTokenBalance;
        uint hTokenBalanceUSD;
        uint dTokenBalanceUSD;
    }

    function getUserAccountData(address _user) public view returns 
    	(
    		uint totalLiquidity,
    		uint totalBorrows,
    		uint ltv,
    		uint liquidationThresold,
            uint healthFactor,
    		bool canBeLiquidated
    	)
    {
    	UserDataLocalVariable memory vars;
        Oracle oracle = Oracle(addressProvider.getPriceOracle());
    	address[] memory reserveList = getAllReserves();

    	for(uint8 i = 0; i < reserveList.length; i++ ) {
    		vars.reserveAddress = reserveList[i];
            vars.reservePriceInUSD = oracle.get_reference_data(vars.reserveAddress);
    		vars.reserveHTokenBalance = HToken(core.getReserveHTokenAddress(vars.reserveAddress)).balanceOf(_user);
			vars.reserveDTokenBalance = DToken(core.getReserveDTokenAddress(vars.reserveAddress)).balanceOf(_user);
            vars.hTokenBalanceUSD = vars.reserveHTokenBalance.wadMul(vars.reservePriceInUSD);
            vars.dTokenBalanceUSD = vars.reserveDTokenBalance.wadMul(vars.reservePriceInUSD);
			totalLiquidity += vars.hTokenBalanceUSD;
			totalBorrows += vars.dTokenBalanceUSD;
    	}

    	if (totalBorrows == 0) {
    		ltv = uint(-1);
    	} else {
    		ltv = (totalBorrows.wadDiv(totalLiquidity)).wadToRay();
    	}
        healthFactor = calculateHealthFactor(totalLiquidity, totalBorrows);
        if (healthFactor < WadRayMath.ray()) {
            canBeLiquidated = true;
        } else {
    	   canBeLiquidated = false;
        }
    }

    function calculateCollateralNeeded(address _reserve, uint256 _amount, uint256 _totalBorrowsUSD, uint256 _ltv) 
    public view returns(uint256) {
        Oracle oracle = Oracle(addressProvider.getPriceOracle());
        uint256 unitPrice = oracle.get_reference_data(_reserve);        
    	uint256 newTotalBorrows = _amount.wadMul(unitPrice) + _totalBorrowsUSD;

        if (_ltv == uint(-1)) {
            return newTotalBorrows.wadMul(2 * 1e18);
        }
    	return (newTotalBorrows.wadToRay().rayDiv(_ltv)).rayToWad();
    }

    function calculateHealthFactor(uint liquidityUSD, uint borrowUSD) 
    public view returns(uint256) {
        if (borrowUSD <= 0) {
            return uint(-1);
        }
        uint256 liquidationThrehold = getLiquidationThresold();
        return liquidityUSD.wadToRay().rayMul(liquidationThrehold).rayDiv(borrowUSD.wadToRay());
    }

    function getLiquidationThresold()
    public view returns(uint256) {
        return core.getLiquidationThresold();
    }

    function isBalanceDecreaseAllowed(address _reserve, address _user, uint256 _amount) 
    public view returns (bool) {
        Oracle oracle = Oracle(addressProvider.getPriceOracle());
        uint256 unitPrice = oracle.get_reference_data(_reserve);  
        uint256 amountToDecreaseUSD = _amount.wadMul(unitPrice);
        (uint256 totalLiquidityUSD, uint256 totalBorrowsUSD,,,,) = getUserAccountData(_user);
        uint256 newLiquidityUSD = totalLiquidityUSD.add(amountToDecreaseUSD);
        uint256 newLTV = (totalBorrowsUSD.wadDiv(totalLiquidityUSD)).wadToRay();
        if (newLTV < getLiquidationThresold()) {
            return true;
        }
        return false;
    }
}