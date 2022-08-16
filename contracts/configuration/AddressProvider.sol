// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

/**
* @title Address Provider
* @author Newton Poudel
**/

contract AddressProvider {
	mapping(bytes32 => address) private addresses;
	address public owner;
	bytes32 private constant LENDING_POOL = "LENDING_POOL";
	bytes32 private constant LENDING_POOL_CORE = "LENDING_POOL_CORE";
	bytes32 private constant LENDING_POOL_DATA_PROVIDER = "LENDING_POOL_DATA_PROVIDER";
	bytes32 private constant PRICE_ORACLE = "PRICE_ORACLE";
	bytes32 private constant REWARD_DISTRIBUTION = "REWARD_DISTRIBUTION";
	bytes32 private constant ETH_ADDRESS = "ETH_ADDRESS";
	bytes32 private constant RESERVE_INITIALIZER = "RESERVE_INITIALIZER";
	bytes32 private constant CONFIG_LIBRARY = "CONFIG_LIBRARY";
	bytes32 private constant HOOD_TOKEN = "HOOD_TOKEN";

	event LendingPoolUpdated(address indexed  _updatedAddress);
	event LendingPoolCoreUpdated(address indexed  _updatedAddress);
	event LendingPoolDataProviderUpdated(address indexed  _updatedAddress);
	event PriceOracleUpdated(address indexed  _updatedAddress);
	event EthAddressUpdated(address indexed  _updatedAddress);
	event ReserveInitializerUpdated(address indexed  _updatedAddress);
	event ConfigLibraryUpdated(address indexed  _updatedAddress);
	event HoodTokenUpdated(address indexed _updatedAddress);

	constructor() public {
		owner = msg.sender;
	}

	/*
	* Modifier 
	* only cntract owner can call methods if this modifier is mentioned
	*/
	modifier onlyOwner() {
		require(msg.sender == owner, "Sender is not owner");
		_;
	}

	/*
	* Returns lendingPool address
	*/
	function getLendingPool() public view returns (address) {
		return getAddress(LENDING_POOL);
	}

	/*
	* Returns lendingPoolCore address
	*/
	function getLendingPoolCore() public view returns (address) {
		return getAddress(LENDING_POOL_CORE);
	}

	/*
	* Returns lendingPoolDataProvider address
	*/
	function getLendingPoolDataProvider() public view returns (address) {
		return getAddress(LENDING_POOL_DATA_PROVIDER);
	}

	/*
	* Returns priceOracle address
	*/
	function getPriceOracle() public view returns (address) {
		return getAddress(PRICE_ORACLE);
	}

	/*
	* Returns addressProvider address
	*/
	function getAddressProvider() public view returns (address) {
		return address(this);
	}

	/*
	* Returns Eth address
	*/
	function getEthAddress() public view returns (address) {
		return getAddress(ETH_ADDRESS);
	}

	/*
	* Returns Reserve Initializer
	*/
	function getReserveInitializer() public view returns (address) {
		return getAddress(RESERVE_INITIALIZER);
	}

	/*
	* Returns Config Library
	*/
	function getConfigLibrary() public view returns (address) {
		return getAddress(CONFIG_LIBRARY);
	}

	/*
	* Returns HOOD Token Address
	*/
	function getHoodToken() public view returns (address) {
		return getAddress(HOOD_TOKEN);
	}

	/*
	* Sets HOOD Token address
	*/
	function setHoodToken(address _hoodToken) public onlyOwner {
		setAddress(HOOD_TOKEN, _hoodToken);
		emit HoodTokenUpdated(_hoodToken);
	}

	/*
	* Sets lendingPool address
	*/
	function setLendingPool(address _lendingPool) public onlyOwner {
		setAddress(LENDING_POOL, _lendingPool);
		emit LendingPoolUpdated(_lendingPool);
	}

	/*
	* Sets lendingPoolCore address
	*/
	function setLendingPoolCore(address _lendingPoolCore) public onlyOwner {
		setAddress(LENDING_POOL_CORE, _lendingPoolCore);
		emit LendingPoolCoreUpdated(_lendingPoolCore);
	}

	/*
	* Sets lendingPoolDataProvider address
	*/
	function setLendingPoolDataProvider(address _lendingPoolDataProvider) public onlyOwner {
		setAddress(LENDING_POOL_DATA_PROVIDER, _lendingPoolDataProvider);
		emit LendingPoolDataProviderUpdated(_lendingPoolDataProvider);
	}


	/*
	* Sets priceOracle address
	*/
	function setPriceOracle(address _priceOracle) public onlyOwner {
		setAddress(PRICE_ORACLE, _priceOracle);
		emit PriceOracleUpdated(_priceOracle);
	}

	/*
	* Sets ETH address
	*/
	function setETHAddress(address _eth) public onlyOwner {
		setAddress(ETH_ADDRESS, _eth);
		emit EthAddressUpdated(_eth);
	}

	/*
	* Sets Reserve Initializer Address
	*/
	function setReserveInitializer(address _reserveInitializer) public onlyOwner {
		setAddress(RESERVE_INITIALIZER, _reserveInitializer);
		emit ReserveInitializerUpdated(_reserveInitializer);
	}

	/* 
	* Sets Config Library Address
	*/
	function setConfigLibrary(address _config) public onlyOwner {
		setAddress(CONFIG_LIBRARY, _config);
		emit ConfigLibraryUpdated(_config);
	}

	function getAddress(bytes32 _key) public view returns (address) {
		return addresses[_key];
	}

	function setAddress(bytes32 _key, address _contract) internal {
		addresses[_key] = _contract;
	}
}
