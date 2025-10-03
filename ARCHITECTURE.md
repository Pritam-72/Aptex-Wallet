# Architecture Overview - Nodit + Kana Integration

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Aptex-Wallet Frontend                     │
│                          (React + TypeScript)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│   Dashboard  │    │   Perps Trading  │   │   Wallet     │
│   (Sidebar)  │────│     Section      │───│   Context    │
└──────────────┘    └──────────────────┘   └──────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────┐           ┌──────────────┐
        │    Nodit     │           │     Kana     │
        │   Services   │           │   Services   │
        └──────────────┘           └──────────────┘
                │                           │
                │                           │
                ▼                           ▼
        ┌──────────────┐           ┌──────────────┐
        │  Nodit API   │           │   Kana API   │
        │  (Aptos)     │           │   (Perps)    │
        └──────────────┘           └──────────────┘
```

---

## 📊 Data Flow Diagram

### Balance Fetching Flow
```
User Opens Dashboard
        │
        ▼
┌──────────────────────┐
│  Nodit Service       │
│  - accountService.ts │
└──────────────────────┘
        │
        ▼ HTTP GET
┌──────────────────────────────────┐
│ Nodit API                        │
│ GET /accounts/{address}/balance  │
└──────────────────────────────────┘
        │
        ▼ Response
┌──────────────────┐
│  Balance Data    │
│  { value: "..." }│
└──────────────────┘
        │
        ▼ Convert octas → APT
┌──────────────────┐
│  Display in UI   │
│  "$1,234.56"     │
└──────────────────┘
```

### Perps Trading Flow
```
User Clicks Market
        │
        ▼
┌──────────────────────┐
│  Kana Service        │
│  - perpsService.ts   │
└──────────────────────┘
        │
        ▼ HTTP GET
┌────────────────────────────┐
│ Kana API                   │
│ GET /perps/markets/{id}    │
└────────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Trading Panel           │
│ - Set size & leverage   │
└─────────────────────────┘
        │
        ▼ User confirms
┌────────────────────────────┐
│ POST /perps/orders         │
│ { side, size, leverage }   │
└────────────────────────────┘
        │
        ▼
┌─────────────────────────┐
│ Position Created        │
│ Real-time P&L updates   │
└─────────────────────────┘
```

### Combined Portfolio Flow
```
┌──────────────┐         ┌──────────────┐
│ Nodit API    │         │  Kana API    │
│ Balance: $X  │         │ Positions: Y │
└──────────────┘         └──────────────┘
        │                         │
        └────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Portfolio View │
        │                 │
        │ Spot:    $X     │
        │ Margin:  $Y     │
        │ P&L:     $Z     │
        │ ──────────────  │
        │ Total:   $T     │
        └─────────────────┘
```

---

## 🗂️ Component Hierarchy

```
SimpleDashboard
│
├── Sidebar
│   ├── SidebarHeader
│   ├── SidebarLinks[]
│   │   ├── Wallet
│   │   ├── Send
│   │   ├── Perps Trading ⭐ NEW
│   │   ├── UPI Manager
│   │   ├── Register ID
│   │   ├── AutoPay
│   │   ├── Collectables
│   │   ├── Transactions
│   │   ├── Security
│   │   └── Events
│   └── SidebarFooter
│
└── Main Content
    │
    ├── if (activeSection === 'wallet')
    │   ├── WalletSection
    │   ├── UpiQuickAccess
    │   └── PaymentRequestsSection
    │
    ├── if (activeSection === 'perps') ⭐ NEW
    │   └── PerpsTradingSection
    │       ├── Header
    │       └── Tabs
    │           ├── Markets Tab
    │           │   └── PerpsMarketsList
    │           │       └── MarketCard[]
    │           │
    │           └── Positions Tab
    │               └── PerpsPositionsManager
    │                   ├── Portfolio Summary
    │                   └── PositionCard[]
    │
    ├── if (activeSection === 'transactions')
    │   └── TransactionHistory
    │
    └── [other sections...]
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────┐
│          React Component            │
│                                     │
│  const [data, setData] = useState() │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│         useEffect Hook              │
│                                     │
│  useEffect(() => {                  │
│    loadData();                      │
│  }, [dependencies]);                │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│       Service Layer Call            │
│                                     │
│  const result = await               │
│    noditService.getBalance();       │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│          API Request                │
│                                     │
│  axios.get('/accounts/...')         │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│        Response Handler             │
│                                     │
│  - Success → setData(result)        │
│  - Error → handleError(error)       │
│  - Finally → setLoading(false)      │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│          UI Updates                 │
│                                     │
│  Component re-renders with new data │
└─────────────────────────────────────┘
```

---

## 📦 Service Layer Architecture

```
services/
│
├── nodit/
│   ├── noditClient.ts
│   │   └── Axios instance
│   │       ├── Base URL config
│   │       ├── Headers (API key)
│   │       ├── Request interceptor
│   │       └── Response interceptor
│   │
│   ├── accountService.ts
│   │   ├── getAccountBalance()
│   │   ├── getAccountResources()
│   │   ├── getAccountTransactions()
│   │   ├── getAccountInfo()
│   │   ├── octasToApt()
│   │   └── aptToOctas()
│   │
│   └── tokenService.ts
│       ├── getTokenMetadata()
│       ├── getAccountTokenBalances()
│       └── getTokenPrice()
│
└── kana/
    ├── kanaClient.ts
    │   ├── Axios instance
    │   └── WebSocket class
    │       ├── connect()
    │       ├── subscribe()
    │       ├── unsubscribe()
    │       └── disconnect()
    │
    └── perpsService.ts
        ├── getPerpsMarkets()
        ├── getMarketDetails()
        ├── getUserPositions()
        ├── getUserTrades()
        ├── placeOrder()
        ├── closePosition()
        ├── calculatePnL()
        └── calculateLiquidationPrice()
```

---

## 🎨 Component Architecture

```
components/perps/
│
├── PerpsTradingSection.tsx
│   └── Main container
│       ├── Header
│       ├── Tabs component
│       └── Conditional rendering
│           ├── if selectedMarket
│           │   └── PerpsTradingPanel
│           └── else
│               └── Tabs (Markets/Positions)
│
├── PerpsMarketsList.tsx
│   └── Markets browser
│       ├── Refresh button
│       └── MarketCard[]
│           ├── Market info
│           ├── Price & change
│           ├── Stats (volume, OI, funding)
│           └── onClick → selectMarket
│
├── PerpsTradingPanel.tsx
│   └── Trading interface
│       ├── Back button
│       ├── Market info card
│       └── Trading form
│           ├── Long/Short tabs
│           ├── Order type selector
│           ├── Size input
│           ├── Leverage slider
│           ├── Stop-loss/take-profit
│           ├── Order summary
│           └── Place order button
│
├── PerpsPositionsManager.tsx
│   └── Position management
│       ├── Portfolio summary
│       │   ├── Total positions
│       │   ├── Total margin
│       │   └── Total P&L
│       └── PositionCard[]
│           ├── Position info
│           ├── P&L display
│           ├── Liquidation price
│           └── Close button
│
└── PerpsPortfolioOverview.tsx
    └── Combined portfolio
        ├── Total portfolio value
        ├── Breakdown cards
        │   ├── Spot balance (Nodit)
        │   ├── Perps margin (Kana)
        │   ├── Unrealized P&L
        │   └── Open positions
        └── Allocation chart
            ├── Spot percentage
            └── Perps percentage
```

---

## 🔐 Security Architecture

```
Frontend (.env)
    │
    ├── VITE_NODIT_API_KEY ──────┐
    └── VITE_KANA_API_URL ───────┤
                                 │
                                 ▼
┌────────────────────────────────────────┐
│      Environment Variables             │
│      (Never in client-side code)       │
└────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│      Service Layer                     │
│      (Reads from import.meta.env)      │
└────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│      API Requests                      │
│      (Headers include API key)         │
└────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│      External APIs                     │
│      (Nodit / Kana)                    │
└────────────────────────────────────────┘
```

---

## 🚀 Deployment Flow

```
Development
    │
    ├── Write code
    ├── Test locally
    └── Commit to Git
        │
        ▼
GitHub Repository
    │
    └── Push to main
        │
        ▼
Vercel/Netlify
    │
    ├── Detect push
    ├── Run build
    │   └── npm run build
    ├── Set environment vars
    │   ├── VITE_NODIT_API_KEY
    │   └── VITE_KANA_API_URL
    └── Deploy
        │
        ▼
Production URL
    │
    └── Live app! 🎉
```

---

## 📱 User Journey Map

```
Start: User logs into wallet
    │
    ▼
Dashboard loads
    │
    ├─→ View spot balance (Nodit API)
    │
    ▼
User clicks "Perps Trading"
    │
    ▼
Load perps section
    │
    ├─→ Fetch markets (Kana API)
    ├─→ Fetch positions (Kana API)
    └─→ Calculate combined portfolio
    │
    ▼
User browses markets
    │
    ├─→ See APT-PERP
    ├─→ See BTC-PERP
    ├─→ See ETH-PERP
    └─→ See SOL-PERP
    │
    ▼
User clicks APT-PERP
    │
    ▼
Trading panel opens
    │
    ├─→ Choose Long
    ├─→ Set size: 1000 APT
    ├─→ Set leverage: 10x
    ├─→ View margin: $820
    └─→ View liq price: $6.50
    │
    ▼
User places order
    │
    ▼
Position created
    │
    ▼
View in positions tab
    │
    ├─→ See real-time P&L
    ├─→ Monitor position
    └─→ Close when ready
    │
    ▼
End: Position closed, profit/loss realized
```

---

## 🎯 Integration Points

```
┌─────────────────────────────────────────────────┐
│              Aptex-Wallet                       │
│                                                 │
│  ┌───────────────┐         ┌──────────────┐   │
│  │   Existing    │         │     New      │   │
│  │   Features    │         │  Integration │   │
│  │               │         │              │   │
│  │ • Wallet      │────────▶│ • Nodit API  │   │
│  │ • Send        │         │ • Kana Perps │   │
│  │ • Receive     │         │ • Portfolio  │   │
│  │ • History     │◀────────│   View       │   │
│  │ • Security    │         │              │   │
│  └───────────────┘         └──────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 💡 Key Design Decisions

### 1. Service Layer Pattern
**Why**: Separates business logic from UI
**Benefit**: Easy to test, maintain, and swap APIs

### 2. Component Composition
**Why**: Small, focused components
**Benefit**: Reusable, maintainable, scalable

### 3. Type Safety
**Why**: TypeScript everywhere
**Benefit**: Catch errors early, better IDE support

### 4. Error Handling
**Why**: Graceful degradation
**Benefit**: Better UX, debugging, reliability

### 5. Mock Data Fallback
**Why**: Development without API keys
**Benefit**: Fast iteration, demos, testing

---

## 🔄 Update & Refresh Flow

```
Real-time Updates (Future WebSocket)
    │
    ▼
┌────────────────────────────────┐
│  WebSocket Connection          │
│  ws://kana-api/stream          │
└────────────────────────────────┘
    │
    ▼
Price update received
    │
    ├─→ Update market price
    ├─→ Recalculate P&L
    └─→ Update UI
    │
    ▼
User sees live updates
```

Current Polling Flow
```
setInterval(() => {
    fetchPositions();
    updatePrices();
}, 5000); // Every 5 seconds
```

---

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Scalable structure
- ✅ Easy maintenance
- ✅ Professional quality
- ✅ Ready for production
