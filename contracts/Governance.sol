pragma solidity 0.6.2;

import "./SafeMath.sol";
import "./interfaces/IStaking.sol";

contract Governance {
    using SafeMath for uint256;

    event SlashProposalCreated(address indexed user, uint256 amount);
    event SlashProposalVoted(
        uint256 indexed pid,
        address indexed voter,
        bool vote
    );
    event SlashProposalFinished(uint256 indexed pid);

    struct SlashProposal {
        address user;
        uint256 amount;
        uint256 amountTotalVoted;
        uint256 amountUpVoted;
        bool finished;
    }

    // Address of owner
    address public owner;

    // Address of Staking contract
    address public addressStaking;

    // Slash proposals
    SlashProposal[] public proposals;

    constructor(address _addressStaking) public {
        require(_addressStaking != address(0), "zero address");
        addressStaking = _addressStaking;

        owner = msg.sender;
    }

    /**
     * @dev Create slash proposal
     * @param _user Address of the user to slash
     * @param _amount Slash amount
     */
    function createSlashProposal(address _user, uint256 _amount)
        external
        onlyOwner
    {
        require(
            IStaking(addressStaking).amountStaked(_user) >= _amount,
            "invalid proposal"
        );

        proposals.push(
            SlashProposal({
                user: _user,
                amount: _amount,
                amountTotalVoted: 0,
                amountUpVoted: 0,
                finished: false
            })
        );

        emit SlashProposalCreated(_user, _amount);
    }

    /**
     * @dev Vote against slash proposal
     * @param _pid slash proposal id
     * @param _vote true for up vote, false for down vote
     */
    function voteSlashProposal(uint256 _pid, bool _vote)
        external
        onlyValidator
    {
        SlashProposal memory proposal = proposals[_pid];

        require(proposal.finished == false, "vote finished");

        proposal.amountTotalVoted = proposal.amountTotalVoted + 1;

        if (_vote) {
            proposal.amountUpVoted = proposal.amountUpVoted + 1;
        }

        proposals[_pid] = proposal;

        emit SlashProposalVoted(_pid, msg.sender, _vote);
    }

    /**
     * @dev Finish slash proposal
     * @param _pid proposal id
     */
    function finishSlashProposal(uint256 _pid) external onlyOwner {
        SlashProposal memory proposal = proposals[_pid];

        require(proposal.finished == false, "vote finished");

        proposal.finished = true;
        proposals[_pid] = proposal;

        // If up vote is greater than down vote, slash the user
        if (
            proposal.amountTotalVoted > 0 &&
            proposal.amountUpVoted * 2 >= proposal.amountTotalVoted
        ) {
            IStaking(addressStaking).slash(proposal.user, proposal.amount);
        }

        emit SlashProposalFinished(_pid);
    }

    function proposalLength() external view returns (uint256) {
        return proposals.length;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "only owner");
        _;
    }

    modifier onlyValidator() {
        require(
            IStaking(addressStaking).isValidator(msg.sender),
            "only validator"
        );
        _;
    }
}
