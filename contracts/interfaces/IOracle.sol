// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

/**
* @title Proxy Oracle Interface
* @author Newton Poudel
**/


interface IOracle {
    function get_reference_data(string calldata _quote, string calldata _base) external view returns (uint);
    function set_reference_data(string calldata _quote, string calldata _base, uint _price) external;

}
