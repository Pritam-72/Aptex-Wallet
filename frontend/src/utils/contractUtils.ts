/**
 * Smart Contract Integration Utilities
 * wallet_system.move contract interaction layer
 */

import {
  Account,
  Aptos,
  AptosConfig,
  Network,
  Ed25519PrivateKey,
  AccountAddress,
  InputViewFunctionData,
  InputEntryFunctionData,
} from "@aptos-labs/ts-sdk";

// Initialize Aptos client for devnet
const config = new AptosConfig({ network: Network.DEVNET });
export const aptos = new Aptos(config);

// Contract configuration
export const CONTRACT_ADDRESS = "0x9c2fe13427bfa2d51671cdc2c04b4915ed4ef81709ccd8cd31c1150769596d2c";
export const MODULE_NAME = "wallet_system";

// Full module identifier
const MODULE_ID = `${CONTRACT_ADDRESS}::${MODULE_NAME}`;

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentRequest {
  id: string;
  from_address: string;
  to_address: string;
  amount: string;
  description: string;
  created_at: string;
  status: number; // 0: pending, 1: paid, 2: rejected
}

export interface SplitEntry {
  participant: string;
  amount: string;
}

export interface SplitBill {
  id: string;
  creator: string;
  total_amount: string;
  description: string;
  splits: SplitEntry[];
  created_at: string;
  paid_participants: string[];
}

export interface EmiAgreement {
  id: string;
  user: string;
  company: string;
  total_amount: string;
  monthly_amount: string;
  months: number;
  months_paid: number;
  description: string;
  created_at: string;
  next_payment_due: string;
  status: number; // 0: active, 1: completed, 2: defaulted
  auto_pay_approved: boolean;
  auto_pay_balance: string;
}

export interface UserStats {
  transaction_count: string;
  total_amount_transacted: string;
}

export interface LoyaltyNFTMetadata {
  tier: number; // 0: bronze, 1: silver, 2: gold, 3: platinum, 4: diamond
  tier_name: string;
  transaction_count: string;
  minted_at: string;
  image_url: string;
  attributes: string[];
}

export interface CouponNFTMetadata {
  template_id: string;
  company: string;
  title: string;
  description: string;
  discount_percentage: string;
  max_discount_amount: string;
  expiry_date: string;
  image_url: string;
  is_redeemed: boolean;
}

export interface CouponTemplate {
  id: string;
  company: string;
  title: string;
  description: string;
  discount_percentage: string;
  max_discount_amount: string;
  valid_days: string;
  image_url: string;
  total_minted: string;
  is_active: boolean;
}

// Transaction result type
export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  vm_status?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Account object from private key string
 */
export const getAccountFromPrivateKey = (privateKeyHex: string): Account => {
  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  return Account.fromPrivateKey({ privateKey });
};

/**
 * Estimate gas for a transaction
 */
export const estimateGas = async (
  senderAddress: string,
  payload: InputEntryFunctionData
): Promise<{ gasUnitPrice: string; maxGasAmount: string; estimatedCost: string }> => {
  try {
    // Return default gas estimates for now
    // TODO: Implement proper gas simulation when SDK supports it
    return {
      gasUnitPrice: "100",
      maxGasAmount: "2000",
      estimatedCost: "0.0002",
    };
  } catch (error) {
    console.error("Error estimating gas:", error);
    return {
      gasUnitPrice: "100",
      maxGasAmount: "2000",
      estimatedCost: "0.0002",
    };
  }
};

/**
 * Check if user has enough balance for transaction + gas
 */
export const checkSufficientBalance = async (
  address: string,
  amountAPT: number,
  gasEstimateAPT: number
): Promise<{ sufficient: boolean; currentBalance: number; required: number }> => {
  try {
    const resources = await aptos.getAccountResources({ accountAddress: address });
    const accountResource = resources.find(
      (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    );

    if (accountResource) {
      const balance = (accountResource.data as { coin: { value: string } }).coin.value;
      const balanceAPT = parseInt(balance) / 100000000;
      const required = amountAPT + gasEstimateAPT;

      return {
        sufficient: balanceAPT >= required,
        currentBalance: balanceAPT,
        required,
      };
    }

    return { sufficient: false, currentBalance: 0, required: amountAPT + gasEstimateAPT };
  } catch (error) {
    console.error("Error checking balance:", error);
    return { sufficient: false, currentBalance: 0, required: amountAPT + gasEstimateAPT };
  }
};

// ============================================================================
// Entry Functions (State-changing operations)
// ============================================================================

/**
 * Register a wallet ID for the user
 */
export const registerWalletId = async (
  account: Account,
  walletId: string
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::register_wallet_id`,
        functionArguments: [CONTRACT_ADDRESS, walletId],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error registering wallet ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to register wallet ID",
    };
  }
};

/**
 * Register a UPI ID for the user
 */
export const registerUpiId = async (
  account: Account,
  upiId: string
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::register_upi_id`,
        functionArguments: [CONTRACT_ADDRESS, upiId],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error registering UPI ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to register UPI ID",
    };
  }
};

/**
 * Create a payment request
 */
export const createPaymentRequest = async (
  account: Account,
  toAddress: string,
  amountOctas: string,
  description: string
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::create_payment_request`,
        functionArguments: [CONTRACT_ADDRESS, toAddress, amountOctas, description],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error creating payment request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment request",
    };
  }
};

/**
 * Pay a payment request
 */
export const payRequest = async (
  account: Account,
  requestId: number
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::pay_request`,
        functionArguments: [CONTRACT_ADDRESS, requestId.toString()],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error paying request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to pay request",
    };
  }
};

/**
 * Reject a payment request
 */
export const rejectRequest = async (
  account: Account,
  requestId: number
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::reject_request`,
        functionArguments: [CONTRACT_ADDRESS, requestId.toString()],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error rejecting request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject request",
    };
  }
};

/**
 * Create a split bill with custom amounts
 */
export const createSplitBill = async (
  account: Account,
  description: string,
  participants: string[],
  participantAmounts: string[] // amounts in octas
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::create_split_bill`,
        functionArguments: [CONTRACT_ADDRESS, description, participants, participantAmounts],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error creating split bill:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create split bill",
    };
  }
};

/**
 * Create EMI agreement (Company function)
 */
export const createEmiAgreement = async (
  account: Account,
  userAddress: string,
  totalAmountOctas: string,
  monthlyAmountOctas: string,
  months: number,
  firstPaymentDueTimestamp: string,
  description: string
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::create_emi_agreement`,
        functionArguments: [
          CONTRACT_ADDRESS,
          userAddress,
          totalAmountOctas,
          monthlyAmountOctas,
          months.toString(),
          firstPaymentDueTimestamp,
          description,
        ],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error creating EMI agreement:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create EMI agreement",
    };
  }
};

/**
 * Approve auto-pay for EMI agreement (User function)
 */
export const approveEmiAutoPay = async (
  account: Account,
  companyAddress: string,
  emiId: number,
  depositAmountOctas: string
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::approve_emi_auto_pay`,
        functionArguments: [
          CONTRACT_ADDRESS,
          companyAddress,
          emiId.toString(),
          depositAmountOctas,
        ],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error approving EMI auto-pay:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve EMI auto-pay",
    };
  }
};

/**
 * Add funds to EMI auto-pay account (User function)
 */
export const addEmiFunds = async (
  account: Account,
  companyAddress: string,
  emiId: number,
  amountOctas: string
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::add_emi_funds`,
        functionArguments: [CONTRACT_ADDRESS, companyAddress, emiId.toString(), amountOctas],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error adding EMI funds:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add EMI funds",
    };
  }
};

/**
 * Collect EMI payment (Company function)
 */
export const collectEmiPayment = async (
  account: Account,
  userAddress: string,
  emiId: number
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::collect_emi_payment`,
        functionArguments: [CONTRACT_ADDRESS, userAddress, emiId.toString()],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error collecting EMI payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to collect EMI payment",
    };
  }
};

/**
 * Create coupon template (Company function)
 */
export const createCouponTemplate = async (
  account: Account,
  title: string,
  description: string,
  discountPercentage: number,
  maxDiscountAmountOctas: string,
  validDays: number,
  imageUrl: string
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::create_coupon_template`,
        functionArguments: [
          CONTRACT_ADDRESS,
          title,
          description,
          discountPercentage.toString(),
          maxDiscountAmountOctas,
          validDays.toString(),
          imageUrl,
        ],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error creating coupon template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create coupon template",
    };
  }
};

/**
 * Deactivate coupon template (Company function)
 */
export const deactivateCouponTemplate = async (
  account: Account,
  templateId: number
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::deactivate_coupon_template`,
        functionArguments: [CONTRACT_ADDRESS, templateId.toString()],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error deactivating coupon template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deactivate coupon template",
    };
  }
};

/**
 * Mint coupon NFT to specific user (Company function)
 */
export const mintCouponNftToUser = async (
  account: Account,
  userAddress: string,
  templateId: number
): Promise<TransactionResult> => {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${MODULE_ID}::mint_coupon_nft_to_user`,
        functionArguments: [CONTRACT_ADDRESS, userAddress, templateId.toString()],
      },
    });

    const pendingTxn = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: pendingTxn.hash,
    });

    return {
      success: response.success,
      hash: pendingTxn.hash,
      vm_status: response.vm_status,
    };
  } catch (error) {
    console.error("Error minting coupon NFT:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mint coupon NFT",
    };
  }
};

// ============================================================================
// View Functions (Read-only operations)
// ============================================================================

/**
 * Get address by wallet ID
 */
export const getAddressByWalletId = async (walletId: string): Promise<string | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_address_by_wallet_id`,
        functionArguments: [CONTRACT_ADDRESS, walletId],
      },
    });

    // Result is Option<address>, check if vec is not empty
    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        return option.vec[0];
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting address by wallet ID:", error);
    return null;
  }
};

/**
 * Get address by UPI ID
 */
export const getAddressByUpiId = async (upiId: string): Promise<string | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_address_by_upi_id`,
        functionArguments: [CONTRACT_ADDRESS, upiId],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        return option.vec[0];
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting address by UPI ID:", error);
    return null;
  }
};

/**
 * Get wallet ID by address
 */
export const getWalletIdByAddress = async (userAddress: string): Promise<string | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_wallet_id_by_address`,
        functionArguments: [CONTRACT_ADDRESS, userAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        return option.vec[0];
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting wallet ID by address:", error);
    return null;
  }
};

/**
 * Get UPI ID by address
 */
export const getUpiIdByAddress = async (userAddress: string): Promise<string | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_upi_id_by_address`,
        functionArguments: [CONTRACT_ADDRESS, userAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        return option.vec[0];
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting UPI ID by address:", error);
    return null;
  }
};

/**
 * Get payment request details
 */
export const getPaymentRequest = async (requestId: number): Promise<PaymentRequest | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_payment_request`,
        functionArguments: [CONTRACT_ADDRESS, requestId.toString()],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        const data = option.vec[0];
        return {
          id: requestId.toString(),
          from_address: data.from_address,
          to_address: data.to_address,
          amount: data.amount,
          description: data.description,
          created_at: data.created_at,
          status: data.status,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting payment request:", error);
    return null;
  }
};

/**
 * Get user's received payment requests
 */
export const getUserPaymentRequests = async (userAddress: string): Promise<number[]> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_user_payment_requests`,
        functionArguments: [CONTRACT_ADDRESS, userAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      return result[0] as number[];
    }
    return [];
  } catch (error) {
    console.error("Error getting user payment requests:", error);
    return [];
  }
};

/**
 * Get user's sent payment requests
 */
export const getUserSentRequests = async (userAddress: string): Promise<number[]> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_user_sent_requests`,
        functionArguments: [CONTRACT_ADDRESS, userAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      return result[0] as number[];
    }
    return [];
  } catch (error) {
    console.error("Error getting user sent requests:", error);
    return [];
  }
};

/**
 * Get split bill details
 */
export const getSplitBill = async (splitId: number): Promise<SplitBill | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_split_bill`,
        functionArguments: [CONTRACT_ADDRESS, splitId.toString()],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        const data = option.vec[0];
        return {
          id: splitId.toString(),
          creator: data.creator,
          total_amount: data.total_amount,
          description: data.description,
          splits: data.splits,
          created_at: data.created_at,
          paid_participants: data.paid_participants,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting split bill:", error);
    return null;
  }
};

/**
 * Get user's split bills
 */
export const getUserSplitBills = async (userAddress: string): Promise<number[]> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_user_split_bills`,
        functionArguments: [CONTRACT_ADDRESS, userAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      return result[0] as number[];
    }
    return [];
  } catch (error) {
    console.error("Error getting user split bills:", error);
    return [];
  }
};

/**
 * Get EMI agreement details
 */
export const getEmiAgreement = async (emiId: number): Promise<EmiAgreement | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_emi_agreement`,
        functionArguments: [CONTRACT_ADDRESS, emiId.toString()],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        const data = option.vec[0];
        return {
          id: emiId.toString(),
          user: data.user,
          company: data.company,
          total_amount: data.total_amount,
          monthly_amount: data.monthly_amount,
          months: data.months,
          months_paid: data.months_paid,
          description: data.description,
          created_at: data.created_at,
          next_payment_due: data.next_payment_due,
          status: data.status,
          auto_pay_approved: data.auto_pay_approved,
          auto_pay_balance: data.auto_pay_balance,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting EMI agreement:", error);
    return null;
  }
};

/**
 * Get user's EMI agreements (EMIs they are paying)
 */
export const getUserEmis = async (userAddress: string): Promise<number[]> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_user_emis`,
        functionArguments: [CONTRACT_ADDRESS, userAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      return result[0] as number[];
    }
    return [];
  } catch (error) {
    console.error("Error getting user EMIs:", error);
    return [];
  }
};

/**
 * Get company's EMI agreements (EMIs they are receiving)
 */
export const getCompanyEmis = async (companyAddress: string): Promise<number[]> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_company_emis`,
        functionArguments: [CONTRACT_ADDRESS, companyAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      return result[0] as number[];
    }
    return [];
  } catch (error) {
    console.error("Error getting company EMIs:", error);
    return [];
  }
};

/**
 * Get user statistics for loyalty tracking
 */
export const getUserStats = async (userAddress: string): Promise<UserStats | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_user_stats`,
        functionArguments: [CONTRACT_ADDRESS, userAddress],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        const data = option.vec[0];
        return {
          transaction_count: data.transaction_count,
          total_amount_transacted: data.total_amount_transacted,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting user stats:", error);
    return null;
  }
};

/**
 * Get coupon template details
 */
export const getCouponTemplate = async (templateId: number): Promise<CouponTemplate | null> => {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ID}::get_coupon_template`,
        functionArguments: [CONTRACT_ADDRESS, templateId.toString()],
      },
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const option = result[0] as Record<string, unknown>;
      if (option.vec && Array.isArray(option.vec) && option.vec.length > 0) {
        const data = option.vec[0];
        return {
          id: templateId.toString(),
          company: data.company,
          title: data.title,
          description: data.description,
          discount_percentage: data.discount_percentage,
          max_discount_amount: data.max_discount_amount,
          valid_days: data.valid_days,
          image_url: data.image_url,
          total_minted: data.total_minted,
          is_active: data.is_active,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting coupon template:", error);
    return null;
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert APT to Octas (1 APT = 100,000,000 octas)
 */
export const aptToOctas = (apt: number): string => {
  return Math.floor(apt * 100000000).toString();
};

/**
 * Convert Octas to APT
 */
export const octasToApt = (octas: string): number => {
  return parseInt(octas) / 100000000;
};

/**
 * Parse contract error message
 */
export const parseContractError = (error: string): string => {
  const errorMap: { [key: string]: string } = {
    "E_WALLET_ID_ALREADY_EXISTS": "This wallet ID is already registered",
    "E_UPI_ID_ALREADY_EXISTS": "This UPI ID is already registered",
    "E_WALLET_ID_NOT_FOUND": "Wallet ID not found",
    "E_UPI_ID_NOT_FOUND": "UPI ID not found",
    "E_PAYMENT_REQUEST_NOT_FOUND": "Payment request not found",
    "E_SPLIT_BILL_NOT_FOUND": "Split bill not found",
    "E_NOT_AUTHORIZED": "You are not authorized for this action",
    "E_INVALID_AMOUNT": "Invalid amount",
    "E_WALLET_NOT_INITIALIZED": "Wallet not initialized",
    "E_EMI_NOT_FOUND": "EMI agreement not found",
    "E_EMI_ALREADY_EXISTS": "EMI agreement already exists",
    "E_EMI_COMPLETED": "EMI already completed",
    "E_EMI_PAYMENT_TOO_EARLY": "EMI payment not due yet",
    "E_INSUFFICIENT_BALANCE": "Insufficient balance",
    "E_INVALID_SPLIT_DATA": "Invalid split bill data",
    "E_EMI_NOT_DUE": "EMI payment not due yet",
    "E_LOYALTY_NFT_ALREADY_EXISTS": "Loyalty NFT already minted for this tier",
    "E_COUPON_NFT_NOT_FOUND": "Coupon NFT not found",
    "E_COUPON_NFT_EXPIRED": "Coupon NFT has expired",
    "E_AUTO_PAY_NOT_APPROVED": "Auto-pay not approved for this EMI",
  };

  for (const [code, message] of Object.entries(errorMap)) {
    if (error.includes(code)) {
      return message;
    }
  }

  return error;
};

/**
 * Resolve recipient identifier (address, wallet ID, or UPI ID)
 * Returns the wallet address or null if not found
 */
export const resolveRecipient = async (identifier: string): Promise<{
  address: string | null;
  type: 'address' | 'walletId' | 'upiId';
}> => {
  // Check if it's a valid address (starts with 0x and has correct length)
  if (identifier.startsWith('0x') && identifier.length === 66) {
    return { address: identifier, type: 'address' };
  }

  // Check if it's a UPI ID (contains @)
  if (identifier.includes('@')) {
    const address = await getAddressByUpiId(identifier);
    return { address, type: 'upiId' };
  }

  // Assume it's a wallet ID
  const address = await getAddressByWalletId(identifier);
  return { address, type: 'walletId' };
};
