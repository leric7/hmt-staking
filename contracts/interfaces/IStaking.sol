pragma solidity 0.6.2;

interface IStaking {
    function amountStaked(address _user) external view returns (uint256);

    function stake(uint256 _amount) external;

    function unstake(uint256 _amount) external;

    function slash(address _user, uint256 _amount) external;

    function hasStake(address _user) external view returns (bool);

    function isValidator(address _user) external view returns (bool);
}
