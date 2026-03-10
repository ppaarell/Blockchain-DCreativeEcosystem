// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAssetRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface ILicenseTerms {
    function isActive(uint256 tokenId) external view returns (bool);
    function rateOf(uint256 tokenId) external view returns (uint256);
}

/// ---------------------------------------------------------------------------
/// RoyaltyEngine (Algorithm-2: Royalty Cycle Execution)
/// ---------------------------------------------------------------------------
contract RoyaltyEngine is AccessControl {
    bytes32 public constant REPORTER_ROLE  = keccak256("REPORTER_ROLE");  // DSP / marketplace
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE"); // opsional untuk funding/withdraw

    IERC20 public immutable payoutToken;
    IAssetRegistry public immutable asset;
    ILicenseTerms  public immutable terms;

    // simpan deposit per reporter agar engine bisa membayar tanpa perlu allowance tiap submit
    mapping(address => uint256) public deposits;

    event Funded(address indexed reporter, uint256 amount);
    event UsageSubmitted(address indexed reporter, uint256 indexed tokenId, uint256 units, uint256 rate, uint256 due, bytes32 reportHash);
    event RoyaltyPaid(uint256 indexed tokenId, address indexed payee, uint256 amount);

    constructor(address _payoutToken, address _assetRegistry, address _licenseTerms) {
        require(_payoutToken != address(0) && _assetRegistry != address(0) && _licenseTerms != address(0), "bad addr");
        payoutToken = IERC20(_payoutToken);
        asset       = IAssetRegistry(_assetRegistry);
        terms       = ILicenseTerms(_licenseTerms);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
    }

    // ===== Funding =====

    function fund(uint256 amount) external {
        require(amount > 0, "amount=0");
        require(payoutToken.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        deposits[msg.sender] += amount;
        emit Funded(msg.sender, amount);
    }

    // ===== Royalty lifecycle =====

    function submitUsage(uint256 tokenId, uint256 units, bytes32 reportHash)
        external
        onlyRole(REPORTER_ROLE)
    {
        require(units > 0, "units=0");
        require(terms.isActive(tokenId), "terms inactive");

        uint256 rate = terms.rateOf(tokenId);
        require(rate > 0, "rate=0");

        uint256 due = units * rate;
        require(deposits[msg.sender] >= due, "insufficient deposit");

        deposits[msg.sender] -= due;

        address payee = asset.ownerOf(tokenId);
        require(payee != address(0), "no owner");

        require(payoutToken.transfer(payee, due), "payout failed");

        emit UsageSubmitted(msg.sender, tokenId, units, rate, due, reportHash);
        emit RoyaltyPaid(tokenId, payee, due);
    }

    // ===== View helpers =====

    function quoteRoyalty(uint256 tokenId, uint256 units) external view returns (uint256 due) {
        if (!terms.isActive(tokenId)) return 0;
        uint256 rate = terms.rateOf(tokenId);
        return units * rate;
    }
}
