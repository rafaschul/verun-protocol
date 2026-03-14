// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ValidatorRegistry {
    struct ValidatorRecord {
        string name;
        address validatorAddress;
        address revenueWallet;
        uint256 totalEarned;
        uint256 userCount;
        bool active;
    }

    address public owner;
    mapping(address => ValidatorRecord) public validators;
    address[] public validatorList;

    event ValidatorAdded(address indexed validator, string name, address revenueWallet);
    event ValidatorRevenueDistributed(address indexed validator, uint256 amount, uint256 evaluationCount, uint256 timestamp);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not owner');
        _;
    }

    constructor(address[3] memory validatorAddresses, string[3] memory names, address[3] memory revenueWallets) {
        owner = msg.sender;
        for (uint256 i = 0; i < 3; i++) {
            _addValidator(validatorAddresses[i], names[i], revenueWallets[i]);
        }
    }

    function _addValidator(address v, string memory name, address revenueWallet) internal {
        require(v != address(0), 'invalid validator');
        require(revenueWallet != address(0), 'invalid revenue wallet');
        require(!validators[v].active, 'validator exists');

        validators[v] = ValidatorRecord({
            name: name,
            validatorAddress: v,
            revenueWallet: revenueWallet,
            totalEarned: 0,
            userCount: 0,
            active: true
        });

        validatorList.push(v);
        emit ValidatorAdded(v, name, revenueWallet);
    }

    function addValidator(address v, string calldata name, address revenueWallet) external onlyOwner {
        _addValidator(v, name, revenueWallet);
    }

    function recordRevenue(address validator, uint256 amount, uint256 evaluationCount) external {
        require(validators[validator].active, 'Not validator');
        validators[validator].totalEarned += amount;
        validators[validator].userCount += evaluationCount;
        emit ValidatorRevenueDistributed(validator, amount, evaluationCount, block.timestamp);
    }

    function slashValidator(address validator, uint256 amount, string calldata reason) external onlyOwner {
        require(validators[validator].active, 'Not validator');
        emit ValidatorSlashed(validator, amount, reason);
    }

    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }
}
