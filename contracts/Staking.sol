pragma solidity 0.6.2;

import "./HMTokenInterface.sol";
import "./SafeMath.sol";
import "./interfaces/IStaking.sol";

contract Staking is IStaking {
    using SafeMath for uint256;

    event StakeDeposited(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event StakeSlashed(address indexed user, uint256 amount);

    // Validator Threshold
    // TODO make this configurable
    uint256 private constant VALIDATOR_THRESHOLD = 1000 * 1e18;

    // HMT Token Address
    address public addressHMTToken;

    // Reward Pool Address
    address public addressRewardPool;

    // Governance Address
    address public addressGovernance;

    // Staking amount per user
    mapping(address => uint256) public override amountStaked;

    constructor(address _addressHMTToken, address _addressRewardPool) public {
        require(_addressHMTToken != address(0), "address zero");

        addressHMTToken = _addressHMTToken;

        require(_addressRewardPool != address(0), "address zero");
        addressRewardPool = _addressRewardPool;
    }

    /**
     * @dev Deposit HMT tokens
     * @param _amount Amount of tokens to stake
     */
    function stake(uint256 _amount) external override {
        amountStaked[msg.sender] = amountStaked[msg.sender] + _amount;

        require(
            HMTokenInterface(addressHMTToken).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "!transfer"
        );

        emit StakeDeposited(msg.sender, _amount);
    }

    /**
     * @dev Withdraw HMT tokens
     * @param _amount Amount of tokens to unstake
     *
     */
    function unstake(uint256 _amount) external override {
        require(amountStaked[msg.sender] >= _amount, "not enough balance");

        amountStaked[msg.sender] = amountStaked[msg.sender] - _amount;

        require(
            HMTokenInterface(addressHMTToken).transfer(msg.sender, _amount),
            "!transfer"
        );

        emit StakeWithdrawn(msg.sender, _amount);
    }

    /**
     * @dev Slash HMT tokens
     * @param _user Address of the user who is being slashed
     * @param _amount Amount of tokens to slash
     *
     */
    function slash(address _user, uint256 _amount)
        external
        override
        onlyGovernance
    {
        require(amountStaked[_user] >= _amount, "not enough balance");

        amountStaked[_user] = amountStaked[_user] - _amount;

        require(
            HMTokenInterface(addressHMTToken).transfer(
                addressRewardPool,
                _amount
            ),
            "!transfer"
        );

        emit StakeSlashed(_user, _amount);
    }

    /**
     * @dev Check if the user has staked
     * @param _user Address of the user to check against
     * @return true if the user has staked
     */
    function hasStake(address _user) external view override returns (bool) {
        return amountStaked[_user] > 0;
    }

    /**
     * @dev Check if the user is validator
     * @param _user Address of the user to check against
     * @return true if the user has staked more than the threshold
     */
    function isValidator(address _user) external view override returns (bool) {
        return amountStaked[_user] >= VALIDATOR_THRESHOLD;
    }

    /**
     * @dev Set Governance Address
     * @param _addressGovernance governance address to set
     */
    function setGovernance(address _addressGovernance) external {
        require(addressGovernance == address(0), "already set");
        require(_addressGovernance != address(0), "address zero");
        addressGovernance = _addressGovernance;
    }

    modifier onlyGovernance() {
        require(msg.sender == addressGovernance, "not governance call");
        _;
    }
}
