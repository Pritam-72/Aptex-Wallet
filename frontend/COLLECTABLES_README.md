# NFT Collectables System

This README explains the NFT Collectables system that has been implemented in the wallet application.

## Overview

The Collectables section provides users with two types of NFTs:

### 1. Offer NFTs (40% chance per transaction)
- **Trigger**: Automatically minted when users make transactions with a 40% probability
- **Content**: 
  - Company logo and name
  - Discount percentage (5-30%)
  - Product link for redemption
  - Expiry date (30 days from mint)
  - Category (Electronics, Food & Dining, Fashion, Books, Gaming)
- **Sample Companies**: TechMart, FoodieHub, FashionZone, BookWorms, GameHub
- **Features**: Users can redeem offers directly from the NFT, mark as used

### 2. Loyalty NFTs (Based on transaction count)
- **Trigger**: Automatically minted when users reach transaction milestones
- **Tiers**:
  - 🥉 **Bronze**: 1+ transactions
  - 🥈 **Silver**: 10+ transactions  
  - 🥇 **Gold**: 50+ transactions
  - ⭐ **Platinum**: 100+ transactions
  - 💎 **Diamond**: 250+ transactions
- **Features**: Each tier is minted only once, displays transaction count and mint date

## How It Works

### Transaction Flow with NFT Minting

1. **User makes a transaction** (Send money or Accept payment request)
2. **System updates user stats** (transaction count)
3. **NFT Minting Logic**:
   - **Loyalty NFT**: Check if user reached new tier threshold → Mint if eligible
   - **Offer NFT**: 40% random chance → Mint random company offer
4. **User gets notification** about any new NFTs in the success toast
5. **NFTs appear in Collectables section**

### Storage Implementation

All NFT data is stored in localStorage with the following keys:
- `user_stats_{userAddress}`: User transaction statistics
- `loyalty_nfts_{userAddress}`: Array of loyalty NFTs
- `offer_nfts_{userAddress}`: Array of offer NFTs

### Code Structure

```
frontend/src/
├── components/
│   └── CollectablesSection.tsx     # Main Collectables UI component
├── utils/
│   └── nftStorage.ts               # NFT minting and storage logic
└── pages/
    └── SimpleDashboard.tsx         # Integration with dashboard
```

### Key Functions

#### nftStorage.ts
- `handleTransactionAndMintNFTs()`: Main function called after transactions
- `checkAndMintLoyaltyNFT()`: Checks eligibility and mints loyalty NFTs  
- `tryMintOfferNFT()`: 40% chance to mint offer NFTs
- `getUserStats()`: Track user transaction statistics
- `initializeUserStats()`: Initialize stats for new users

#### CollectablesSection.tsx
- Two-tab interface (Offers vs Loyalty)
- Card-based NFT display with metadata
- Offer redemption functionality
- Tier-based styling for loyalty NFTs

## Integration Points

### 1. SendTransaction Component
```tsx
// After successful transaction
const nftResults = handleTransactionAndMintNFTs(currentAccount.address);

// Enhanced success toast with NFT notifications
if (nftResults.loyaltyNFT) {
  toastDescription += ` 🏆 New ${nftResults.loyaltyNFT.tier} loyalty NFT earned!`;
}
if (nftResults.offerNFT) {
  toastDescription += ` 🎁 Bonus offer NFT received!`;
}
```

### 2. PaymentRequestsSection Component
```tsx
// After accepting payment request
const nftResults = handleTransactionAndMintNFTs(userAddress);
// Similar toast enhancement
```

### 3. SimpleDashboard Navigation
- Added "Collectables" section to sidebar
- Integrated with keyboard shortcut (⌘2)
- User stats initialization on wallet load

## Testing the Feature

1. **Create/Load a wallet** in the dashboard
2. **Make transactions** using the Send functionality
3. **Accept payment requests** from other users
4. **Check Collectables section** to see minted NFTs
5. **Try redeeming offers** by clicking "Redeem Offer" button

## Sample Data

The system includes 5 sample companies with realistic offers:
- **TechMart** (🛒): Electronics, 10-25% discounts
- **FoodieHub** (🍕): Food & Dining, 5-20% discounts  
- **FashionZone** (👕): Fashion, 15-30% discounts
- **BookWorms** (📚): Books, 10-18% discounts
- **GameHub** (🎮): Gaming, 10-25% discounts

## Future Enhancements

1. **Smart Contract Integration**: Connect with Aptos wallet_system.move contract
2. **NFT Marketplace**: Allow trading of NFTs between users
3. **Company Dashboard**: Let companies create their own offer templates
4. **Advanced Analytics**: Track redemption rates and user engagement
5. **Seasonal Events**: Special NFTs for holidays or events
6. **Achievement System**: Additional NFTs for specific wallet activities