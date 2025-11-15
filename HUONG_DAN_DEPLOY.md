# 🚀 Hướng Dẫn Deploy Multisig Wallet Contract

## 📋 Mục Lục
1. [Deploy lên Localhost (Hardhat)](#1-deploy-lên-localhost-hardhat)
2. [Deploy lên Testnet (Sepolia)](#2-deploy-lên-testnet-sepolia)
3. [Deploy lên Mainnet](#3-deploy-lên-mainnet)
4. [Kiểm tra Contract sau khi Deploy](#4-kiểm-tra-contract-sau-khi-deploy)

---

## 1. Deploy lên Localhost (Hardhat)

### Bước 1: Khởi động Hardhat Node

Mở **Terminal 1** và chạy:

```bash
npm run node
```

Hoặc:

```bash
npx hardhat node
```

Hardhat node sẽ chạy tại `http://127.0.0.1:8545` và cung cấp 20 test accounts với ETH miễn phí.

**Lưu ý:** Giữ terminal này mở trong suốt quá trình deploy và test.

### Bước 2: Compile Contract

Mở **Terminal 2** (terminal mới) và chạy:

```bash
npm run compile
```

### Bước 3: Deploy Contract

Trong cùng **Terminal 2**, chạy:

```bash
npm run deploy:localhost
```

Hoặc:

```bash
npx hardhat run scripts/deployments/main.ts --network localhost
```

### Kết quả:

Sau khi deploy thành công, bạn sẽ thấy:
- Địa chỉ contract được in ra (ví dụ: `0x5FbDB2315678afecb367f032d93F642f64180aa3`)
- Contract được lưu vào file `deployed-contracts.json`

**Copy địa chỉ contract này** để sử dụng trong frontend!

---

## 2. Deploy lên Testnet (Sepolia)

### Bước 1: Tạo file `.env`

Tạo file `.env` trong thư mục gốc của project:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# Hoặc sử dụng Alchemy
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

PRIVATE_KEY=your_private_key_here_without_0x_prefix

ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Lưu ý quan trọng:**
- ⚠️ **KHÔNG** commit file `.env` lên GitHub (đã có trong `.gitignore`)
- Lấy Infura key tại: https://infura.io/
- Lấy Alchemy key tại: https://www.alchemy.com/
- Lấy Etherscan API key tại: https://etherscan.io/apis
- Private key phải là của account có Sepolia ETH (lấy tại faucet)

### Bước 2: Lấy Sepolia ETH (Testnet)

1. Truy cập Sepolia Faucet:
   - https://sepoliafaucet.com/
   - https://faucet.quicknode.com/ethereum/sepolia
   - https://www.alchemy.com/faucets/ethereum-sepolia

2. Nhập địa chỉ wallet của bạn để nhận test ETH

### Bước 3: Compile Contract

```bash
npm run compile
```

### Bước 4: Deploy lên Sepolia

```bash
npx hardhat run scripts/deployments/main.ts --network sepolia
```

### Kết quả:

- Contract được deploy lên Sepolia testnet
- Contract sẽ được verify tự động trên Etherscan (nếu có API key)
- Địa chỉ contract được lưu vào `deployed-contracts.json`

---

## 3. Deploy lên Mainnet

⚠️ **CẢNH BÁO:** Deploy lên Mainnet sẽ tốn phí gas thật (ETH thật). Đảm bảo bạn đã test kỹ trên testnet trước!

### Bước 1: Cập nhật `.env`

Thêm vào file `.env`:

```env
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_mainnet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Bước 2: Cập nhật `hardhat.config.ts`

Uncomment phần mainnet config trong `hardhat.config.ts`:

```typescript
mainnet: {
  url: MAINNET_RPC_URL,
  accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
  chainId: 1,
},
```

### Bước 3: Deploy

```bash
npx hardhat run scripts/deployments/main.ts --network mainnet
```

---

## 4. Kiểm tra Contract sau khi Deploy

### Xem địa chỉ Contract

Sau khi deploy, địa chỉ contract được lưu trong file `deployed-contracts.json`:

```json
{
  "localhost": {
    "MultisigWallet": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  },
  "sepolia": {
    "MultisigWallet": "0x..."
  }
}
```

### Sử dụng trong Frontend

1. Mở frontend tại `http://localhost:8080`
2. Nhập địa chỉ contract vào ô "Địa chỉ Contract"
3. Chọn network tương ứng
4. Click "Kết nối Wallet"

### Kiểm tra trên Etherscan (Testnet/Mainnet)

1. Truy cập: https://sepolia.etherscan.io/ (cho Sepolia) hoặc https://etherscan.io/ (cho Mainnet)
2. Nhập địa chỉ contract
3. Xem thông tin contract, transactions, và verify code

---

## 📝 Thông tin về Contract

### Constructor Parameters

Contract được deploy với:
- **Owners:** 3 owners (từ accounts 1, 2, 3 trong Hardhat)
- **Required approvals:** 2 (cần 2/3 owners approve để execute)

### Các Owners mặc định (Hardhat Localhost)

Khi deploy trên localhost, các owners là:
- Owner 1: Account từ Hardhat node (index 1)
- Owner 2: Account từ Hardhat node (index 2)  
- Owner 3: Account từ Hardhat node (index 3)

**Lưu ý:** Để sử dụng contract, bạn cần import các private keys này vào MetaMask.

---

## 🔧 Troubleshooting

### Lỗi: "insufficient funds"
- **Giải pháp:** Đảm bảo account có đủ ETH để trả gas fee

### Lỗi: "nonce too high"
- **Giải pháp:** Reset nonce hoặc đợi một chút rồi thử lại

### Lỗi: "network mismatch"
- **Giải pháp:** Kiểm tra network trong `hardhat.config.ts` và `.env` file

### Contract không verify được
- **Giải pháp:** Kiểm tra ETHERSCAN_API_KEY và đợi đủ block confirmations

---

## 📚 Tài liệu tham khảo

- [Hardhat Documentation](https://hardhat.org/docs)
- [Etherscan API](https://docs.etherscan.io/)
- [Infura Documentation](https://docs.infura.io/)
- [Alchemy Documentation](https://docs.alchemy.com/)

---

## ✅ Checklist trước khi Deploy

- [ ] Contract đã được compile thành công
- [ ] Đã test contract trên localhost
- [ ] Có đủ ETH/gas để deploy
- [ ] File `.env` đã được cấu hình đúng
- [ ] Network trong `hardhat.config.ts` đã được cấu hình
- [ ] Đã backup private keys an toàn

---

**Chúc bạn deploy thành công! 🎉**

