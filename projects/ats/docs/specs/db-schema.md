---
title: "Database Schema — Lapam-ATS"
type: db-schema
agent: specification
status: draft
version: 1.0
created: 2026-03-22
parent: docs/specs/PRD.md
architecture: docs/specs/ADR-001-tech-stack.md
---

# Database Schema: Lapam-ATS

**Database:** PostgreSQL 16 via Neon (EU Frankfurt region)
**ORM:** Prisma 5
**Multi-tenancy:** Shared database; `tenantId` on all tenant-scoped tables; enforced via Prisma
client extension at application layer. PostgreSQL row-level security added as defence-in-depth.

---

## 1. Entity Overview

```
Tenant
  └── Location (many)
  └── User (many, via Clerk org membership)
  └── Job (many)
        └── Application (many)
              └── Candidate (1)
              └── ConsentRecord (1, application consent)
              └── PipelineEvent (many)
              └── Message (many)
              └── ScreeningResponse (many)
              └── RightToWorkCheck (0-1, UK locations only)
              └── InterviewSlot (0-many)
  └── TalentPoolEntry (many)
        └── ConsentRecord (1, talent pool consent — separate from application consent)
  └── JobQueue (many, background job records)
  └── AuditLog (many, immutable)
```

---

## 2. Prisma Schema

```prisma
// schema.prisma
// Lapam-ATS — PostgreSQL 16 / Prisma 5

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// MULTI-TENANCY
// ─────────────────────────────────────────────

model Tenant {
  id          String   @id @default(cuid())
  clerkOrgId  String   @unique   // Clerk organisation ID — primary external reference
  name        String
  slug        String   @unique   // URL-safe identifier used in routing
  plan        TenantPlan @default(TRIAL)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  locations   Location[]
  jobs        Job[]
  talentPool  TalentPoolEntry[]
  jobQueue    JobQueue[]
  auditLogs   AuditLog[]
}

enum TenantPlan {
  TRIAL
  ACTIVE
  SUSPENDED
}

// ─────────────────────────────────────────────
// LOCATION
// ─────────────────────────────────────────────

model Location {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  country     LocationCountry   // determines which compliance workflows apply
  timezone    String?           // IANA timezone string, e.g. "Europe/London"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  jobs        Job[]
  // Location <-> User assignment is managed via LocationAssignment join table
  assignments LocationAssignment[]

  @@index([tenantId])
}

enum LocationCountry {
  GB   // UK — triggers Right to Work workflow
  IE
  FR
  DE
  NL
  ES
  IT
  US   // US — triggers I-9 workflow (phase two)
  OTHER
}

model LocationAssignment {
  id          String   @id @default(cuid())
  locationId  String
  clerkUserId String   // Clerk user ID of the assigned Location Manager
  createdAt   DateTime @default(now())

  location    Location @relation(fields: [locationId], references: [id])

  @@unique([locationId, clerkUserId])
  @@index([clerkUserId])
}

// ─────────────────────────────────────────────
// JOB POSTING
// ─────────────────────────────────────────────

model Job {
  id              String    @id @default(cuid())
  tenantId        String
  locationId      String
  title           String
  description     String    @db.Text
  locationType    JobLocationType?
  employmentType  EmploymentType @default(FULL_TIME)
  status          JobStatus  @default(DRAFT)
  externalIndeedId String?   // ID returned by Indeed API on publish
  applyLinkToken  String     @unique @default(cuid()) // token in public apply URL
  closedAt        DateTime?
  createdByUserId String     // Clerk user ID
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  tenant          Tenant     @relation(fields: [tenantId], references: [id])
  location        Location   @relation(fields: [locationId], references: [id])
  applications    Application[]
  screeningQuestions ScreeningQuestion[]

  @@index([tenantId])
  @@index([locationId])
  @@index([applyLinkToken])
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
  ARCHIVED
}

enum JobLocationType {
  RESTAURANT
  HOTEL
  BAR
  EVENTS
  OTHER
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  SEASONAL
  ZERO_HOURS
  FLEXIBLE
}

model ScreeningQuestion {
  id          String   @id @default(cuid())
  jobId       String
  question    String
  type        QuestionType
  options     String[]          // for SINGLE_CHOICE type
  isKnockout  Boolean  @default(false)
  order       Int
  createdAt   DateTime @default(now())

  job         Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  responses   ScreeningResponse[]

  @@index([jobId])
}

enum QuestionType {
  FREE_TEXT
  YES_NO
  SINGLE_CHOICE
}

// ─────────────────────────────────────────────
// CANDIDATE AND APPLICATION
// ─────────────────────────────────────────────

// Candidate holds PII. This is the primary GDPR deletion target.
// A Candidate belongs to a Tenant — they are not global identities.
// One person applying to two different Tenant organisations = two Candidate records.

model Candidate {
  id            String   @id @default(cuid())
  tenantId      String
  firstName     String
  lastName      String
  mobileNumber  String?
  email         String?
  preferredChannel  MessageChannel @default(SMS)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?   // soft delete; GDPR hard delete job cascades on this

  applications  Application[]
  talentPoolEntries TalentPoolEntry[]

  @@index([tenantId])
}

model Application {
  id              String   @id @default(cuid())
  tenantId        String
  jobId           String
  candidateId     String
  stage           PipelineStage @default(APPLIED)
  availabilityType AvailabilityType?
  cvDocumentKey   String?   // Cloudflare R2 object key (optional)
  source          ApplicationSource @default(DIRECT)
  isKnockoutFlagged Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  job             Job          @relation(fields: [jobId], references: [id])
  candidate       Candidate    @relation(fields: [candidateId], references: [id])
  consent         ConsentRecord?
  pipelineEvents  PipelineEvent[]
  messages        Message[]
  screeningResponses ScreeningResponse[]
  rightToWorkCheck RightToWorkCheck?
  interviewSlots  InterviewSlot[]
  offer           Offer?

  @@index([tenantId])
  @@index([jobId])
  @@index([candidateId])
}

enum PipelineStage {
  APPLIED
  SCREENING
  INTERVIEW
  OFFER
  HIRED
  REJECTED
  WITHDRAWN
}

enum AvailabilityType {
  FULL_TIME
  PART_TIME
  FLEXIBLE
}

enum ApplicationSource {
  DIRECT       // direct apply link / QR code
  INDEED
  GOOGLE_JOBS
  REFERRAL
  TALENT_POOL  // re-application from talent pool re-engagement
}

model ScreeningResponse {
  id          String   @id @default(cuid())
  applicationId String
  questionId  String
  response    String
  createdAt   DateTime @default(now())

  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  question    ScreeningQuestion @relation(fields: [questionId], references: [id])

  @@index([applicationId])
}

// ─────────────────────────────────────────────
// CONSENT (first-class entity)
// ─────────────────────────────────────────────

// Every consent record has a type, a date, and an expiry.
// Application consent and talent pool consent are separate records with separate lifecycles.

model ConsentRecord {
  id              String       @id @default(cuid())
  tenantId        String
  candidateId     String
  consentType     ConsentType
  consentDate     DateTime     @default(now())
  consentExpiry   DateTime     // default: consentDate + 12 months
  renewedAt       DateTime?
  revokedAt       DateTime?
  sourceIp        String?      // for audit; not used for any business logic
  applicationId   String?      @unique   // set for APPLICATION consent type
  talentPoolEntryId String?    @unique   // set for TALENT_POOL consent type

  application     Application?     @relation(fields: [applicationId], references: [id])
  talentPoolEntry TalentPoolEntry? @relation(fields: [talentPoolEntryId], references: [id])

  @@index([tenantId, consentExpiry])  // used by re-consent scheduler
  @@index([candidateId])
}

enum ConsentType {
  APPLICATION    // consent for processing data to assess for a specific role
  TALENT_POOL    // consent for storing data in the re-engagement talent pool
}

// ─────────────────────────────────────────────
// PIPELINE EVENTS (immutable activity log per application)
// ─────────────────────────────────────────────

model PipelineEvent {
  id              String   @id @default(cuid())
  applicationId   String
  tenantId        String
  actorUserId     String?  // Clerk user ID; null for system-generated events
  eventType       PipelineEventType
  fromStage       PipelineStage?
  toStage         PipelineStage?
  note            String?
  createdAt       DateTime @default(now())

  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
  @@index([tenantId])
}

enum PipelineEventType {
  APPLICATION_RECEIVED
  STAGE_CHANGED
  MESSAGE_SENT
  INTERVIEW_SCHEDULED
  INTERVIEW_CONFIRMED
  INTERVIEW_REMINDER_SENT
  RTW_INITIATED
  RTW_COMPLETED
  OFFER_SENT
  OFFER_ACCEPTED
  OFFER_DECLINED
  AI_FEATURE_INVOKED   // logged when any AI productivity feature is used
  NOTE_ADDED
  GDPR_DELETION_SCHEDULED
}

// ─────────────────────────────────────────────
// MESSAGES (candidate communications)
// ─────────────────────────────────────────────

model Message {
  id              String   @id @default(cuid())
  tenantId        String
  applicationId   String
  direction       MessageDirection
  channel         MessageChannel
  body            String   @db.Text
  status          MessageStatus @default(PENDING)
  externalId      String?  // Twilio SID or Resend message ID
  sentAt          DateTime?
  deliveredAt     DateTime?
  aiAssisted      Boolean  @default(false)  // true if drafted via AI comms feature
  createdAt       DateTime @default(now())

  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
  @@index([tenantId])
}

enum MessageDirection {
  OUTBOUND   // operator → candidate
  INBOUND    // candidate → operator (future: WhatsApp replies)
}

enum MessageChannel {
  EMAIL
  SMS
  WHATSAPP   // Could-1; channel field exists from day one per PRD architecture constraint
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}

// ─────────────────────────────────────────────
// UK RIGHT TO WORK
// ─────────────────────────────────────────────

// Immutable after creation. Created by system when RTW workflow is triggered.
// The verifyingUserId and all timestamps are write-once.

model RightToWorkCheck {
  id                String   @id @default(cuid())
  tenantId          String
  applicationId     String   @unique
  checkType         RtwCheckType
  result            RtwResult
  documentType      String?  // e.g. "UK Passport", "BRP", "Share Code"
  permissionExpiry  DateTime?  // for time-limited permissions; triggers expiry alert
  gbgCheckId        String?    // GBG IDVT external reference
  verifyingUserId   String     // Clerk user ID of operator who triggered the check
  completedAt       DateTime   @default(now())
  // No updatedAt — this record is immutable after creation

  application       Application @relation(fields: [applicationId], references: [id])

  @@index([tenantId])
}

enum RtwCheckType {
  IDVT          // digital check via GBG IDVT (UK/Irish passport holders)
  SHARE_CODE    // online check via UKVI share code
  MANUAL        // manual document inspection (legacy; audit record only)
}

enum RtwResult {
  PASS
  FAIL
  PENDING
}

// ─────────────────────────────────────────────
// INTERVIEW SLOTS
// ─────────────────────────────────────────────

model InterviewSlot {
  id              String   @id @default(cuid())
  applicationId   String
  tenantId        String
  proposedAt      DateTime
  confirmedAt     DateTime?
  status          SlotStatus @default(PROPOSED)
  reminderSentAt  DateTime?
  createdAt       DateTime @default(now())

  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
}

enum SlotStatus {
  PROPOSED
  CONFIRMED
  DECLINED
  EXPIRED
}

// ─────────────────────────────────────────────
// OFFER
// ─────────────────────────────────────────────

model Offer {
  id              String   @id @default(cuid())
  applicationId   String   @unique
  tenantId        String
  letterDocumentKey String?   // Cloudflare R2 key for the generated offer letter
  acceptanceToken String   @unique @default(cuid())  // token in candidate-facing acceptance URL
  status          OfferStatus @default(SENT)
  sentAt          DateTime @default(now())
  respondedAt     DateTime?

  application     Application @relation(fields: [applicationId], references: [id])

  @@index([tenantId])
  @@index([acceptanceToken])
}

enum OfferStatus {
  SENT
  ACCEPTED
  DECLINED
  EXPIRED
}

// ─────────────────────────────────────────────
// TALENT POOL (Should-1)
// ─────────────────────────────────────────────

model TalentPoolEntry {
  id              String   @id @default(cuid())
  tenantId        String
  candidateId     String
  originalRole    String
  locationId      String?
  tag             TalentPoolTag
  notes           String?  @db.Text
  externalWfmId   String?  // Could-2: populated when WFM handoff is implemented
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  candidate       Candidate @relation(fields: [candidateId], references: [id])
  consent         ConsentRecord?

  @@unique([tenantId, candidateId])  // one talent pool entry per candidate per tenant
  @@index([tenantId])
}

enum TalentPoolTag {
  REHIRE_ELIGIBLE
  CONDITIONAL_REHIRE
  DO_NOT_REENGAGE
}

// ─────────────────────────────────────────────
// BACKGROUND JOB QUEUE (ADR-001: Vercel Cron + job_queue table)
// ─────────────────────────────────────────────

model JobQueue {
  id          String    @id @default(cuid())
  tenantId    String?   // null for system-wide jobs (e.g. global GDPR sweep)
  jobType     JobType
  payload     Json
  status      JobStatus2 @default(PENDING)
  attempts    Int       @default(0)
  maxAttempts Int       @default(3)
  runAfter    DateTime  @default(now())
  lastError   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tenant      Tenant?   @relation(fields: [tenantId], references: [id])

  @@index([status, runAfter])  // used by cron job poller
}

// Avoid name collision with Job model's JobStatus
enum JobStatus2 {
  PENDING
  RUNNING
  DONE
  FAILED
}

enum JobType {
  GDPR_PURGE_CANDIDATE          // nightly: delete expired candidate records
  TALENT_POOL_RECONSENT_REMIND  // weekly: send re-consent to expiring talent pool entries
  APPLICATION_STALE_ALERT       // hourly: alert manager on stale applications
  RTW_EXPIRY_ALERT              // daily: alert on upcoming right-to-work expiries
  OFFER_EXPIRY_CHECK            // daily: mark unresponded offers as expired
  APPLICATION_ACK_SEND          // near-real-time: send acknowledgement SMS/email after application
}

// ─────────────────────────────────────────────
// AUDIT LOG (immutable; append-only)
// ─────────────────────────────────────────────

// Used for: GDPR deletion records, AI feature invocation log, RTW override log.
// No personal data is stored in this table directly.
// candidateRef is a SHA-256 hash of candidateId — not reversible, but correlatable
// within a tenant's own records if needed for audit purposes.

model AuditLog {
  id            String   @id @default(cuid())
  tenantId      String
  eventType     AuditEventType
  actorUserId   String?  // Clerk user ID; null for system events
  candidateRef  String?  // SHA-256(candidateId) — anonymised reference
  applicationRef String? // SHA-256(applicationId)
  metadata      Json?    // event-specific data: feature type, input structure, reason codes
  createdAt     DateTime @default(now())
  // No updatedAt — append-only

  tenant        Tenant   @relation(fields: [tenantId], references: [id])

  @@index([tenantId, eventType])
  @@index([createdAt])
}

enum AuditEventType {
  GDPR_CANDIDATE_DELETED
  GDPR_DSAR_EXPORTED
  GDPR_ERASURE_REQUESTED
  GDPR_CONSENT_REVOKED
  RTW_CHECK_OVERRIDDEN        // Group Admin overrode a failed or pending RTW check
  AI_JD_GENERATION            // AI job description feature invoked
  AI_COMMS_DRAFT              // AI communications draft feature invoked
  AI_INTERVIEW_QUESTIONS      // AI interview question suggestions invoked
  OFFER_ACCEPTED
  OFFER_DECLINED
  CANDIDATE_HIRED
  CANDIDATE_REJECTED
}
```

---

## 3. SQL DDL (key tables — abbreviated for critical structures)

Full DDL is generated by Prisma Migrate from the schema above. The following DDL is provided
for human review and to make architectural decisions legible without running Prisma tooling.

```sql
-- Consent records table — illustrating the first-class consent model
CREATE TABLE "ConsentRecord" (
    "id"                TEXT NOT NULL PRIMARY KEY,
    "tenantId"          TEXT NOT NULL,
    "candidateId"       TEXT NOT NULL,
    "consentType"       TEXT NOT NULL CHECK ("consentType" IN ('APPLICATION', 'TALENT_POOL')),
    "consentDate"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "consentExpiry"     TIMESTAMPTZ NOT NULL,
    "renewedAt"         TIMESTAMPTZ,
    "revokedAt"         TIMESTAMPTZ,
    "sourceIp"          TEXT,
    "applicationId"     TEXT UNIQUE,
    "talentPoolEntryId" TEXT UNIQUE,
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id"),
    FOREIGN KEY ("talentPoolEntryId") REFERENCES "TalentPoolEntry"("id")
);

CREATE INDEX "ConsentRecord_tenantId_consentExpiry_idx"
    ON "ConsentRecord"("tenantId", "consentExpiry");

-- Right to work check — immutable after insert, no UPDATE trigger
CREATE TABLE "RightToWorkCheck" (
    "id"               TEXT NOT NULL PRIMARY KEY,
    "tenantId"         TEXT NOT NULL,
    "applicationId"    TEXT NOT NULL UNIQUE,
    "checkType"        TEXT NOT NULL CHECK ("checkType" IN ('IDVT', 'SHARE_CODE', 'MANUAL')),
    "result"           TEXT NOT NULL CHECK ("result" IN ('PASS', 'FAIL', 'PENDING')),
    "documentType"     TEXT,
    "permissionExpiry" TIMESTAMPTZ,
    "gbgCheckId"       TEXT,
    "verifyingUserId"  TEXT NOT NULL,
    "completedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
);

-- Prevent updates to RightToWorkCheck (immutability enforced at DB level)
CREATE RULE rtw_no_update AS ON UPDATE TO "RightToWorkCheck" DO INSTEAD NOTHING;

-- Job queue — polling index
CREATE INDEX "JobQueue_status_runAfter_idx"
    ON "JobQueue"("status", "runAfter")
    WHERE "status" = 'PENDING';

-- Audit log — append-only enforced at DB level
CREATE RULE audit_no_update AS ON UPDATE TO "AuditLog" DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO "AuditLog" DO INSTEAD NOTHING;
```

---

## 4. Multi-Tenancy Enforcement

The Prisma client extension that enforces tenant isolation on all queries:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const TENANT_SCOPED_MODELS = [
  'Job', 'Location', 'Application', 'Candidate', 'ConsentRecord',
  'PipelineEvent', 'Message', 'RightToWorkCheck', 'InterviewSlot',
  'Offer', 'TalentPoolEntry', 'JobQueue', 'AuditLog',
  'ScreeningQuestion', 'ScreeningResponse', 'LocationAssignment',
]

export function createTenantClient(tenantId: string) {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_SCOPED_MODELS.includes(model ?? '')) return query(args)

          const writeOps = ['create', 'createMany', 'upsert']
          const readOps = ['findFirst', 'findMany', 'findUnique', 'count', 'aggregate']
          const mutateOps = ['update', 'updateMany', 'delete', 'deleteMany']

          if (writeOps.includes(operation)) {
            args.data = { ...args.data, tenantId }
          }
          if (readOps.includes(operation)) {
            args.where = { ...args.where, tenantId }
          }
          if (mutateOps.includes(operation)) {
            args.where = { ...args.where, tenantId }
          }
          return query(args)
        },
      },
    },
  })
}
```

The `tenantId` is sourced from the authenticated Clerk session (organisation ID) in every
Route Handler and Server Action. The Prisma client is never instantiated without a tenantId.

---

## 5. GDPR Deletion Logic

The nightly `GDPR_PURGE_CANDIDATE` job processes candidates whose consent has expired and
whose most recent application was rejected/withdrawn over 12 months ago:

```sql
-- Candidates eligible for deletion (run by nightly job)
SELECT c.id
FROM "Candidate" c
JOIN "ConsentRecord" cr ON cr."candidateId" = c.id
  AND cr."consentType" = 'APPLICATION'
  AND cr."consentExpiry" < NOW()
  AND cr."revokedAt" IS NULL
WHERE c."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Application" a
    WHERE a."candidateId" = c.id
      AND a.stage NOT IN ('REJECTED', 'WITHDRAWN')
  )
  AND NOT EXISTS (
    -- Retain if right-to-work record requires retention (employment + 2 years)
    SELECT 1 FROM "RightToWorkCheck" rtw
    JOIN "Application" a ON a.id = rtw."applicationId"
    WHERE a."candidateId" = c.id
      AND rtw.result = 'PASS'
      -- RTW retention: 2 years from hire date; approximate as 2 years from check
      AND rtw."completedAt" > NOW() - INTERVAL '2 years'
  )
```

---

## 6. Design Rationale

### Why Candidate is tenant-scoped, not global

A global candidate identity (one Candidate row per email address across all tenants) would be
simpler from a de-duplication perspective but creates a GDPR data-sharing problem: two
unrelated operators sharing a candidate record is a GDPR data breach. Tenant-scoped candidates
mean each operator owns their own candidate data independently. A person applying to two
different Lapam-ATS tenants creates two Candidate records — this is correct behaviour.

### Why ConsentRecord is a separate entity, not a field on Candidate or Application

The seasonal talent pool (Should-1) requires two distinct consent types with different expiry
dates, different re-consent workflows, and different deletion triggers. If consent were a field
on Application (e.g. `gdprConsentAt: DateTime`), the talent pool feature would require a schema
migration to add talent pool consent. Making ConsentRecord a first-class entity with a
`consentType` discriminator means both consent types are handled by a single infrastructure.
The GDPR deletion scheduler queries a single table regardless of consent type.

### Why RightToWorkCheck has no `updatedAt` and is immutable at DB level

A right-to-work check record is a legal document. UK guidance requires employers to retain
evidence of checks in their original form. A mutable record could be altered after the fact —
either accidentally (ORM `updateMany` calls, migrations) or maliciously. PostgreSQL `RULE`
prevents any UPDATE to the table at the database level. The Prisma model has no `updatedAt`
field to reinforce this. If a check is performed again (e.g. because a visa was renewed), a
new `RightToWorkCheck` row is created — the original is never modified.

### Why `externalWfmId` and `channel` fields exist at MVP despite their features being post-MVP

The PRD specifies two architecture constraints: (1) the `Message.channel` field must exist from
day one so that adding WhatsApp (Could-1) requires no migration; (2) the `TalentPoolEntry.
externalWfmId` field must exist so that WFM sync (Could-2) is an additive feature. Adding a
nullable column at launch costs nothing. Adding it later requires a migration in production and
potential downtime. Both fields are nullable and invisible to MVP feature code — they are
schema-forward declarations for planned features.
