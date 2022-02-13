// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../utils/WadRayMath.sol";
import "../tokens/HToken.sol";
import "../tokens/DToken.sol";
import "./LendingPoolCore.sol";
import "hardhat/console.sol";
// import "../oracle/Oracle.sol";
import "../configuration/AddressProvider.sol";

/** 
* @title LendingPool Data Provider
* @author Newton Poudel
**/

contract LendingPoolDataProvider {
	using WadRayMath for uint256;
    
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
			uint baseLTVasCollateral,
			uint liquidationThresold,
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
		baseLTVasCollateral = core.getReserveBaseLTVasCollateral(_reserve);
		liquidationThresold = core.getReserveLiquidationThresold(_reserve);
		hTokenAddress = core.getReserveHTokenAddress(_reserve);
		dTokenAddress = core.getReserveDTokenAddress(_reserve);

    }

    function getAllReserves() public view returns(address[] memory) {
    	return core.getAllReserveList();
    }

    // local variable
    struct UserDataLocalVariable {
        // uint reserveDecimals;
        // string  reserveSymbol;
        address reserveAddress;
        // address reserveHTokenAddress;
        // address reserveDTokenAddress;
        // uint reservePriceInUSD;
        // uint reserveLTV;
        uint reserveHTokenBalance;
        uint reserveDTokenBalance;
        // uint byReserveDecimals;
        // uint reserveLiquidityUSD;
        // uint reserveBorrowsUSD;
    }

    function getUserReserveData(address _reserve, address _user) public view returns
    	(
    		uint256 totalLiquidity, 
    		uint256 totalBorrows
    	) 
    {
    	// TODO:> balanceOf instead of principalBalanceOf
    	totalLiquidity = HToken(core.getReserveHTokenAddress(_reserve)).principalBalanceOf(_user);
		totalBorrows = DToken(core.getReserveDTokenAddress(_reserve)).principalBalanceOf(_user);
    }


    function getUserAccountData(address _user) public view returns 
    	(
    		uint totalLiquidity,
    		uint totalBorrows,
    		uint ltv,
    		uint liquidationThresold,
    		bool canBeLiquidated
    	)
    {
    	UserDataLocalVariable memory vars;
    	address[] memory reserveList = getAllReserves();

    	for(uint8 i = 0; i < reserveList.length; i++ ) {
    		vars.reserveAddress = reserveList[i];

    		vars.reserveHTokenBalance = HToken(core.getReserveHTokenAddress(vars.reserveAddress)).principalBalanceOf(_user);
			vars.reserveDTokenBalance = DToken(core.getReserveDTokenAddress(vars.reserveAddress)).principalBalanceOf(_user);
			totalLiquidity += vars.reserveHTokenBalance;
			totalBorrows += vars.reserveDTokenBalance;
    	}

    	if (totalBorrows == 0) {
    		ltv = uint(-1);
    	} else {
    		ltv = (totalBorrows.wadDiv(totalLiquidity)).wadToRay();
    	}
    	liquidationThresold = 65 * 1e25;
    	canBeLiquidated = false;
    }

    function calculateCollateralNeeded(uint256 _amount, uint256 _totalBorrows, uint256 _ltv) 
    public view returns(uint256) {
    	uint256 newTotalBorrows = _amount + _totalBorrows;
    	return (newTotalBorrows.wadToRay().rayDiv(_ltv)).rayToWad();
        // return ((borrowBalanceUSD.add(requestedAmountUSD)).wadToRay().rayDiv(userLTV)).rayToWad();
    }

   //  function calculateHealthFactorInternal (
   //      uint256 _collateral,
   //      uint256 _borrow,
   //      uint256 _liquidationThreshold
   //  ) internal pure returns (uint256) {
   //      if (_borrowUSD == 0) {
   //          return uint256(-1);
   //      }
   //      return (_collateral.rayMul(_liquidationThreshold).wadDiv(_borrow)).wadToRay();
   //  }




}