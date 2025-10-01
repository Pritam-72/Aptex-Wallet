# Known Issues & Limitations

**Document Version**: 1.0  
**Last Updated**: [Date]  
**Contract Address**: `0x9c2fe13427bfa2d51671cdc2c04b4915ed4ef81709ccd8cd31c1150769596d2c`  
**Network**: Aptos Devnet

---

## Overview

This document tracks known issues, limitations, and planned improvements for the Aptos Wallet application.

---

## Critical Issues 🔴

None currently identified.

---

## High Priority Issues 🟠

### Issue 1: [Title]
**Status**: Open | In Progress | Resolved  
**Severity**: High  
**Impact**: [Description of impact]  
**Affected Components**: [List components]

**Description**: 

**Workaround**: 

**Planned Fix**: 

**Target Resolution**: [Date]

---

## Medium Priority Issues 🟡

### Issue 1: Transaction History Pagination
**Status**: Open  
**Severity**: Medium  
**Impact**: Users with 1000+ transactions may experience slow loading

**Description**: 
The `getEnhancedAccountTransactions()` function currently fetches up to 50 transactions without pagination. Users with extensive transaction history may experience performance issues.

**Workaround**: 
Currently limiting to 50 transactions. Users can view more on Aptos Explorer.

**Planned Fix**: 
- Implement pagination with "Load More" button
- Add infinite scrolling
- Cache fetched transactions

**Target Resolution**: v1.1.0

---

### Issue 2: Real-time Balance Updates
**Status**: Open  
**Severity**: Medium  
**Impact**: Balance may not update immediately after transaction

**Description**: 
Balance is fetched from Aptos blockchain API, which may have a slight delay (1-2 seconds) after transaction confirmation.

**Workaround**: 
- Manual refresh button available
- Auto-refresh after transaction
- Show pending transaction status

**Planned Fix**: 
- Implement WebSocket for real-time updates
- Add optimistic UI updates

**Target Resolution**: v1.2.0

---

### Issue 3: Error Message Localization
**Status**: Open  
**Severity**: Medium  
**Impact**: Error messages only available in English

**Description**: 
All user-facing error messages are currently in English only. International users may have difficulty understanding errors.

**Workaround**: 
English error messages with clear icons and visual cues.

**Planned Fix**: 
- Implement i18n for error messages
- Support multiple languages (Spanish, Chinese, Hindi, etc.)
- Language selector in settings

**Target Resolution**: v1.3.0

---

## Low Priority Issues 🟢

### Issue 1: Transaction Export Formats
**Status**: Open  
**Severity**: Low  
**Impact**: Limited export format options

**Description**: 
Transaction history can only be exported to Excel. Users may prefer CSV, PDF, or other formats.

**Planned Fix**: 
- Add CSV export
- Add PDF export with formatting
- Add JSON export for developers

**Target Resolution**: v1.2.0

---

### Issue 2: Dark Mode Support
**Status**: Open  
**Severity**: Low  
**Impact**: No dark mode option for users who prefer it

**Description**: 
Application currently only supports light mode.

**Planned Fix**: 
- Implement dark mode theme
- Add theme toggle in settings
- Respect system theme preference

**Target Resolution**: v1.3.0

---

### Issue 3: Browser Extension Wallet Support
**Status**: Partial  
**Severity**: Low  
**Impact**: Limited wallet options

**Description**: 
Currently tested with Petra and Martian wallets. Other wallet extensions may have compatibility issues.

**Tested Wallets**:
- ✅ Petra Wallet - Full support
- ✅ Martian Wallet - Full support
- ⚠️ Pontem Wallet - Not tested
- ⚠️ Other wallets - Not tested

**Planned Fix**: 
- Test with all major Aptos wallets
- Add wallet-specific error handling
- Document supported wallets

**Target Resolution**: v1.1.0

---

## Limitations 📋

### Limitation 1: Devnet Only
**Description**: Application currently deployed on Aptos Devnet only.

**Impact**: 
- Test tokens only (no real value)
- Devnet may reset periodically
- Performance may differ from mainnet

**Future Plan**: Deploy to Aptos Mainnet after thorough testing

---

### Limitation 2: Transaction Type Detection
**Description**: Transaction type detection relies on function names in transaction payloads.

**Current Limitations**:
- Custom transactions may not be recognized
- External contract calls may show as "other"
- Batch transactions may not parse correctly

**Detection Logic**:
```typescript
// Recognizes:
- coin_transfer
- payment_request
- split_bill
- emi_payment
- nft_mint
// Others shown as "other"
```

**Future Plan**: Enhance parsing with event analysis and custom transaction decoder

---

### Limitation 3: Gas Estimation
**Description**: Gas estimation is approximate based on transaction type.

**Current Behavior**:
- Uses Aptos blockchain's gas estimation
- May occasionally be slightly inaccurate
- No guarantee of exact gas cost

**Future Plan**: Implement more accurate gas prediction model

---

### Limitation 4: NFT Image Display
**Description**: NFT images rely on metadata URIs being accessible.

**Current Limitations**:
- If IPFS gateway is down, images won't load
- No fallback image caching
- Slow loading for large images

**Future Plan**: 
- Implement image caching
- Add fallback images
- Use multiple IPFS gateways

---

### Limitation 5: Search Functionality
**Description**: Transaction search is client-side only.

**Current Limitations**:
- Only searches loaded transactions (up to 50)
- No server-side search
- No fuzzy matching
- Case-sensitive in some fields

**Future Plan**: Implement server-side search with indexing

---

### Limitation 6: Wallet Backup
**Description**: Wallet backup relies on user manually saving mnemonic.

**Current Limitations**:
- No encrypted backup export
- No cloud backup option
- No automatic backup reminders

**Security Note**: This is intentional for security, but may be improved with optional encrypted backups.

**Future Plan**: 
- Optional encrypted backup file export
- Backup reminders
- Multi-device sync (with user consent)

---

### Limitation 7: Multi-signature Support
**Description**: Application does not currently support multi-signature wallets.

**Impact**: 
- Cannot use with corporate/DAO wallets
- Limited to single-signer accounts

**Future Plan**: Add multi-sig support in v2.0.0

---

### Limitation 8: Transaction Batching
**Description**: Multiple transactions must be sent individually.

**Impact**: 
- Cannot batch multiple operations
- Higher gas costs for multiple actions
- Slower for bulk operations

**Future Plan**: Implement transaction batching in v2.0.0

---

### Limitation 9: Offline Mode
**Description**: Application requires internet connection for all operations.

**Current Limitations**:
- No offline transaction signing
- No cached data viewing
- No service worker for offline access

**Future Plan**: Implement progressive web app (PWA) features

---

### Limitation 10: Analytics Privacy
**Description**: Limited privacy controls for analytics.

**Current State**:
- Basic analytics tracking
- No opt-out option
- IP addresses may be logged

**Future Plan**: 
- Add analytics opt-out
- Implement privacy-focused analytics
- GDPR compliance features

---

## Browser Compatibility Notes 🌐

### Fully Supported
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Partially Supported
- ⚠️ Mobile Safari (iOS < 14): Some animations may be choppy
- ⚠️ Chrome (< 90): May not support all features
- ⚠️ Firefox (< 88): WebP images may not load

### Not Supported
- ❌ Internet Explorer (all versions)
- ❌ Opera Mini
- ❌ UC Browser

---

## Performance Considerations ⚡

### Known Performance Bottlenecks

1. **Transaction History Loading**
   - Fetching 1000+ transactions can take 5-10 seconds
   - Mitigation: Limit to 50 transactions by default

2. **Contract Data Fetching**
   - Multiple contract calls on dashboard load
   - Mitigation: Batch requests where possible

3. **NFT Image Loading**
   - IPFS images can be slow
   - Mitigation: Show loading placeholders

4. **Wallet Connection**
   - Initial wallet connection can take 2-3 seconds
   - Mitigation: Show loading state

---

## Security Considerations 🔒

### Security Limitations

1. **Client-Side Storage**
   - Encrypted wallet data stored in localStorage
   - Vulnerable if user's device is compromised
   - Mitigation: Strong password requirement, auto-lock

2. **Transaction Signing**
   - Relies on browser wallet extension security
   - No additional 2FA for transactions
   - Mitigation: Transaction confirmation prompts

3. **API Endpoints**
   - Public Aptos RPC endpoints
   - Rate limiting may apply
   - Mitigation: Implement request caching

4. **XSS Prevention**
   - React's built-in XSS protection
   - User input sanitization
   - Still requires vigilance

---

## Mobile Experience 📱

### Known Mobile Issues

1. **Wallet Connection on Mobile**
   - Some mobile browsers may not support wallet extensions
   - Mitigation: Deep links to wallet apps

2. **Touch Target Sizes**
   - Some buttons may be small on older devices
   - Mitigation: Minimum 44x44px touch targets

3. **Landscape Mode**
   - Some screens not optimized for landscape
   - Mitigation: Force portrait on key screens

4. **Keyboard Behavior**
   - Mobile keyboard may cover input fields
   - Mitigation: Scroll viewport when keyboard opens

---

## Future Enhancements 🚀

### Planned Features (v1.1.0)
- [ ] Transaction pagination
- [ ] CSV/PDF export
- [ ] Wallet address book
- [ ] Transaction notes
- [ ] Notification preferences

### Planned Features (v1.2.0)
- [ ] Real-time balance updates
- [ ] Push notifications
- [ ] QR code scanner
- [ ] Biometric authentication

### Planned Features (v2.0.0)
- [ ] Multi-signature wallets
- [ ] Transaction batching
- [ ] Advanced analytics
- [ ] Portfolio tracking
- [ ] DeFi integrations

---

## Reporting Issues 🐛

### How to Report

If you encounter an issue not listed here:

1. **Check Existing Issues**: Review this document first
2. **GitHub Issues**: Open an issue at [Repository URL]
3. **Discord**: Report in #support channel [Discord Link]
4. **Email**: Send to support@[domain].com

### Information to Include

When reporting an issue, please provide:
- Browser name and version
- Operating system
- Wallet extension version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/screen recordings
- Console errors (F12 → Console)
- Transaction hash (if applicable)

---

## Version History 📝

### v1.0.0 (Current)
- Initial release
- All 13 core features implemented
- 20 error codes handled
- Devnet deployment

### v0.9.0 (Beta)
- Beta testing phase
- Bug fixes from testing
- Performance improvements

### v0.8.0 (Alpha)
- Alpha release
- Core functionality complete
- Internal testing

---

**Last Updated**: [Date]  
**Next Review**: [Date]  
**Maintained By**: [Team Name]
