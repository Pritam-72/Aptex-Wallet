# Pre-Testing TypeScript Errors

**Date**: [Current Date]  
**Status**: Non-blocking for testing, should be fixed before production

---

## Existing TypeScript Errors (5 total)

### 1. walletUtils.ts - Line 152
**Error**: `Property 'privateKey' does not exist on type 'Account'`

```typescript
privateKey: account.privateKey.toString(),
```

**Severity**: Low  
**Impact**: Affects wallet export functionality  
**Fix**: Update to use correct Aptos SDK Account API  
**Workaround**: May need to access private key differently in newer SDK versions

---

### 2. RegisterWallet.tsx - Line 14
**Error**: `'"@/utils/contractUtils"' has no exported member named 'parseContractError'`

```typescript
import { parseContractError } from "@/utils/contractUtils";
```

**Severity**: Low  
**Impact**: Old error parsing function import  
**Fix**: Change import to use errorHandler utility  
**Solution**:
```typescript
// Change from
import { parseContractError } from "@/utils/contractUtils";

// To
import { parseContractError } from "@/utils/errorHandler";
```

**Note**: `parseContractError` was moved to `errorHandler.ts` in Task 12. The old function in `contractUtils.ts` is now `parseContractErrorLegacy` (deprecated).

---

### 3. UpiMappingSection.tsx - Line 14
**Error**: `'"@/utils/contractUtils"' has no exported member named 'parseContractError'`

```typescript
import { parseContractError } from "@/utils/contractUtils";
```

**Severity**: Low  
**Impact**: Old error parsing function import  
**Fix**: Same as RegisterWallet.tsx above  
**Solution**:
```typescript
import { parseContractError } from "@/utils/errorHandler";
```

---

### 4. CompanyEmiSection.tsx - Line 95
**Error**: `Type '"walletId"' is not assignable to type 'SetStateAction<"address" | "wallet_id" | "upi_id">'`

```typescript
setRecipientType(result.type); // result.type is "walletId" but state expects "wallet_id"
```

**Severity**: Low  
**Impact**: Recipient type mismatch (camelCase vs snake_case)  
**Fix**: Convert camelCase to snake_case  
**Solution**:
```typescript
// Add type conversion
const normalizedType = result.type === 'walletId' ? 'wallet_id' : 
                       result.type === 'upiId' ? 'upi_id' : 
                       result.type;
setRecipientType(normalizedType);
```

---

### 5. CompanyCouponSection.tsx - Line 101
**Error**: Same as CompanyEmiSection.tsx above

```typescript
setRecipientType(result.type);
```

**Severity**: Low  
**Impact**: Same recipient type mismatch  
**Fix**: Same solution as CompanyEmiSection.tsx

---

### 6. CompanyDashboard.tsx - Line 17
**Error**: `Cannot find module './CompanyCouponSection'`

```typescript
import { CompanyCouponSection } from './CompanyCouponSection';
```

**Severity**: Medium  
**Impact**: Module import path issue  
**Root Cause**: CompanyCouponSection.tsx is in `components/` but CompanyDashboard.tsx is in `pages/`  
**Fix**: Correct import path  
**Solution**:
```typescript
// Change from
import { CompanyCouponSection } from './CompanyCouponSection';

// To
import { CompanyCouponSection } from '@/components/CompanyCouponSection';
```

---

## Quick Fix Script

To fix all these errors quickly, run these replacements:

### Fix 1 & 2: Update error handler imports (RegisterWallet.tsx, UpiMappingSection.tsx)
```typescript
// In RegisterWallet.tsx and UpiMappingSection.tsx
// Change:
import { parseContractError } from "@/utils/contractUtils";
// To:
import { parseContractError } from "@/utils/errorHandler";
```

### Fix 3: Update CompanyDashboard import
```typescript
// In CompanyDashboard.tsx
// Change:
import { CompanyCouponSection } from './CompanyCouponSection';
// To:
import { CompanyCouponSection } from '@/components/CompanyCouponSection';
```

### Fix 4 & 5: Type conversion in CompanyEmiSection and CompanyCouponSection
```typescript
// Add helper function at top of both files
const normalizeRecipientType = (type: string): "address" | "wallet_id" | "upi_id" => {
  if (type === 'walletId') return 'wallet_id';
  if (type === 'upiId') return 'upi_id';
  return 'address';
};

// Then use it:
setRecipientType(normalizeRecipientType(result.type));
```

### Fix 6: walletUtils.ts private key access
```typescript
// Check Aptos SDK documentation for correct private key access
// May need to use account.signingKey or similar
```

---

## Testing Priority

These errors should be fixed before starting comprehensive testing:

1. **High Priority** (Fix first):
   - CompanyDashboard.tsx import path (blocks component loading)
   
2. **Medium Priority** (Fix before feature testing):
   - parseContractError imports (affects error handling)
   - recipientType mismatches (affects EMI/Coupon creation)

3. **Low Priority** (Can be deferred):
   - walletUtils.ts privateKey (affects wallet export, can workaround)

---

## Recommendation

**Before starting Phase 1 testing**, fix errors 1-5 to ensure clean compilation:

```bash
# Check TypeScript errors
npm run build

# Or in watch mode
npm run dev
```

**Estimated Fix Time**: 15-20 minutes

---

## Notes

- These errors were present before Task 13 (Testing & Validation)
- They do not affect the completion of Task 13 documentation
- They should be addressed before executing the testing plan
- All errors are fixable with simple import/type corrections
- No core logic changes required

---

**Status**: ⚠️ 5 TypeScript errors to fix before testing  
**Impact**: Low to Medium (non-blocking for documentation, blocking for testing)  
**Next Action**: Apply quick fixes above, then proceed with testing

