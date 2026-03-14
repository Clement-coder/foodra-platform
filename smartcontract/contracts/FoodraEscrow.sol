// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title FoodraEscrow
 * @notice Per-product USDC escrow for Foodra marketplace on Base
 *
 * Flow:
 *  1. Buyer calls createEscrow() → USDC locked in contract
 *  2. Buyer calls confirmDelivery() → farmer paid minus 2.5% fee
 *  3. After 7 days silence → anyone calls autoRelease() → farmer paid
 *  4. Either party calls raiseDispute() → admin resolves via resolveDispute()
 */
contract FoodraEscrow {

    // ── Types ────────────────────────────────────────────────

    enum EscrowStatus { LOCKED, RELEASED, REFUNDED, DISPUTED }

    struct Escrow {
        address buyer;
        address farmer;
        uint256 amount;     // USDC (6 decimals)
        uint256 ngnAmount;  // NGN equivalent at purchase time (display only)
        EscrowStatus status;
        uint256 createdAt;
    }

    // ── State ────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public owner;
    address public treasury;

    uint16 public feeBps = 250;              // 2.5%
    uint16 public constant MAX_FEE_BPS = 1000; // 10% hard cap

    uint256 public constant AUTO_RELEASE_PERIOD = 7 days;

    mapping(bytes32 => Escrow) public escrows;

    // ── Events ───────────────────────────────────────────────

    event EscrowCreated(bytes32 indexed orderId, address indexed buyer, address indexed farmer, uint256 amount, uint256 ngnAmount);
    event DeliveryConfirmed(bytes32 indexed orderId, uint256 farmerAmount, uint256 fee);
    event AutoReleased(bytes32 indexed orderId);
    event DisputeRaised(bytes32 indexed orderId, address raisedBy);
    event DisputeResolved(bytes32 indexed orderId, address releasedTo, uint256 amount);
    event FeeUpdated(uint16 oldFee, uint16 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // ── Errors ───────────────────────────────────────────────

    error NotBuyer();
    error NotParty();
    error NotOwner();
    error InvalidAddress();
    error InvalidAmount();
    error FeeTooHigh();
    error EscrowNotFound();
    error EscrowNotLocked();
    error TooEarlyForAutoRelease();
    error EscrowAlreadyExists();
    error TransferFailed();

    // ── Modifiers ────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyBuyer(bytes32 orderId) {
        if (escrows[orderId].buyer != msg.sender) revert NotBuyer();
        _;
    }

    modifier mustBeLocked(bytes32 orderId) {
        if (escrows[orderId].buyer == address(0)) revert EscrowNotFound();
        if (escrows[orderId].status != EscrowStatus.LOCKED) revert EscrowNotLocked();
        _;
    }

    // ── Constructor ──────────────────────────────────────────

    constructor(address _usdc, address _treasury) {
        if (_usdc == address(0) || _treasury == address(0)) revert InvalidAddress();
        usdc = IERC20(_usdc);
        treasury = _treasury;
        owner = msg.sender;
    }

    // ── Core ─────────────────────────────────────────────────

    /**
     * @param orderId  keccak256(abi.encodePacked(supabaseOrderId, productId))
     * @param farmer   Farmer's wallet address
     * @param amount   USDC amount in 6-decimal units
     * @param ngnAmount NGN equivalent stored for display
     */
    function createEscrow(
        bytes32 orderId,
        address farmer,
        uint256 amount,
        uint256 ngnAmount
    ) external {
        if (farmer == address(0) || farmer == msg.sender) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (escrows[orderId].buyer != address(0)) revert EscrowAlreadyExists();

        if (!usdc.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();

        escrows[orderId] = Escrow({
            buyer: msg.sender,
            farmer: farmer,
            amount: amount,
            ngnAmount: ngnAmount,
            status: EscrowStatus.LOCKED,
            createdAt: block.timestamp
        });

        emit EscrowCreated(orderId, msg.sender, farmer, amount, ngnAmount);
    }

    /// @notice Buyer confirms delivery — releases funds to farmer minus fee
    function confirmDelivery(bytes32 orderId)
        external
        onlyBuyer(orderId)
        mustBeLocked(orderId)
    {
        _release(orderId);
    }

    /// @notice Anyone can trigger auto-release after 7 days
    function autoRelease(bytes32 orderId) external mustBeLocked(orderId) {
        if (block.timestamp < escrows[orderId].createdAt + AUTO_RELEASE_PERIOD)
            revert TooEarlyForAutoRelease();
        _release(orderId);
        emit AutoReleased(orderId);
    }

    /// @notice Buyer or farmer raises a dispute — freezes funds for admin review
    function raiseDispute(bytes32 orderId) external mustBeLocked(orderId) {
        Escrow storage e = escrows[orderId];
        if (msg.sender != e.buyer && msg.sender != e.farmer) revert NotParty();
        e.status = EscrowStatus.DISPUTED;
        emit DisputeRaised(orderId, msg.sender);
    }

    /**
     * @notice Owner resolves dispute
     * @param releaseTo address(0) = refund buyer; farmer address = release to farmer
     */
    function resolveDispute(bytes32 orderId, address releaseTo) external onlyOwner {
        Escrow storage e = escrows[orderId];
        if (e.buyer == address(0)) revert EscrowNotFound();
        if (e.status != EscrowStatus.DISPUTED) revert EscrowNotLocked();

        address recipient = (releaseTo == address(0)) ? e.buyer : releaseTo;
        uint256 amount = e.amount;
        e.status = (releaseTo == address(0)) ? EscrowStatus.REFUNDED : EscrowStatus.RELEASED;

        if (!usdc.transfer(recipient, amount)) revert TransferFailed();
        emit DisputeResolved(orderId, recipient, amount);
    }

    // ── Admin ────────────────────────────────────────────────

    function updateFee(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit FeeUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    function updateTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }

    // ── Views ────────────────────────────────────────────────

    function getEscrow(bytes32 orderId) external view returns (Escrow memory) {
        return escrows[orderId];
    }

    function computeOrderId(string calldata supabaseOrderId, string calldata productId)
        external pure returns (bytes32)
    {
        return keccak256(abi.encodePacked(supabaseOrderId, productId));
    }

    // ── Internal ─────────────────────────────────────────────

    function _release(bytes32 orderId) internal {
        Escrow storage e = escrows[orderId];
        uint256 fee = (e.amount * feeBps) / 10000;
        uint256 farmerAmount = e.amount - fee;
        e.status = EscrowStatus.RELEASED;

        if (!usdc.transfer(e.farmer, farmerAmount)) revert TransferFailed();
        if (fee > 0 && !usdc.transfer(treasury, fee)) revert TransferFailed();

        emit DeliveryConfirmed(orderId, farmerAmount, fee);
    }
}
