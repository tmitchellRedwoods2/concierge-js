# Prescription Refill Automation - Implementation Plan

## Overview
Automate prescription refills for medications that don't require physician interaction, making it easier for clients to maintain their medication supply without manual intervention.

## Goals
1. **Automatically detect** when prescriptions need refills
2. **Automatically request** refills from pharmacies for eligible prescriptions
3. **Notify users** of refill status and any issues
4. **Provide manual controls** for users who want to manage refills themselves

## Current State Analysis

### Existing Prescription Model
- ✅ Basic prescription data (medication, dosage, frequency)
- ✅ Pharmacy information
- ✅ Refills remaining count
- ✅ Prescribing doctor
- ❌ No auto-refill settings
- ❌ No refill history tracking
- ❌ No next refill due date calculation
- ❌ No last refill date

### Existing Features
- ✅ Prescription CRUD operations
- ✅ Basic prescription display
- ❌ No refill automation
- ❌ No pharmacy integration

## Implementation Plan

### Phase 1: Data Model Extensions

#### 1.1 Extend Prescription Model
**File**: `src/lib/db/models/Prescription.ts`

**New Fields**:
```typescript
{
  // Auto-refill settings
  autoRefillEnabled: boolean;        // User preference for auto-refill
  autoRefillDaysBefore: number;      // Days before refill due to trigger (default: 7)
  
  // Refill tracking
  lastRefillDate?: Date;             // When last refilled
  nextRefillDueDate?: Date;          // Calculated next refill date
  refillHistory: Array<{             // History of refill requests
    date: Date;
    status: 'requested' | 'processing' | 'ready' | 'picked_up' | 'cancelled';
    pharmacy: string;
    estimatedReady?: Date;
    notes?: string;
  }>;
  
  // Pharmacy account info (for API integration)
  pharmacyAccountId?: string;        // Pharmacy account identifier
  pharmacyRxNumber?: string;         // Prescription number at pharmacy
  
  // Refill eligibility
  requiresPhysicianApproval: boolean; // Whether this needs doctor approval
  isMaintenanceMedication: boolean;   // Typically true for chronic conditions
}
```

#### 1.2 Create PrescriptionRefill Model (Optional - for detailed tracking)
**File**: `src/lib/db/models/PrescriptionRefill.ts`

```typescript
{
  prescriptionId: ObjectId;
  userId: string;
  requestDate: Date;
  pharmacy: string;
  status: 'requested' | 'processing' | 'ready' | 'picked_up' | 'cancelled' | 'failed';
  estimatedReadyDate?: Date;
  actualReadyDate?: Date;
  pickedUpDate?: Date;
  failureReason?: string;
  pharmacyConfirmationNumber?: string;
  notes?: string;
}
```

### Phase 2: Refill Automation Service

#### 2.1 Create Prescription Refill Service
**File**: `src/lib/services/prescription-refill-automation.ts`

**Key Functions**:
- `checkRefillNeeds(userId)`: Scan all active prescriptions and identify those needing refills
- `canAutoRefill(prescription)`: Determine if a prescription is eligible for auto-refill
- `requestRefill(prescriptionId, userId)`: Submit refill request to pharmacy
- `calculateNextRefillDate(prescription)`: Calculate when next refill is due based on frequency and quantity
- `updateRefillStatus(refillId, status)`: Update refill request status

**Eligibility Criteria**:
- ✅ `autoRefillEnabled === true`
- ✅ `refillsRemaining > 0`
- ✅ `requiresPhysicianApproval === false`
- ✅ `nextRefillDueDate` is within `autoRefillDaysBefore` days
- ✅ `isActive === true`

#### 2.2 Create Pharmacy Integration Service
**File**: `src/lib/services/pharmacy-api-integration.ts`

**Supported Pharmacies** (Initial):
- CVS (API or web scraping)
- Walgreens (API or web scraping)
- Rite Aid (API or web scraping)
- Generic pharmacy (manual/email-based)

**Key Functions**:
- `requestRefill(pharmacy, rxNumber, userId)`: Submit refill request
- `checkRefillStatus(pharmacy, rxNumber)`: Check status of refill request
- `getPharmacyInfo(pharmacy)`: Get pharmacy contact info

**Note**: Start with email-based or manual process, then add API integrations as available.

### Phase 3: Email Integration

#### 3.1 Create Health Email Parser
**File**: `src/lib/services/health-email-parser.ts`

**Purpose**: Parse emails from pharmacies to detect:
- Refill reminders ("Your prescription is ready for refill")
- Refill confirmations ("Your refill has been requested")
- Refill ready notifications ("Your prescription is ready for pickup")
- Refill issues ("Your refill requires physician approval")

**Key Functions**:
- `parsePharmacyEmail(email)`: Extract prescription and refill info from email
- `identifyPharmacy(email)`: Determine which pharmacy sent the email
- `extractRefillStatus(email)`: Determine refill status from email content

#### 3.2 Integrate with Email Polling
**File**: `src/lib/services/email-polling.ts` (extend existing)

Add health email parsing to the email polling service to automatically process pharmacy emails.

### Phase 4: API Endpoints

#### 4.1 Prescription Refill Endpoints
**File**: `src/app/api/health/prescriptions/[id]/refill/route.ts`

**Endpoints**:
- `POST /api/health/prescriptions/[id]/refill`: Manually request a refill
- `GET /api/health/prescriptions/[id]/refill-status`: Get refill status
- `GET /api/health/prescriptions/refill-eligible`: Get all prescriptions eligible for refill

#### 4.2 Auto-Refill Settings Endpoints
**File**: `src/app/api/health/prescriptions/[id]/auto-refill/route.ts`

**Endpoints**:
- `PUT /api/health/prescriptions/[id]/auto-refill`: Enable/disable auto-refill
- `PUT /api/health/prescriptions/[id]/auto-refill-settings`: Update auto-refill settings

### Phase 5: Background Automation Worker

#### 5.1 Create Refill Automation Worker
**File**: `src/lib/services/prescription-refill-worker.ts`

**Purpose**: Periodically check for prescriptions needing refills and automatically request them.

**Functionality**:
- Run on a schedule (e.g., daily at 8 AM)
- Check all active prescriptions with `autoRefillEnabled === true`
- Identify prescriptions due for refill
- Automatically request refills for eligible prescriptions
- Send notifications to users

#### 5.2 Create Worker Initialization
**File**: `src/app/api/health/refill-automation/init/route.ts`

Initialize the background worker when the application starts.

### Phase 6: UI Components

#### 6.1 Update Prescription Display
**File**: `src/app/health/page.tsx`

**New Features**:
- Auto-refill toggle switch per prescription
- Refill status indicator
- "Request Refill" button for manual refills
- Days until next refill display
- Refill history timeline

#### 6.2 Create Refill Settings Modal
**New Component**: `src/components/health/prescription-refill-settings.tsx`

**Features**:
- Enable/disable auto-refill
- Set days before refill to trigger (default: 7)
- View refill history
- Update pharmacy information

#### 6.3 Create Refill Status Badge
**New Component**: `src/components/health/refill-status-badge.tsx`

**Statuses**:
- ✅ Ready for refill (green)
- ⏳ Refill requested (yellow)
- 📦 Ready for pickup (blue)
- ⚠️ Needs attention (red)
- ❌ Out of refills (gray)

### Phase 7: Notifications

#### 7.1 Refill Notifications
**Integration**: Use existing `notification-service.ts`

**Notification Types**:
- Refill requested confirmation
- Refill ready for pickup
- Refill requires attention (needs doctor approval, out of refills, etc.)
- Auto-refill enabled/disabled confirmation

### Phase 8: Testing

#### 8.1 Unit Tests
- Prescription refill eligibility logic
- Next refill date calculation
- Pharmacy integration (mocked)
- Email parsing for pharmacy emails

#### 8.2 Integration Tests
- End-to-end refill request flow
- Auto-refill automation worker
- Email-to-refill workflow

#### 8.3 System Tests
- Manual refill request
- Auto-refill automation
- Email parsing and refill detection

## Implementation Order

1. **Phase 1**: Extend data models (Prescription schema updates)
2. **Phase 2**: Create refill automation service (core logic)
3. **Phase 4**: Create API endpoints (manual refill requests first)
4. **Phase 6**: Update UI (basic refill controls)
5. **Phase 3**: Email integration (parse pharmacy emails)
6. **Phase 5**: Background automation worker
7. **Phase 7**: Notifications
8. **Phase 8**: Testing

## Success Metrics

- ✅ Users can enable auto-refill per prescription
- ✅ System automatically detects refill needs
- ✅ System automatically requests refills for eligible prescriptions
- ✅ Users receive notifications about refill status
- ✅ Users can manually request refills
- ✅ System handles edge cases (out of refills, needs approval, etc.)

## Future Enhancements

- Pharmacy API integrations (CVS, Walgreens APIs)
- Prescription price comparison
- Generic medication substitution suggestions
- Refill scheduling optimization
- Multi-pharmacy support
- Prescription delivery coordination

## Notes

- Start with email-based/manual refill process
- Focus on prescriptions that don't require physician approval
- Provide clear user controls and visibility
- Ensure robust error handling and notifications
- Consider privacy and security for pharmacy account information

