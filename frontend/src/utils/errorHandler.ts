/**
 * Smart Contract Error Handler
 * Provides user-friendly error messages for all wallet_system.move error codes
 */

// Error code constants matching wallet_system.move
export const CONTRACT_ERROR_CODES = {
  E_WALLET_ID_ALREADY_EXISTS: 1,
  E_UPI_ID_ALREADY_EXISTS: 2,
  E_WALLET_ID_NOT_FOUND: 3,
  E_UPI_ID_NOT_FOUND: 4,
  E_PAYMENT_REQUEST_NOT_FOUND: 5,
  E_SPLIT_BILL_NOT_FOUND: 6,
  E_NOT_AUTHORIZED: 7,
  E_INVALID_AMOUNT: 8,
  E_WALLET_NOT_INITIALIZED: 9,
  E_EMI_NOT_FOUND: 10,
  E_EMI_ALREADY_EXISTS: 11,
  E_EMI_COMPLETED: 12,
  E_EMI_PAYMENT_TOO_EARLY: 13,
  E_INSUFFICIENT_BALANCE: 14,
  E_INVALID_SPLIT_DATA: 15,
  E_EMI_NOT_DUE: 16,
  E_LOYALTY_NFT_ALREADY_EXISTS: 17,
  E_COUPON_NFT_NOT_FOUND: 18,
  E_COUPON_NFT_EXPIRED: 19,
  E_AUTO_PAY_NOT_APPROVED: 20,
} as const;

// Error severity levels
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ContractError {
  code: number;
  title: string;
  message: string;
  severity: ErrorSeverity;
  suggestion?: string;
  action?: string;
}

// User-friendly error messages for each error code
const ERROR_MESSAGES: Record<number, ContractError> = {
  [CONTRACT_ERROR_CODES.E_WALLET_ID_ALREADY_EXISTS]: {
    code: 1,
    title: 'Wallet ID Already Taken',
    message: 'This wallet ID is already registered by another user. Please choose a different wallet ID.',
    severity: 'error',
    suggestion: 'Try adding numbers or special characters to make your wallet ID unique.',
    action: 'Choose Different ID',
  },
  [CONTRACT_ERROR_CODES.E_UPI_ID_ALREADY_EXISTS]: {
    code: 2,
    title: 'UPI ID Already Registered',
    message: 'This UPI ID is already linked to another wallet. Each UPI ID can only be registered once.',
    severity: 'error',
    suggestion: 'Please use a different UPI ID or contact support if you believe this is an error.',
    action: 'Use Different UPI ID',
  },
  [CONTRACT_ERROR_CODES.E_WALLET_ID_NOT_FOUND]: {
    code: 3,
    title: 'Wallet ID Not Found',
    message: 'The wallet ID you entered does not exist in our system.',
    severity: 'error',
    suggestion: 'Please check the wallet ID for typos or ask the recipient to verify their ID.',
    action: 'Verify Wallet ID',
  },
  [CONTRACT_ERROR_CODES.E_UPI_ID_NOT_FOUND]: {
    code: 4,
    title: 'UPI ID Not Found',
    message: 'This UPI ID is not registered in the system.',
    severity: 'error',
    suggestion: 'Make sure the UPI ID is correct or ask the recipient to register their UPI ID first.',
    action: 'Check UPI ID',
  },
  [CONTRACT_ERROR_CODES.E_PAYMENT_REQUEST_NOT_FOUND]: {
    code: 5,
    title: 'Payment Request Not Found',
    message: 'The payment request you are trying to access does not exist or has been deleted.',
    severity: 'error',
    suggestion: 'The request may have already been paid or cancelled. Please refresh the page.',
    action: 'Refresh Page',
  },
  [CONTRACT_ERROR_CODES.E_SPLIT_BILL_NOT_FOUND]: {
    code: 6,
    title: 'Split Bill Not Found',
    message: 'The split bill you are looking for could not be found.',
    severity: 'error',
    suggestion: 'The split bill may have been cancelled or all payments may have been completed.',
    action: 'View Active Bills',
  },
  [CONTRACT_ERROR_CODES.E_NOT_AUTHORIZED]: {
    code: 7,
    title: 'Not Authorized',
    message: 'You do not have permission to perform this action.',
    severity: 'error',
    suggestion: 'Only the owner or authorized user can perform this operation.',
    action: 'Contact Owner',
  },
  [CONTRACT_ERROR_CODES.E_INVALID_AMOUNT]: {
    code: 8,
    title: 'Invalid Amount',
    message: 'The amount you entered is invalid. Amount must be greater than zero.',
    severity: 'error',
    suggestion: 'Please enter a valid positive amount greater than 0.',
    action: 'Enter Valid Amount',
  },
  [CONTRACT_ERROR_CODES.E_WALLET_NOT_INITIALIZED]: {
    code: 9,
    title: 'Wallet Not Initialized',
    message: 'Your wallet has not been properly initialized in the smart contract.',
    severity: 'error',
    suggestion: 'Please complete the wallet setup process or contact support.',
    action: 'Initialize Wallet',
  },
  [CONTRACT_ERROR_CODES.E_EMI_NOT_FOUND]: {
    code: 10,
    title: 'EMI Agreement Not Found',
    message: 'The EMI agreement you are trying to access does not exist.',
    severity: 'error',
    suggestion: 'Please verify the EMI ID or check if the agreement has been completed.',
    action: 'View EMI List',
  },
  [CONTRACT_ERROR_CODES.E_EMI_ALREADY_EXISTS]: {
    code: 11,
    title: 'EMI Agreement Already Exists',
    message: 'An EMI agreement with this ID already exists.',
    severity: 'error',
    suggestion: 'Please use a different EMI ID or check your existing agreements.',
    action: 'View Existing EMIs',
  },
  [CONTRACT_ERROR_CODES.E_EMI_COMPLETED]: {
    code: 12,
    title: 'EMI Already Completed',
    message: 'This EMI agreement has already been fully paid.',
    severity: 'info',
    suggestion: 'All installments have been paid. No further payments are required.',
    action: 'View Payment History',
  },
  [CONTRACT_ERROR_CODES.E_EMI_PAYMENT_TOO_EARLY]: {
    code: 13,
    title: 'EMI Payment Too Early',
    message: 'You cannot pay the next EMI installment yet. Please wait until the due date.',
    severity: 'warning',
    suggestion: 'EMI payments can only be made on or after the monthly due date.',
    action: 'View Due Date',
  },
  [CONTRACT_ERROR_CODES.E_INSUFFICIENT_BALANCE]: {
    code: 14,
    title: 'Insufficient Balance',
    message: 'Your wallet balance is not sufficient to complete this transaction.',
    severity: 'error',
    suggestion: 'Please add funds to your wallet before attempting this transaction.',
    action: 'Add Funds',
  },
  [CONTRACT_ERROR_CODES.E_INVALID_SPLIT_DATA]: {
    code: 15,
    title: 'Invalid Split Bill Data',
    message: 'The split bill data is invalid. Please check participant addresses and amounts.',
    severity: 'error',
    suggestion: 'Make sure all participant addresses are valid and amounts add up correctly.',
    action: 'Review Split Data',
  },
  [CONTRACT_ERROR_CODES.E_EMI_NOT_DUE]: {
    code: 16,
    title: 'EMI Payment Not Due Yet',
    message: 'The next EMI installment is not due yet.',
    severity: 'warning',
    suggestion: 'You can pay the EMI on or after the monthly due date.',
    action: 'Check Due Date',
  },
  [CONTRACT_ERROR_CODES.E_LOYALTY_NFT_ALREADY_EXISTS]: {
    code: 17,
    title: 'Loyalty NFT Already Minted',
    message: 'You already have a loyalty NFT for this tier.',
    severity: 'info',
    suggestion: 'Continue making transactions to unlock higher tier loyalty NFTs.',
    action: 'View My NFTs',
  },
  [CONTRACT_ERROR_CODES.E_COUPON_NFT_NOT_FOUND]: {
    code: 18,
    title: 'Coupon Not Found',
    message: 'The coupon you are trying to use could not be found.',
    severity: 'error',
    suggestion: 'The coupon may have been deleted or is no longer available.',
    action: 'Browse Coupons',
  },
  [CONTRACT_ERROR_CODES.E_COUPON_NFT_EXPIRED]: {
    code: 19,
    title: 'Coupon Expired',
    message: 'This coupon has expired and can no longer be used.',
    severity: 'warning',
    suggestion: 'Please check for other available coupons in the marketplace.',
    action: 'View Active Coupons',
  },
  [CONTRACT_ERROR_CODES.E_AUTO_PAY_NOT_APPROVED]: {
    code: 20,
    title: 'Auto-Pay Not Approved',
    message: 'Auto-pay has not been approved for this transaction.',
    severity: 'error',
    suggestion: 'Please approve auto-pay in your settings or make a manual payment.',
    action: 'Enable Auto-Pay',
  },
};

/**
 * Parse error code from contract error message
 */
export const parseErrorCode = (error: unknown): number | null => {
  if (!error) return null;

  const errorStr = String(error);
  
  // Try to extract error code from common patterns
  // Pattern 1: "Move abort in <address>::<module>: <code>"
  const abortMatch = errorStr.match(/Move abort.*?:\s*(\d+)/i);
  if (abortMatch) {
    return parseInt(abortMatch[1], 10);
  }

  // Pattern 2: "ABORTED: <code>"
  const abortedMatch = errorStr.match(/ABORTED:\s*(\d+)/i);
  if (abortedMatch) {
    return parseInt(abortedMatch[1], 10);
  }

  // Pattern 3: "error code: <code>"
  const errorCodeMatch = errorStr.match(/error\s*code:\s*(\d+)/i);
  if (errorCodeMatch) {
    return parseInt(errorCodeMatch[1], 10);
  }

  // Pattern 4: Direct number in error
  const numberMatch = errorStr.match(/\b([1-9]|1\d|20)\b/);
  if (numberMatch) {
    const code = parseInt(numberMatch[1], 10);
    if (code >= 1 && code <= 20) {
      return code;
    }
  }

  return null;
};

/**
 * Get user-friendly error details from error code
 */
export const getErrorDetails = (errorCode: number): ContractError | null => {
  return ERROR_MESSAGES[errorCode] || null;
};

/**
 * Get user-friendly error message from any error
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';

  const errorCode = parseErrorCode(error);
  if (errorCode) {
    const details = getErrorDetails(errorCode);
    if (details) {
      return details.message;
    }
  }

  // Fallback to error string
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

/**
 * Get full error details from any error
 */
export const parseContractError = (error: unknown): ContractError | null => {
  const errorCode = parseErrorCode(error);
  if (errorCode) {
    return getErrorDetails(errorCode);
  }

  // Return generic error for unknown errors
  if (error) {
    return {
      code: 0,
      title: 'Transaction Failed',
      message: error instanceof Error ? error.message : String(error),
      severity: 'error',
      suggestion: 'Please try again or contact support if the problem persists.',
      action: 'Retry',
    };
  }

  return null;
};

/**
 * Check if error is a specific contract error
 */
export const isContractError = (error: unknown, errorCode: number): boolean => {
  const parsedCode = parseErrorCode(error);
  return parsedCode === errorCode;
};

/**
 * Format error for logging
 */
export const formatErrorForLog = (error: unknown, context?: string): string => {
  const errorCode = parseErrorCode(error);
  const contextStr = context ? `[${context}] ` : '';
  
  if (errorCode) {
    const details = getErrorDetails(errorCode);
    if (details) {
      return `${contextStr}Error ${errorCode}: ${details.title} - ${details.message}`;
    }
    return `${contextStr}Contract Error ${errorCode}: ${error}`;
  }

  return `${contextStr}Error: ${error instanceof Error ? error.message : String(error)}`;
};

/**
 * Get error icon based on severity
 */
export const getErrorIcon = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '❌';
  }
};

/**
 * Get error color based on severity
 */
export const getErrorColor = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'error':
      return 'destructive';
    case 'warning':
      return 'warning';
    case 'info':
      return 'default';
    default:
      return 'destructive';
  }
};

/**
 * Get toast-friendly error message
 */
export const getToastErrorMessage = (error: unknown): { title: string; description: string } => {
  const errorDetails = parseContractError(error);
  
  if (errorDetails) {
    return {
      title: errorDetails.title,
      description: errorDetails.message,
    };
  }

  return {
    title: 'Transaction Failed',
    description: error instanceof Error ? error.message : String(error),
  };
};
