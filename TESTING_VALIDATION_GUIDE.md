# Testing & Validation Guide

## Overview

This comprehensive guide covers testing and validation for all blockchain-integrated features in the Aptos Wallet application. Follow this guide to ensure all features work correctly on Aptos Devnet.

## Prerequisites

### 1. Environment Setup
- ✅ Node.js v18+ installed
- ✅ Frontend dependencies installed (`npm install`)
- ✅ Backend server running (if applicable)
- ✅ Smart contract deployed on Aptos Devnet
- ✅ Browser with MetaMask or Aptos wallet extension

### 2. Contract Information
- **Contract Address**: `0x9c2fe13427bfa2d51671cdc2c04b4915ed4ef81709ccd8cd31c1150769596d2c`
- **Module Name**: `wallet_system`
- **Network**: Aptos Devnet
- **Explorer**: https://explorer.aptoslabs.com/?network=devnet

### 3. Test Accounts
Create at least 3 test accounts for comprehensive testing:
- **Account A**: Primary test account (sender)
- **Account B**: Recipient account
- **Account C**: Company/multi-party account

Fund all accounts using Aptos Devnet faucet:
```bash
# Via Aptos CLI
aptos account fund-with-faucet --account <ADDRESS>

# Or use the app's built-in fund feature
```

---

## Testing Checklist

### Phase 1: Wallet & Authentication ✅

#### 1.1 Wallet Creation
- [ ] Create new wallet
- [ ] Verify 12-word mnemonic generation
- [ ] Confirm secure storage in localStorage
- [ ] Test password protection
- [ ] Verify account derivation (BIP44)

**Expected Result**: New wallet created with unique address starting with `0x`

#### 1.2 Wallet Import
- [ ] Import wallet using mnemonic phrase
- [ ] Import wallet using private key
- [ ] Verify imported address matches original
- [ ] Test incorrect mnemonic handling
- [ ] Test invalid private key handling

**Expected Result**: Successfully import existing wallet

#### 1.3 Wallet Unlock
- [ ] Lock wallet
- [ ] Unlock with correct password
- [ ] Test incorrect password
- [ ] Verify session persistence
- [ ] Test auto-lock timeout (if implemented)

**Expected Result**: Secure unlock/lock functionality

#### 1.4 Multiple Accounts
- [ ] Create additional accounts
- [ ] Switch between accounts
- [ ] Verify separate balances
- [ ] Test account naming
- [ ] Delete account (if supported)

**Expected Result**: Multiple accounts managed correctly

---

### Phase 2: Basic Transactions 💸

#### 2.1 Send APT
- [ ] Send 0.1 APT to Account B
- [ ] Verify transaction hash generation
- [ ] Confirm balance deduction (sender)
- [ ] Confirm balance increase (recipient)
- [ ] Check transaction in explorer
- [ ] Verify gas fee deduction
- [ ] Test insufficient balance error

**Test Cases**:
```
1. Send 0.1 APT from Account A to Account B
2. Send 1.5 APT with custom note
3. Send 0.001 APT (minimum amount)
4. Attempt to send more than balance
5. Send to invalid address (should show error)
```

**Expected Result**: 
- Successful transfer: Balance updated, transaction hash displayed
- Failed transfer: Error message shown, balance unchanged

#### 2.2 Receive APT
- [ ] Receive APT from another account
- [ ] Verify balance update
- [ ] Check transaction appears in history
- [ ] Verify correct timestamp
- [ ] Test multiple incoming transactions

**Expected Result**: Received funds reflected immediately after confirmation

#### 2.3 Transaction History
- [ ] View transaction history
- [ ] Verify all sent transactions appear
- [ ] Verify all received transactions appear
- [ ] Check transaction details (hash, amount, timestamp)
- [ ] Filter by transaction type (sent/received)
- [ ] Search by address or hash
- [ ] Export transaction history to Excel

**Expected Result**: Complete transaction history with accurate details

---

### Phase 3: Payment Requests 📬

#### 3.1 Create Payment Request
- [ ] Create payment request from Account B to Account A
- [ ] Set amount: 0.5 APT
- [ ] Add description: "Test payment request"
- [ ] Verify request ID generation
- [ ] Check request appears in Account A's pending requests

**Test Cases**:
```
1. Create payment request for 0.5 APT
2. Create request with long description (100+ chars)
3. Create multiple requests to same user
4. Test minimum amount (0.0001 APT)
```

**Expected Result**: Payment request created with unique ID, visible to recipient

#### 3.2 Pay Payment Request
- [ ] Account A views pending payment requests
- [ ] Select request from Account B
- [ ] Review request details (amount, description)
- [ ] Confirm payment
- [ ] Verify request status changes to "Paid"
- [ ] Check balance deduction (Account A)
- [ ] Check balance increase (Account B)
- [ ] Verify request removed from pending list

**Expected Result**: Payment request paid successfully, balances updated

#### 3.3 Reject Payment Request
- [ ] Create new payment request
- [ ] Reject the request
- [ ] Verify request status changes to "Rejected"
- [ ] Confirm no balance change
- [ ] Check request removed from active list

**Expected Result**: Request rejected without fund transfer

#### 3.4 Payment Request Errors
- [ ] Test paying already paid request (Error 5)
- [ ] Test accessing non-existent request (Error 5)
- [ ] Test paying request not meant for you (Error 7)

**Expected Result**: User-friendly error messages displayed

---

### Phase 4: Split Bills 🧾

#### 4.1 Create Split Bill
- [ ] Account A creates split bill
- [ ] Total amount: 1.0 APT
- [ ] Add participants:
  - Account B: 0.4 APT
  - Account C: 0.6 APT
- [ ] Add description: "Dinner split"
- [ ] Verify split bill ID generation
- [ ] Check participants receive notifications

**Test Cases**:
```
1. Split 1.0 APT equally between 2 people (0.5 each)
2. Split 2.0 APT unequally (0.8, 0.7, 0.5)
3. Split with 5+ participants
4. Split with custom amounts
```

**Expected Result**: Split bill created, payment requests generated for each participant

#### 4.2 Pay Split Bill Share
- [ ] Account B logs in
- [ ] View split bill payment requests
- [ ] Pay their share (0.4 APT)
- [ ] Verify payment confirmation
- [ ] Check Account A receives 0.4 APT
- [ ] Verify split bill shows partial payment

**Expected Result**: Partial payment recorded, split bill status updated

#### 4.3 Complete Split Bill
- [ ] Account C pays their share (0.6 APT)
- [ ] Verify Account A receives 0.6 APT
- [ ] Check split bill status changes to "Completed"
- [ ] Verify total received: 1.0 APT
- [ ] Confirm all payment requests marked as paid

**Expected Result**: Split bill fully paid, all participants satisfied

#### 4.4 Split Bill Errors
- [ ] Test invalid split data (amounts don't match total) (Error 15)
- [ ] Test accessing non-existent split bill (Error 6)
- [ ] Test insufficient balance when paying share (Error 14)

**Expected Result**: Appropriate error messages displayed

---

### Phase 5: EMI Agreements 💳

#### 5.1 Create EMI Agreement
- [ ] Company (Account C) creates EMI agreement
- [ ] Set user: Account A
- [ ] Total amount: 10.0 APT
- [ ] Monthly installment: 2.0 APT
- [ ] Total months: 5
- [ ] Verify EMI ID generation
- [ ] Check EMI appears in Account A's dashboard

**Test Cases**:
```
1. Create 5-month EMI for 10 APT (2 APT/month)
2. Create 12-month EMI for 50 APT (4.17 APT/month)
3. Test minimum installment amount
4. Create multiple EMIs for same user
```

**Expected Result**: EMI agreement created, visible to both parties

#### 5.2 Pay EMI Installment
- [ ] Account A views active EMIs
- [ ] Select EMI agreement
- [ ] Click "Pay Installment"
- [ ] Verify 2.0 APT deduction
- [ ] Check Company (Account C) receives payment
- [ ] Verify months_paid increments (0 → 1)
- [ ] Check next due date updated
- [ ] Verify EMI status remains "Active"

**Expected Result**: First installment paid successfully, EMI status updated

#### 5.3 Complete EMI
- [ ] Pay remaining installments (months 2-5)
- [ ] Verify each payment succeeds
- [ ] Check months_paid reaches total_months (5)
- [ ] Verify EMI status changes to "Completed"
- [ ] Confirm no more payments required
- [ ] Check total paid equals total amount (10.0 APT)

**Expected Result**: EMI fully paid, status shows "Completed"

#### 5.4 EMI Errors
- [ ] Test paying before due date (Error 13)
- [ ] Test paying already completed EMI (Error 12)
- [ ] Test accessing non-existent EMI (Error 10)
- [ ] Test insufficient balance for installment (Error 14)
- [ ] Test duplicate EMI ID (Error 11)

**Expected Result**: User-friendly error messages for each scenario

#### 5.5 Auto-Pay (If Implemented)
- [ ] Enable auto-pay for EMI
- [ ] Wait for due date
- [ ] Verify automatic payment triggers
- [ ] Check balance deduction
- [ ] Disable auto-pay
- [ ] Test error when auto-pay not approved (Error 20)

**Expected Result**: Automatic payments work when enabled

---

### Phase 6: Loyalty NFTs & Tiers 🏆

#### 6.1 View Loyalty Tier
- [ ] Check current loyalty tier in dashboard
- [ ] Verify transaction count display
- [ ] Check total volume transacted
- [ ] Confirm tier matches transaction count:
  - Bronze: 1-9 transactions
  - Silver: 10-19 transactions
  - Gold: 20-49 transactions
  - Platinum: 50-99 transactions
  - Diamond: 100+ transactions

**Expected Result**: Correct tier displayed based on transaction history

#### 6.2 Tier Progression
- [ ] Perform transactions to reach Silver tier (10 total)
- [ ] Verify tier upgrade in dashboard
- [ ] Check tier badge updates
- [ ] Perform more transactions for Gold tier (20 total)
- [ ] Confirm Gold tier achievement
- [ ] Verify tier history maintained

**Expected Result**: Tier automatically upgrades as transaction count increases

#### 6.3 Loyalty NFT Display
- [ ] Navigate to Collectables section
- [ ] View loyalty NFTs
- [ ] Check NFT tier badge (Bronze/Silver/Gold/etc.)
- [ ] Verify NFT metadata display
- [ ] Test NFT filtering by tier
- [ ] Check NFT image/icon display

**Expected Result**: Loyalty NFTs displayed with correct tier information

#### 6.4 Loyalty Errors
- [ ] Test minting duplicate tier NFT (Error 17)
- [ ] Verify user can't mint higher tier than qualified

**Expected Result**: Error shown for invalid NFT operations

---

### Phase 7: Coupon System 🎟️

#### 7.1 Company Creates Coupon
- [ ] Company logs in (Account C)
- [ ] Navigate to Company Dashboard
- [ ] Create new coupon template:
  - Title: "10% Off Cashback"
  - Description: "Get 10% cashback on purchases"
  - Discount: 10%
  - Max discount: 1.0 APT
  - Valid days: 30
  - Image URL: (optional)
- [ ] Verify coupon template ID generation
- [ ] Check coupon appears in company's list
- [ ] Activate coupon template

**Expected Result**: Coupon template created and activated

#### 7.2 User Claims Coupon
- [ ] User (Account A) views available coupons
- [ ] Browse active coupon templates
- [ ] Claim "10% Off Cashback" coupon
- [ ] Verify coupon NFT minted
- [ ] Check coupon appears in user's wallet
- [ ] Verify expiry date (current date + 30 days)

**Expected Result**: Coupon NFT minted to user's account

#### 7.3 User Redeems Coupon
- [ ] Navigate to payment/transaction screen
- [ ] Select available coupon
- [ ] Apply coupon to transaction
- [ ] Verify discount calculation (10% or max 1.0 APT)
- [ ] Complete transaction
- [ ] Check coupon marked as used
- [ ] Verify discount applied to final amount

**Expected Result**: Coupon successfully redeemed, discount applied

#### 7.4 Coupon Errors
- [ ] Test using expired coupon (Error 19)
- [ ] Test accessing non-existent coupon (Error 18)
- [ ] Test using already redeemed coupon

**Expected Result**: Appropriate error messages displayed

---

### Phase 8: Dashboard Data Integration 📊

#### 8.1 SimpleDashboard
- [ ] View SimpleDashboard
- [ ] Verify wallet balance displayed (real-time)
- [ ] Check transaction count from blockchain
- [ ] Verify total volume transacted
- [ ] Check loyalty tier badge
- [ ] Verify active payment requests count
- [ ] Test refresh functionality
- [ ] Check loading states

**Expected Result**: All data fetched from blockchain and displayed accurately

#### 8.2 UpiDashboard
- [ ] Navigate to UPI Dashboard
- [ ] Verify wallet overview card
- [ ] Check blockchain statistics display
- [ ] Verify transaction count
- [ ] Check loyalty status card
- [ ] Test wallet not connected state

**Expected Result**: UPI dashboard shows real blockchain data

#### 8.3 BlockchainStats Component
- [ ] Verify transaction count display
- [ ] Check total volume in APT
- [ ] Verify loyalty tier with icon
- [ ] Check active payment requests with pulse animation
- [ ] Test loading state with spinner
- [ ] Verify responsive grid layout

**Expected Result**: All blockchain stats displayed correctly

---

### Phase 9: Transaction History Enhanced 🔍

#### 9.1 Enhanced Transaction Display
- [ ] View transaction history
- [ ] Check transaction type badges:
  - Coin Transfer (blue)
  - Payment Request (purple)
  - Split Bill (green)
  - EMI Payment (orange)
  - NFT Mint (yellow)
- [ ] Verify transaction descriptions
- [ ] Check gas used display
- [ ] Test explorer link (opens in new tab)
- [ ] Verify transaction filtering works

**Expected Result**: Enhanced transaction display with detailed information

#### 9.2 Transaction Parsing
- [ ] Perform coin transfer
- [ ] Check parsed as "coin_transfer"
- [ ] Create and pay payment request
- [ ] Verify parsed as "payment_request"
- [ ] Pay EMI installment
- [ ] Check parsed as "emi_payment"
- [ ] Mint loyalty NFT
- [ ] Verify parsed as "nft_mint"

**Expected Result**: All transaction types correctly identified and parsed

#### 9.3 Transaction Direction
- [ ] Send transaction (should show "sent")
- [ ] Receive transaction (should show "received")
- [ ] Self-transfer (should show "self")
- [ ] Check arrows/icons match direction

**Expected Result**: Transaction direction accurately displayed

---

### Phase 10: Error Handling 🛡️

Test all 20 error codes to ensure proper error messages:

#### 10.1 Identity Errors
- [ ] **Error 1**: Register wallet ID already taken
  - Expected: "Wallet ID Already Taken" message
- [ ] **Error 2**: Register UPI ID already used
  - Expected: "UPI ID Already Registered" message
- [ ] **Error 3**: Send to non-existent wallet ID
  - Expected: "Wallet ID Not Found" message
- [ ] **Error 4**: Send to non-existent UPI ID
  - Expected: "UPI ID Not Found" message

#### 10.2 Payment Request Errors
- [ ] **Error 5**: Pay non-existent payment request
  - Expected: "Payment Request Not Found" message
- [ ] **Error 6**: Access non-existent split bill
  - Expected: "Split Bill Not Found" message

#### 10.3 Authorization & Validation Errors
- [ ] **Error 7**: Unauthorized action
  - Expected: "Not Authorized" message
- [ ] **Error 8**: Send zero or negative amount
  - Expected: "Invalid Amount" message
- [ ] **Error 9**: Use uninitialized wallet
  - Expected: "Wallet Not Initialized" message

#### 10.4 EMI Errors
- [ ] **Error 10**: Access non-existent EMI
  - Expected: "EMI Agreement Not Found" message
- [ ] **Error 11**: Create duplicate EMI ID
  - Expected: "EMI Agreement Already Exists" message
- [ ] **Error 12**: Pay completed EMI
  - Expected: "EMI Already Completed" (info severity)
- [ ] **Error 13**: Pay EMI before due date
  - Expected: "EMI Payment Too Early" (warning)
- [ ] **Error 16**: Pay EMI not yet due
  - Expected: "EMI Payment Not Due Yet" (warning)

#### 10.5 Balance & Data Errors
- [ ] **Error 14**: Send more than balance
  - Expected: "Insufficient Balance" message
- [ ] **Error 15**: Create split bill with invalid data
  - Expected: "Invalid Split Bill Data" message

#### 10.6 NFT Errors
- [ ] **Error 17**: Mint duplicate loyalty NFT
  - Expected: "Loyalty NFT Already Minted" (info)
- [ ] **Error 18**: Use non-existent coupon
  - Expected: "Coupon Not Found" message
- [ ] **Error 19**: Use expired coupon
  - Expected: "Coupon Expired" (warning)

#### 10.7 Auto-Pay Errors
- [ ] **Error 20**: Auto-pay without approval
  - Expected: "Auto-Pay Not Approved" message

**Expected Result**: All error codes show user-friendly messages with:
- Clear title
- Detailed message
- Helpful suggestion
- Recommended action

---

### Phase 11: Performance & UX 🚀

#### 11.1 Loading States
- [ ] Check loading spinners during transactions
- [ ] Verify skeleton loaders for data fetching
- [ ] Test progress indicators
- [ ] Ensure no frozen UI during operations

**Expected Result**: Smooth loading states, no UI blocking

#### 11.2 Responsiveness
- [ ] Test on desktop (1920x1080, 1366x768)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667, 414x896)
- [ ] Check horizontal scrolling
- [ ] Verify touch interactions

**Expected Result**: Fully responsive across all devices

#### 11.3 Toast Notifications
- [ ] Success notifications (green)
- [ ] Error notifications (red)
- [ ] Warning notifications (yellow)
- [ ] Info notifications (blue)
- [ ] Verify auto-dismiss timing
- [ ] Test notification stacking

**Expected Result**: Clear, timely notifications for all actions

#### 11.4 Performance Metrics
- [ ] Page load time < 3 seconds
- [ ] Transaction submission < 2 seconds
- [ ] Data fetching < 1 second
- [ ] No memory leaks (check DevTools)
- [ ] Smooth animations (60 FPS)

**Expected Result**: Fast, performant application

---

### Phase 12: Edge Cases & Security 🔐

#### 12.1 Edge Cases
- [ ] Send to own address
- [ ] Create payment request to self
- [ ] Send maximum allowed amount
- [ ] Send minimum allowed amount (0.0001 APT)
- [ ] Multiple simultaneous transactions
- [ ] Rapid clicking/double submission
- [ ] Browser back button during transaction
- [ ] Network disconnection during tx

**Expected Result**: All edge cases handled gracefully

#### 12.2 Security
- [ ] Private key never exposed in UI
- [ ] Mnemonic stored securely (encrypted)
- [ ] Password not stored in plain text
- [ ] No sensitive data in console logs (production)
- [ ] HTTPS connection verified
- [ ] XSS protection verified
- [ ] CSRF protection (if applicable)

**Expected Result**: Security best practices followed

#### 12.3 Data Persistence
- [ ] Wallet data persists after page reload
- [ ] Accounts persist after browser close
- [ ] Settings persist across sessions
- [ ] Test localStorage clearing
- [ ] Test session expiration

**Expected Result**: Data properly persisted and restored

---

## Test Scenarios

### Scenario 1: New User Journey
1. Create new wallet
2. Copy address
3. Fund wallet using faucet (1.0 APT)
4. Verify balance appears
5. Send 0.1 APT to another address
6. Check transaction in history
7. View transaction in explorer

### Scenario 2: Payment Request Flow
1. Account A creates wallet
2. Account B creates wallet
3. Fund both accounts
4. B creates payment request for 0.5 APT to A
5. A views and pays request
6. Both verify balances updated
7. Check transaction history

### Scenario 3: Split Bill Among Friends
1. Three accounts: A, B, C
2. Fund all accounts
3. A creates split bill: 3.0 APT total
   - B owes 1.2 APT
   - C owes 1.8 APT
4. B pays their share
5. C pays their share
6. A verifies received 3.0 APT
7. All check transaction histories

### Scenario 4: EMI Journey
1. Company (C) creates EMI for User (A)
2. A reviews EMI terms
3. A pays first installment
4. Wait (or simulate) until next month
5. A pays second installment
6. Continue until EMI completed
7. Verify completion status

### Scenario 5: Loyalty Progression
1. New user starts (Bronze tier)
2. Perform 10 transactions (reach Silver)
3. Verify tier upgrade in dashboard
4. Perform 10 more transactions (reach Gold)
5. View loyalty NFTs collected
6. Check tier-specific benefits

---

## Automated Testing Recommendations

### Unit Tests
Create tests for:
- Error parsing functions
- Amount conversion utilities
- Address validation
- Transaction formatting
- Contract interaction functions

### Integration Tests
Test:
- Wallet creation flow
- Transaction sending flow
- Payment request lifecycle
- EMI payment cycle
- NFT minting process

### E2E Tests (Playwright/Cypress)
Test complete user journeys:
- New user onboarding
- Send/receive transactions
- Payment request creation and payment
- Split bill management
- EMI agreement lifecycle

---

## Known Issues & Limitations

Document any known issues:
- [ ] Issue 1: Description
- [ ] Issue 2: Description
- [ ] Limitation 1: Description

---

## Test Results

### Test Summary
- **Total Test Cases**: [To be filled]
- **Passed**: [To be filled]
- **Failed**: [To be filled]
- **Blocked**: [To be filled]
- **Pass Rate**: [To be filled]%

### Critical Issues Found
1. [Issue description]
2. [Issue description]

### Non-Critical Issues
1. [Issue description]
2. [Issue description]

---

## Sign-Off

### Tested By
- **Name**: [Your Name]
- **Date**: [Test Date]
- **Environment**: Aptos Devnet
- **Browser**: [Browser & Version]

### Approval
- [ ] All critical features tested
- [ ] All error codes verified
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Ready for production

---

## Next Steps

After completing testing:
1. Fix any critical bugs found
2. Document all known issues
3. Create bug tracking tickets
4. Plan for mainnet deployment
5. Prepare user documentation
6. Set up monitoring and analytics

---

## Appendix

### Useful Links
- Aptos Explorer: https://explorer.aptoslabs.com/?network=devnet
- Aptos Documentation: https://aptos.dev/
- Contract Source Code: [Link to contract repo]
- Frontend Repository: [Link to frontend repo]

### Test Data
- Contract Address: `0x9c2fe13427bfa2d51671cdc2c04b4915ed4ef81709ccd8cd31c1150769596d2c`
- Test Account A: [Address]
- Test Account B: [Address]
- Test Account C: [Address]

### Support Contacts
- Developer: [Contact]
- DevOps: [Contact]
- Product Owner: [Contact]
