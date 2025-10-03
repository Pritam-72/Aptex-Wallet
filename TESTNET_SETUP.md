# 🧪 Testnet Setup Guide

## Why Use Aptos Testnet?

✅ **Free testnet APT** - No real money needed
✅ **Safe testing** - Experiment without risk
✅ **Faster iteration** - Test features quickly
✅ **Perfect for demos** - Show functionality without mainnet
✅ **Bounty friendly** - Most hackathons prefer testnet

---

## 🚀 Complete Testnet Setup

### Step 1: Get Testnet APT

#### Option A: Aptos Faucet (Easiest)
1. Visit: https://aptoslabs.com/testnet-faucet
2. Connect your wallet or enter address
3. Click "Fund Account"
4. Receive 1 APT instantly
5. Can use multiple times (100 APT limit per day)

#### Option B: Petra Wallet Built-in Faucet
1. Install Petra Wallet extension
2. Switch to Testnet network
3. Click "Faucet" button
4. Receive testnet APT

#### Option C: CLI Faucet
```bash
aptos account fund-with-faucet --account YOUR_ADDRESS --network testnet
```

---

### Step 2: Configure Nodit for Testnet

#### Get Nodit Testnet API Key:

1. **Visit**: https://nodit.io/
2. **Sign Up**: Create free account
3. **Dashboard**: Go to API Keys section
4. **Create Key**: 
   - Click "Create API Key"
   - Name: "Aptex-Wallet Testnet"
   - **Network: Aptos Testnet** ⚠️ Important!
   - Click "Create"
5. **Copy Key**: Save your API key

#### Add to .env:
```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
# Nodit Testnet Configuration
VITE_NODIT_API_KEY=npat_xxxxxxxxxxxxxxxxxxxx
VITE_NODIT_BASE_URL=https://aptos-testnet.nodit.io/v1
VITE_NODIT_WEBHOOK_SECRET=your_webhook_secret

# Kana Labs (Testnet)
VITE_KANA_API_URL=https://testnet-api.kanalabs.io
VITE_KANA_WS_URL=wss://testnet-ws.kanalabs.io

# Aptos Testnet
VITE_APTOS_NETWORK=testnet
VITE_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
```

---

### Step 3: Test Nodit Integration

Create a test file to verify Nodit works:

```typescript
// frontend/src/test-nodit.ts
import { getAccountBalance } from './services/nodit/accountService';

async function testNodit() {
  const testAddress = '0x1'; // Use your wallet address
  
  console.log('Testing Nodit Testnet API...');
  
  try {
    const balance = await getAccountBalance(testAddress);
    console.log('✅ Success! Balance:', balance);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNodit();
```

Run test:
```bash
cd frontend
npm run dev
# Open browser console to see results
```

---

### Step 4: Verify Testnet Wallet Connection

In your wallet dashboard:

1. **Check Network**: Ensure showing "Testnet"
2. **View Balance**: Should show testnet APT
3. **Test Transaction**: Send small amount to yourself
4. **Verify in Explorer**: https://explorer.aptoslabs.com/?network=testnet

---

## 🎯 Testing Checklist

### Nodit API Tests

- [ ] Balance fetching works
  ```typescript
  const balance = await getAccountBalance(yourAddress);
  console.log('Balance:', balance);
  ```

- [ ] Transaction history loads
  ```typescript
  const txs = await getAccountTransactions(yourAddress);
  console.log('Transactions:', txs.length);
  ```

- [ ] Account resources fetch
  ```typescript
  const resources = await getAccountResources(yourAddress);
  console.log('Resources:', resources.length);
  ```

### Perps Trading Tests (Mock Data)

Since Kana testnet might not have full API access, we use mock data:

- [ ] Markets display correctly
- [ ] Can open trading panel
- [ ] Leverage slider works
- [ ] Position calculations accurate
- [ ] Mock positions display

### Combined Portfolio Tests

- [ ] Spot balance from Nodit (real testnet data)
- [ ] Perps positions from Kana (mock data)
- [ ] Total portfolio calculates correctly
- [ ] Asset allocation charts display

---

## 🐛 Common Testnet Issues & Solutions

### Issue 1: "Account not found"
**Solution**: 
- Fund account with testnet faucet first
- Wait 30 seconds for propagation
- Refresh page

### Issue 2: Nodit API returns 401
**Solution**:
- Verify API key is for **testnet** not mainnet
- Check `.env` file has correct key
- Restart dev server after changing `.env`

### Issue 3: Balance shows 0
**Solution**:
- Get testnet APT from faucet
- Verify correct network selected
- Check explorer: https://explorer.aptoslabs.com/?network=testnet

### Issue 4: Transactions don't show
**Solution**:
- Make at least one transaction first
- Wait for transaction confirmation
- Try refreshing the page

---

## 💡 Testnet Best Practices

### 1. Use Descriptive Wallet Names
```typescript
// In wallet creation
const walletName = "Testnet Demo Wallet";
```

### 2. Label Testnet Clearly in UI
Add testnet indicator:
```tsx
{process.env.VITE_APTOS_NETWORK === 'testnet' && (
  <Badge variant="warning">TESTNET</Badge>
)}
```

### 3. Mock Data for Missing APIs
If Kana testnet API not available:
```typescript
export async function getPerpsMarkets() {
  if (!isKanaConfigured() || process.env.VITE_APTOS_NETWORK === 'testnet') {
    return getMockMarkets(); // Use mock data
  }
  // Real API call
}
```

### 4. Test with Multiple Accounts
- Create 2-3 test wallets
- Send between them
- Test different scenarios

---

## 📊 Testnet vs Mainnet Comparison

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| APT Cost | Free | Real money |
| Risk | Zero | Financial |
| Speed | Fast | Same |
| Data | Test data | Real data |
| Faucet | Available | No |
| Reset | Possible | Never |
| Demo | Perfect | Risky |

---

## 🎬 Demo Preparation with Testnet

### Before Recording Demo:

1. **Fund Multiple Accounts**
   ```bash
   # Get APT for demo
   aptos account fund-with-faucet --account YOUR_ADDRESS --network testnet
   ```

2. **Create Sample Transactions**
   - Send APT between accounts
   - Generate transaction history
   - Create diverse activity

3. **Prepare Mock Perps Positions**
   - Mock data already shows realistic positions
   - Adjust values in `getMockPositions()` if needed

4. **Test All Features**
   - Click through entire flow
   - Ensure no errors
   - Check loading states

---

## 🚀 Switching to Mainnet (Later)

When ready for production:

### 1. Update Environment
```env
# Change network
VITE_APTOS_NETWORK=mainnet
VITE_NODIT_BASE_URL=https://aptos-mainnet.nodit.io/v1
VITE_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
```

### 2. Get Mainnet API Key
- Create new Nodit key for mainnet
- Update `.env` file

### 3. Update Kana URLs
```env
VITE_KANA_API_URL=https://api.kanalabs.io
VITE_KANA_WS_URL=wss://ws.kanalabs.io
```

### 4. Warning Banner
Add mainnet warning:
```tsx
{process.env.VITE_APTOS_NETWORK === 'mainnet' && (
  <Alert variant="warning">
    ⚠️ You are using MAINNET. Real funds at risk!
  </Alert>
)}
```

---

## 📱 Mobile Testing on Testnet

### Using Petra Mobile:
1. Install Petra Mobile app
2. Settings → Network → Testnet
3. Get testnet APT via in-app faucet
4. Test wallet features

### Using Browser on Mobile:
1. Open Chrome/Safari on phone
2. Navigate to your deployed testnet app
3. Connect wallet
4. Test responsive UI

---

## ✅ Testnet Verification Checklist

Before demo/submission:

### Setup
- [ ] Nodit testnet API key configured
- [ ] Wallet has testnet APT
- [ ] App runs on testnet
- [ ] No console errors

### Features
- [ ] Balance displays correctly
- [ ] Transactions show in history
- [ ] Perps markets load
- [ ] Trading panel works
- [ ] Positions display
- [ ] Portfolio view accurate

### Performance
- [ ] Fast load times
- [ ] Smooth animations
- [ ] No lag or freezing
- [ ] Mobile responsive

### Demo Ready
- [ ] Multiple accounts funded
- [ ] Transaction history present
- [ ] Screenshots taken
- [ ] Video script prepared

---

## 🎓 Learning Resources

### Aptos Testnet:
- Faucet: https://aptoslabs.com/testnet-faucet
- Explorer: https://explorer.aptoslabs.com/?network=testnet
- Docs: https://aptos.dev/guides/move-guides/

### Nodit Testnet:
- Dashboard: https://nodit.io/dashboard
- Docs: https://developer.nodit.io/reference/aptos-quickstart
- Support: support@nodit.io

### Testing Tools:
- Aptos CLI: https://aptos.dev/tools/aptos-cli/
- TypeScript SDK: https://aptos.dev/sdks/ts-sdk/

---

## 🎯 Quick Start Commands

```bash
# 1. Setup environment
cd frontend
cp .env.example .env
# Edit .env with testnet config

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open in browser
# http://localhost:5173

# 5. Test Nodit API
# Open browser console
# Check for successful API calls
```

---

## 💰 Cost Comparison

### Testnet (Recommended for Demo):
- **Setup**: Free
- **Testing**: Free
- **APT**: Free from faucet
- **Transactions**: Free (testnet gas)
- **Total**: $0

### Mainnet (Production Only):
- **Setup**: Free
- **Testing**: Costs real APT
- **APT**: Buy from exchange
- **Transactions**: Gas fees
- **Total**: Variable costs

**For bounty submissions → Use Testnet!** ✅

---

## 📞 Support

### Getting Help:

**Testnet Issues**:
- Check network is set to testnet
- Verify API key is testnet key
- Try faucet again if balance is 0
- Check explorer for transaction status

**Nodit Issues**:
- Verify API key in dashboard
- Check rate limits
- Review API docs
- Contact support@nodit.io

**App Issues**:
- Check browser console
- Clear cache and reload
- Verify .env configuration
- Review documentation

---

## 🎉 Ready for Testnet!

You're all set to:
1. ✅ Develop on testnet safely
2. ✅ Test with Nodit API
3. ✅ Demo perps trading
4. ✅ Submit for bounties
5. ✅ No financial risk!

**Happy testing! 🚀**

---

**Pro Tip**: Keep testnet for development, demos, and bounty submissions. Only switch to mainnet for production deployment with real users.
