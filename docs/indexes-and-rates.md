# Cumulative Indexes and Interest rates
The Interest cumulated by the reserve during the time interval since the last updated timestamp

    - Liquidity Cumulative Index
    - Borrow Cumulative Index


It is updated on every deposit/borrow/redeem/repay transaction.<br/>
Updated when totalBorrows in a system > 0.<br/>
Cumulatives indexes update on the basis of currentRate.
Then the rate updates after.

```py
def updateIndexes():
    if totalBorrows > 0:
        x = calculateLinearInterest(currentInterestRate, lastUpdateTimestamp)
        y = calculateLinearInterest(currentBorrowRate, lastUpdateTimestamp)
        liquidityumulativeIndex = x * currentLiquidityCumulativeIndex
        borrowCumulativeIndex = y * currentBorrowCumulativeIndex

```
Code snippet to calculate linear interest. <br/>
Can use compounded interest for borrows
```py
def calculateLinearInterest(currentRate, lastUpdateTime):
   time_difference = currentTimestamp - lastUpdateTime
   time_delta = time_difference / seconds_per_day 
   return currentRate * time_delta + 1
```

Then, after the indexes are updated, the borrow and liquidity rates will be updated.

```py
def updateReserveInterestRates(reserve, liquidityAdded, liquidityTaken):
    
    newAvailableLiquidity = reserveData.availableLiquidity + liquidityAdded - liquidityTaken
    newTotalBorrows = reserveData.totalBorrows
    newInterestRate, newBorrowRate = calculateInterestRate(newAvailableLiquidity, newTotalBorrows)

    reserveData.availableLiquidity = newAvailableLiquidity
    reserveData.totalLiquidity = reserveData.totalLiquidity + liquidityAdded - liquidityTaken
    reserveData.liquidityRate = newInterestRate
    reserveData.borrowRate = newBorrowRate
    reserveData.lastUpdateTimestamp = currentTimestamp

```