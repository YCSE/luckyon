# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LuckyOn is an AI-powered fortune-telling service platform built with:
- **Backend**: Firebase Functions V2 (100% serverless, TypeScript)
- **Frontend**: React 18 + TypeScript + styled-components
- **AI**: Google Gemini API for fortune generation
- **Payment**: PortOne V2 payment gateway
- **Region**: asia-northeast3 (Seoul) for all Firebase resources

## Critical Architecture Decisions

### 1. Race Condition Prevention (Payment & Fortune Access)

**Problem Solved**: Users could exploit one-time purchases by making concurrent requests.

**Solution**: Transaction-based atomic operations in `/functions/src/index.ts`

```typescript
// ALWAYS use checkAndReserveOneTimePurchase() for fortune generation
// This atomically checks AND removes the purchase in a single transaction
const accessType = await checkAndReserveOneTimePurchase(uid, serviceType);

// If generation fails, restore the purchase
if (error) {
  await restoreOneTimePurchase(uid, serviceType);
}
```

**Files**: All fortune generation functions (`generateTodayFortune`, `generateSajuAnalysis`, etc.)

### 2. Payment Completion Defense-in-Depth

**Dual-path architecture** ensures payment completion even if client disconnects:

1. **Client path**: User completes payment → `verifyPayment` → `completePayment`
2. **Webhook path** (backup): PortOne V2 webhook → `portoneWebhook` → `completePayment`

**Critical**: `completePayment` uses Firestore Transactions with duplicate prevention (PAY002 error code).

**Webhook Configuration** (PortOne Console):
- Version: 2024-04-25 (V2)
- URL: `https://asia-northeast3-luckyon-6be9e.cloudfunctions.net/portoneWebhook`
- Event: Transaction.Paid
- Signature verification: Standard Webhooks HMAC SHA-256

### 3. Document Structure (SSOT - Single Source of Truth)

- **FUNCTIONS.md**: Function definitions (name, params, returns, config)
- **COMPONENTS.md**: Frontend components, design tokens, patterns
- **functions/CLAUDE.md**: Implementation details for Functions

**NEVER implement Functions without checking FUNCTIONS.md first.**

## Development Commands

### Firebase Functions

```bash
# Working directory: /functions
cd functions

# Build TypeScript
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Deploy all functions
cd .. && firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:portoneWebhook

# View logs
firebase functions:log
firebase functions:log --only portoneWebhook

# Cloud Logging (more detailed)
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="functionname"' --limit 30
```

### Frontend Client

```bash
# Working directory: /client
cd client

# Development server (default port 3000)
npm run dev

# Alternative port
PORT=3001 npm run dev

# Production build
npm run build
```

### Firebase Project Management

```bash
# Current project
firebase projects:list

# Switch environment
firebase use production  # luckyon-6be9e
firebase use staging     # staging-luckyon (if configured)
```

## Environment Variables

### Functions (.env in /functions directory)

```env
GEMINI_API_KEY=<Google Gemini API key>
PORTONE_STORE_ID=store-XXXXXXXX
PORTONE_API_SECRET=<PortOne API secret>
PORTONE_WEBHOOK_SECRET=whsec_XXXXXXXXXX
FUNCTIONS_REGION=asia-northeast3
```

**Critical**: Firebase Functions V2 reads from `.env` file (not `firebase functions:config`).

## Payment Flow Architecture

### PortOne V2 Integration

**merchantUid format**: `LUCKY_YYYYMMDD_XXXXXX` (nanoid for random part)

**Complete flow**:
1. Client: `createPayment()` → get merchantUid
2. Client: Load PortOne SDK → open payment window
3. User: Complete payment
4. Client: `verifyPayment(paymentId, merchantUid)` → verify with PortOne API
5. Client: `completePayment(paymentId, merchantUid)` → grant access
6. **Backup**: PortOne webhook → `portoneWebhook` → `completePayment()`

**Key insight**: Step 6 ensures payment is completed even if user closes browser between steps 4-5.

## Frontend Design System

**All styling MUST use design tokens** from `/client/src/design-system/tokens/index.ts`.

```typescript
import { tokens } from '../design-system/tokens';

// ✅ Correct
const Button = styled.button`
  color: ${tokens.colors.primary[500]};
  padding: ${tokens.spacing[4]};
  border-radius: ${tokens.borderRadius.md};
`;

// ❌ Wrong (hardcoded values)
const Button = styled.button`
  color: #E56030;
  padding: 16px;
  border-radius: 12px;
`;
```

**Atomic Design structure**:
- `/components/atoms/` - Basic elements (Button, Input)
- `/components/molecules/` - Composed elements (FortuneServiceCard)
- `/components/organisms/` - Complex sections (Header, Footer)
- `/components/layout/` - Layout components
- `/pages/` - Full pages

**Korean date format**: Always use `yyyy년 m월 d일` via `/client/src/utils/date.ts` utilities.

## Firebase Functions V2 Patterns

### Function Definition Template

```typescript
export const functionName = onCall({
  region: 'asia-northeast3',  // ALWAYS Seoul
  memory: '2GiB',
  concurrency: 100,
  maxInstances: 20,
  timeoutSeconds: 60
}, async (request) => {
  // 1. Auth check
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'AUTH001');
  }

  // 2. Validate input
  const { param1, param2 } = request.data;

  // 3. Business logic
  try {
    const result = await serviceFunction(param1, param2);
    return { success: true, data: result };
  } catch (error: any) {
    logError('functionName', error, request.data);
    throw toHttpsError(error);
  }
});
```

### HTTP Endpoints (onRequest)

```typescript
export const httpEndpoint = onRequest({
  region: 'asia-northeast3',
  memory: '2GiB',
  cors: true,
  timeoutSeconds: 30
}, async (request, response) => {
  try {
    // Handle request
    response.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[EndpointName] Error:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});
```

## Firestore Security Patterns

**Critical principle**: Functions write, clients read (with restrictions).

```javascript
// Users can read only their own data
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false;  // Only Functions can write
}

// Payments are completely private
match /payments/{paymentId} {
  allow read, write: if false;  // Only Functions access
}

// Fortune results: own data only
match /fortune_results/{resultId} {
  allow read: if request.auth != null &&
    request.auth.uid == resource.data.uid;
  allow write: if false;
}
```

## Common Debugging Workflows

### Webhook Not Working

1. Check webhook version in PortOne console (must be V2: 2024-04-25)
2. Verify environment variable: `PORTONE_WEBHOOK_SECRET` in `/functions/.env`
3. Check Cloud Logging:
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="portonewebhook"' --limit 30
   ```
4. Look for `[WebhookVerify]` logs showing signature validation
5. Verify webhook body format: must have `type` and `data` fields (V2 format)

### Payment Not Completing

1. Check payment document status in Firestore `/payments/{paymentId}`
2. Verify `completePayment` was called (check logs)
3. Check for PAY002 error (duplicate completion - this is OK)
4. Verify user document updated with subscription or oneTimePurchases

### Fortune Generation Fails

1. Check access rights: subscription valid OR one-time purchase exists
2. Verify Gemini API key in environment
3. Check cache first: may already exist in `fortune_results` collection
4. Look for rollback logs if one-time purchase was restored

## Testing

### Local Emulator

```bash
# Start emulators
firebase emulators:start

# Emulator ports
# - Firestore: 8080
# - Functions: 5001
# - Auth: 9099
# - UI: 4000
```

### Manual API Testing

```bash
# Test webhook endpoint
curl -X POST https://asia-northeast3-luckyon-6be9e.cloudfunctions.net/portoneWebhook \
  -H "Content-Type: application/json" \
  -H "webhook-id: test-123" \
  -H "webhook-timestamp: 1234567890" \
  -H "webhook-signature: v1,signature" \
  -d '{"type":"Transaction.Paid","data":{"paymentId":"test-payment-id"}}'
```

## Key Files Reference

### Backend
- `/functions/src/index.ts` - All Functions entry point
- `/functions/src/services/payment.service.ts` - Payment logic (Transaction-based)
- `/functions/src/services/fortune.service.ts` - AI fortune generation
- `/functions/src/config/environment.ts` - Environment variables
- `/functions/src/utils/errors.ts` - Error codes (AUTH001, PAY001, etc.)

### Frontend
- `/client/src/pages/` - Page components
- `/client/src/components/` - Atomic design components
- `/client/src/design-system/tokens/index.ts` - Design tokens (SSOT for styling)
- `/client/src/services/api.ts` - Firebase Functions calls
- `/client/src/config/firebase.ts` - Firebase initialization

### Configuration
- `/firebase.json` - Firebase project config
- `/firestore.rules` - Security rules
- `/firestore.indexes.json` - Firestore indexes
- `/.env` - Root environment variables
- `/functions/.env` - Functions environment variables

## Error Codes

Quick reference for error handling:

- **AUTH001-004**: Authentication/authorization errors
- **PAY001-004**: Payment processing errors (PAY002 = duplicate, OK to ignore)
- **SVC001-004**: Service/business logic errors
- **SYS001-004**: System/infrastructure errors

## Critical Implementation Notes

1. **Always use Firestore Transactions** for operations that must be atomic (payments, one-time purchases)
2. **PortOne V2 only** - No V1 compatibility
3. **Design tokens mandatory** - Never hardcode colors/spacing in frontend
4. **Seoul region (asia-northeast3)** - All Firebase resources
5. **Webhook signature verification** - Uses Standard Webhooks spec with HMAC SHA-256
6. **merchantUid format** - Must be `LUCKY_YYYYMMDD_XXXXXX`
7. **Korean dates** - Always `yyyy년 m월 d일` format in UI

## Reference Documentation

- **Function Specifications**: [FUNCTIONS.md](./FUNCTIONS.md)
- **Component Guide**: [COMPONENTS.md](./COMPONENTS.md)
- **Functions Implementation**: [functions/CLAUDE.md](./functions/CLAUDE.md)
