pragma solidity 0.6.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract HMTToken is ERC20 {
    constructor(string memory name, string memory symbol)
        public
        ERC20(name, symbol)
    {}

    /**
     * @dev Function to mint tokens
     * @param value The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(uint256 value) public returns (bool) {
        _mint(_msgSender(), value);
        return true;
    }
}
