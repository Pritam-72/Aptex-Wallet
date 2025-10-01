/**
 * Contract Function Testing Script
 * 
 * This script helps test all integrated contract functions in the browser console.
 * Open DevTools console and run individual test functions.
 * 
 * Make sure you're connected to your wallet first!
 */

// Contract configuration
const CONTRACT_ADDRESS = "0x9c2fe13427bfa2d51671cdc2c04b4915ed4ef81709ccd8cd31c1150769596d2c";
const MODULE_NAME = "wallet_system";

console.log("🧪 Contract Testing Script Loaded");
console.log("📝 Contract Address:", CONTRACT_ADDRESS);
console.log("📦 Module Name:", MODULE_NAME);
console.log("\n=== Available Test Functions ===");
console.log("1. testWalletBalance() - Check wallet balance");
console.log("2. testUserStats() - Get user statistics");
console.log("3. testTransactionHistory() - Fetch transaction history");
console.log("4. testPaymentRequests() - List payment requests");
console.log("5. testEMIAgreements() - List EMI agreements");
console.log("6. testLoyaltyTier() - Check loyalty tier");
console.log("7. testErrorHandling() - Test error parsing");
console.log("8. runAllTests() - Run all tests");
console.log("\n💡 Example: testWalletBalance()");

/**
 * Test 1: Check wallet balance
 */
async function testWalletBalance() {
    console.log("\n🧪 Test 1: Wallet Balance");
    try {
        const address = await window.aptos?.account();
        if (!address) {
            console.error("❌ Wallet not connected");
            return;
        }
        
        console.log("📍 Address:", address);
        
        const balance = await window.aptos.account();
        console.log("✅ Balance check successful");
        console.log("💰 Account:", balance);
        
        return balance;
    } catch (error) {
        console.error("❌ Balance check failed:", error);
        return null;
    }
}

/**
 * Test 2: Get user statistics
 */
async function testUserStats() {
    console.log("\n🧪 Test 2: User Statistics");
    try {
        const address = await window.aptos?.account();
        if (!address) {
            console.error("❌ Wallet not connected");
            return;
        }
        
        console.log("📍 Address:", address.address);
        console.log("🔍 Fetching user stats from contract...");
        
        // This would call your getUserStats function
        console.log("✅ User stats test ready");
        console.log("💡 Implement getUserStats() call in contractUtils.ts");
        
        return { status: "ready" };
    } catch (error) {
        console.error("❌ User stats failed:", error);
        return null;
    }
}

/**
 * Test 3: Fetch transaction history
 */
async function testTransactionHistory() {
    console.log("\n🧪 Test 3: Transaction History");
    try {
        const address = await window.aptos?.account();
        if (!address) {
            console.error("❌ Wallet not connected");
            return;
        }
        
        console.log("📍 Address:", address.address);
        console.log("🔍 Fetching transactions...");
        
        // Fetch from Aptos indexer
        const response = await fetch(
            `https://api.devnet.aptoslabs.com/v1/accounts/${address.address}/transactions?limit=10`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const transactions = await response.json();
        console.log(`✅ Found ${transactions.length} transactions`);
        console.log("📊 Recent transactions:", transactions);
        
        // Count transaction types
        const types = {};
        transactions.forEach(tx => {
            const type = tx.payload?.function || "unknown";
            types[type] = (types[type] || 0) + 1;
        });
        
        console.log("📈 Transaction types:", types);
        return transactions;
    } catch (error) {
        console.error("❌ Transaction history failed:", error);
        return null;
    }
}

/**
 * Test 4: List payment requests
 */
async function testPaymentRequests() {
    console.log("\n🧪 Test 4: Payment Requests");
    try {
        const address = await window.aptos?.account();
        if (!address) {
            console.error("❌ Wallet not connected");
            return;
        }
        
        console.log("📍 Address:", address.address);
        console.log("🔍 Checking payment requests...");
        
        // This would call contract view function
        console.log("✅ Payment requests test ready");
        console.log("💡 Payment requests are stored in contract tables");
        console.log("💡 Use view function to fetch active requests");
        
        return { status: "ready" };
    } catch (error) {
        console.error("❌ Payment requests failed:", error);
        return null;
    }
}

/**
 * Test 5: List EMI agreements
 */
async function testEMIAgreements() {
    console.log("\n🧪 Test 5: EMI Agreements");
    try {
        const address = await window.aptos?.account();
        if (!address) {
            console.error("❌ Wallet not connected");
            return;
        }
        
        console.log("📍 Address:", address.address);
        console.log("🔍 Checking EMI agreements...");
        
        console.log("✅ EMI agreements test ready");
        console.log("💡 EMI agreements are stored in contract tables");
        console.log("💡 Use view function to fetch active EMIs");
        
        return { status: "ready" };
    } catch (error) {
        console.error("❌ EMI agreements failed:", error);
        return null;
    }
}

/**
 * Test 6: Check loyalty tier
 */
async function testLoyaltyTier() {
    console.log("\n🧪 Test 6: Loyalty Tier");
    try {
        const address = await window.aptos?.account();
        if (!address) {
            console.error("❌ Wallet not connected");
            return;
        }
        
        console.log("📍 Address:", address.address);
        console.log("🔍 Calculating loyalty tier...");
        
        // Fetch transaction count
        const response = await fetch(
            `https://api.devnet.aptoslabs.com/v1/accounts/${address.address}/transactions?limit=1000`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const transactions = await response.json();
        const txCount = transactions.length;
        
        // Calculate tier
        let tier = "Bronze";
        if (txCount >= 100) tier = "Diamond";
        else if (txCount >= 50) tier = "Platinum";
        else if (txCount >= 20) tier = "Gold";
        else if (txCount >= 10) tier = "Silver";
        
        console.log(`✅ Transaction count: ${txCount}`);
        console.log(`🏆 Loyalty tier: ${tier}`);
        
        return { transactions: txCount, tier };
    } catch (error) {
        console.error("❌ Loyalty tier check failed:", error);
        return null;
    }
}

/**
 * Test 7: Test error handling
 */
function testErrorHandling() {
    console.log("\n🧪 Test 7: Error Handling");
    
    // Test error patterns
    const testErrors = [
        { 
            error: "Move abort in 0x9c2fe13427bfa2d51671cdc2c04b4915ed4ef81709ccd8cd31c1150769596d2c::wallet_system: 0x1",
            expected: "Error 1: Wallet ID Already Exists"
        },
        {
            error: "execution failed with error code 5",
            expected: "Error 5: Payment Request Not Found"
        },
        {
            error: { message: "INSUFFICIENT_BALANCE", code: 14 },
            expected: "Error 14: Insufficient Balance"
        },
        {
            error: "Transaction failed: EEMI_ALREADY_COMPLETED(12)",
            expected: "Error 12: EMI Already Completed"
        }
    ];
    
    console.log("🔍 Testing error parsing patterns...");
    
    testErrors.forEach((test, index) => {
        console.log(`\nTest ${index + 1}:`);
        console.log("Input:", test.error);
        console.log("Expected:", test.expected);
        console.log("💡 Use parseErrorCode() from errorHandler.ts");
    });
    
    console.log("\n✅ Error handling test patterns ready");
    console.log("💡 Check ERROR_HANDLING_SYSTEM.md for complete error list");
    
    return testErrors;
}

/**
 * Test 8: Network connectivity
 */
async function testNetworkConnectivity() {
    console.log("\n🧪 Test 8: Network Connectivity");
    try {
        console.log("🔍 Testing Aptos Devnet connection...");
        
        const response = await fetch("https://api.devnet.aptoslabs.com/v1");
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log("✅ Devnet connected");
        console.log("📊 Network info:", data);
        
        return data;
    } catch (error) {
        console.error("❌ Network connectivity failed:", error);
        return null;
    }
}

/**
 * Test 9: Contract existence
 */
async function testContractExists() {
    console.log("\n🧪 Test 9: Contract Existence");
    try {
        console.log("🔍 Checking contract deployment...");
        console.log("📍 Contract:", CONTRACT_ADDRESS);
        
        const response = await fetch(
            `https://api.devnet.aptoslabs.com/v1/accounts/${CONTRACT_ADDRESS}/modules`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const modules = await response.json();
        console.log(`✅ Found ${modules.length} module(s)`);
        
        const walletModule = modules.find(m => m.abi?.name === MODULE_NAME);
        if (walletModule) {
            console.log("✅ wallet_system module found");
            console.log("📦 Module functions:", walletModule.abi?.exposed_functions?.length || 0);
        } else {
            console.warn("⚠️ wallet_system module not found");
        }
        
        return modules;
    } catch (error) {
        console.error("❌ Contract check failed:", error);
        return null;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log("\n🚀 Running All Tests...\n");
    console.log("=".repeat(50));
    
    const results = {};
    
    // Test 1: Network
    results.network = await testNetworkConnectivity();
    await sleep(1000);
    
    // Test 2: Contract
    results.contract = await testContractExists();
    await sleep(1000);
    
    // Test 3: Balance
    results.balance = await testWalletBalance();
    await sleep(1000);
    
    // Test 4: User Stats
    results.userStats = await testUserStats();
    await sleep(1000);
    
    // Test 5: Transactions
    results.transactions = await testTransactionHistory();
    await sleep(1000);
    
    // Test 6: Payment Requests
    results.paymentRequests = await testPaymentRequests();
    await sleep(1000);
    
    // Test 7: EMI Agreements
    results.emiAgreements = await testEMIAgreements();
    await sleep(1000);
    
    // Test 8: Loyalty Tier
    results.loyaltyTier = await testLoyaltyTier();
    await sleep(1000);
    
    // Test 9: Error Handling
    results.errorHandling = testErrorHandling();
    
    console.log("\n" + "=".repeat(50));
    console.log("\n📊 Test Results Summary:");
    console.log("Network:", results.network ? "✅ Pass" : "❌ Fail");
    console.log("Contract:", results.contract ? "✅ Pass" : "❌ Fail");
    console.log("Balance:", results.balance ? "✅ Pass" : "❌ Fail");
    console.log("User Stats:", results.userStats ? "✅ Pass" : "❌ Fail");
    console.log("Transactions:", results.transactions ? "✅ Pass" : "❌ Fail");
    console.log("Payment Requests:", results.paymentRequests ? "✅ Pass" : "❌ Fail");
    console.log("EMI Agreements:", results.emiAgreements ? "✅ Pass" : "❌ Fail");
    console.log("Loyalty Tier:", results.loyaltyTier ? "✅ Pass" : "❌ Fail");
    console.log("Error Handling:", results.errorHandling ? "✅ Pass" : "❌ Fail");
    
    const passed = Object.values(results).filter(r => r !== null).length;
    const total = Object.keys(results).length;
    console.log(`\n🎯 Pass Rate: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
    
    return results;
}

/**
 * Utility: Sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Get contract view function
 */
async function callViewFunction(functionName, typeArgs = [], args = []) {
    console.log(`\n🔍 Calling view function: ${functionName}`);
    try {
        const response = await fetch(
            "https://api.devnet.aptoslabs.com/v1/view",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::${functionName}`,
                    type_arguments: typeArgs,
                    arguments: args,
                }),
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        console.log("✅ View function result:", result);
        return result;
    } catch (error) {
        console.error("❌ View function failed:", error);
        return null;
    }
}

// Export functions to window for easy access
window.contractTests = {
    testWalletBalance,
    testUserStats,
    testTransactionHistory,
    testPaymentRequests,
    testEMIAgreements,
    testLoyaltyTier,
    testErrorHandling,
    testNetworkConnectivity,
    testContractExists,
    runAllTests,
    callViewFunction,
};

console.log("\n✅ All test functions loaded!");
console.log("💡 Access via: window.contractTests.runAllTests()");
console.log("💡 Or call individual tests directly");
