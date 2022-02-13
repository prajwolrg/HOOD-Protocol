// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;


// import "hardhat/console.sol";
import "../utils/WadRayMath.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

library Config {
    
    using WadRayMath for uint256;
    using SafeMath for uint256;

    uint256 internal constant SECONDS_PER_YEAR = 365 days;
    uint256 internal constant EXA = 1e18;
    uint256 internal constant RAY = 1e27;

    // constants set to same across all reserves
    uint256 internal constant OPTIMAL_UTILIZATION_RATE = 0.8 * 1e27;
    uint256 internal constant BASE_BORROW_RATE = 2e27;
    uint256 internal constant SLOPE_RATE_1 = 6e27;
    uint256 internal constant SLOPE_RATE_2 = 1e27;

    struct ReserveData {
        address reserveAddress;
        address hTokenAddress;
        address dTokenAddress;
        uint8 decimals;
        uint lastUpdateTimestamp;
        uint borrowRate;
        uint liquidityRate;
        uint baseLTVasCollateral;
        uint liquidationThresold;
        uint borrowCumulativeIndex;
        uint liquidityCumulativeIndex;
        bool isActive;      
        bool isFreezed;
    }

    function initialize(
        ReserveData storage self,
        address _hTokenAddress, 
        address _dTokenAddress,
        uint8 _decimals
    ) external {
        require(self.hTokenAddress == address(0), "Reserve has already been initialized.");

        self.liquidityCumulativeIndex = WadRayMath.ray();
        self.borrowCumulativeIndex = WadRayMath.ray();
        self.lastUpdateTimestamp = block.timestamp;

        self.baseLTVasCollateral = 50 * 1e25;
        self.liquidationThresold = 65 * 1e25;

        self.decimals = _decimals;
        self.hTokenAddress = _hTokenAddress;
        self.dTokenAddress = _dTokenAddress;
        
        self.isActive = true;
        self.isFreezed = false;
    }

    function getNormalizedIncome(ReserveData storage self) 
    internal view returns (uint256)
    {
        return calculateLinearInterest(
            self.liquidityRate, 
            self.lastUpdateTimestamp
            ).rayMul(self.liquidityCumulativeIndex);
    }

    function getNormalizedDebt(ReserveData storage self) 
    internal view returns (uint256)
    {
        return calculateLinearInterest(
            self.borrowRate, 
            self.lastUpdateTimestamp
            ).rayMul(self.borrowCumulativeIndex);
    }

    function updateCumulativeIndexes(ReserveData storage self) internal {
        // uint256 totalBorrows = getTotalBorrows(self); // interface with dToken and balanceOf
        uint256 totalBorrows = 0;
        if (totalBorrows > 0 ) {

            uint256 currentLiquidityRate = self.liquidityRate;
            uint256 currentBorrowRate = self.borrowRate;
            uint256 lastUpdateTimestamp = self.lastUpdateTimestamp;

            uint256 cumulatedLiquidityInterest = calculateLinearInterest(currentLiquidityRate, lastUpdateTimestamp);
            self.liquidityCumulativeIndex = cumulatedLiquidityInterest.rayMul(self.liquidityCumulativeIndex);
            uint256 cumulativeBorrowInterest = calculateLinearInterest(currentBorrowRate, lastUpdateTimestamp); // Compounded
            self.borrowCumulativeIndex = cumulativeBorrowInterest.rayMul(self.borrowCumulativeIndex);
        }
    }

    function calculateLinearInterest(uint _rate, uint _lastUpdateTimestamp)
    public view returns(uint) {
        uint256 timeDifference = block.timestamp.sub(uint256(_lastUpdateTimestamp));
        uint256 timeDelta = timeDifference.wadToRay().rayDiv(SECONDS_PER_YEAR.wadToRay());
        return _rate.rayMul(timeDelta).add(WadRayMath.ray());
    }

}