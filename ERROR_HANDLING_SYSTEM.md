# Error Handling System Documentation

## Overview

This document describes the comprehensive error handling system implemented for the Aptos Wallet application. The system provides user-friendly error messages for all 20 smart contract error codes and includes robust error boundaries and display components.

## Components

### 1. Error Handler Utility (`errorHandler.ts`)

The core error handling utility that provides:

- **Error Code Constants**: All 20 error codes from `wallet_system.move`
- **Error Details Interface**: Structured error information including:
  - Code number
  - User-friendly title
  - Detailed message
  - Severity level (error/warning/info)
  - Helpful suggestion
  - Recommended action

#### Key Functions:

```typescript
// Parse error code from contract error
parseErrorCode(error: unknown): number | null

// Get error details from code
getErrorDetails(errorCode: number): ContractError | null

// Get user-friendly message from any error
getErrorMessage(error: unknown): string

// Get full error details
parseContractError(error: unknown): ContractError | null

// Check if error matches specific code
isContractError(error: unknown, errorCode: number): boolean

// Format error for logging
formatErrorForLog(error: unknown, context?: string): string

// Get toast-friendly error message
getToastErrorMessage(error: unknown): { title: string; description: string }
```

### 2. Error Boundary Component (`ErrorBoundary.tsx`)

React error boundary that catches runtime errors and displays a user-friendly fallback UI.

**Features:**
- Catches all React component errors
- Shows detailed error information in development mode
- Provides recovery actions (Try Again, Reload, Go Home)
- Includes helpful suggestions for users

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Or with HOC
export default withErrorBoundary(YourComponent);
```

### 3. Contract Error Display (`ContractErrorDisplay.tsx`)

Reusable component for displaying smart contract errors with rich UI.

**Features:**
- Severity-based styling (error/warning/info)
- Shows error code, title, message, and suggestion
- Optional retry and dismiss actions
- Inline error variant for forms

**Usage:**
```tsx
<ContractErrorDisplay
  error={error}
  onRetry={() => retryFunction()}
  onDismiss={() => setError(null)}
/>

// Inline version
<InlineError error={error} />
```

## All 20 Error Codes

### Error Code Mapping:

| Code | Error Name | Title | Severity |
|------|-----------|-------|----------|
| 1 | E_WALLET_ID_ALREADY_EXISTS | Wallet ID Already Taken | error |
| 2 | E_UPI_ID_ALREADY_EXISTS | UPI ID Already Registered | error |
| 3 | E_WALLET_ID_NOT_FOUND | Wallet ID Not Found | error |
| 4 | E_UPI_ID_NOT_FOUND | UPI ID Not Found | error |
| 5 | E_PAYMENT_REQUEST_NOT_FOUND | Payment Request Not Found | error |
| 6 | E_SPLIT_BILL_NOT_FOUND | Split Bill Not Found | error |
| 7 | E_NOT_AUTHORIZED | Not Authorized | error |
| 8 | E_INVALID_AMOUNT | Invalid Amount | error |
| 9 | E_WALLET_NOT_INITIALIZED | Wallet Not Initialized | error |
| 10 | E_EMI_NOT_FOUND | EMI Agreement Not Found | error |
| 11 | E_EMI_ALREADY_EXISTS | EMI Agreement Already Exists | error |
| 12 | E_EMI_COMPLETED | EMI Already Completed | info |
| 13 | E_EMI_PAYMENT_TOO_EARLY | EMI Payment Too Early | warning |
| 14 | E_INSUFFICIENT_BALANCE | Insufficient Balance | error |
| 15 | E_INVALID_SPLIT_DATA | Invalid Split Bill Data | error |
| 16 | E_EMI_NOT_DUE | EMI Payment Not Due Yet | warning |
| 17 | E_LOYALTY_NFT_ALREADY_EXISTS | Loyalty NFT Already Minted | info |
| 18 | E_COUPON_NFT_NOT_FOUND | Coupon Not Found | error |
| 19 | E_COUPON_NFT_EXPIRED | Coupon Expired | warning |
| 20 | E_AUTO_PAY_NOT_APPROVED | Auto-Pay Not Approved | error |

## Error Patterns Detected

The error parser recognizes multiple error message patterns:

1. **Move Abort Pattern**: `"Move abort in <address>::<module>: <code>"`
2. **Aborted Pattern**: `"ABORTED: <code>"`
3. **Error Code Pattern**: `"error code: <code>"`
4. **Direct Number**: Numbers 1-20 in error messages

## Integration Examples

### 1. In Contract Interaction Functions

```typescript
import { parseContractError, formatErrorForLog } from './errorHandler';

export const createPaymentRequest = async (...) => {
  try {
    // ... transaction code ...
    
    if (!response.success) {
      const errorDetails = parseContractError(response.vm_status);
      console.error(formatErrorForLog(response.vm_status, "createPaymentRequest"));
      return {
        success: false,
        error: errorDetails?.message || "Transaction failed",
      };
    }
  } catch (error) {
    console.error(formatErrorForLog(error, "createPaymentRequest"));
    const errorDetails = parseContractError(error);
    return {
      success: false,
      error: errorDetails?.message || "Operation failed",
    };
  }
};
```

### 2. In React Components

```typescript
import { getToastErrorMessage } from '@/utils/errorHandler';
import { ContractErrorDisplay } from '@/components/ContractErrorDisplay';

const MyComponent = () => {
  const [error, setError] = useState(null);
  
  const handleTransaction = async () => {
    try {
      // ... transaction code ...
    } catch (err) {
      setError(err);
      
      // Show toast notification
      const { title, description } = getToastErrorMessage(err);
      toast({ title, description, variant: "destructive" });
    }
  };
  
  return (
    <>
      {error && <ContractErrorDisplay error={error} onDismiss={() => setError(null)} />}
      {/* ... rest of component ... */}
    </>
  );
};
```

### 3. With Toast Notifications

```typescript
import { getToastErrorMessage } from '@/utils/errorHandler';

try {
  // ... operation ...
} catch (error) {
  const { title, description } = getToastErrorMessage(error);
  toast({
    title,
    description,
    variant: "destructive",
    duration: 5000,
  });
}
```

## User-Friendly Messages

Each error includes:

1. **Clear Title**: Short, descriptive error name
2. **Detailed Message**: Explains what went wrong
3. **Helpful Suggestion**: Guidance on how to resolve
4. **Action Button**: Recommended next step

### Example Error Messages:

**E_INSUFFICIENT_BALANCE (Code 14):**
- **Title**: "Insufficient Balance"
- **Message**: "Your wallet balance is not sufficient to complete this transaction."
- **Suggestion**: "Please add funds to your wallet before attempting this transaction."
- **Action**: "Add Funds"

**E_EMI_PAYMENT_TOO_EARLY (Code 13):**
- **Title**: "EMI Payment Too Early"
- **Message**: "You cannot pay the next EMI installment yet. Please wait until the due date."
- **Suggestion**: "EMI payments can only be made on or after the monthly due date."
- **Action**: "View Due Date"

## Best Practices

### 1. Always Use Error Handler

```typescript
// ❌ Bad
catch (error) {
  toast({ title: "Error", description: String(error) });
}

// ✅ Good
catch (error) {
  const { title, description } = getToastErrorMessage(error);
  toast({ title, description, variant: "destructive" });
}
```

### 2. Log Errors with Context

```typescript
// ❌ Bad
console.error(error);

// ✅ Good
console.error(formatErrorForLog(error, "createPaymentRequest"));
```

### 3. Display Errors Appropriately

```typescript
// For inline forms
<InlineError error={error} />

// For prominent displays
<ContractErrorDisplay error={error} onRetry={handleRetry} />

// For toast notifications
const { title, description } = getToastErrorMessage(error);
toast({ title, description });
```

### 4. Wrap Components with Error Boundary

```typescript
// In main App component
<ErrorBoundary>
  <Router>
    <Routes />
  </Router>
</ErrorBoundary>
```

## Testing Error Handling

To test error handling, you can trigger specific errors:

```typescript
// Simulate contract error
throw new Error("Move abort: 14"); // Insufficient balance error

// Test with error code directly
const error = "ABORTED: 7"; // Not authorized error
const details = parseContractError(error);
console.log(details); // Shows user-friendly error details
```

## Future Enhancements

Potential improvements to consider:

1. **Error Analytics**: Track error frequency and types
2. **I18n Support**: Multilingual error messages
3. **Error Recovery**: Automatic retry with exponential backoff
4. **User Feedback**: Allow users to report errors
5. **Error Notifications**: Optional email/SMS alerts for critical errors

## Conclusion

This comprehensive error handling system ensures that all smart contract errors are caught, parsed, and displayed with user-friendly messages. The system improves user experience by:

- Providing clear, actionable error messages
- Offering helpful suggestions for resolution
- Maintaining consistent error display across the application
- Logging errors with proper context for debugging
- Preventing application crashes with error boundaries

All 20 contract error codes are properly handled, making the application robust and user-friendly.
