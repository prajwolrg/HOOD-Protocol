# Initialize Reserve

```js
lendingPoolCore.initializeReserve(reserve, params)
```

- deploys hToken and oToken for that reserve
- add reserve address to supported list of reserve (all initialized reserves basically)

## Initial configuration:
```
address reserveAddress = reserve;
address hTokenAddress = deployed_address;
string symbol = h + reserveSymbol;
uint8 decimals = reserveDecimals;
uint lastUpdateTimestamp = blocktime;
uint borrowRate = 0;
uint liquidityRate = 0;
uint totalLiquidity = 0;
uint availableLiquidity = 0;
uint totalBorrows = 0;
uint baseLTVasCollateral = param;
uint liquidationThresold = param;
uint borrowCumulativeIndex = RAY;
uint liquidityCumulativeIndex = RAY;
bool isActive = true;
bool usageAsCollateralEnabled = true;
bool borrowEnabled = true;        
bool isFreezed = false;
```
