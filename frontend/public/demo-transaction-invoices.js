// Demo script to add sample transactions for testing Invoice NFTs
// Run this in browser console or as a utility

export const addSampleTransactions = () => {
  try {
    // Get current wallet data
    const walletData = localStorage.getItem('cryptal_wallet');
    if (!walletData) {
      console.log('No wallet found. Please create a wallet first.');
      return;
    }

    const parsedData = JSON.parse(walletData);
    const currentIndex = parsedData.currentAccountIndex || 0;
    const publicKey = parsedData.accounts?.[currentIndex]?.publicKey;
    const address = parsedData.accounts?.[currentIndex]?.address;

    if (!publicKey || !address) {
      console.log('No valid account found in wallet.');
      return;
    }

    // Sample transactions
    const sampleTransactions = [
      {
        from: address,
        to: "0x8ba1f109551bD432803012645Hac136c22c2C3B0",
        ethAmount: "2.5",
        aptosAmount: "2.5",
        inrAmount: 932,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        txHash: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
        type: "sent",
        status: "confirmed",
        gasUsed: "0.001",
        function: "coin::transfer"
      },
      {
        from: "0x123f456789abcdef123456789abcdef123456789a",
        to: address,
        ethAmount: "5.75",
        aptosAmount: "5.75",
        inrAmount: 2144,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        txHash: "0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
        type: "received",
        status: "confirmed",
        gasUsed: "0.001",
        function: "coin::transfer"
      },
      {
        from: address,
        to: "0xdeadbeef12345678901234567890123456789012",
        ethAmount: "0.1",
        aptosAmount: "0.1",
        inrAmount: 37,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        type: "sent",
        status: "confirmed",
        gasUsed: "0.001",
        function: "coin::transfer"
      },
      {
        from: "0x555666777888999aaabbbcccdddeeefffggghhh",
        to: address,
        ethAmount: "10.0",
        aptosAmount: "10.0",
        inrAmount: 3730,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        txHash: "0x111222333444555666777888999aaabbbcccdddeeefffggghhhjjjkkkllll",
        type: "received",
        status: "confirmed",
        gasUsed: "0.001",
        function: "coin::transfer"
      },
      {
        from: address,
        to: "0x999888777666555444333222111000aaabbbccc",
        ethAmount: "1.25",
        aptosAmount: "1.25",
        inrAmount: 466,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        txHash: "0x333444555666777888999aaabbbcccdddeeefffggghhhjjjkkkllmmmnn",
        type: "sent",
        status: "confirmed",
        gasUsed: "0.001",
        function: "coin::transfer"
      }
    ];

    // Store transactions in localStorage
    const existingTransactions = localStorage.getItem(`transactions_${publicKey}`);
    let allTransactions = [];

    if (existingTransactions) {
      try {
        allTransactions = JSON.parse(existingTransactions);
      } catch (e) {
        allTransactions = [];
      }
    }

    // Add sample transactions (avoid duplicates)
    sampleTransactions.forEach(newTx => {
      const exists = allTransactions.some(existingTx => existingTx.txHash === newTx.txHash);
      if (!exists) {
        allTransactions.push(newTx);
      }
    });

    // Sort by timestamp (newest first)
    allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Save back to localStorage
    localStorage.setItem(`transactions_${publicKey}`, JSON.stringify(allTransactions));

    console.log(`✅ Added ${sampleTransactions.length} sample transactions for Invoice NFT testing`);
    console.log(`📊 Total transactions: ${allTransactions.length}`);
    console.log('🔄 Refresh the Collectables page to see Invoice NFTs');

    return allTransactions;
  } catch (error) {
    console.error('Error adding sample transactions:', error);
  }
};

// Auto-run when imported in browser
if (typeof window !== 'undefined') {
  // Make it available globally for easy access in console
  window.addSampleTransactions = addSampleTransactions;
}

// Instructions for use
console.log(`
🎯 Invoice NFT Demo Setup

To add sample transactions for testing:
1. Open browser console (F12)
2. Run: addSampleTransactions()
3. Refresh the Collectables page
4. Navigate to the "Invoices" tab

The sample transactions will create downloadable Invoice NFTs!
`);

export default addSampleTransactions;