# 🚀 Hướng Dẫn Chạy Project Multisig Wallet

## Bước 1: Cài đặt Dependencies

Mở terminal trong thư mục project và chạy:

```bash
npm install
```

## Bước 2: Compile Smart Contract

```bash
npm run compile
```

## Bước 3: Chạy Hardhat Node (Terminal 1)

Mở một terminal mới và chạy:

```bash
npm run node
```

Hoặc:

```bash
npx hardhat node
```

Hardhat node sẽ chạy tại: `http://127.0.0.1:8545`

**Lưu ý:** Giữ terminal này mở trong suốt quá trình phát triển.

## Bước 4: Deploy Contract (Terminal 2)

Mở một terminal mới khác và chạy:

```bash
npm run deploy:localhost
```

Hoặc:

```bash
npx hardhat run scripts/deployments/main.ts --network localhost
```

Sau khi deploy, bạn sẽ thấy địa chỉ contract được in ra. **Copy địa chỉ này** để sử dụng trong frontend.

## Bước 5: Chạy Frontend (Terminal 3)

Mở một terminal mới khác và chạy:

```bash
npm run frontend
```

Hoặc:

```bash
npx http-server frontend -p 8080 -o
```

Frontend sẽ tự động mở tại: `http://localhost:8080`

## Bước 6: Cấu hình MetaMask

1. **Thêm Hardhat Network vào MetaMask:**
   - Mở MetaMask → Settings → Networks → Add Network
   - Thông tin network:
     - **Network Name:** Hardhat Local
     - **RPC URL:** http://127.0.0.1:8545
     - **Chain ID:** 31337
     - **Currency Symbol:** ETH

2. **Import Test Account vào MetaMask:**
   - Mở MetaMask → Import Account
   - Chọn "Private Key"
   - Dán một trong các private key sau:
     - Account 1: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
     - Account 2: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
     - Account 3: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

## Bước 7: Sử dụng Frontend

1. Mở trình duyệt tại `http://localhost:8080`
2. Nhập địa chỉ contract (từ bước 4) vào ô "Địa chỉ Contract"
3. Chọn "Localhost (Hardhat)" trong dropdown "Mạng"
4. Click "Kết nối Wallet"
5. Chọn account trong MetaMask khi được yêu cầu

## 📝 Tóm tắt các lệnh

```bash
# Terminal 1: Chạy Hardhat Node
npm run node

# Terminal 2: Deploy Contract
npm run deploy:localhost

# Terminal 3: Chạy Frontend
npm run frontend
```

## 🔧 Các lệnh khác

- **Compile contract:** `npm run compile`
- **Run tests:** `npm run test`
- **Deploy (default network):** `npm run deploy`

## ⚠️ Lưu ý

- Phải chạy Hardhat node trước khi deploy contract
- Phải deploy contract trước khi sử dụng frontend
- Giữ tất cả 3 terminal mở trong quá trình phát triển
- Nếu thay đổi contract, cần compile và deploy lại

## 🐛 Xử lý lỗi

- **Lỗi "port already in use":** Đổi port trong script hoặc tắt process đang dùng port đó
- **Lỗi "contract not found":** Kiểm tra lại địa chỉ contract và đảm bảo đã deploy
- **Lỗi MetaMask connection:** Kiểm tra network đã được thêm đúng chưa và Chain ID là 31337

