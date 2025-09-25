// Demo script to add sample NFTs for testing the UI
// Run this in browser console to add sample data

function addSampleNFTs() {
  // Get current user address (replace with actual address)
  const userAddress = "0x1234567890abcdef"; // Replace with your wallet address

  // Sample offer NFTs
  const sampleOfferNFTs = [
    {
      id: `nft_${Date.now()}_1`,
      companyName: "TechMart",
      companyLogo: "🛒",
      discountPercentage: 15,
      productLink: "https://techmart.example.com",
      description: "Get 15% off on electronics at TechMart. Limited time offer!",
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      isRedeemed: false,
      mintedAt: new Date().toISOString(),
      category: "Electronics"
    },
    {
      id: `nft_${Date.now()}_2`,
      companyName: "FoodieHub",
      companyLogo: "🍕",
      discountPercentage: 20,
      productLink: "https://foodiehub.example.com",
      description: "Get 20% off on food & dining at FoodieHub. Delicious deals await!",
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
      isRedeemed: false,
      mintedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      category: "Food & Dining"
    }
  ];

  // Sample loyalty NFTs
  const sampleLoyaltyNFTs = [
    {
      id: `nft_${Date.now()}_3`,
      tier: "bronze",
      transactionCount: 5,
      mintedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      name: "Bronze Loyalty NFT",
      description: "Loyalty NFT earned for completing 5 transactions. This exclusive bronze tier NFT showcases your dedication to the wallet ecosystem.",
      imageUrl: "https://your-nft-storage.com/bronze-loyalty.png",
      attributes: ["tier:bronze", "type:loyalty_nft", "category:rewards", "transactions:5", "exclusive:true"]
    },
    {
      id: `nft_${Date.now()}_4`,
      tier: "silver",
      transactionCount: 15,
      mintedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      name: "Silver Loyalty NFT",
      description: "Loyalty NFT earned for completing 15 transactions. This exclusive silver tier NFT showcases your growing engagement.",
      imageUrl: "https://your-nft-storage.com/silver-loyalty.png",
      attributes: ["tier:silver", "type:loyalty_nft", "category:rewards", "transactions:15", "exclusive:true"]
    }
  ];

  // Sample user stats
  const sampleUserStats = {
    totalTransactions: 15,
    lastTransactionDate: new Date().toISOString(),
    loyaltyNftsMinted: ["bronze", "silver"]
  };

  // Store in localStorage
  localStorage.setItem(`offer_nfts_${userAddress}`, JSON.stringify(sampleOfferNFTs));
  localStorage.setItem(`loyalty_nfts_${userAddress}`, JSON.stringify(sampleLoyaltyNFTs));
  localStorage.setItem(`user_stats_${userAddress}`, JSON.stringify(sampleUserStats));

  console.log("✅ Sample NFT data added successfully!");
  console.log("📊 Added:", sampleOfferNFTs.length, "offer NFTs");
  console.log("🏆 Added:", sampleLoyaltyNFTs.length, "loyalty NFTs");
  console.log("📈 User stats:", sampleUserStats);
  console.log("🔄 Refresh the Collectables page to see the data");
}

// Instructions
console.log("🎮 NFT Demo Setup");
console.log("1. Replace the userAddress variable with your actual wallet address");
console.log("2. Run addSampleNFTs() to add sample data");
console.log("3. Navigate to the Collectables section to see the NFTs");

// Export for use
window.addSampleNFTs = addSampleNFTs;