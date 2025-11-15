// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "hardhat/console.sol"; // used in testing chains

/**
 * @title Multisig Wallet Contract
 * @author Al-Qa'qa'
 * @notice A secure multisignature wallet that requires multiple approvals before executing transactions
 * @dev This contract allows multiple owners to manage funds collectively
 */
contract MultisigWallet {
    // Events
    event Deposit(address indexed sender, uint256 amount);
    event Submit(uint256 indexed txId, address indexed owner);
    event Approve(address indexed owner, uint256 indexed txId);
    event Revoke(address indexed owner, uint256 indexed txId);
    event Execute(uint256 indexed txId);

    // Structs
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;
    uint256 public transactionCount;

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approved;

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "MultisigWallet: caller is not an owner");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < transactions.length, "MultisigWallet: transaction does not exist");
        _;
    }

    modifier notApproved(uint256 _txId) {
        require(!approved[_txId][msg.sender], "MultisigWallet: transaction already approved");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "MultisigWallet: transaction already executed");
        _;
    }

    /**
     * @notice Constructor to initialize the multisig wallet
     * @param _owners Array of owner addresses that will have access to this wallet
     * @param _required Minimum number of approvals required to execute a transaction
     * @dev Requires at least one owner and _required must be between 1 and owners.length
     */
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "MultisigWallet: owners required");
        require(
            _required > 0 && _required <= _owners.length,
            "MultisigWallet: invalid required number of owners"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "MultisigWallet: invalid owner address");
            require(!isOwner[owner], "MultisigWallet: owner is not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        required = _required;
    }

    /**
     * @notice Handle receiving ETH from external wallets
     * @dev Emits Deposit event when ETH is received
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Fallback function to handle ETH sent without data
     */
    fallback() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @notice Submit a new transaction to the multisig wallet
     * @param _to Address that will receive the transaction
     * @param _value Amount of ETH to be transferred (in wei)
     * @param _data Additional data to be sent with the transaction
     * @return txId The ID of the newly created transaction
     * @dev The submitter automatically approves their own transaction
     */
    function submit(
        address _to,
        uint256 _value,
        bytes calldata _data
    ) external onlyOwner returns (uint256 txId) {
        require(_to != address(0), "MultisigWallet: invalid recipient address");

        txId = transactions.length;
        transactions.push(Transaction(_to, _value, _data, false));
        transactionCount++;

        // Automatically approve the transaction by the submitter
        approved[txId][msg.sender] = true;

        emit Submit(txId, msg.sender);
        emit Approve(msg.sender, txId);
    }

    /**
     * @notice Approve a pending transaction
     * @param _txId Transaction ID to approve
     * @dev Only owners can approve, and they cannot approve the same transaction twice
     */
    function approve(uint256 _txId)
        external
        onlyOwner
        txExists(_txId)
        notApproved(_txId)
        notExecuted(_txId)
    {
        approved[_txId][msg.sender] = true;
        emit Approve(msg.sender, _txId);
    }

    /**
     * @notice Revoke approval for a transaction
     * @param _txId Transaction ID to revoke approval for
     * @dev Only the owner who approved can revoke their approval
     */
    function revoke(uint256 _txId)
        external
        onlyOwner
        txExists(_txId)
        notExecuted(_txId)
    {
        require(approved[_txId][msg.sender], "MultisigWallet: transaction not approved by caller");
        approved[_txId][msg.sender] = false;
        emit Revoke(msg.sender, _txId);
    }

    /**
     * @notice Execute a transaction that has enough approvals
     * @param _txId Transaction ID to execute
     * @dev Requires at least `required` number of approvals before execution
     */
    function execute(uint256 _txId) external txExists(_txId) notExecuted(_txId) {
        Transaction storage transaction = transactions[_txId];

        require(
            getApprovalCount(_txId) >= required,
            "MultisigWallet: insufficient approvals"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "MultisigWallet: transaction execution failed");

        emit Execute(_txId);
    }

    /**
     * @notice Get the number of approvals for a specific transaction
     * @param _txId Transaction ID to check
     * @return count Number of approvals for the transaction
     */
    function getApprovalCount(uint256 _txId) public view returns (uint256 count) {
        require(_txId < transactions.length, "MultisigWallet: transaction does not exist");
        
        for (uint256 i = 0; i < owners.length; i++) {
            if (approved[_txId][owners[i]]) {
                count++;
            }
        }
    }

    /**
     * @notice Get the total number of transactions
     * @return count Total number of transactions submitted
     */
    function getTransactionCount() external view returns (uint256 count) {
        return transactions.length;
    }

    /**
     * @notice Get the total number of owners
     * @return count Total number of owners
     */
    function getOwnerCount() external view returns (uint256 count) {
        return owners.length;
    }

    /**
     * @notice Get all owner addresses
     * @return Array of all owner addresses
     */
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /**
     * @notice Get transaction details by ID
     * @param _txId Transaction ID
     * @return to Recipient address
     * @return value Amount of ETH to transfer
     * @return data Additional data
     * @return executed Whether the transaction has been executed
     */
    function getTransaction(uint256 _txId)
        external
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed
        )
    {
        require(_txId < transactions.length, "MultisigWallet: transaction does not exist");
        Transaction memory transaction = transactions[_txId];
        return (transaction.to, transaction.value, transaction.data, transaction.executed);
    }

    /**
     * @notice Check if a transaction is approved by a specific owner
     * @param _txId Transaction ID
     * @param _owner Owner address to check
     * @return Whether the owner has approved the transaction
     */
    function isApproved(uint256 _txId, address _owner) external view returns (bool) {
        require(_txId < transactions.length, "MultisigWallet: transaction does not exist");
        return approved[_txId][_owner];
    }

    /**
     * @notice Get the wallet balance
     * @return balance Current balance of the wallet in wei
     */
    function getBalance() external view returns (uint256 balance) {
        return address(this).balance;
    }
}
