// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../utils/WadRayMath.sol";
import "../tokens/HToken.sol";
import "hardhat/console.sol";
import "../oracle/Oracle.sol";
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

	address public lendingPoolAddress;
    address public addressProviderAddress;
    AddressProvider public addressProvider;
    // dummy address to represent ETH
    address internal constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

	uint256 internal constant SECONDS_PER_YEAR = 365 days;
    uint256 internal constant EXA = 1e18;
    uint256 internal constant RAY = 1e27;

    // constants set to same across all reserves
    uint256 internal constant OPTIMAL_UTILIZATION_RATE = 0.8 * 1e27;
    uint256 internal constant BASE_BORROW_RATE = 2e27;
    uint256 internal constant SLOPE_RATE_1 = 6e27;
    uint256 internal constant SLOPE_RATE_2 = 1e27;

	struct UserReserveData {
        uint principalBorrowBalance;
        uint lastUpdateTimestamp;
        uint borrowCumulativeIndex;
        address userAddress;
        bool useAsCollateral;
    }

    struct ReserveData {
        // addresses
        address reserveAddress;
        address hTokenAddress;
        // string
        string symbol;
        // uint
        uint8 decimals;
        uint lastUpdateTimestamp;
        uint borrowRate;
        uint liquidityRate;
        uint totalLiquidity;
        uint availableLiquidity;
        uint totalBorrows;
        uint baseLTVasCollateral;
        uint liquidationThresold;
        uint borrowCumulativeIndex;
        uint liquidityCumulativeIndex;
        // boolean variables
        bool isActive;
        bool usageAsCollateralEnabled;
        bool borrowEnabled;        
        bool isFreezed;
    }

    mapping(address => ReserveData) internal reserves;
    address[] public reserveList;
    mapping(address => mapping(address => UserReserveData)) internal userReserveData; // [walletAddr][reserveAddr]

    constructor(address _addressesProvider) public {
        addressProviderAddress = _addressesProvider;
        addressProvider = AddressProvider(_addressesProvider);
    }

    function initialize() public {
        lendingPoolAddress = addressProvider.getLendingPool();
    }

	modifier onlyLendingPool () {
		require(msg.sender == lendingPoolAddress,
			"Caller must be a lending pool contract");
		_;
	}

    event ReserveUpdated( address _reserve, uint newLiquidityRate, uint newBorrowRate);
    event ReserveInitialized(address _reserve, address _hTokenAddress);

	function getReserveHTokenAddress(address _reserve) public view returns (address) {
		ReserveData storage reserve = reserves[_reserve];
		return reserve.hTokenAddress;
	}

    /*
    * Initialize a reserve in the protocol.
    * Gets name and symbol info from reserve to create hToken for it.
    * Calls internal function _initializeReserve
    * Might need to add dToken later
    */
    function initializeReserve(
        address _reserve,
        uint8 _decimals,
        uint _liquidationThreshold,
        uint _baseLTVasCollateral
    ) external {
        ERC20Detailed asset = ERC20Detailed(_reserve);

        string memory reserveSymbol = asset.symbol();

        string memory hTokenName = string(abi.encodePacked("Hood Interest ", asset.name(), "Token"));
        // if debt token is added, it should be included here.
        string memory hTokenSymbol = string(abi.encodePacked("h", asset.symbol()));


        _initializeReserve(
            _reserve,
            reserveSymbol,
            hTokenName,
            hTokenSymbol,
            _decimals,
            _liquidationThreshold,
            _baseLTVasCollateral
        );
    }

    /*
    * Internal method, called by initializeReserve
    * Deploys hToken, interest bearing token
    * Sets reserve initialization data
    * Emits ReserveInitialized eventlog
    */
    function _initializeReserve (
        address _reserve,
        string memory _reserveSymbol,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint _liquidationThreshold,
        uint _baseLTVasCollateral
    ) internal {
        HToken hTokenInstance = new HToken(
            _name,
            _symbol,
            _decimals,
            addressProviderAddress,
            _reserve
        );

        addReserveToList(_reserve);

        ReserveData storage reserve = reserves[_reserve];
        
        // actual initialization logic
        reserve.reserveAddress = _reserve;
        reserve.symbol = _reserveSymbol;
        reserve.hTokenAddress = address(hTokenInstance);
        reserve.decimals = _decimals;

        reserve.baseLTVasCollateral = _baseLTVasCollateral ; // take as param
        reserve.liquidationThresold = _liquidationThreshold; // take as param

        reserve.borrowCumulativeIndex = RAY; 
        reserve.liquidityCumulativeIndex = RAY;

        reserve.isActive = true;
        reserve.usageAsCollateralEnabled = true;
        reserve.borrowEnabled = true;        
        reserve.isFreezed = false;

        emit ReserveInitialized(_reserve, address(hTokenInstance));
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

    function updateStateOnDeposit(
		address _reserve, 
		// address _user, 
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
        (,, uint256 balanceIncrease ) = 
            getUserBorrowBalances(_reserve, _user);

        updateReserveStateOnBorrowInternal(
            _reserve,
            balanceIncrease,
            _amount
        );

        updateUserStateOnBorrowInternal(
            _reserve,
            _user,
            // balanceIncrease,
            _amount
        );

        updateReserveInterestRatesAndTimestampInternal(_reserve, 0, _amount);
    }


    function updateStateOnRedeem(
        address _reserve,
        // address _user,
        uint256 _amount
    ) external onlyLendingPool {
        updateCumulativeIndexes(_reserve);
        updateReserveInterestRatesAndTimestampInternal(_reserve, 0, _amount);
    }

    function updateStateOnRepay(
        address _reserve,
        address _user,
        uint _amount,
        uint _balanceIncrease
    ) external onlyLendingPool {
        updateReserveStateOnRepayInternal(_reserve, _amount, _balanceIncrease);
        updateUserStateOnRepayInternal(_reserve, _user, _amount, _balanceIncrease);
        // reserve, incoming, outgoing
        updateReserveInterestRatesAndTimestampInternal(_reserve, _amount, 0);
    }

    function updateUserStateOnRepayInternal (
        address _reserve,
        address _user,
        uint _amount,
        uint _balanceIncrease
    ) internal {
        ReserveData storage reserve = reserves[_reserve];
        UserReserveData storage user = userReserveData[_user][_reserve];
        
        user.principalBorrowBalance = user.principalBorrowBalance.add(_balanceIncrease).sub(_amount);
        user.borrowCumulativeIndex = reserve.borrowCumulativeIndex;
        user.lastUpdateTimestamp = block.timestamp;
    }

    /*
    */
    function updateUserStateOnBorrowInternal (
        address _reserve,
        address _user,
        // uint256 _balanceIncrease,
        uint256 _amount    
    ) internal {
        ReserveData storage reserveData = reserves[_reserve];
        uint256 borrowIndex = reserveData.borrowCumulativeIndex;
        UserReserveData storage _userReserveData = userReserveData[_user][_reserve];

        // add compounded borrow balance to new principal
        _userReserveData.principalBorrowBalance = getCompoundedBorrowBalance(_reserve, _user).add(_amount);
        // _userReserveData.principalBorrowBalance.add(
        //         _amount
        //     );
        _userReserveData.borrowCumulativeIndex = borrowIndex;
        _userReserveData.lastUpdateTimestamp = block.timestamp;
    }

    function updateReserveStateOnRepayInternal (
        address _reserve,
        uint _amount, 
        uint _balanceIncrease
    ) internal {
        updateCumulativeIndexes(_reserve);
        ReserveData storage reserve = reserves[_reserve];

        uint totalBorrows = reserve.totalBorrows.add(_balanceIncrease).sub(_amount);
    }

    /*
    * Update total borrows for a reserve.
    * Interest handled via cumulative indexes.
    */
    function updateReserveStateOnBorrowInternal (
        address _reserve,
        uint256 _balanceIncrease,
        uint256 _amount
    ) internal {
        updateCumulativeIndexes(_reserve);

        ReserveData storage reserveData = reserves[_reserve];
        uint256 totalBorrows = reserveData.totalBorrows;
        uint256 newTotalBorrow = totalBorrows + _amount + _balanceIncrease;
        reserveData.totalBorrows = newTotalBorrow;
    }

    /*
    * Called on Ether / ERC20 deposit
    * Eth goes to contract, so not much logic necessary for eth.
    * add only lending pool decorator
    */
    function transferToReserve(address _reserve, address payable _user, uint _amount) 
        external
        payable
    {
        if ( _reserve != ETH ) {
            require(msg.value == 0, "User is sending eth for ERC20 transfer");
            ERC20(_reserve).safeTransferFrom(_user, address(this), _amount);
        } else {
            require(msg.value == _amount, "Amount and value are different");
        }   
    }

    /*
    * Called on Ether / ERC20 borrow
    * only lending pool decorator needed
    */
    function transferToUser(address _reserve, address payable _user, uint _amount) 
        external
        onlyLendingPool
    {
        if ( _reserve != ETH ) {
            ERC20(_reserve).safeTransfer(_user, _amount);            
        } else {
            (bool result, ) = _user.call.value(_amount).gas(50000)("");
            require(result, "ETH Transfer failed.");
        }   
    }

    function getReserveNormalizedIndex(address _reserve) public view returns(uint) {
        ReserveData storage reserve = reserves[_reserve];
        uint interest = calculateLinearInterest(
            reserve.liquidityRate,
            reserve.lastUpdateTimestamp
        );
        return interest.rayMul(reserve.liquidityCumulativeIndex);                
    }

	function updateReserveInterestRatesAndTimestampInternal(
		address _reserve, 
		uint _liquidityAdded, 
		uint _liquidityTaken
		) internal {

		ReserveData storage reserve = reserves[_reserve];
		uint availableLiquidity = getReserveAvailableLiquidity(_reserve).add(_liquidityAdded).sub(_liquidityTaken);
		uint totalBorrows = reserve.totalBorrows;
		(uint newLiquidityRate, uint newBorrowRate) = calculateInterestRate(/*_reserve,*/ availableLiquidity, totalBorrows);

        reserve.totalLiquidity = getReserveTotalLiquidity(_reserve).add(_liquidityAdded).sub(_liquidityTaken);
        reserve.availableLiquidity = availableLiquidity;
		reserve.liquidityRate = newLiquidityRate;
		reserve.borrowRate = newBorrowRate;
		reserve.lastUpdateTimestamp = block.timestamp;

		emit ReserveUpdated(
			_reserve,
			newLiquidityRate,
			newBorrowRate
			);
	}

    function getReserveAvailableLiquidity(
        address _reserve
        ) public view returns (
            uint availableLiquidity) {

            ReserveData storage reserve = reserves[_reserve];
            availableLiquidity = reserve.availableLiquidity;
        }

	function calculateInterestRate(
		// address _reserve,
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

	function updateCumulativeIndexes(address _reserve) internal {
		ReserveData storage reserveData = reserves[_reserve];
		uint totalBorrows = reserveData.totalBorrows;

		if (totalBorrows > 0) {
            uint currentLiquidityRate = reserveData.liquidityRate;
            uint currentBorrowRate = reserveData.borrowRate;
            uint lastUpdateTimestamp = reserveData.lastUpdateTimestamp;

			uint cumulatedLiquidityInterest = calculateLinearInterest(currentLiquidityRate, lastUpdateTimestamp);
			reserveData.liquidityCumulativeIndex = cumulatedLiquidityInterest.rayMul(reserveData.liquidityCumulativeIndex);
			uint cumulativeBorrowInterest = calculateLinearInterest(currentBorrowRate, lastUpdateTimestamp); // Compounded
			reserveData.borrowCumulativeIndex = cumulativeBorrowInterest.rayMul(reserveData.borrowCumulativeIndex);
		}
	}
  
  function calculateLinearInterest(uint _rate, uint _lastUpdateTimestamp)
    public view returns(uint) {
        uint256 timeDifference = block.timestamp.sub(uint256(_lastUpdateTimestamp));
        uint256 timeDelta = timeDifference.wadToRay().rayDiv(SECONDS_PER_YEAR.wadToRay());
        return _rate.rayMul(timeDelta).add(WadRayMath.ray());
    }

    function calculateCompoundedInterest(uint _rate, uint _lastUpdateTimestamp)
      public view returns (uint compoundedInterestRate) {
        uint timeDifference = block.timestamp.sub(_lastUpdateTimestamp);
        uint ratePerSecond = _rate.wadDiv(timeDifference);
        compoundedInterestRate = (ratePerSecond.add(EXA)).rayPow(timeDifference).rayToWad();
      }

    function getReserveSymbol(address _reserve) public view returns (string memory) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.symbol;
    }

    function getReserveTotalLiquidity(address _reserve) public view returns (uint) {
        return getReserveAvailableLiquidity(_reserve).add(getReserveTotalBorrows(_reserve));
    }

    function getReserveTotalBorrows(address _reserve) public view returns (uint) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.totalBorrows;
    }

    function getReserveLiquidityRate(address _reserve) public view returns (uint) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.liquidityRate;
    }

    function getReserveBorrowRate(address _reserve) public view returns (uint) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.borrowRate;
    }

    function getReserveLiquidityCumulativeIndex(address _reserve) public view returns (uint) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.liquidityCumulativeIndex;
    }

    function getReserveBorrowCumulativeIndex(address _reserve) public view returns (uint) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.borrowCumulativeIndex;
    }

    function getReserveLastUpdateTimestamp(address _reserve) public view returns (uint) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.lastUpdateTimestamp;
    }

    function getReserveActiveStatus(address _reserve) public view returns (bool) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.isActive;
    }

    function getReserveFreezeStatus(address _reserve) public view returns (bool) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.isFreezed;
    }

    function getReserveIsBorrowEnabled(address _reserve) public view returns (bool) {
        ReserveData storage reserve = reserves[_reserve];
        return reserve.borrowEnabled;
    }

    function getReserveData(address _reserve) public view returns
    (
        uint totalLiquidity,
        uint availableLiquidity,
        uint liquidityRate,
        uint totalBorrows,
        uint borrowRate,
        address hTokenAddress,
        uint lastUpdateTimestamp
    ) {
        // actual data to return
        totalLiquidity = getReserveTotalLiquidity(_reserve);
        availableLiquidity = getReserveAvailableLiquidity(_reserve);
        liquidityRate = getReserveLiquidityRate(_reserve);
        totalBorrows = getReserveTotalBorrows(_reserve);
        borrowRate = getReserveBorrowRate(_reserve);
        hTokenAddress = getReserveHTokenAddress(_reserve);
        lastUpdateTimestamp = getReserveLastUpdateTimestamp(_reserve);
    }

    struct UserDataLocalvariable {
        uint reserveDecimals;
        string  reserveSymbol;
        address reserveAddress;
        uint reservePriceInUSD;
        uint reserveLTV;
        uint reserveBalance;
        uint reserveBorrowBalance;
        uint byReserveDecimals;
        uint reserveLiquidityUSD;
        uint reserveBorrowsUSD;
    }

    function getUserAccountData(address _user) public view returns 
    (
        uint totalLiquidityUSD,
        uint totalCollateralUSD,
        uint totalBorrowsUSD,
        uint availableBorrowsUSD,
        uint currentLTV,
        uint healthFactor,
        bool healthFactorBelowThreshold
    ) {
        UserDataLocalvariable memory vars;
        Oracle oracle = Oracle(addressProvider.getPriceOracle());

        for (uint i = 0; i < reserveList.length; i++) {
            vars.reserveAddress = reserveList[i];
            (vars.reserveSymbol,vars.reserveDecimals,,vars.reserveLTV) = getReserveBasicData(vars.reserveAddress);
            // get hTokenAddress
            vars.reserveBalance = HToken(getReserveHTokenAddress(vars.reserveAddress)).balanceOf(_user);
            vars.byReserveDecimals = 10 ** vars.reserveDecimals;
            // interface with oracle to get price
            vars.reservePriceInUSD = oracle.get_reference_data(vars.reserveSymbol, "USD");
            // convert in terms of USD
            vars.reserveLiquidityUSD = vars.reservePriceInUSD
                                    .mul(vars.reserveBalance)
                                    .div(vars.byReserveDecimals);
            totalLiquidityUSD = totalLiquidityUSD.add(vars.reserveLiquidityUSD);
            totalCollateralUSD = totalCollateralUSD.add(vars.reserveLiquidityUSD);

            // borrow data
            (,vars.reserveBorrowBalance,) = getUserBorrowBalances(vars.reserveAddress, _user);
            vars.reserveBorrowsUSD = vars.reservePriceInUSD
                                    .mul(vars.reserveBorrowBalance)
                                    .div(vars.byReserveDecimals);
            totalBorrowsUSD = totalBorrowsUSD.add(vars.reserveBorrowsUSD);
            // calculate ltv for user
            currentLTV = currentLTV.add(vars.reserveLiquidityUSD.wadToRay().rayMul(vars.reserveLTV));
            // console.log("Core Reserve loop LTV: ", currentLTV, totalBorrowsUSD);
        }
        uint256 liquidationThresold = 0.65 * 1e27;
        currentLTV = totalCollateralUSD > 0 ? currentLTV.rayDiv(totalCollateralUSD.wadToRay()): 0;
        healthFactor = calculateHealthFactorInternal(totalCollateralUSD, totalBorrowsUSD, liquidationThresold);
        if (healthFactor < EXA) {
            healthFactorBelowThreshold = true;
        }

        availableBorrowsUSD = totalLiquidityUSD.wadDiv(2 * 1e18).sub(totalBorrowsUSD);
        if (totalBorrowsUSD == 0) {
            currentLTV = uint(-1);
        }
    }

    function getReserveBasicData(address _reserve) public view returns (
        string memory, uint, bool, uint
    ) {
        ReserveData storage reserve = reserves[_reserve];
        return (
            reserve.symbol,
            reserve.decimals,
            reserve.usageAsCollateralEnabled,
            reserve.baseLTVasCollateral
        );
    }

    function calculateHealthFactorInternal (
        uint256 _collateralUSD,
        uint256 _borrowUSD,
        uint256 _liquidationThreshold
    ) internal pure returns (uint256 healthFactor) {
        if (_borrowUSD == 0) {
            return uint256(-1);
        }
        healthFactor = _collateralUSD.rayMul(_liquidationThreshold).wadDiv(_borrowUSD);
    }

    /*
    * _reserve: Reserve from which _amount is to be borrowed
    * _amount: Amount to borrow
    * borrowBalanceUSD: Current borrow balance in USD
    */
    function calculateCollateralNeeded (
        address _reserve,
        uint256 _amount,
        uint256 borrowBalanceUSD,
        uint256 userLTV
    ) public view returns (uint256) {
        // interface with oracle
        Oracle oracle = Oracle(addressProvider.getPriceOracle());
        ReserveData storage reserve = reserves[_reserve];
        uint unitPrice = oracle.get_reference_data(reserve.symbol, "USD");
        uint requestedAmountUSD = unitPrice.mul(_amount).div(10 ** 18);
        return ((borrowBalanceUSD.add(requestedAmountUSD)).wadToRay().rayDiv(userLTV)).rayToWad();
    }

    struct balanceDecreaseAllowedLocalVars {
        string reserveSymbol;
        uint reserveDecimals; 
        uint collateralBalance;
        uint currentLTV;
        uint afterDecreaseLTV;
        uint amountToDecreaseUSD;
        uint collateralAfterDecreaseUSD;
    }

    function isBalanceDecreaseAllowed(address _reserve, address _user, uint _amount)
        external view returns(bool) {
            balanceDecreaseAllowedLocalVars memory vars;
            (vars.reserveSymbol,vars.reserveDecimals,,vars.currentLTV) = getReserveBasicData(_reserve);

            (
                ,
                uint totalCollateralUSD,
                uint totalBorrowsUSD,,uint userLTV,,
            ) = getUserAccountData(_user);
            
            if (totalBorrowsUSD == 0) {
                return true;
            }

            Oracle oracle = Oracle(addressProvider.getPriceOracle());
            // this amount to be decreased from collateral value
            vars.amountToDecreaseUSD = oracle.get_reference_data(vars.reserveSymbol, "USD").mul(_amount).div(10**vars.reserveDecimals);
            vars.collateralAfterDecreaseUSD = totalCollateralUSD.sub(vars.amountToDecreaseUSD);
            
            
            if (vars.collateralAfterDecreaseUSD <= 0) {
                return false;
            }

            vars.afterDecreaseLTV = totalCollateralUSD.mul(userLTV)
                                    .sub(vars.amountToDecreaseUSD.mul(vars.currentLTV))
                                    .div(vars.collateralAfterDecreaseUSD);

            uint healthFactorAfterDecrease = calculateHealthFactorInternal(
                vars.collateralAfterDecreaseUSD,
                totalBorrowsUSD,
                vars.afterDecreaseLTV
            );

            return healthFactorAfterDecrease > EXA;     
    }

    function getUserReserveData(address _reserve, address _user)
        external
        view
        returns (
            uint256 currentHTokenBalance,
            uint256 principalHTokenBalance,
            uint256 currentBorrowBalance,
            uint256 principalBorrowBalance,
            uint256 borrowRate,
            uint256 liquidityRate,
            uint256 lastUpdateTimestamp
        )
    {
        currentHTokenBalance = HToken(getReserveHTokenAddress(_reserve)).balanceOf(_user);
        principalHTokenBalance = HToken(getReserveHTokenAddress(_reserve)).principalBalanceOf(_user);

        liquidityRate = getReserveLiquidityRate(_reserve);
        borrowRate = getReserveBorrowRate(_reserve);
        lastUpdateTimestamp = getUserLastUpdateTimestamp(_reserve, _user); // update state on borrow
        (principalBorrowBalance, currentBorrowBalance, ) = getUserBorrowBalances(_reserve, _user);
    }

    function getUserLastUpdateTimestamp(address _reserve, address _user) 
        public view returns (uint256 lastUpdateTimestamp)
    {
        UserReserveData storage _userReserveData = userReserveData[_user][_reserve];
        lastUpdateTimestamp = _userReserveData.lastUpdateTimestamp; 
    }

    function getCompoundedBorrowBalance(address _reserve, address _user) internal view returns(uint) {
        ReserveData storage reserveData = reserves[_reserve];
        UserReserveData storage _userReserveData = userReserveData[_user][_reserve];

        if (_userReserveData.principalBorrowBalance == 0) return 0;

        uint _principalBorrowBalance = _userReserveData.principalBorrowBalance.wadToRay();

        uint cumulatedInterest = calculateLinearInterest(
            reserveData.borrowRate, 
            _userReserveData.lastUpdateTimestamp
            ).rayMul(_userReserveData.borrowCumulativeIndex).rayDiv(reserveData.borrowCumulativeIndex);
        
        return _principalBorrowBalance.rayMul(cumulatedInterest).rayToWad();
    }

    function getUserBorrowBalances(address _reserve, address _user)
        public view returns(uint256 principal, uint256 compoundedBalance, uint balanceIncrease)
    {
        UserReserveData storage user = userReserveData[_user][_reserve];
        if (user.principalBorrowBalance == 0) {
            return (0,0,0);
        }

        principal = user.principalBorrowBalance;
        // this or that
        // uint256 cumulatedInterest = calculateNormalizedDebt(_reserve);
        // compoundedBalance = principal.rayMul(cumulatedInterest);
        compoundedBalance = getCompoundedBorrowBalance(_reserve, _user);
        balanceIncrease = compoundedBalance.sub(principal);
    }

    function calculateNormalizedDebt(address _reserve)
        public view returns(uint256 cumulatedInterest)
    {
        ReserveData storage reserveData = reserves[_reserve];
        uint256 interest = calculateLinearInterest(reserveData.borrowRate, reserveData.lastUpdateTimestamp); // compounded
        cumulatedInterest = interest.wadMul(reserveData.borrowCumulativeIndex);
    }

}
