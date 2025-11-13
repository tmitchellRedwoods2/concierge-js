# 🏥 Health Management Automation Plan

## 📋 Overview

This document outlines the comprehensive plan for automating health-related administrative tasks, following the same agentic pattern established in the Calendar automation. The goal is to save retirees **~10-11 hours per year** by automating prescription refills, appointment scheduling, insurance claims, and health record management.

---

## 🎯 Automation Goals

### **Time Savings Breakdown**
- **Prescription Refills**: 4 hours/year (10 min × 24 refills)
- **Appointment Scheduling**: 3 hours/year (15 min × 12 appointments)
- **Insurance Claims**: 2 hours/year (20 min × 6 claims)
- **Health Records**: 1.7 hours/year (5 min × 20 results)
- **Total**: ~10-11 hours/year per client

---

## 🏗️ Architecture Overview

### **Reusable Pattern** (from Calendar automation)
```
Email/Webhook → Parser Service → Automation Engine → Action → Notification
```

### **Health-Specific Components**
1. **Health Email Parser** - Extracts health-related data from emails
2. **Prescription Refill Automation** - Auto-request refills from pharmacy emails
3. **Appointment Scheduling Automation** - Auto-schedule from doctor availability emails
4. **Insurance Claim Automation** - Auto-submit claims from medical bills
5. **Health Record Parser** - Extract and store lab results, test reports

---

## 📦 Component 1: Health Email Parser Service

### **Purpose**
Extract health-related information from emails (prescriptions, appointments, lab results, bills)

### **Location**: `src/lib/services/health-email-parser.ts`

### **Capabilities**

#### **1.1 Prescription Refill Email Parsing**
**Input**: Pharmacy refill reminder email
```
From: CVS Pharmacy <noreply@cvs.com>
Subject: Your prescription is ready for refill
Body: Your prescription for LISINOPRIL 10MG TAB is ready for refill. 
      Refill by: January 20, 2024. Order #12345
```

**Output**:
```typescript
{
  type: 'prescription_refill',
  medicationName: 'LISINOPRIL',
  dosage: '10MG TAB',
  pharmacy: 'CVS Pharmacy',
  refillByDate: Date('2024-01-20'),
  orderNumber: '12345',
  confidence: 0.95
}
```

**Parsing Logic**:
- Detect pharmacy sender (CVS, Walgreens, Rite Aid, etc.)
- Extract medication name and dosage
- Parse refill date/deadline
- Extract order/prescription number
- Match to existing prescription in database

#### **1.2 Lab Results Email Parsing**
**Input**: Lab results email
```
From: LabCorp <results@labcorp.com>
Subject: Your lab results are available
Body: Your test results from January 15, 2024 are now available.
      Tests: Complete Blood Count (CBC), Lipid Panel
      Access your results at: https://patient.labcorp.com/results/12345
```

**Output**:
```typescript
{
  type: 'lab_results',
  labName: 'LabCorp',
  testDate: Date('2024-01-15'),
  testTypes: ['Complete Blood Count (CBC)', 'Lipid Panel'],
  accessUrl: 'https://patient.labcorp.com/results/12345',
  confidence: 0.9
}
```

**Parsing Logic**:
- Detect lab provider (LabCorp, Quest, etc.)
- Extract test date
- Identify test types
- Extract access URL or attachment
- Flag for anomaly detection (if values provided)

#### **1.3 Medical Bill Email Parsing**
**Input**: Medical bill/statement email
```
From: Medical Billing <billing@hospital.com>
Subject: Your medical statement is ready
Body: Statement Date: January 15, 2024
      Amount Due: $250.00
      Service: Annual Physical Exam
      Provider: Dr. Smith, Internal Medicine
      Due Date: February 15, 2024
```

**Output**:
```typescript
{
  type: 'medical_bill',
  provider: 'Dr. Smith, Internal Medicine',
  service: 'Annual Physical Exam',
  amount: 250.00,
  statementDate: Date('2024-01-15'),
  dueDate: Date('2024-02-15'),
  confidence: 0.85
}
```

**Parsing Logic**:
- Detect billing provider
- Extract amount due
- Parse service description
- Extract due date
- Identify if insurance claim needed

#### **1.4 Appointment Availability Email Parsing**
**Input**: Doctor availability email
```
From: Dr. Smith's Office <scheduler@drsmith.com>
Subject: Available appointment times
Body: We have the following available times for your appointment:
      - January 20, 2024 at 10:00 AM
      - January 22, 2024 at 2:00 PM
      - January 25, 2024 at 11:00 AM
      Please reply with your preferred time.
```

**Output**:
```typescript
{
  type: 'appointment_availability',
  doctorName: 'Dr. Smith',
  availableTimes: [
    { date: Date('2024-01-20'), time: '10:00 AM' },
    { date: Date('2024-01-22'), time: '2:00 PM' },
    { date: Date('2024-01-25'), time: '11:00 AM' }
  ],
  confidence: 0.9
}
```

**Parsing Logic**:
- Detect doctor/office sender
- Extract multiple available time slots
- Parse dates and times
- Suggest optimal time based on user preferences

---

## 📦 Component 2: Prescription Refill Automation

### **Purpose**
Automatically request prescription refills when pharmacy sends refill reminder

### **Location**: `src/lib/services/prescription-refill-automation.ts`

### **Workflow**

1. **Email Received** → Health email parser extracts refill details
2. **Match Prescription** → Find matching prescription in database
3. **Check Eligibility** → Verify refills remaining, refill date
4. **Auto-Request** → Submit refill request to pharmacy (via API or email)
5. **Update Database** → Update prescription refill status
6. **Notify User** → Send confirmation notification

### **API Endpoints**

#### **POST `/api/health/prescriptions/[id]/refill`**
Request prescription refill

**Request**:
```json
{
  "pharmacy": "cvs",
  "orderNumber": "12345",
  "autoRequest": true
}
```

**Response**:
```json
{
  "success": true,
  "refillRequested": true,
  "estimatedReadyDate": "2024-01-18",
  "pharmacyConfirmation": "Refill #12345 submitted"
}
```

### **Pharmacy Integration Options**

1. **Email-Based** (Initial):
   - Send formatted email to pharmacy
   - Parse confirmation email
   - Update status

2. **API Integration** (Future):
   - CVS API
   - Walgreens API
   - Rite Aid API
   - Fullscript API

### **Automation Rules**

```typescript
{
  trigger: {
    type: 'email',
    conditions: {
      from: ['*@cvs.com', '*@walgreens.com', '*@riteaid.com'],
      subject: ['refill', 'prescription', 'ready'],
      body: ['refill', 'prescription']
    }
  },
  actions: [
    {
      type: 'parse_health_email',
      config: { emailType: 'prescription_refill' }
    },
    {
      type: 'match_prescription',
      config: { matchBy: ['medicationName', 'pharmacy'] }
    },
    {
      type: 'request_prescription_refill',
      config: { autoRequest: true, requireConfirmation: false }
    },
    {
      type: 'send_notification',
      config: { 
        template: 'prescription_refill_requested',
        includePharmacyDetails: true
      }
    }
  ]
}
```

---

## 📦 Component 3: Appointment Scheduling Automation

### **Purpose**
Automatically schedule appointments when doctor sends availability

### **Location**: `src/lib/services/appointment-scheduling-automation.ts`

### **Workflow**

1. **Email Received** → Health email parser extracts available times
2. **Check Calendar** → Find optimal time slot (no conflicts)
3. **User Preferences** → Consider preferred times, avoid early mornings
4. **Auto-Schedule** → Select best time and confirm with doctor
5. **Create Calendar Event** → Add to calendar (reuse calendar automation)
6. **Notify User** → Send confirmation with appointment details

### **Smart Scheduling Logic**

```typescript
interface SchedulingPreferences {
  preferredTimes: ['10:00 AM', '2:00 PM'], // Avoid early mornings
  avoidDays: ['Monday'], // User preference
  bufferTime: 30, // Minutes between appointments
  maxAdvanceDays: 90, // Don't schedule too far out
  minAdvanceDays: 3 // Need at least 3 days notice
}

function selectOptimalTime(
  availableTimes: TimeSlot[],
  preferences: SchedulingPreferences,
  existingAppointments: CalendarEvent[]
): TimeSlot | null {
  // Filter by preferences
  // Check for conflicts
  // Select best match
  // Return optimal time or null
}
```

### **API Endpoints**

#### **POST `/api/health/appointments/auto-schedule`**
Auto-schedule appointment from availability email

**Request**:
```json
{
  "doctorName": "Dr. Smith",
  "availableTimes": [
    { "date": "2024-01-20", "time": "10:00 AM" },
    { "date": "2024-01-22", "time": "2:00 PM" }
  ],
  "appointmentType": "Annual Physical",
  "preferences": {
    "preferredTimes": ["10:00 AM", "2:00 PM"],
    "avoidDays": ["Monday"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "appointmentScheduled": true,
  "selectedTime": {
    "date": "2024-01-22",
    "time": "2:00 PM"
  },
  "calendarEventId": "event-123",
  "confirmationSent": true
}
```

---

## 📦 Component 4: Insurance Claim Automation

### **Purpose**
Automatically submit insurance claims from medical bills

### **Location**: `src/lib/services/insurance-claim-automation.ts`

### **Workflow**

1. **Bill Received** → Health email parser extracts bill details
2. **Check Insurance** → Verify insurance coverage for service
3. **Auto-Submit Claim** → Submit claim to insurance provider
4. **Track Status** → Monitor claim status
5. **Notify User** → Send updates on claim status

### **Claim Submission Logic**

```typescript
interface MedicalBill {
  provider: string;
  service: string;
  amount: number;
  serviceDate: Date;
  dueDate: Date;
  diagnosisCode?: string;
  procedureCode?: string;
}

async function submitInsuranceClaim(
  bill: MedicalBill,
  userId: string
): Promise<ClaimSubmission> {
  // 1. Get user's insurance policy
  // 2. Check if service is covered
  // 3. Format claim according to insurance provider
  // 4. Submit via insurance API or portal
  // 5. Return claim ID and tracking info
}
```

### **API Endpoints**

#### **POST `/api/health/claims/auto-submit`**
Auto-submit insurance claim from medical bill

**Request**:
```json
{
  "bill": {
    "provider": "Dr. Smith, Internal Medicine",
    "service": "Annual Physical Exam",
    "amount": 250.00,
    "serviceDate": "2024-01-15",
    "dueDate": "2024-02-15"
  },
  "insurancePolicyId": "policy-123"
}
```

**Response**:
```json
{
  "success": true,
  "claimSubmitted": true,
  "claimId": "claim-456",
  "estimatedProcessingTime": "10-14 business days",
  "trackingUrl": "https://insurance.com/claims/claim-456"
}
```

---

## 📦 Component 5: Health Record Parser

### **Purpose**
Extract and store lab results, test reports, and health records

### **Location**: `src/lib/services/health-record-parser.ts`

### **Workflow**

1. **Email Received** → Health email parser identifies lab results
2. **Extract Data** → Parse test results (if in email) or download from link
3. **Store Record** → Save to health records database
4. **Flag Anomalies** → Compare to normal ranges, flag concerns
5. **Notify User** → Send notification with results summary

### **Lab Result Parsing**

```typescript
interface LabResult {
  labName: string;
  testDate: Date;
  testTypes: string[];
  results?: {
    testName: string;
    value: number;
    unit: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  accessUrl?: string;
  pdfAttachment?: Buffer;
}

async function parseLabResults(
  email: EmailContent
): Promise<LabResult> {
  // 1. Extract test date and types
  // 2. Download PDF if link provided
  // 3. OCR/extract values from PDF
  // 4. Compare to normal ranges
  // 5. Flag anomalies
  // 6. Return structured data
}
```

### **API Endpoints**

#### **POST `/api/health/records/lab-results`**
Store lab results from email

**Request**:
```json
{
  "labName": "LabCorp",
  "testDate": "2024-01-15",
  "testTypes": ["Complete Blood Count", "Lipid Panel"],
  "accessUrl": "https://patient.labcorp.com/results/12345",
  "results": [
    {
      "testName": "Total Cholesterol",
      "value": 180,
      "unit": "mg/dL",
      "normalRange": "<200",
      "status": "normal"
    }
  ]
}
```

---

## 🔄 Integration with Existing Systems

### **Calendar Integration**
- Health appointments automatically added to calendar
- Reminders scheduled
- ICS files generated

### **Insurance Integration**
- Claims linked to insurance policies
- Coverage verification
- Claim status tracking

### **Notification System**
- Reuse existing notification service
- Health-specific email templates
- SMS reminders for urgent items

### **Automation Engine**
- Reuse existing automation engine
- Health-specific triggers and actions
- Execution logging and monitoring

---

## 📊 Database Schema Extensions

### **Prescription Model** (Extend existing)
```typescript
{
  // Existing fields...
  autoRefillEnabled: boolean;
  lastRefillRequestDate?: Date;
  nextAutoRefillDate?: Date;
  pharmacyApiId?: string; // For API integration
  refillHistory: Array<{
    date: Date;
    orderNumber: string;
    status: 'requested' | 'processing' | 'ready' | 'picked_up';
  }>;
}
```

### **Health Record Model** (New)
```typescript
{
  _id: ObjectId;
  userId: string;
  recordType: 'lab_result' | 'test_report' | 'imaging' | 'other';
  provider: string;
  recordDate: Date;
  testTypes?: string[];
  results?: any; // Structured test results
  accessUrl?: string;
  pdfUrl?: string;
  anomalies?: Array<{
    testName: string;
    value: any;
    concern: string;
  }>;
  createdAt: Date;
}
```

### **Insurance Claim Model** (Extend existing)
```typescript
{
  // Existing fields...
  autoSubmitted: boolean;
  submissionDate: Date;
  claimNumber: string;
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'paid';
  statusHistory: Array<{
    date: Date;
    status: string;
    notes?: string;
  }>;
  medicalBillId?: string; // Link to original bill
}
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- Health email parser for each email type
- Prescription matching logic
- Scheduling algorithm
- Claim submission formatting

### **Integration Tests**
- End-to-end prescription refill flow
- End-to-end appointment scheduling
- End-to-end claim submission
- Health record storage

### **System Tests**
- Real pharmacy emails
- Real lab result emails
- Real medical bill emails
- Real appointment availability emails

---

## 🚀 Implementation Phases

### **Phase 1: Prescription Refill Automation** (Priority 1)
**Timeline**: 2-3 weeks
- [ ] Build health email parser (prescription refill)
- [ ] Create prescription matching service
- [ ] Implement email-based refill request
- [ ] Add automation rules
- [ ] Create notification templates
- [ ] Write tests

### **Phase 2: Appointment Scheduling Automation** (Priority 2)
**Timeline**: 2-3 weeks
- [ ] Build health email parser (appointment availability)
- [ ] Create smart scheduling service
- [ ] Integrate with calendar automation
- [ ] Add user preferences
- [ ] Create confirmation flow
- [ ] Write tests

### **Phase 3: Insurance Claim Automation** (Priority 3)
**Timeline**: 3-4 weeks
- [ ] Build health email parser (medical bills)
- [ ] Create claim submission service
- [ ] Integrate with insurance API/portal
- [ ] Add claim tracking
- [ ] Create status update notifications
- [ ] Write tests

### **Phase 4: Health Record Management** (Priority 4)
**Timeline**: 2-3 weeks
- [ ] Build health email parser (lab results)
- [ ] Create health record storage service
- [ ] Add PDF parsing/OCR
- [ ] Implement anomaly detection
- [ ] Create health record dashboard
- [ ] Write tests

---

## 📝 API Endpoints Summary

### **Health Email Webhook**
- `POST /api/health/email/webhook` - Receive health-related emails

### **Prescription Automation**
- `POST /api/health/prescriptions/[id]/refill` - Request refill
- `GET /api/health/prescriptions/[id]/refill-status` - Check refill status
- `POST /api/health/prescriptions/[id]/enable-auto-refill` - Enable auto-refill

### **Appointment Automation**
- `POST /api/health/appointments/auto-schedule` - Auto-schedule from availability
- `GET /api/health/appointments/suggested-times` - Get suggested times
- `POST /api/health/appointments/[id]/confirm` - Confirm scheduled appointment

### **Insurance Claims**
- `POST /api/health/claims/auto-submit` - Auto-submit claim
- `GET /api/health/claims/[id]/status` - Get claim status
- `POST /api/health/claims/[id]/track` - Enable tracking

### **Health Records**
- `POST /api/health/records/lab-results` - Store lab results
- `GET /api/health/records` - Get all health records
- `GET /api/health/records/[id]` - Get specific record
- `GET /api/health/records/anomalies` - Get flagged anomalies

---

## 🔒 Security & Privacy

### **HIPAA Considerations**
- Encrypt health data at rest
- Secure email transmission
- Access logging and audit trails
- User consent for automation
- Data retention policies

### **User Controls**
- Enable/disable auto-refill per prescription
- Approve before auto-scheduling appointments
- Review before auto-submitting claims
- Access health records dashboard

---

## 📈 Success Metrics

### **Prescription Refills**
- 90%+ refill requests automated
- < 5 minutes from email to refill request
- 95%+ accuracy in prescription matching

### **Appointment Scheduling**
- 80%+ appointments auto-scheduled
- Optimal time selection 90%+ of the time
- User satisfaction > 4.5/5

### **Insurance Claims**
- 85%+ claims auto-submitted
- < 10 minutes from bill to claim submission
- 90%+ claim approval rate

### **Health Records**
- 95%+ lab results automatically stored
- 100% anomaly detection accuracy
- < 2 minutes from email to stored record

---

## 🔮 Future Enhancements

- **Pharmacy API Integration**: Direct API calls instead of email
- **Insurance API Integration**: Direct claim submission
- **Lab API Integration**: Direct result retrieval
- **Predictive Analytics**: Predict refill needs, appointment reminders
- **Health Insights**: Trend analysis, health recommendations
- **Multi-User Support**: Family member health management

---

**Last Updated**: January 2024  
**Status**: Planning Phase  
**Next Steps**: Begin Phase 1 implementation after calendar automation validation

