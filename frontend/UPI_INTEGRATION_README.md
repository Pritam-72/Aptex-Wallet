# UPI Integration Feature

This feature allows users to link their UPI IDs to their wallet addresses and send transactions using familiar UPI IDs instead of complex wallet addresses. It includes a dedicated UPI management dashboard accessible through the sidebar.

## 🚀 Features

- **Dedicated UPI Dashboard**: Full-featured UPI management interface in the sidebar
- **UPI ID Mapping**: Users can map multiple UPI IDs to their wallet address
- **UPI QR Code Support**: Scan standard UPI QR codes to auto-fill transaction details
- **Easy Transfers**: Send crypto using UPI IDs like `user@paytm` instead of `0xabc123...`
- **Transaction History**: Track transactions made via UPI IDs
- **Real-time Validation**: Check if UPI IDs are available in the local directory
- **Quick Access Widget**: Easy access to UPI manager from the main wallet view
- **Search & Filter**: Find specific UPI mappings quickly
- **Statistics Dashboard**: View mapping statistics and recent activity

## 📁 Files Added/Modified

### New Files
- `src/utils/upiStorage.ts` - Core UPI mapping functionality
- `src/components/UpiMappingSection.tsx` - UI for managing UPI mappings (legacy)
- `src/pages/UpiDashboard.tsx` - Dedicated UPI management dashboard
- `src/components/UpiQuickAccess.tsx` - Quick access widget for main wallet view
- `public/upi-demo.html` - Demo and documentation page

### Modified Files
- `src/components/SendTransaction.tsx` - Added UPI ID field and QR parsing
- `src/components/UserSettings.tsx` - Added link to UPI dashboard
- `src/pages/SimpleDashboard.tsx` - Added UPI sidebar section and dashboard integration
- `src/utils/transactionStorage.ts` - Added UPI ID to transaction records

## 🎯 How to Use

### For Users

1. **Access UPI Dashboard**:
   - Click "UPI Manager" in the sidebar (shortcut: ⌘U)
   - Or click "Manage" in the UPI quick access widget on the wallet page
   - Or go to User Settings and click "Open UPI Manager"

2. **Set Up UPI Mapping**:
   - In the UPI Dashboard, find "Add New UPI ID" section
   - Add your UPI ID (e.g., `yourname@paytm`)
   - Optionally add a display name
   - Save the mapping

2. **Send Money Using UPI ID**:
   - Open Send Transaction
   - Either enter a wallet address OR enter a UPI ID
   - If UPI ID is found, it will show "UPI ID found in directory"
   - Complete the transaction as usual

3. **Manage UPI Mappings**:
   - View all your UPI mappings in the dashboard
   - Search and filter mappings
   - Copy UPI IDs to clipboard
   - Remove mappings when no longer needed
   - Export mappings for backup

4. **Scan UPI QR Codes**:
   - Use the QR scanner in Send Transaction
   - Point at any standard UPI QR code
   - The system will automatically extract the UPI ID
   - If the UPI ID is mapped, it resolves to the wallet address

### For Developers

```typescript
// Core functions available
import { 
  addUpiMapping, 
  getPublicKeyByUpiId, 
  parseUpiQr, 
  isValidUpiId 
} from '@/utils/upiStorage';

// Example usage
const success = addUpiMapping('user@paytm', '0xabc123...', 'John Doe');
const walletAddress = getPublicKeyByUpiId('user@paytm');
const upiData = parseUpiQr('upi://pay?pa=user@paytm&pn=John%20Doe&am=100');
const isValid = isValidUpiId('user@paytm');
```

## 🔧 Technical Details

### UPI QR Code Format Support
The system supports standard UPI QR codes with this format:
```
upi://pay?pa=UPIID@PROVIDER&pn=NAME&am=AMOUNT&...
```

Common examples:
- `upi://pay?pa=9236882056@axl&pn=User%20Name&mc=0000`
- `upi://pay?pa=jayesh152005-1@okicici&pn=jayesh%20krishna`

### Storage
- UPI mappings are stored locally in `localStorage`
- Key: `cryptal_upi_mappings`
- Format: JSON with mappings array and version

### Validation
- UPI ID format: `^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$`
- Prevents duplicate UPI ID mappings
- Validates wallet address format

## 🧪 Testing

### Unit Testing
```bash
# Test UPI validation
isValidUpiId('test@paytm') // true
isValidUpiId('invalid') // false

# Test QR parsing
parseUpiQr('upi://pay?pa=test@paytm') // { upiId: 'test@paytm' }
```

### Integration Testing
1. Add a UPI mapping in settings
2. Try sending to that UPI ID
3. Scan a UPI QR code
4. Verify transaction history shows UPI ID

### Demo
Open `public/upi-demo.html` for a comprehensive demo and testing guide.

## ⚠️ Important Notes

### Security
- UPI mappings are stored locally on each device
- No central server stores the mappings
- Users control their own UPI directory

### Privacy
- Only the user can see their UPI mappings
- Transaction history includes UPI IDs for reference
- No data is shared externally

### Limitations
- This is a local mapping system only
- Does not connect to actual UPI payment networks
- UPI ID existence is not verified with banks
- Users must trust the recipients they map

## 🔄 Future Enhancements

1. **Shared Directory**: Central service for UPI ID lookups
2. **QR Generation**: Generate UPI-style QR codes for wallet addresses
3. **Social Features**: Find friends by UPI ID
4. **Bulk Import/Export**: Manage large lists of UPI mappings
5. **Integration**: Connect with actual UPI payment gateways
6. **Verification**: Verify UPI ID ownership

## 📱 UI Components

### UpiDashboard (Main Dashboard)
- Complete UPI management interface
- Statistics and analytics
- Add/remove UPI mappings
- Search and filter functionality
- Export capabilities
- Help and documentation

### UpiMappingSection (Legacy Component)
- Basic add/remove UPI mappings
- View mapped UPI IDs
- Validation and error handling

### UpiQuickAccess
- Quick navigation widget
- Displays on main wallet page
- One-click access to UPI dashboard

### SendTransaction (Enhanced)
- UPI ID input field
- Real-time UPI ID validation
- UPI QR code scanning
- Address resolution display

## 🧭 Navigation

### Accessing UPI Features

1. **Primary Access**: Sidebar → "UPI Manager" (⌘U)
2. **Quick Access**: Wallet page → UPI widget → "Manage" button
3. **Settings**: User Settings → "Open UPI Manager" button

### Keyboard Shortcuts
- `⌘U` - Open UPI Manager from anywhere in the dashboard

## 🎨 User Experience

### Visual Indicators
- ✅ Green checkmark: UPI ID found
- ⚠️ Yellow warning: UPI ID not registered
- ❌ Red error: Invalid UPI ID format
- Address preview: Shows resolved wallet address

### Error Handling
- Clear error messages for invalid UPI IDs
- Helpful hints for proper UPI ID format
- Graceful fallback to wallet addresses

## 🚀 Getting Started

1. Build the project: `npm run build`
2. The UPI integration is automatically available
3. Access UPI Manager from the sidebar or wallet quick access
4. Users can start mapping UPI IDs in the dedicated dashboard
5. Test with the demo page: `public/upi-demo.html`

## 🎨 Dashboard Features

### Statistics Overview
- Total UPI mappings count
- Valid mappings indicator
- Recently added mappings (last 7 days)

### Management Tools
- Add new UPI mappings with validation
- Search existing mappings
- Export/import functionality
- Quick copy UPI IDs
- Remove unwanted mappings

### Visual Indicators
- ✅ Green: Valid and mapped UPI IDs
- ⚠️ Yellow: Valid format but not mapped
- ❌ Red: Invalid UPI ID format
- 📊 Statistics cards with color-coded status

This feature bridges the gap between traditional UPI payments and crypto transactions, making the wallet more accessible to users familiar with UPI systems. The dedicated dashboard provides a comprehensive management interface for power users while maintaining simplicity for casual users.