// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AuraCredit - Simple demo credit contract (for Sepolia)
/// @notice Does not transfer real funds; only keeps credit balance on-chain.
contract AuraCredit {
    address public owner;

    struct Position {
        uint256 principal; // borrowed principal
        uint256 repaid; // total repaid so far
        bool active; // whether there is an open credit
    }

    // User -> credit position
    mapping(address => Position) private positions;
    // Join bonus (reduces effective debt)
    mapping(address => uint256) public joinBonus;

    uint256 public constant BONUS_AMOUNT = 50;
    uint256 public constant INTEREST_BPS = 200;

    event CreditTaken(address indexed user, uint256 principal, uint256 totalDebt);
    event CreditRepaid(address indexed user, uint256 amount, uint256 remainingDebt);
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
        require(amount > 0, "Tutar sifir");

        Position storage p = positions[msg.sender];
        require(!p.active, "Aktif kredi var");

        p.principal = amount;
        p.repaid = 0;
        p.active = true;

        uint256 debt = totalDebtOf(msg.sender);
        emit CreditTaken(msg.sender, amount, debt);
    }

    /// @notice Repays the current credit.
    function repay(uint256 amount) external {
        require(amount > 0, "Tutar sifir");

        Position storage p = positions[msg.sender];
        require(p.active, "Aktif kredi yok");

        uint256 debt = totalDebtOf(msg.sender);
        require(debt > 0, "Odenecek borc yok");
        require(amount <= debt, "Tutar borctan fazla");

        p.repaid += amount;

        uint256 gross = p.principal + _interestOf(p.principal);
        uint256 rawDebt = gross - p.repaid;
        if (rawDebt <= joinBonus[msg.sender] || p.repaid >= gross) {
            p.active = false;
            joinBonus[msg.sender] = 0;
        }

        uint256 remaining = totalDebtOf(msg.sender);
        emit CreditRepaid(msg.sender, amount, remaining);
    }

    /// @notice Grants 50 AURA join bonus (owner only). Reduces user's effective debt.
    function grantJoinBonus(address to) external onlyOwner {
        require(to != address(0), "Zero address");
        joinBonus[to] += BONUS_AMOUNT;
        emit JoinBonusGranted(to, BONUS_AMOUNT);
    }

    mapping(address => bool) public hasClaimedJoinBonus;

    /// @notice User claims 50 AURA join bonus. MetaMask opens for user to sign. One claim per address.
    function claimJoinBonus() external {
        require(!hasClaimedJoinBonus[msg.sender], "Already claimed");
        hasClaimedJoinBonus[msg.sender] = true;
        joinBonus[msg.sender] += BONUS_AMOUNT;
        emit JoinBonusGranted(msg.sender, BONUS_AMOUNT);
    }

    /// @notice Returns user's total debt (principal + interest - repaid - bonus).
    function totalDebtOf(address user) public view returns (uint256) {
        Position storage p = positions[user];
        if (!p.active) {
            return 0;
        }

        uint256 interest = _interestOf(p.principal);
        uint256 gross = p.principal + interest;

        if (p.repaid >= gross) {
            return 0;
        }

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

