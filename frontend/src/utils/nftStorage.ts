// NFT Storage and Minting Utilities

export interface OfferNFT {
  id: string;
  companyName: string;
  companyLogo: string;
  discountPercentage: number;
  productLink: string;
  description: string;
  expiryDate: string;
  isRedeemed: boolean;
  mintedAt: string;
  category: string;
}

export interface LoyaltyNFT {
  id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  transactionCount: number;
  mintedAt: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: string[];
}

export interface UserStats {
  totalTransactions: number;
  lastTransactionDate: string;
  loyaltyNftsMinted: string[];
}

// Loyalty tier thresholds (based on wallet_system.move)
const LOYALTY_THRESHOLDS = {
  bronze: 1,
  silver: 10,
  gold: 50,
  platinum: 100,
  diamond: 250,
};

// Sample company data for offer NFTs
const SAMPLE_COMPANIES = [
  {
    name: "TechMart",
    logo: "🛒",
    categories: ["Electronics", "Gadgets"],
    discounts: [10, 15, 20, 25],
    links: ["https://techmart.example.com", "https://techmart.example.com/deals"]
  },
  {
    name: "FoodieHub",
    logo: "🍕",
    categories: ["Food & Dining", "Restaurants"],
    discounts: [5, 10, 15, 20],
    links: ["https://foodiehub.example.com", "https://foodiehub.example.com/offers"]
  },
  {
    name: "FashionZone",
    logo: "👕",
    categories: ["Fashion", "Clothing"],
    discounts: [15, 20, 25, 30],
    links: ["https://fashionzone.example.com", "https://fashionzone.example.com/sale"]
  },
  {
    name: "BookWorms",
    logo: "📚",
    categories: ["Books", "Education"],
    discounts: [10, 12, 15, 18],
    links: ["https://bookworms.example.com", "https://bookworms.example.com/deals"]
  },
  {
    name: "GameHub",
    logo: "🎮",
    categories: ["Gaming", "Entertainment"],
    discounts: [10, 15, 20, 25],
    links: ["https://gamehub.example.com", "https://gamehub.example.com/specials"]
  }
];

// Generate unique ID
const generateNFTId = (): string => {
  return `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get user stats from localStorage
export const getUserStats = (userAddress: string): UserStats => {
  try {
    const stored = localStorage.getItem(`user_stats_${userAddress}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
  
  return {
    totalTransactions: 0,
    lastTransactionDate: new Date().toISOString(),
    loyaltyNftsMinted: [],
  };
};

// Update user stats
export const updateUserStats = (userAddress: string): UserStats => {
  const stats = getUserStats(userAddress);
  stats.totalTransactions += 1;
  stats.lastTransactionDate = new Date().toISOString();
  
  try {
    localStorage.setItem(`user_stats_${userAddress}`, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
  
  return stats;
};

// Check and mint loyalty NFT if eligible
export const checkAndMintLoyaltyNFT = (userAddress: string, transactionCount: number): LoyaltyNFT | null => {
  const stats = getUserStats(userAddress);
  
  // Determine highest eligible tier
  let eligibleTier: keyof typeof LOYALTY_THRESHOLDS | null = null;
  
  if (transactionCount >= LOYALTY_THRESHOLDS.diamond && !stats.loyaltyNftsMinted.includes('diamond')) {
    eligibleTier = 'diamond';
  } else if (transactionCount >= LOYALTY_THRESHOLDS.platinum && !stats.loyaltyNftsMinted.includes('platinum')) {
    eligibleTier = 'platinum';
  } else if (transactionCount >= LOYALTY_THRESHOLDS.gold && !stats.loyaltyNftsMinted.includes('gold')) {
    eligibleTier = 'gold';
  } else if (transactionCount >= LOYALTY_THRESHOLDS.silver && !stats.loyaltyNftsMinted.includes('silver')) {
    eligibleTier = 'silver';
  } else if (transactionCount >= LOYALTY_THRESHOLDS.bronze && !stats.loyaltyNftsMinted.includes('bronze')) {
    eligibleTier = 'bronze';
  }
  
  if (!eligibleTier) {
    return null;
  }
  
  // Create loyalty NFT
  const loyaltyNFT: LoyaltyNFT = {
    id: generateNFTId(),
    tier: eligibleTier,
    transactionCount,
    mintedAt: new Date().toISOString(),
    name: `${eligibleTier.charAt(0).toUpperCase() + eligibleTier.slice(1)} Loyalty NFT`,
    description: `Loyalty NFT earned for completing ${transactionCount} transactions. This exclusive ${eligibleTier} tier NFT showcases your dedication to the wallet ecosystem.`,
    imageUrl: `https://your-nft-storage.com/${eligibleTier}-loyalty.png`,
    attributes: [
      `tier:${eligibleTier}`,
      'type:loyalty_nft',
      'category:rewards',
      `transactions:${transactionCount}`,
      'exclusive:true'
    ],
  };
  
  // Save loyalty NFT
  try {
    const existingLoyaltyNFTs = getLoyaltyNFTs(userAddress);
    existingLoyaltyNFTs.push(loyaltyNFT);
    localStorage.setItem(`loyalty_nfts_${userAddress}`, JSON.stringify(existingLoyaltyNFTs));
    
    // Update user stats to mark tier as minted
    stats.loyaltyNftsMinted.push(eligibleTier);
    localStorage.setItem(`user_stats_${userAddress}`, JSON.stringify(stats));
    
    console.log(`🏆 Loyalty NFT minted! Tier: ${eligibleTier}, Transactions: ${transactionCount}`);
    return loyaltyNFT;
  } catch (error) {
    console.error('Error saving loyalty NFT:', error);
    return null;
  }
};

// Mint offer NFT with 40% chance
export const tryMintOfferNFT = (userAddress: string): OfferNFT | null => {
  // 40% chance to mint offer NFT
  if (Math.random() > 0.4) {
    return null;
  }
  
  // Select random company
  const company = SAMPLE_COMPANIES[Math.floor(Math.random() * SAMPLE_COMPANIES.length)];
  const category = company.categories[Math.floor(Math.random() * company.categories.length)];
  const discount = company.discounts[Math.floor(Math.random() * company.discounts.length)];
  const link = company.links[Math.floor(Math.random() * company.links.length)];
  
  // Generate expiry date (30 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  const offerNFT: OfferNFT = {
    id: generateNFTId(),
    companyName: company.name,
    companyLogo: company.logo,
    discountPercentage: discount,
    productLink: link,
    description: `Get ${discount}% off on ${category.toLowerCase()} at ${company.name}. Limited time offer!`,
    expiryDate: expiryDate.toISOString(),
    isRedeemed: false,
    mintedAt: new Date().toISOString(),
    category,
  };
  
  // Save offer NFT
  try {
    const existingOfferNFTs = getOfferNFTs(userAddress);
    existingOfferNFTs.push(offerNFT);
    localStorage.setItem(`offer_nfts_${userAddress}`, JSON.stringify(existingOfferNFTs));
    
    console.log(`🎁 Offer NFT minted! Company: ${company.name}, Discount: ${discount}%`);
    return offerNFT;
  } catch (error) {
    console.error('Error saving offer NFT:', error);
    return null;
  }
};

// Get offer NFTs for user
export const getOfferNFTs = (userAddress: string): OfferNFT[] => {
  try {
    const stored = localStorage.getItem(`offer_nfts_${userAddress}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading offer NFTs:', error);
  }
  return [];
};

// Get loyalty NFTs for user
export const getLoyaltyNFTs = (userAddress: string): LoyaltyNFT[] => {
  try {
    const stored = localStorage.getItem(`loyalty_nfts_${userAddress}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading loyalty NFTs:', error);
  }
  return [];
};

// Main function to handle transaction and mint NFTs
export const handleTransactionAndMintNFTs = (userAddress: string): {
  loyaltyNFT: LoyaltyNFT | null;
  offerNFT: OfferNFT | null;
  newTransactionCount: number;
} => {
  // Update user stats
  const updatedStats = updateUserStats(userAddress);
  
  // Try to mint loyalty NFT
  const loyaltyNFT = checkAndMintLoyaltyNFT(userAddress, updatedStats.totalTransactions);
  
  // Try to mint offer NFT (40% chance)
  const offerNFT = tryMintOfferNFT(userAddress);
  
  return {
    loyaltyNFT,
    offerNFT,
    newTransactionCount: updatedStats.totalTransactions,
  };
};

// Get all NFTs for user (for display purposes)
export const getAllNFTs = (userAddress: string) => {
  return {
    offerNFTs: getOfferNFTs(userAddress),
    loyaltyNFTs: getLoyaltyNFTs(userAddress),
    stats: getUserStats(userAddress),
  };
};

// Initialize user stats if not exists
export const initializeUserStats = (userAddress: string): void => {
  const existing = getUserStats(userAddress);
  if (existing.totalTransactions === 0) {
    // User might have existing transactions, let's initialize with a reasonable count
    // In a real app, you'd calculate this from actual transaction history
    const initialStats: UserStats = {
      totalTransactions: 0,
      lastTransactionDate: new Date().toISOString(),
      loyaltyNftsMinted: [],
    };
    
    try {
      localStorage.setItem(`user_stats_${userAddress}`, JSON.stringify(initialStats));
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  }
};

// Clear all NFT data for user (for testing purposes)
export const clearUserNFTData = (userAddress: string): void => {
  try {
    localStorage.removeItem(`offer_nfts_${userAddress}`);
    localStorage.removeItem(`loyalty_nfts_${userAddress}`);
    localStorage.removeItem(`user_stats_${userAddress}`);
    console.log('User NFT data cleared successfully');
  } catch (error) {
    console.error('Error clearing user NFT data:', error);
  }
};