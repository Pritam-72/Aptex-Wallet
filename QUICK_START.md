# Quick Start Guide - Nodit + Kana Perps Integration

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (if needed)
```bash
cd frontend
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your Nodit API key:
```env
VITE_NODIT_API_KEY=your_actual_api_key_here
VITE_NODIT_BASE_URL=https://aptos-testnet.nodit.io/v1
VITE_APTOS_NETWORK=testnet
```

**Get Nodit API Key (Testnet):**
1. Visit https://nodit.io/
2. Sign up (free)
3. Dashboard → API Keys → Create Key
4. **Select Network: Aptos Testnet**
5. Copy key to `.env`

### Step 3: Run the Application
```bash
npm run dev
```

### Step 4: Test the Integration

1. **Open browser**: http://localhost:5173
2. **Login/Create wallet**
3. **Access dashboard**: Click "Perps Trading" in sidebar
4. **View markets**: Browse available perpetual futures
5. **Check portfolio**: See combined spot + perps portfolio

---

## 🎯 Quick Feature Tour

### Perps Trading Section

**Location**: Dashboard → Sidebar → "Perps Trading" (⌘P)

**Features**:
1. **Markets Tab**:
   - Browse APT, BTC, ETH, SOL perps
   - See live prices and 24h changes
   - View volume and open interest
   - Check funding rates

2. **Trade**:
   - Click any market
   - Choose Long or Short
   - Set size and leverage (1x-125x)
   - Add stop-loss/take-profit
   - Place order

3. **Positions Tab**:
   - View all open positions
   - Monitor real-time P&L
   - Close positions
   - Track liquidation prices

### Combined Portfolio

**Location**: Automatically shown in Perps section

**Shows**:
- Total portfolio value (spot + perps)
- Spot wallet balance (from Nodit)
- Perps margin (from Kana)
- Unrealized P&L
- Asset allocation charts

---

## 🧪 Testing Without API Keys

The integration includes mock data, so you can test immediately:

1. Leave `VITE_NODIT_API_KEY` empty or as placeholder
2. App will use mock markets and positions
3. All features work with test data
4. Perfect for development and demos

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'axios'"
**Solution**:
```bash
npm install axios
```

### Issue: Nodit API errors
**Solution**:
1. Check API key is correct
2. Verify `.env` file is in `frontend/` folder
3. Restart dev server after changing `.env`

### Issue: Blank perps section
**Solution**:
1. Check browser console for errors
2. Verify wallet is connected
3. Try refreshing the page

---

## 📱 Keyboard Shortcuts

- `⌘P` / `Ctrl+P` → Open Perps Trading
- `⌘1` → Wallet section
- `⌘2` → AutoPay
- `⌘3` → Collectables
- `⌘4` → Transactions
- `⌘5` → Security
- `⌘6` → Events

---

## 🚀 Next Steps

1. **Get API Keys**: Register on Nodit.io
2. **Record Demo**: Create 2-3 min video showing features
3. **Deploy**: Push to Vercel/Netlify
4. **Submit**: Share GitHub repo + demo link

---

## 📋 Submission Checklist

Before submitting for bounties:

**Nodit Track**:
- [ ] Nodit API key configured
- [ ] Balance fetching works
- [ ] Transaction history displays
- [ ] Code is documented

**Kana Track**:
- [ ] Markets display correctly
- [ ] Trading panel functions
- [ ] Positions manager works
- [ ] Portfolio view shows combined data

**General**:
- [ ] Demo video recorded
- [ ] README updated
- [ ] Code pushed to GitHub
- [ ] Deployed to production

---

## 💡 Tips for Best Results

1. **Demo Video**:
   - Show both Nodit and Kana features
   - Highlight the combined portfolio view
   - Explain technical implementation
   - Keep under 3 minutes

2. **Code Quality**:
   - Code is already clean and documented
   - Add more comments if needed
   - Ensure no console errors

3. **Presentation**:
   - Take screenshots of key features
   - Add them to README
   - Show mobile responsiveness
   - Highlight unique aspects

---

## 🎬 Demo Script Suggestion

**"Hi, I'm presenting Aptex-Wallet with integrated Nodit infrastructure and Kana Labs perpetual futures trading."**

1. **[Show Dashboard]** "This is the main wallet interface with spot balance."

2. **[Click Perps Trading]** "We've added a complete perps trading section."

3. **[Show Markets]** "Here you can browse all available perpetual futures markets with real-time data from Kana Labs."

4. **[Open a Position]** "Let's open a long position on APT with 10x leverage..."

5. **[Show Portfolio]** "The unique feature is this combined portfolio view - it shows spot balance from Nodit API and perps positions from Kana in one unified dashboard."

6. **[Show Position Manager]** "You can monitor all positions with live P&L updates and close them when ready."

7. **[Conclusion]** "This integration combines the best of both worlds - Nodit's infrastructure for reliable blockchain data and Kana's perps for advanced trading."

---

## 📞 Need Help?

- Check `INTEGRATION_README.md` for detailed docs
- Review code comments in source files
- Open GitHub issue for bugs
- Contact team for questions

---

**Ready to qualify for both bounties!** 🚀

Total Potential: **$1,500 - $3,000**
- Nodit: $500
- Kana: $1,000 - $2,500
