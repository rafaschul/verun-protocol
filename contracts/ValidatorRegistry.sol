// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ValidatorRegistry {
    address[] private validators;

    constructor(address[3] memory _validators) {
        for (uint256 i = 0; i < _validators.length; i++) {
            require(_validators[i] != address(0), 'invalid validator');
            validators.push(_validators[i]);
        }
    }

    function getValidators() external view returns (address[] memory) {
        return validators;
    }
}
