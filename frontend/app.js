// Wait for ethers to be loaded
function waitForEthers() {
    return new Promise((resolve, reject) => {
        if (typeof ethers !== 'undefined') {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof ethers !== 'undefined') {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('Ethers library failed to load after 5 seconds');
                alert('Lỗi: Thư viện Ethers chưa được tải. Vui lòng tải lại trang.');
                reject(new Error('Ethers library not loaded'));
            }
        }, 100);
    });
}

// Global variables
let provider = null;
let signer = null;
let contract = null;
let contractAddress = '';
let contractABI = null;

// Contract ABI - Complete version
const MULTISIG_WALLET_ABI = [
    "function owners(uint256) view returns (address)",
    "function isOwner(address) view returns (bool)",
    "function required() view returns (uint256)",
    "function transactionCount() view returns (uint256)",
    "function transactions(uint256) view returns (address to, uint256 value, bytes memory data, bool executed)",
    "function submit(address _to, uint256 _value, bytes calldata _data) external returns (uint256)",
    "function approve(uint256 _txId) external",
    "function revoke(uint256 _txId) external",
    "function execute(uint256 _txId) external",
    "function approved(uint256, address) view returns (bool)",
    "function getApprovalCount(uint256 _txId) view returns (uint256)",
    "function getTransactionCount() view returns (uint256)",
    "function getOwnerCount() view returns (uint256)",
    "function getOwners() view returns (address[])",
    "function getTransaction(uint256 _txId) view returns (address to, uint256 value, bytes memory data, bool executed)",
    "function isApproved(uint256 _txId, address _owner) view returns (bool)",
    "function getBalance() view returns (uint256)",
    "event Deposit(address indexed sender, uint256 amount)",
    "event Submit(uint256 indexed txId, address indexed owner)",
    "event Approve(address indexed owner, uint256 indexed txId)",
    "event Revoke(address indexed owner, uint256 indexed txId)",
    "event Execute(uint256 indexed txId)"
];

// Network configurations
const NETWORKS = {
    localhost: {
        name: 'localhost',
        chainId: 31337,
        rpcUrl: 'http://127.0.0.1:8545'
    },
    sepolia: {
        name: 'sepolia',
        chainId: 11155111,
        rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'
    },
    mainnet: {
        name: 'mainnet',
        chainId: 1,
        rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await waitForEthers();
        setupEventListeners();
        loadContractAddress();
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
});

function setupEventListeners() {
    document.getElementById('connect-btn').addEventListener('click', connectWallet);
    document.getElementById('deposit-btn').addEventListener('click', deposit);
    document.getElementById('submit-tx-btn').addEventListener('click', submitTransaction);
    document.getElementById('refresh-txs-btn').addEventListener('click', loadTransactions);
}

function loadContractAddress() {
    // Try to load from localStorage
    const savedAddress = localStorage.getItem('multisigWalletAddress');
    if (savedAddress) {
        document.getElementById('contract-address').value = savedAddress;
    }
}

async function connectWallet() {
    try {
        const contractAddr = document.getElementById('contract-address').value.trim();
        const networkSelect = document.getElementById('network-select').value;
        
        if (!contractAddr) {
            showStatus('connection-status', 'Vui lòng nhập địa chỉ contract', 'error');
            return;
        }

        if (!ethers.utils.isAddress(contractAddr)) {
            showStatus('connection-status', 'Địa chỉ contract không hợp lệ', 'error');
            return;
        }

        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            showStatus('connection-status', 'Vui lòng cài đặt MetaMask!', 'error');
            return;
        }

        // Connect to MetaMask
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        
        const network = await provider.getNetwork();
        const selectedNetwork = NETWORKS[networkSelect];
        
        // Check if we're on the correct network
        if (network.chainId !== selectedNetwork.chainId && networkSelect !== 'localhost') {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${selectedNetwork.chainId.toString(16)}` }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    showStatus('connection-status', 'Vui lòng thêm mạng vào MetaMask', 'error');
                    return;
                }
            }
        }

        // Connect to contract
        contractAddress = contractAddr;
        
        // Check if contract has code at this address
        const code = await provider.getCode(contractAddress);
        if (code === '0x' || code === '0x0') {
            showStatus('connection-status', 'Không tìm thấy contract tại địa chỉ này. Vui lòng kiểm tra lại địa chỉ hoặc đảm bảo contract đã được deploy.', 'error');
            return;
        }
        
        contract = new ethers.Contract(contractAddress, MULTISIG_WALLET_ABI, signer);
        
        // Verify contract by calling a simple view function
        try {
            await contract.required();
        } catch (error) {
            showStatus('connection-status', 'Địa chỉ này không phải là Multisig Wallet contract. Vui lòng kiểm tra lại địa chỉ.', 'error');
            console.error('Contract verification error:', error);
            return;
        }
        
        // Save address to localStorage
        localStorage.setItem('multisigWalletAddress', contractAddress);
        
        // Get user address
        const userAddress = await signer.getAddress();
        document.getElementById('current-address').textContent = userAddress;
        
        showStatus('connection-status', 'Kết nối thành công!', 'success');
        
        // Load wallet info
        await loadWalletInfo();
        
        // Show sections
        document.getElementById('wallet-info-section').style.display = 'block';
        document.getElementById('deposit-section').style.display = 'block';
        document.getElementById('submit-section').style.display = 'block';
        document.getElementById('transactions-section').style.display = 'block';
        
    } catch (error) {
        console.error('Connection error:', error);
        showStatus('connection-status', `Lỗi: ${error.message}`, 'error');
    }
}

async function loadWalletInfo() {
    try {
        if (!contract) {
            showStatus('connection-status', 'Chưa kết nối contract. Vui lòng kết nối wallet trước.', 'error');
            return;
        }

        // Verify contract is still valid
        const code = await provider.getCode(contractAddress);
        if (code === '0x' || code === '0x0') {
            showStatus('connection-status', 'Contract không còn tồn tại tại địa chỉ này.', 'error');
            return;
        }

        // Get wallet balance
        const balance = await provider.getBalance(contractAddress);
        document.getElementById('wallet-balance').textContent = 
            `${ethers.utils.formatEther(balance)} ETH`;

        // Get required approvals with error handling
        let required;
        try {
            required = await contract.required();
            document.getElementById('required-approvals').textContent = required.toString();
        } catch (error) {
            console.error('Error calling required():', error);
            showStatus('connection-status', 'Lỗi: Không thể đọc thông tin contract. Đảm bảo địa chỉ contract đúng và network đã được chọn đúng.', 'error');
            document.getElementById('required-approvals').textContent = 'Lỗi';
            return;
        }

        // Get owners count and list using new function
        let ownersCount = 0;
        let ownersList = [];
        try {
            ownersCount = await contract.getOwnerCount();
            ownersList = await contract.getOwners();
        } catch (e) {
            console.error('Error loading owners:', e);
            // Fallback to old method if new function doesn't exist
            try {
                while (true) {
                    try {
                        const owner = await contract.owners(ownersCount);
                        ownersList.push(owner);
                        ownersCount++;
                    } catch (err) {
                        break;
                    }
                }
            } catch (err2) {
                showStatus('connection-status', 'Lỗi khi tải danh sách owners. Vui lòng thử lại.', 'error');
            }
        }

        document.getElementById('owners-count').textContent = ownersCount.toString();
        
        // Check if current user is owner
        const userAddress = await signer.getAddress();
        let isOwner = false;
        try {
            isOwner = await contract.isOwner(userAddress);
        } catch (e) {
            console.error('Error checking owner status:', e);
        }
        document.getElementById('is-owner-status').textContent = isOwner ? 'Có' : 'Không';
        document.getElementById('is-owner-status').style.color = isOwner ? '#10b981' : '#ef4444';

        // Display owners list
        const ownersListEl = document.getElementById('owners-list');
        ownersListEl.innerHTML = '';
        ownersList.forEach((owner, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Owner ${index + 1}:</strong> <span class="address-highlight">${owner}</span>`;
            if (owner.toLowerCase() === userAddress.toLowerCase()) {
                li.style.borderLeftColor = '#10b981';
            }
            ownersListEl.appendChild(li);
        });

        // Load transactions
        await loadTransactions();

    } catch (error) {
        console.error('Error loading wallet info:', error);
        showStatus('connection-status', `Lỗi tải thông tin: ${error.message}`, 'error');
    }
}

async function deposit() {
    try {
        if (!signer) {
            showStatus('deposit-status', 'Vui lòng kết nối wallet trước', 'error');
            return;
        }

        const amount = document.getElementById('deposit-amount').value;
        if (!amount || parseFloat(amount) <= 0) {
            showStatus('deposit-status', 'Vui lòng nhập số lượng hợp lệ', 'error');
            return;
        }

        const tx = await signer.sendTransaction({
            to: contractAddress,
            value: ethers.utils.parseEther(amount)
        });

        showStatus('deposit-status', `Đang gửi giao dịch... Hash: ${tx.hash}`, 'info');
        
        await tx.wait();
        showStatus('deposit-status', `Nạp tiền thành công! Hash: ${tx.hash}`, 'success');
        
        document.getElementById('deposit-amount').value = '';
        await loadWalletInfo();

    } catch (error) {
        console.error('Deposit error:', error);
        showStatus('deposit-status', `Lỗi: ${error.message}`, 'error');
    }
}

async function submitTransaction() {
    try {
        if (!contract) {
            showStatus('submit-status', 'Vui lòng kết nối wallet trước', 'error');
            return;
        }

        const to = document.getElementById('tx-to').value.trim();
        const value = document.getElementById('tx-value').value;
        const data = document.getElementById('tx-data').value.trim() || '0x';

        if (!to || !ethers.utils.isAddress(to)) {
            showStatus('submit-status', 'Địa chỉ nhận không hợp lệ', 'error');
            return;
        }

        if (!value || parseFloat(value) < 0) {
            showStatus('submit-status', 'Số lượng ETH không hợp lệ', 'error');
            return;
        }

        const tx = await contract.submit(
            to,
            ethers.utils.parseEther(value),
            data
        );

        showStatus('submit-status', `Đang tạo giao dịch... Hash: ${tx.hash}`, 'info');
        
        await tx.wait();
        showStatus('submit-status', `Tạo giao dịch thành công! Hash: ${tx.hash}`, 'success');
        
        // Clear form
        document.getElementById('tx-to').value = '';
        document.getElementById('tx-value').value = '';
        document.getElementById('tx-data').value = '';
        
        await loadTransactions();
        await loadWalletInfo();

    } catch (error) {
        console.error('Submit error:', error);
        showStatus('submit-status', `Lỗi: ${error.message}`, 'error');
    }
}

async function loadTransactions() {
    try {
        if (!contract) {
            const transactionsListEl = document.getElementById('transactions-list');
            if (transactionsListEl) {
                transactionsListEl.innerHTML = '<p>Chưa kết nối contract</p>';
            }
            return;
        }

        // Verify contract is still valid
        try {
            const code = await provider.getCode(contractAddress);
            if (code === '0x' || code === '0x0') {
                const transactionsListEl = document.getElementById('transactions-list');
                if (transactionsListEl) {
                    transactionsListEl.innerHTML = '<p style="color: #ef4444;">Contract không tồn tại</p>';
                }
                return;
            }
        } catch (e) {
            console.error('Error checking contract code:', e);
        }

        const transactionsListEl = document.getElementById('transactions-list');
        if (!transactionsListEl) return;
        
        transactionsListEl.innerHTML = '<p>Đang tải...</p>';

        // Get transaction count by trying to read until we get an error
        let txCount = 0;
        const transactions = [];
        
        try {
            while (true) {
                try {
                    const tx = await contract.transactions(txCount);
                    transactions.push({
                        id: txCount,
                        to: tx.to,
                        value: tx.value,
                        data: tx.data,
                        executed: tx.executed
                    });
                    txCount++;
                } catch (e) {
                    // Reached end of transactions
                    break;
                }
            }
        } catch (e) {
            console.error('Error loading transactions:', e);
            transactionsListEl.innerHTML = '<p style="color: #ef4444;">Lỗi khi tải giao dịch</p>';
            return;
        }

        if (transactions.length === 0) {
            transactionsListEl.innerHTML = '<p>Chưa có giao dịch nào</p>';
            return;
        }

        transactionsListEl.innerHTML = '';
        
        const userAddress = await signer.getAddress();
        const required = parseInt(document.getElementById('required-approvals').textContent);
        const ownersCount = parseInt(document.getElementById('owners-count').textContent);
        
        for (const tx of transactions) {
            const txEl = await createTransactionElement(tx, userAddress, required, ownersCount);
            transactionsListEl.appendChild(txEl);
        }

    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-list').innerHTML = 
            `<p style="color: #ef4444;">Lỗi tải giao dịch: ${error.message}</p>`;
    }
}

async function createTransactionElement(tx, userAddress, required, ownersCount) {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    // Get approval count using new function
    let approvalCount = 0;
    try {
        approvalCount = await contract.getApprovalCount(tx.id);
    } catch (e) {
        // Fallback to old method if new function doesn't exist
        try {
            for (let i = 0; i < ownersCount; i++) {
                try {
                    const owner = await contract.owners(i);
                    const approved = await contract.approved(tx.id, owner);
                    if (approved) approvalCount++;
                } catch (err) {
                    break;
                }
            }
        } catch (err2) {
            console.error('Error calculating approval count:', err2);
        }
    }
    
    div.innerHTML = `
        <div class="transaction-header">
            <span class="tx-id">Giao dịch #${tx.id}</span>
            <span class="tx-status ${tx.executed ? 'executed' : 'pending'}">
                ${tx.executed ? 'Đã thực thi' : 'Chờ phê duyệt'}
            </span>
        </div>
        <div class="tx-details">
            <div class="tx-detail-item">
                <span class="info-label">Đến:</span>
                <span class="address-highlight">${tx.to}</span>
            </div>
            <div class="tx-detail-item">
                <span class="info-label">Giá trị:</span>
                <span>${ethers.utils.formatEther(tx.value)} ETH</span>
            </div>
        </div>
        <div class="tx-approvals">
            <div class="approval-count">
                Phê duyệt: <span id="approval-count-${tx.id}">${approvalCount}</span> / ${required}
            </div>
            <div class="approval-buttons" id="approval-buttons-${tx.id}">
                <button class="btn btn-success" onclick="approveTransaction(${tx.id})" 
                    ${tx.executed ? 'disabled' : ''}>Phê duyệt</button>
                <button class="btn btn-danger" onclick="revokeTransaction(${tx.id})" 
                    ${tx.executed ? 'disabled' : ''}>Hủy phê duyệt</button>
                <button class="btn btn-primary" onclick="executeTransaction(${tx.id})" 
                    ${tx.executed ? 'disabled' : ''}>Thực thi</button>
            </div>
        </div>
    `;
    
    return div;
}

async function approveTransaction(txId) {
    try {
        if (!contract) return;
        
        const tx = await contract.approve(txId);
        showStatus('connection-status', `Đang phê duyệt... Hash: ${tx.hash}`, 'info');
        await tx.wait();
        showStatus('connection-status', 'Phê duyệt thành công!', 'success');
        await loadTransactions();
    } catch (error) {
        console.error('Approve error:', error);
        showStatus('connection-status', `Lỗi: ${error.message}`, 'error');
    }
}

async function revokeTransaction(txId) {
    try {
        if (!contract) return;
        
        const tx = await contract.revoke(txId);
        showStatus('connection-status', `Đang hủy phê duyệt... Hash: ${tx.hash}`, 'info');
        await tx.wait();
        showStatus('connection-status', 'Hủy phê duyệt thành công!', 'success');
        await loadTransactions();
    } catch (error) {
        console.error('Revoke error:', error);
        showStatus('connection-status', `Lỗi: ${error.message}`, 'error');
    }
}

async function executeTransaction(txId) {
    try {
        if (!contract) return;
        
        const tx = await contract.execute(txId);
        showStatus('connection-status', `Đang thực thi... Hash: ${tx.hash}`, 'info');
        await tx.wait();
        showStatus('connection-status', 'Thực thi thành công!', 'success');
        await loadTransactions();
        await loadWalletInfo();
    } catch (error) {
        console.error('Execute error:', error);
        showStatus('connection-status', `Lỗi: ${error.message}`, 'error');
    }
}

function showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusEl.className = 'status';
            statusEl.textContent = '';
        }, 5000);
    }
}

// Make functions globally available
window.approveTransaction = approveTransaction;
window.revokeTransaction = revokeTransaction;
window.executeTransaction = executeTransaction;

