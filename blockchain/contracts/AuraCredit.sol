// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AuraCredit - Simple demo credit contract (for Sepolia)
/// @notice Does not transfer real funds; only keeps credit balance on-chain.
contract AuraCredit {
    address public owner;

    struct Position {
        uint256 principal;
        uint256 repaid;
        bool active;
    }

    mapping(address => Position) private positions;
    mapping(address => uint256) public joinBonus;
    mapping(address => bool) public hasClaimedJoinBonus;

    uint256 public constant BONUS_AMOUNT = 50;
    uint256 public constant INTEREST_BPS = 200;

    event CreditTaken(address indexed user, uint256 principal, uint256 totalDebt);
    event CreditRepaid(address indexed user, uint256 amount, uint256 remainingDebt);
    event CreditClosed(address indexed user, uint256 bonusRemaining);
    event JoinBonusGranted(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Opens a new credit. One credit per user at a time.
    function takeCredit(uint256 amount) external {
        require(amount > 0, "Amount zero");

        Position storage p = positions[msg.sender];
        require(!p.active, "Active credit exists");

        p.principal = amount;
        p.repaid = 0;
        p.active = true;

        uint256 debt = totalDebtOf(msg.sender);
        emit CreditTaken(msg.sender, amount, debt);
    }

    /// @notice Repays the current credit.
    function repay(uint256 amount) external {
        Position storage p = positions[msg.sender];
        require(p.active, "No active credit");

        uint256 debt = totalDebtOf(msg.sender);

        if (debt == 0) {
            // Bonus fully covers debt - user must call closeCredit() instead
            revert("Debt zero - use closeCredit()");
        }

        require(amount > 0, "Amount zero");
        require(amount <= debt, "Amount exceeds debt");

        p.repaid += amount;

        uint256 gross = p.principal + _interestOf(p.principal);
        uint256 rawDebt = gross - p.repaid;

        if (rawDebt <= joinBonus[msg.sender] || p.repaid >= gross) {
            _closePosition(msg.sender);
        }

        uint256 remaining = totalDebtOf(msg.sender);
        emit CreditRepaid(msg.sender, amount, remaining);
    }

    /// @notice Closes credit when debt is 0 (e.g. bonus fully covers it). Prevents deadlock.
    function closeCredit() external {
        Position storage p = positions[msg.sender];
        require(p.active, "No active credit");
        require(totalDebtOf(msg.sender) == 0, "Debt not zero - repay first");

        _closePosition(msg.sender);
    }

    /// @dev Closes position and only deducts bonus used to cover raw debt. Preserves remaining bonus.
    function _closePosition(address user) internal {
        Position storage p = positions[user];
        uint256 gross = p.principal + _interestOf(p.principal);
        uint256 rawDebt = gross - p.repaid;

        uint256 bonus = joinBonus[user];
        uint256 bonusUsed = rawDebt > bonus ? bonus : rawDebt;
        joinBonus[user] -= bonusUsed;

        p.active = false;

        emit CreditClosed(user, joinBonus[user]);
    }

    /// @notice Grants 50 AURA join bonus (owner only). One per user (cannot double with claimJoinBonus).
    function grantJoinBonus(address to) external onlyOwner {
        require(to != address(0), "Zero address");
        require(!hasClaimedJoinBonus[to], "Already received bonus");
        hasClaimedJoinBonus[to] = true;
        joinBonus[to] += BONUS_AMOUNT;
        emit JoinBonusGranted(to, BONUS_AMOUNT);
    }

    /// @notice User claims 50 AURA join bonus. One per address (cannot double with grantJoinBonus).
    function claimJoinBonus() external {
        require(!hasClaimedJoinBonus[msg.sender], "Already claimed");
        hasClaimedJoinBonus[msg.sender] = true;
        joinBonus[msg.sender] += BONUS_AMOUNT;
        emit JoinBonusGranted(msg.sender, BONUS_AMOUNT);
    }

    /// @notice Returns user's total debt (principal + interest - repaid - bonus).
    function totalDebtOf(address user) public view returns (uint256) {
        Position storage p = positions[user];
        if (!p.active) return 0;

        uint256 interest = _interestOf(p.principal);
        uint256 gross = p.principal + interest;

        if (p.repaid >= gross) return 0;

        uint256 rawDebt = gross - p.repaid;
        uint256 bonus = joinBonus[user];
        if (bonus >= rawDebt) return 0;
        return rawDebt - bonus;
    }

    /// @notice Returns user's position and current debt in one call.
    function getPosition(address user)
        external
        view
        returns (uint256 principal, uint256 repaid, bool active, uint256 debt)
    {
        Position storage p = positions[user];
        principal = p.principal;
        repaid = p.repaid;
        active = p.active;
        debt = totalDebtOf(user);
    }

    function _interestOf(uint256 principal) internal pure returns (uint256) {
        return (principal * INTEREST_BPS) / 10_000;
    }
}
