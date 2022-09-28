pragma solidity 0.6.2;

import "./HMTokenInterface.sol";
import "./SafeMath.sol";

contract RewardPool {
    using SafeMath for uint256;

    uint256 private constant BULK_MAX_VALUE = 1000000000 * (10**18);
    uint256 private constant BULK_MAX_COUNT = 100;

    address public addressHMTToken;

    constructor(address _addressHMTToken) public {
        addressHMTToken = _addressHMTToken;
    }

    /**
     * @dev Get HMT Token balance
     */
    function getBalance() public view returns (uint256) {
        return HMTokenInterface(addressHMTToken).balanceOf(address(this));
    }

    /**
     * @dev Distribute reward to the recipient
     * @param _recipient Address of the recipient that will receive the reward
     * @param _amount Reward amount
     */
    function distribute(address _recipient, uint256 _amount) external {
        require(getBalance() >= _amount, "not enough balance");

        HMTokenInterface(addressHMTToken).transfer(_recipient, _amount);
    }

    /**
     * @dev Distribute reward to the recipient
     * @param _recipients Array of addresses of the recipient that will receive the reward
     * @param _amounts Array of the reward amounts
     */
    function distributeBulk(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external {
        require(
            _recipients.length == _amounts.length,
            "Amount of recipients and values don't match"
        );
        require(_recipients.length < BULK_MAX_COUNT, "Too many recipients");

        uint256 aggregatedBulkAmount = 0;
        for (uint256 i; i < _amounts.length; i++) {
            aggregatedBulkAmount += _amounts[i];
        }
        require(aggregatedBulkAmount < BULK_MAX_VALUE, "Bulk value too high");
        require(getBalance() >= aggregatedBulkAmount, "not enough balance");

        for (uint256 i = 0; i < _recipients.length; ++i) {
            HMTokenInterface(addressHMTToken).transfer(
                _recipients[i],
                _amounts[i]
            );
        }
    }
}
