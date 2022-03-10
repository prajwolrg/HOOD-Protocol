// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../configuration/AddressProvider.sol";
import "../utils/WadRayMath.sol";
import "../tokens/HToken.sol";
import "../tokens/DToken.sol";
import "./LendingPoolCore.sol";

contract ReserveInitializer {
	using SafeMath for uint256;	
	using WadRayMath for uint256;
	AddressProvider public addressProvider;
	LendingPoolCore public core;

	constructor (address _addressesProvider) public {
		addressProvider = AddressProvider(_addressesProvider);
	}

	function initialize() external {
        core = LendingPoolCore(addressProvider.getLendingPoolCore());
	}

    event ReserveInitialized(address _reserve, address _hTokenAddress, address _dTokenAddress);

	/*
    * Initialize a reserve in the protocol.
    * Gets name and symbol info from reserve to create hToken  and dToken for it.
    * Calls internal function _initializeReserve
    */
    function initializeReserve(
        address _reserve
    ) external {
        ERC20Detailed asset = ERC20Detailed(_reserve);
        uint8 decimals = asset.decimals();

        string memory hTokenName = string(abi.encodePacked("Hood Interest ", asset.name(), "Token"));
        string memory hTokenSymbol = string(abi.encodePacked("h", asset.symbol()));

        string memory dTokenName = string(abi.encodePacked("Hood Debt ", asset.name(), "Token"));
        string memory dTokenSymbol = string(abi.encodePacked("d", asset.symbol()));


        _initializeReserve(
            _reserve,
            hTokenName,
            hTokenSymbol,
            dTokenName,
            dTokenSymbol,
            decimals
        );
    }

    function _initializeReserve (
        address _reserve,
        string memory _hName,
        string memory _hSymbol,
        string memory _dName,
        string memory _dSymbol,
        uint8 _decimals
    ) internal {

    	address addressProviderAddress = address(addressProvider);

        HToken hTokenInstance = new HToken(
            _hName,
            _hSymbol,
            _decimals,
            addressProviderAddress,
            _reserve
        );

        DToken dTokenInstance = new DToken(
            _dName,
            _dSymbol,
            _decimals,
            addressProviderAddress,
            _reserve
        );

        core.initializeReserveInternal(
        	_reserve,
        	address(hTokenInstance),
        	address(dTokenInstance),
        	_decimals
        	);

        emit ReserveInitialized(_reserve, address(hTokenInstance), address(dTokenInstance));
    }
}