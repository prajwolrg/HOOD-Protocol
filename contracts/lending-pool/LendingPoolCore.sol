// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../utils/WadRayMath.sol";
import "hardhat/console.sol";
import "../tokens/HToken.sol";
import "../tokens/DToken.sol";
import "./Config.sol";
import "../configuration/AddressProvider.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

/**
* @title LendingPoolCore
* @author Newton Poudel
**/

contract LendingPoolCore {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using SafeERC20 for ERC20;
    using Config for Config.ReserveData;

    address public lendingPoolAddress;
    address public reserveInitializerAddress;
    AddressProvider public addressProvider;
    // dummy address to represent ETH
    address internal constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

	uint256 internal constant SECONDS_PER_YEAR = 365 days;
    uint256 constant LIQUIDATION_THRESHOLD = 0.65 * 1e27;
    uint256 constant RAY = 1e27;

    // constants set to same across all reserves
    uint256 internal constant OPTIMAL_UTILIZATION_RATE = 0.8 * 1e27;
    uint256 internal constant BASE_BORROW_RATE = 2e27;
    uint256 internal constant SLOPE_RATE_1 = 6e27;
    uint256 internal constant SLOPE_RATE_2 = 1e27;


    mapping(address => Config.ReserveData) internal reserves;
    address[] public reserveList;
    mapping(address => mapping(address => uint)) internal lastUpdateTimestamp; // [walletAddr][reserveAddr]

    constructor(address _addressesProvider) public {
        addressProvider = AddressProvider(_addressesProvider);
    }

    function initialize() public {
        lendingPoolAddress = addressProvider.getLendingPool();
        reserveInitializerAddress = addressProvider.getReserveInitializer();
    }

	modifier onlyLendingPool () {
		require(msg.sender == lendingPoolAddress,
			"Caller must be a lending pool contract");
		_;
	}

    modifier onlyReserveInitializer () {
        require(msg.sender == reserveInitializerAddress,
            "Caller must be a reserve initializer contract");
        _;
    }

    event ReserveUpdated( address _reserve, uint newLiquidityRate, uint newBorrowRate);

	function getReserveHTokenAddress(address _reserve) public view returns (address) {
		Config.ReserveData storage reserve = reserves[_reserve];
		return reserve.hTokenAddress;
	}

    function getReserveDTokenAddress(address _reserve) public view returns (address) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.dTokenAddress;
    }

    function initializeReserveInternal(
        address _reserve,
        address _hTokenAddress,
        address _dTokenAddress,
        uint8 _decimals
    ) external onlyReserveInitializer  {
        reserves[_reserve].initialize(_hTokenAddress, _dTokenAddress, _decimals);
        addReserveToList(_reserve);
    }


    /*
    * Add reserve to supported reserve list
    * Called by _initializeReserve method
    */
    function addReserveToList(address _reserve) internal {
        bool isInReserve = false;
        for (uint i = 0; i < reserveList.length; i++) {
            if (reserveList[i] == _reserve) {
                isInReserve = true;
            }
        }
        if (isInReserve == false) {
            reserveList.push(_reserve);
        }
    }

    function getAllReserveList() public view returns(address[] memory) {
        address[] memory list = new address[](reserveList.length);
        for (uint i = 0; i < reserveList.length; i++) {
            list[i] = reserveList[i];
        }
        return list;
    }

    function updateStateOnDeposit(
		address _reserve, 
		uint _amount
		) external onlyLendingPool  {
        updateCumulativeIndexes(_reserve);
		updateReserveInterestRatesAndTimestampInternal(_reserve, _amount, 0);
	}


    function updateStateOnBorrow(
        address _reserve,
        address _user,
        uint _amount
    ) external onlyLendingPool 
    {
        lastUpdateTimestamp[_user][_reserve] = block.timestamp;
        DToken dToken = DToken(getReserveDTokenAddress(_reserve));
        dToken.mintOnBorrow(_user, _amount, getReserveBorrowCumulativeIndex(_reserve));
        updateCumulativeIndexes(_reserve);
        updateReserveInterestRatesAndTimestampInternal(_reserve, 0, _amount);
    }


    function updateStateOnRedeem(
        address _reserve,
        uint256 _amount
    ) external onlyLendingPool {
        updateCumulativeIndexes(_reserve);
        updateReserveInterestRatesAndTimestampInternal(_reserve, 0, _amount);
    }


    function updateStateOnRepay(
        address _reserve,
        address _user,
        uint _amount
    ) external onlyLendingPool {
        lastUpdateTimestamp[_user][_reserve] = block.timestamp;
        DToken dToken = DToken(getReserveDTokenAddress(_reserve));
        dToken.burnOnRepay(_user, _amount);
        updateCumulativeIndexes(_reserve);
        updateReserveInterestRatesAndTimestampInternal(_reserve, _amount, 0);
    }

    function updateCumulativeIndexes(address _reserve) internal {
        DToken dToken = DToken(getReserveDTokenAddress(_reserve));
        uint256 totalBorrows = dToken.totalSupply();
        reserves[_reserve].updateCumulativeIndexes(totalBorrows);
    }

    /*
    * Called on ERC20 deposit
    */
    function transferToReserve(address _reserve, address payable _user, uint _amount) 
        external
        payable
        onlyLendingPool
    {
        if ( _reserve != ETH ) {
            require(msg.value == 0, "User is sending ICZ for ERC20 transfer");
            ERC20(_reserve).safeTransferFrom(_user, address(this), _amount);
        } else {
            require(msg.value == _amount, "Amount and value are different");
        }   
    }

    /*
    * Called on Ether / ERC20 borrow
    */
    function transferToUser(address _reserve, address payable _user, uint _amount) 
        external
        onlyLendingPool
    {
        if ( _reserve != ETH ) {
            ERC20(_reserve).safeTransfer(_user, _amount);            
        } else {
            (bool result, ) = _user.call.value(_amount).gas(50000)("");
            require(result, "ICZ Transfer failed.");
        }   
    }

	function updateReserveInterestRatesAndTimestampInternal(
		address _reserve, 
		uint _liquidityAdded, 
		uint _liquidityTaken
		) internal {

		Config.ReserveData storage reserve = reserves[_reserve];

		uint availableLiquidity = getReserveAvailableLiquidity(_reserve).add(_liquidityAdded).sub(_liquidityTaken);
		uint totalBorrows = getReserveTotalBorrows(_reserve);
		(uint newLiquidityRate, uint newBorrowRate) = calculateInterestRate(availableLiquidity, totalBorrows);

		reserve.liquidityRate = newLiquidityRate;
		reserve.borrowRate = newBorrowRate;
		reserve.lastUpdateTimestamp = block.timestamp;

		emit ReserveUpdated(
			_reserve,
			newLiquidityRate,
			newBorrowRate
			);
	}

    function getReserveNormalizedIncome(address _reserve)
    public view returns (uint256) 
    {
        return reserves[_reserve].getNormalizedIncome();
    }

    function getReserveNormalizedDebt(address _reserve)
    public view returns (uint256) 
    {
        return reserves[_reserve].getNormalizedDebt();
    }

    function getReserveLastUserUpdateTimestamp(address _reserve, address _user)
    public view returns(uint256)
    {
        return lastUpdateTimestamp[_user][_reserve];
    }

    function getReserveAvailableLiquidity(address _reserve) 
    public view returns (uint) 
    {
        ERC20Detailed asset = ERC20Detailed(_reserve);
        return asset.balanceOf(address(this));
    }

    function getReserveTotalBorrows(address _reserve) 
    public view returns (uint) 
    {
        address dTokenAddress = getReserveDTokenAddress(_reserve);
        DToken dToken = DToken(dTokenAddress);
        return dToken.totalSupply();
    }

    function getReserveTotalLiquidity(address _reserve)
    public view returns (uint)
    {
        return getReserveAvailableLiquidity(_reserve).add(getReserveTotalBorrows(_reserve));
    }

	function calculateInterestRate(
		uint _availableLiquidity,
		uint _totalBorrows
		) internal pure returns (
			uint newLiquidityRate,
			uint newBorrowRate
		) {
			uint utilizationRate = (_availableLiquidity == 0 && _totalBorrows == 0 )
				? 0
				: _totalBorrows.rayDiv(_availableLiquidity.add(_totalBorrows));

            if (utilizationRate <= OPTIMAL_UTILIZATION_RATE) {
                newBorrowRate = BASE_BORROW_RATE.add(
                    SLOPE_RATE_1.rayMul(
                            utilizationRate.rayDiv(OPTIMAL_UTILIZATION_RATE)
                        )
                    );
            } else {
                newBorrowRate = BASE_BORROW_RATE.add(SLOPE_RATE_1).add(
                        utilizationRate.sub(OPTIMAL_UTILIZATION_RATE).rayDiv(
                            RAY.sub(OPTIMAL_UTILIZATION_RATE)
                            ).rayMul(SLOPE_RATE_2)
                    );
            }
            newLiquidityRate = newBorrowRate.rayMul(utilizationRate);
		}

    function getBasicReserveData(address _reserve) public view returns
        (
            uint _lastUpdateTimestamp,
            uint borrowRate,
            uint liquidityRate,
            uint totalLiquidity,
            uint availableLiquidity,
            uint totalBorrows,
            uint borrowCumulativeIndex,
            uint liquidityCumulativeIndex
        )
    {
        Config.ReserveData storage reserve = reserves[_reserve];
        _lastUpdateTimestamp = reserve.lastUpdateTimestamp ;
        borrowRate = reserve.borrowRate;
        liquidityRate = reserve.liquidityRate;
        totalLiquidity = getReserveTotalLiquidity(_reserve);
        availableLiquidity = getReserveAvailableLiquidity(_reserve);
        totalBorrows = getReserveTotalBorrows(_reserve);
        borrowCumulativeIndex = reserve.borrowCumulativeIndex;
        liquidityCumulativeIndex = reserve.liquidityCumulativeIndex;
    }

    function getBasicReserveInfo(address _reserve) public view returns 
        (
            uint decimals,
            address hTokenAddress,
            address dTokenAddress,
            bool isActive,
            bool isFreezed
        ) {
            Config.ReserveData storage reserve = reserves[_reserve];
            decimals = reserve.decimals;
            hTokenAddress = reserve.hTokenAddress;
            dTokenAddress = reserve.dTokenAddress;
            isActive = reserve.isActive;
            isFreezed = reserve.isFreezed;
        }

    function getLiquidationThresold() public view returns (uint256) {
        return LIQUIDATION_THRESHOLD;
    }

    function getReserveLiquidityRate(address _reserve) public view returns (uint) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.liquidityRate;
    }

    function getReserveBorrowRate(address _reserve) public view returns (uint) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.borrowRate;
    }

    function getReserveLiquidityCumulativeIndex(address _reserve) public view returns (uint) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.liquidityCumulativeIndex;
    }

    function getReserveBorrowCumulativeIndex(address _reserve) public view returns (uint) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.borrowCumulativeIndex;
    }

    function getReserveLastUpdateTimestamp(address _reserve) public view returns (uint) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.lastUpdateTimestamp;
    }

    function getReserveActiveStatus(address _reserve) public view returns (bool) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.isActive;
    }

    function getReserveFreezeStatus(address _reserve) public view returns (bool) {
        Config.ReserveData storage reserve = reserves[_reserve];
        return reserve.isFreezed;
    }
}
