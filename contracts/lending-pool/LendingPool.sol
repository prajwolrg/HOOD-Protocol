// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;
import "./LendingPoolCore.sol";
import "./LendingPoolDataProvider.sol";
import "hardhat/console.sol";
import "../configuration/AddressProvider.sol";
import "../tokens/HToken.sol";
import "../tokens/DToken.sol";

/**
* @title LendingPool
* @author Newton Poudel
**/

contract LendingPool {

	string public name = "LENDING POOL";
	LendingPoolCore public core;
	AddressProvider public addressProvider;
    LendingPoolDataProvider public dataProvider;

	event Deposit (
		address indexed _reserve,
		address indexed _user,
		uint _amount,
		uint _timestamp
		);

	event Borrow (
		address indexed _reserve,
		address indexed _user,
		uint _amount,
		uint _timestamp
		);

	event Redeem(
		address indexed _reserve,
		address indexed _user,
		uint _amount,
		uint _timestamp
		);
	
	event Repay(
		address indexed _reserve, 
		address indexed _user,
		uint _amount, 
		uint _timestamp
	);

	constructor(address _addressesProvider) public {
		addressProvider = AddressProvider(_addressesProvider);
	}

	function initialize() public {
		core = LendingPoolCore(addressProvider.getLendingPoolCore());
		dataProvider = LendingPoolDataProvider(addressProvider.getLendingPoolDataProvider());
	}

	/*
	* Modifier to check if the reserve is active
	*/
	modifier onlyActiveReserve(address _reserve) {
		require(core.getReserveActiveStatus(_reserve), "Reserve is inactive");
		_;
	}

	/*
	* Modifier to check if the reserve is frozen
	*/
	modifier onlyUnfreezedReserve(address _reserve) {
		require(!core.getReserveFreezeStatus(_reserve), "Reserve is frozen");
		_;
	}

	/*
	* Modifier to check if tthe amount is greater than zero
	*/
	modifier onlyAmountGreaterThanZero(uint _amount) {
		require(_amount > 0, "Amount is not greater than zero.");
		_;
	}

	/*
	* Deposit any asset to the reserve
	* Corresponding amount of hTokens is minted
	*/
	function deposit(address _reserve, uint _amount) 
		external
		onlyActiveReserve(_reserve)
		onlyAmountGreaterThanZero(_amount)
	{
		HToken hToken = HToken(core.getReserveHTokenAddress(_reserve));

		core.updateStateOnDeposit(_reserve, _amount);

		hToken.mintOnDeposit(msg.sender, _amount);

		core.transferToReserve(_reserve, msg.sender, _amount);

		emit Deposit(_reserve, msg.sender, _amount, block.timestamp);
	}

	/*
	* Allows user to borrow specific amount of reserve from the system
	* provided thay have deposited enough collateral
	*/

	function borrow(address _reserve, uint _amount) 
		external
		onlyActiveReserve(_reserve)
		onlyUnfreezedReserve(_reserve)
		onlyAmountGreaterThanZero(_amount)
	{
		(,,,,uint availableLiquidity,,,,,) = dataProvider.getReserveData(_reserve);
		DToken dToken = DToken(core.getReserveDTokenAddress(_reserve));
		require(_amount <= availableLiquidity, "Not enough liquidity in this reserve");
		(
    		uint totalLiquidityUSD,
			uint totalCollateralUSD,
    		uint totalBorrowsUSD,
    		uint ltv,,,
    		bool canBeLiquidated
    	) =  dataProvider.getUserAccountData(msg.sender);    	
		require(!canBeLiquidated, "Health Factor should be above threshold");
		uint collateralNeeded = dataProvider.calculateCollateralNeeded(_reserve, _amount, totalBorrowsUSD, ltv);
		require(totalLiquidityUSD >= collateralNeeded, "Insufficient collateral to borrow");
		core.updateStateOnBorrow(_reserve, msg.sender, _amount);
		core.transferToUser(_reserve, msg.sender, _amount);
		emit Borrow(_reserve, msg.sender, _amount, block.timestamp);
	}

	/*
	* Allows users who deposited into the system redeem their asset.
	* Called by overlying hToken only.
	*/

	function redeem(address _reserve, address payable _user, uint256 _amount)
		external
		onlyActiveReserve(_reserve)
		onlyAmountGreaterThanZero(_amount) 
	{
		(,,,,uint availableLiquidity,,,,address hTokenAddress,) = dataProvider.getReserveData(_reserve);
		require(msg.sender == hTokenAddress, "Only respective hToken can call this method");
		require(availableLiquidity >= _amount, "Not enough liquidity in the reserve");
		core.updateStateOnRedeem(_reserve, _amount);
		core.transferToUser(_reserve, _user, _amount);		
		emit Redeem(_reserve, _user, _amount, block.timestamp);
		}
	
	/* 
	* Allows users to repay back their loan for a reserve
	*/

	function repay(address _reserve, uint _amount)	
		external
		onlyAmountGreaterThanZero(_amount)
	{
		(,uint currentBorrowBalance,,,) = dataProvider.getUserReserveData(_reserve, msg.sender);
		uint amountToReturn = 0;

		require(currentBorrowBalance > 0, "User does not have any borrow pending");
		if (_amount > currentBorrowBalance) {
			amountToReturn = _amount - currentBorrowBalance;
		}
		uint amountToRepay = _amount - amountToReturn;

		// update state
		core.updateStateOnRepay(_reserve, msg.sender, amountToRepay);
		// return back to user
		core.transferToUser(_reserve, msg.sender, amountToReturn);
		// transfer required amount to core
		core.transferToReserve(_reserve, msg.sender, amountToRepay);
		emit Repay(_reserve, msg.sender, amountToRepay, block.timestamp);		
	}
}
