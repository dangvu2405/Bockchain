# Multisig Wallet - Giao diện Web

## 🚀 Project đã được khởi chạy!

### Thông tin quan trọng:

**Địa chỉ Contract đã deploy:**
```
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Local Server:**
- Frontend đang chạy tại: http://localhost:8080
- Hardhat node đang chạy tại: http://127.0.0.1:8545

### Cách sử dụng:

1. **Mở trình duyệt** và truy cập: http://localhost:8080

2. **Kết nối MetaMask:**
   - Cài đặt MetaMask extension nếu chưa có
   - Thêm Hardhat network vào MetaMask:
     - Network Name: Hardhat Local
     - RPC URL: http://127.0.0.1:8545
     - Chain ID: 31337
     - Currency Symbol: ETH

3. **Import test account vào MetaMask:**
   - Mở MetaMask → Import Account
   - Sử dụng private key của một trong các test accounts:
     - Account 1: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
     - Account 2: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
     - Account 3: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

4. **Nhập địa chỉ contract:**
   - Copy địa chỉ: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
   - Paste vào ô "Địa chỉ Contract"
   - Chọn "Localhost (Hardhat)"
   - Click "Kết nối Wallet"

5. **Sử dụng các tính năng:**
   - Xem thông tin wallet
   - Nạp tiền vào wallet
   - Tạo giao dịch mới
   - Phê duyệt/Hủy phê duyệt giao dịch
   - Thực thi giao dịch

### Lưu ý:
- Contract đã được deploy với 3 owners và cần 2 phê duyệt để thực thi
- Sử dụng các test accounts để test các tính năng
- Hardhat node cung cấp ETH miễn phí cho testing

