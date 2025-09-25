// Simple balance test - run this in browser console or Node.js
// To test: Open browser dev tools on http://localhost:8082 and paste this code

async function testWalletBalance() {
  console.log('🧪 Starting wallet balance test...');
  
  try {
    // First test - system address (should have balance)
    console.log('\n📋 Test 1: System address (0x1)');
    const systemBalance = await window.aptosUtils?.getWalletBalance('0x1');
    console.log('System address balance:', systemBalance);
    
    // Second test - non-existent address (should return 0)
    console.log('\n📋 Test 2: Non-existent address');
    const fakeAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const fakeBalance = await window.aptosUtils?.getWalletBalance(fakeAddress);
    console.log('Fake address balance:', fakeBalance);
    
    // Third test - current user's address (if available)
    const currentAccount = JSON.parse(localStorage.getItem('currentAccount') || 'null');
    if (currentAccount?.address) {
      console.log('\n📋 Test 3: Current user address');
      console.log('Testing address:', currentAccount.address);
      const userBalance = await window.aptosUtils?.getWalletBalance(currentAccount.address);
      console.log('User address balance:', userBalance);
    } else {
      console.log('\n📋 Test 3: Skipped (no current account found)');
    }
    
    console.log('\n✅ Balance test completed');
    
  } catch (error) {
    console.error('❌ Balance test failed:', error);
  }
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  window.testWalletBalance = testWalletBalance;
  console.log('🔧 Test function available as: window.testWalletBalance()');
}

// Auto-run if in browser context
if (typeof window !== 'undefined' && window.location) {
  setTimeout(() => {
    console.log('🏃‍♂️ Auto-running balance test in 3 seconds...');
    setTimeout(testWalletBalance, 3000);
  }, 1000);
}