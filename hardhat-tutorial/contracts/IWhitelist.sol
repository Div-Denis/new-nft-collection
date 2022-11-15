//SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;

//Whitelist 的接口

interface IWhitelist {
    function whitelistedAddresses(address) external view returns(bool);
}