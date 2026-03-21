---
title: "TASKS — Lapam-ATS"
type: tasks
agent: specification
status: draft
version: 1.0
created: 2026-03-22
parent: docs/specs/PRD.md
architecture: docs/specs/ADR-001-tech-stack.md
---

# Implementation Tasks: Lapam-ATS

Tasks are ordered by dependency. Each task is sized for a single agent session (5–15 minutes
of agent work). Complete Phase 0 before Phase 1, and so on. Within a phase, tasks with no
inter-dependency can be executed in any order.

**Task tiers:**
- **Small** — single file or trivial multi-file; < 10 min
- **Medium** — multi-file, moderate complexity; 10–15 min
- **Large** — do not use; decompose further if encountered

---

## Phase 0: Project Foundation

---

### TASK-001: Scaffold Next.js project

- **Description:** Initialise the Next.js 15 project with TypeScript, Tailwind CSS v4, and
  shadcn/ui. Set up the base directory structure (`src/app`, `src/components`, `src/lib`,
  `src/modules`). Add `.env.example` with all required environment variable names.
- **Depends on:** none
- **Reads:** ADR-001 §2 (Web Framework), §10 (Deployment)
- **Creates:** `package.json`, `tsconfig.json`, `tailwind.config.ts`,
  `src/app/layout.tsx`, `src/app/page.tsx`, `.env.example`, `README.md`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given the repo is cloned, When `pnpm install && pnpm dev` is run, Then the dev server starts
    on `localhost:3000` with no TypeScript errors
  - Given the project is scaffolded, When `pnpm build` is run, Then the build completes
    successfully with zero errors
- **Verifies:** `pnpm build`

---

### TASK-002: Connect Prisma to Neon and run initial migration

- **Description:** Install Prisma, add the full schema from `db-schema.md`, configure the
  Neon connection string, and run the initial migration to create all tables. Generate the
  Prisma client.
- **Depends on:** TASK-001
- **Reads:** db-schema.md (full Prisma schema section)
- **Creates:** `prisma/schema.prisma`, `prisma/migrations/0001_initial/migration.sql`
- **Modifies:** `package.json` (add prisma, @prisma/client)
- **Tier:** Small
- **Acceptance criteria:**
  - Given DATABASE_URL is set to a Neon development branch, When `pnpm prisma migrate dev` is
    run, Then the migration succeeds with all tables created and no errors
  - Given the migration has run, When `pnpm prisma studio` is opened, Then all models from
    db-schema.md are visible in the schema browser
- **Verifies:** `pnpm prisma migrate status`

---

### TASK-003: Integrate Clerk auth and tenant middleware

- **Description:** Install `@clerk/nextjs`. Add Clerk middleware to protect all `/app/`
  routes except `/apply/*`, `/interview/*`, `/offer/*`, `/rtw/*`, and `/api/public/*`.
  Implement the `createTenantClient` Prisma extension from db-schema.md §4. Export a
  `getTenantClient()` helper that extracts tenantId from the Clerk session orgId.
- **Depends on:** TASK-002
- **Reads:** ADR-001 §4 (Auth), db-schema.md §4 (Multi-tenancy enforcement)
- **Creates:** `src/middleware.ts`, `src/lib/prisma.ts`, `src/lib/auth.ts`
- **Modifies:** `src/app/layout.tsx` (wrap with ClerkProvider)
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a user is not signed in, When they navigate to `/dashboard`, Then they are redirected
    to `/sign-in`
  - Given a signed-in user belongs to Clerk org `org_abc`, When `getTenantClient()` is called
    in a Route Handler, Then the returned Prisma client injects `tenantId: "org_abc"` on all
    queries
  - Given the tenant client is in use, When a query is made without a tenantId in scope, Then
    the query throws rather than returning cross-tenant data
- **Verifies:** `pnpm vitest run src/lib/auth.test.ts`

---

### TASK-004: RBAC role helpers and route guards

- **Description:** Implement role-checking utilities using Clerk's `publicMetadata.role` field.
  Roles: `group_admin`, `location_manager`, `read_only`. Create a `requireRole()` helper for
  use in Route Handlers and Server Actions. Create a `getUserLocations()` helper that returns
  the list of location IDs a `location_manager` is assigned to (reads `LocationAssignment`
  table).
- **Depends on:** TASK-003
- **Reads:** ADR-001 §4 (RBAC roles), PRD §4.1 Must-8
- **Creates:** `src/lib/rbac.ts`, `src/lib/rbac.test.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a user with role `location_manager`, When `requireRole('group_admin')` is called,
    Then it throws an Unauthorized error with status 403
  - Given a user with role `group_admin`, When `requireRole('group_admin')` is called, Then
    it resolves without error
  - Given a `location_manager` assigned to locations `[loc_1, loc_2]`, When
    `getUserLocations()` is called, Then it returns `["loc_1", "loc_2"]`
- **Verifies:** `pnpm vitest run src/lib/rbac.test.ts`

---

## Phase 1: Organisation and Location Management (Must-8)

---

### TASK-005: Location CRUD API routes

- **Description:** Implement Route Handlers for location management:
  `GET /api/locations`, `POST /api/locations`, `PATCH /api/locations/[locationId]`.
  Validate input with Zod. Require `group_admin` role for POST and PATCH.
- **Depends on:** TASK-004
- **Reads:** api-spec.yaml §/locations, PRD §4.1 Must-8
- **Creates:** `src/app/api/locations/route.ts`,
  `src/app/api/locations/[locationId]/route.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a group_admin session, When POST `/api/locations` with `{name: "Bristol", country: "GB"}`,
    Then a Location record is created with the correct tenantId and 201 is returned
  - Given a location_manager session, When POST `/api/locations`, Then 403 is returned
  - Given two tenants, When tenant A calls GET `/api/locations`, Then only tenant A's locations
    are returned
- **Verifies:** `pnpm vitest run src/app/api/locations`

---

### TASK-006: Location management UI

- **Description:** Build the `/settings/locations` page listing all locations with create and
  edit actions. Use shadcn/ui `Table` and `Sheet` (slide-in form). Country selection maps to
  the `LocationCountry` enum.
- **Depends on:** TASK-005
- **Reads:** ux-spec.md §2 (OP-04, OP-05), ADR-001 §2 (UI components)
- **Creates:** `src/app/(dashboard)/settings/locations/page.tsx`,
  `src/components/locations/location-form.tsx`,
  `src/components/locations/locations-table.tsx`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a group_admin, When they visit `/settings/locations`, Then all their locations are
    listed with name, country, and active status
  - Given the location list, When they click "Add Location", Then a side sheet opens with a
    form; on submit the new location appears in the list without a full page reload
- **Verifies:** `pnpm playwright test tests/e2e/locations.spec.ts`

---

### TASK-007: User management and location assignment UI

- **Description:** Build `/settings/users` page. List Clerk org members. Allow group_admin to
  change a user's role (via Clerk org membership metadata update) and assign/remove them from
  locations (via `POST/DELETE /api/locations/[locationId]/assignments`). Implement the
  assignment Route Handlers.
- **Depends on:** TASK-006
- **Reads:** api-spec.yaml §/locations/{locationId}/assignments, PRD §4.1 Must-8, ADR-001 §4
- **Creates:** `src/app/(dashboard)/settings/users/page.tsx`,
  `src/app/api/locations/[locationId]/assignments/route.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a group_admin, When they assign user X as location_manager for "Bristol", Then a
    `LocationAssignment` row is created and user X's dashboard shows only "Bristol"
  - Given a location_manager session, When they visit `/settings/users`, Then 403 is returned
- **Verifies:** `pnpm vitest run src/app/api/locations/[locationId]/assignments`

---

## Phase 2: Job Posting (Must-2, Must-9)

---

### TASK-008: Job CRUD API routes

- **Description:** Implement Route Handlers: `GET /api/jobs`, `POST /api/jobs`,
  `GET /api/jobs/[jobId]`, `PATCH /api/jobs/[jobId]`. Validate with Zod.
  On `GET /api/jobs`, filter by user's accessible locations for location_managers.
  Generate `applyLinkToken` (cuid) on job creation.
- **Depends on:** TASK-004
- **Reads:** api-spec.yaml §/jobs, PRD §4.1 Must-2, db-schema.md §Job
- **Creates:** `src/app/api/jobs/route.ts`, `src/app/api/jobs/[jobId]/route.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a location_manager for location A, When GET `/api/jobs`, Then only jobs for location A
    are returned
  - Given a POST to `/api/jobs` with valid payload, Then a Job record is created with
    `status: DRAFT` and a unique `applyLinkToken`
- **Verifies:** `pnpm vitest run src/app/api/jobs`

---

### TASK-009: AI job description generator endpoint

- **Description:** Implement `POST /api/ai/job-description`. Use Vercel AI SDK with Anthropic
  provider (claude-haiku-4-5). Stream the response. Input: `roleTitle` + optional `locationType`.
  Log an `AuditLog` entry with `eventType: AI_JD_GENERATION` on each invocation. No candidate
  data in the prompt.
- **Depends on:** TASK-003
- **Reads:** ADR-001 §6 (AI integration), api-spec.yaml §/ai/job-description,
  PRD §4.1 Must-9
- **Creates:** `src/app/api/ai/job-description/route.ts`,
  `src/lib/ai.ts` (Vercel AI SDK client setup with Anthropic provider)
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a valid session, When POST `/api/ai/job-description` with `{roleTitle: "Kitchen Porter"}`,
    Then a streaming text response is returned containing a job description
  - Given the invocation, When the AuditLog is queried, Then an entry with
    `eventType: AI_JD_GENERATION` exists with no personal data in metadata
  - Given the Anthropic provider is unavailable, When the endpoint is called, Then 503 is
    returned with a user-readable error message
- **Verifies:** `pnpm vitest run src/app/api/ai/job-description`

---

### TASK-010: Job create/edit form with AI JD generator UI

- **Description:** Build `/jobs/new` page and the reusable `<JobForm>` component. Include the
  role title field, location selector, employment type selector, description textarea, and an
  inline "Generate with AI" button that streams the AI response into the textarea. Apply the
  AI draft indicator styling from ux-spec.md §7. Reuse `<JobForm>` for the edit view.
- **Depends on:** TASK-008, TASK-009
- **Reads:** ux-spec.md §3 Flow 1, §7 (AI draft indicator), ADR-001 §6
- **Creates:** `src/app/(dashboard)/jobs/new/page.tsx`,
  `src/components/jobs/job-form.tsx`,
  `src/components/jobs/ai-jd-button.tsx`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given the job create form, When the user types a role title and clicks "Generate with AI",
    Then the description field fills with streamed text and shows the amber AI draft label
  - Given the draft is present, When the user edits the field, Then the AI draft label disappears
  - Given a completed form, When submitted, Then a Job in DRAFT status is created and the user
    is redirected to the job detail page
- **Verifies:** `pnpm playwright test tests/e2e/job-create.spec.ts`

---

### TASK-011: Publish job to Indeed + generate Google for Jobs structured data

- **Description:** Implement `POST /api/jobs/[jobId]/publish`. Call Indeed Sponsored Jobs API
  to post the role. Add JSON-LD `JobPosting` schema markup to the public apply page (TASK-014)
  via a `<script type="application/ld+json">` tag. Update job status to PUBLISHED.
  On job close (`PATCH status: CLOSED`), call Indeed API to delist.
- **Depends on:** TASK-008
- **Reads:** api-spec.yaml §/jobs/{jobId}/publish, PRD §4.1 Must-2
- **Creates:** `src/app/api/jobs/[jobId]/publish/route.ts`,
  `src/lib/indeed.ts`
- **Modifies:** `src/app/api/jobs/[jobId]/route.ts` (add close logic to PATCH)
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a DRAFT job, When POST `/api/jobs/[jobId]/publish`, Then the job status becomes
    PUBLISHED, `externalIndeedId` is set, and the response includes the Indeed job ID
  - Given a PUBLISHED job, When PATCH status to CLOSED, Then the Indeed API delist call is
    made and the job status becomes CLOSED
- **Verifies:** `pnpm vitest run src/app/api/jobs/[jobId]/publish`

---

## Phase 3: Candidate Application (Must-1)

---

### TASK-012: Cloudflare R2 setup and presigned upload endpoint

- **Description:** Configure Cloudflare R2 bucket (EU jurisdiction). Implement
  `POST /api/uploads/presign` — generates a 15-minute presigned PUT URL for CV, RTW document,
  or offer letter uploads. Object key pattern: `/{tenantId}/{applicationId}/{documentType}/{filename}`.
  All reads via presigned GET URLs (never public bucket access).
- **Depends on:** TASK-003
- **Reads:** ADR-001 §5 (File storage), api-spec.yaml §/uploads/presign
- **Creates:** `src/lib/r2.ts`, `src/app/api/uploads/presign/route.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a valid session, When POST `/api/uploads/presign` with a valid payload, Then a
    presigned PUT URL and object key are returned, expiring in 15 minutes
  - Given the presigned URL, When a file is PUT to it directly, Then the file is stored in R2
    under the correct tenant-scoped key
  - Given a request without a session, When POST `/api/uploads/presign`, Then 401 is returned
- **Verifies:** `pnpm vitest run src/app/api/uploads/presign`

---

### TASK-013: Public apply page — mobile-first, no-login

- **Description:** Build `/apply/[applyLinkToken]` as a multi-screen mobile form.
  Screen 1: job summary + CTA. Screen 2: name + mobile + email. Screen 3: availability
  (3 large tappable options). Screen 4 (if screening questions exist): questions. Final screen:
  GDPR consent notice + submit. No auth required. If job is closed, show a clear message.
  Include Google for Jobs JSON-LD (from TASK-011).
- **Depends on:** TASK-008
- **Reads:** ux-spec.md §3 Flow 4, §4 (breakpoints), §5 (accessibility), §6 (tokens),
  PRD §4.1 Must-1
- **Creates:** `src/app/apply/[applyLinkToken]/page.tsx`,
  `src/components/apply/apply-form.tsx`,
  `src/components/apply/gdpr-notice.tsx`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a valid apply link, When a user visits on a 375px-wide viewport, Then the form
    renders as a single-column, 4-screen flow with no horizontal scroll
  - Given the form, When the user does not check the GDPR consent checkbox, Then the submit
    button is disabled and an inline error appears on attempt
  - Given a closed job's apply token, When the page is visited, Then a "This role is no longer
    accepting applications" message is shown
- **Verifies:** `pnpm playwright test tests/e2e/apply.spec.ts`

---

### TASK-014: Application submission API and consent record creation

- **Description:** Implement `POST /api/public/jobs/[applyLinkToken]/apply`. Create `Candidate`,
  `Application`, and `ConsentRecord` (type: APPLICATION, expiry: +12 months) in a single
  database transaction. Return 400 if `consentGiven` is false. Enqueue an
  `APPLICATION_ACK_SEND` job in `JobQueue`. Return 410 if job status is CLOSED.
- **Depends on:** TASK-002, TASK-013
- **Reads:** api-spec.yaml §/public/jobs/{applyLinkToken}/apply, PRD §4.1 Must-1,
  db-schema.md §ConsentRecord
- **Creates:** `src/app/api/public/jobs/[applyLinkToken]/apply/route.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a valid apply token and consentGiven: true, When POST to the endpoint, Then a
    Candidate, Application, and ConsentRecord are created atomically in one transaction
  - Given consentGiven: false, When POST, Then 400 is returned and no records are created
  - Given a closed job's token, When POST, Then 410 is returned
  - Given a successful submission, When the JobQueue is queried, Then a
    `APPLICATION_ACK_SEND` job with status PENDING exists for this application
- **Verifies:** `pnpm vitest run src/app/api/public/jobs`

---

## Phase 4: Pipeline Dashboard (Must-3)

---

### TASK-015: Dashboard aggregate API

- **Description:** Implement `GET /api/dashboard`. For group_admin: aggregate pipeline stage
  counts across all tenant locations. For location_manager: scope to assigned locations only.
  Compute `staleAlert` flag (open role with 0 APPLIED/SCREENING/INTERVIEW candidates, role
  open ≥ 5 days). Return array of `DashboardLocation` objects.
- **Depends on:** TASK-004, TASK-008
- **Reads:** api-spec.yaml §/dashboard, PRD §4.1 Must-3
- **Creates:** `src/app/api/dashboard/route.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a tenant with 3 locations, each with jobs at various stages, When group_admin calls
    GET `/api/dashboard`, Then all 3 locations are returned with correct stage counts
  - Given a location_manager assigned to 1 location, When GET `/api/dashboard`, Then only that
    location's data is returned
  - Given a role open for 6 days with 0 active candidates, Then `staleAlert: true` for that
    location
- **Verifies:** `pnpm vitest run src/app/api/dashboard`

---

### TASK-016: Dashboard UI with real-time SSE updates

- **Description:** Build `/dashboard` page using `DashboardLocation` data. Location cards show:
  name, country, open roles count, stage counts, stale alert badge. Implement an SSE endpoint
  (`GET /api/dashboard/stream`) that pushes updated dashboard data when pipeline events occur.
  Client uses `EventSource` to listen and re-render without reload.
- **Depends on:** TASK-015
- **Reads:** ux-spec.md §2 (OP-03), §3 Flow 1, §7 (candidate card), PRD §4.1 Must-3
- **Creates:** `src/app/(dashboard)/dashboard/page.tsx`,
  `src/components/dashboard/location-card.tsx`,
  `src/components/dashboard/stale-alert-badge.tsx`,
  `src/app/api/dashboard/stream/route.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a group_admin on the dashboard, When a new application is received for any location,
    Then the relevant location card updates its APPLIED count within 10 seconds without a
    page refresh
  - Given a location with a stale alert, Then its card displays the amber stale alert badge
  - Given a location_manager, When they view the dashboard, Then only their assigned locations
    are visible
- **Verifies:** `pnpm playwright test tests/e2e/dashboard.spec.ts`

---

### TASK-017: Job detail Kanban pipeline UI and stage change

- **Description:** Build `/jobs/[jobId]` page. Show Kanban columns for each `PipelineStage`.
  Candidate cards show: name, time since applied, availability badge, knockout flag. Stage
  change via a dropdown action menu (not drag-and-drop at MVP). Stage change calls
  `PATCH /api/applications/[applicationId]/stage`. For OFFER stage at a UK location, surface
  RTW requirement inline. For REJECTED, require a confirmation step.
- **Depends on:** TASK-015, TASK-014
- **Reads:** ux-spec.md §3 Flow 2, §7 (pipeline stage change, candidate card), PRD §4.1 Must-3
- **Creates:** `src/app/(dashboard)/jobs/[jobId]/page.tsx`,
  `src/components/pipeline/kanban-board.tsx`,
  `src/components/pipeline/candidate-card.tsx`,
  `src/app/api/applications/[applicationId]/stage/route.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a job with applications in various stages, When the page loads, Then candidates
    appear in the correct Kanban column
  - Given a candidate in APPLIED, When the operator selects "Move to Screening", Then the
    candidate card moves to the SCREENING column and a PipelineEvent is created
  - Given a UK location job, When a candidate is moved to OFFER, Then an RTW requirement
    banner appears on the candidate card
  - Given REJECTED is selected, Then a confirmation bottom sheet appears before the stage
    change is committed
- **Verifies:** `pnpm playwright test tests/e2e/pipeline.spec.ts`

---

## Phase 5: Candidate Communications (Must-4, Must-10)

---

### TASK-018: Resend email and Twilio SMS integrations

- **Description:** Implement `src/lib/email.ts` (Resend + React Email) and `src/lib/sms.ts`
  (Twilio). Each exports a typed `sendEmail(to, subject, body)` and `sendSms(to, body)`
  function. Both should handle provider errors gracefully and return a result object (not
  throw). Create a React Email template for the application acknowledgement.
- **Depends on:** TASK-001
- **Reads:** ADR-001 §8 (Communications)
- **Creates:** `src/lib/email.ts`, `src/lib/sms.ts`,
  `src/emails/application-acknowledgement.tsx`
- **Modifies:** `package.json` (add resend, @react-email/components, twilio)
- **Tier:** Small
- **Acceptance criteria:**
  - Given valid Resend and Twilio credentials in env, When `sendEmail` is called with a valid
    address, Then an email is dispatched and a message ID is returned
  - Given an invalid Twilio number, When `sendSms` is called, Then it returns
    `{success: false, error: "..."}` without throwing
- **Verifies:** `pnpm vitest run src/lib/email.test.ts src/lib/sms.test.ts`

---

### TASK-019: Application acknowledgement cron job

- **Description:** Implement `POST /api/cron/stale-alert` and the acknowledgement worker.
  The cron handler reads `APPLICATION_ACK_SEND` jobs from `JobQueue` with status PENDING and
  `runAfter <= now`. For each: sends SMS or email acknowledgement to the candidate, creates a
  `Message` record, creates a `PipelineEvent` (APPLICATION_RECEIVED), marks the job DONE.
  Secure with `CRON_SECRET` header check.
- **Depends on:** TASK-018, TASK-014
- **Reads:** ADR-001 §7 (Background jobs), PRD §4.1 Must-4, db-schema.md §JobQueue
- **Creates:** `src/app/api/cron/ack/route.ts`, `src/lib/jobs/ack-worker.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a pending APPLICATION_ACK_SEND job, When the cron endpoint is called with the correct
    CRON_SECRET, Then the candidate receives an SMS/email, a Message record is created, and
    the job status becomes DONE
  - Given an incorrect CRON_SECRET, When the endpoint is called, Then 401 is returned and no
    jobs are processed
  - Given a job that has failed 3 times (attempts = maxAttempts), Then it is marked FAILED and
    not retried
- **Verifies:** `pnpm vitest run src/lib/jobs/ack-worker.test.ts`

---

### TASK-020: Candidate message compose UI with AI comms draft

- **Description:** Build the message compose view on the candidate detail page
  (`/jobs/[jobId]/applications/[applicationId]`). Include a blank textarea and an "AI Draft"
  button. AI Draft calls `POST /api/ai/comms-draft` and populates the field with the response.
  Apply AI draft indicator. Send button calls `POST /api/applications/[applicationId]/messages`.
  Display message thread history below.
- **Depends on:** TASK-017, TASK-018
- **Reads:** ux-spec.md §3 Flow 2, §7 (AI draft indicator), PRD §4.1 Must-4, Must-10
- **Creates:** `src/components/pipeline/message-compose.tsx`,
  `src/components/pipeline/message-thread.tsx`,
  `src/app/api/ai/comms-draft/route.ts`,
  `src/app/api/applications/[applicationId]/messages/route.ts`
- **Modifies:** `src/app/(dashboard)/jobs/[jobId]/applications/[applicationId]/page.tsx`
- **Tier:** Medium
- **Acceptance criteria:**
  - Given the candidate detail page, When the operator clicks "AI Draft", Then the compose
    field is populated with a drafted message and the amber AI label appears
  - Given the draft is in the field, When the operator clicks "Send", Then a Message record is
    created, the SMS/email is dispatched, and the message appears in the thread
  - Given a send, Then `aiAssisted: true` is set on the Message if AI Draft was used
- **Verifies:** `pnpm playwright test tests/e2e/messaging.spec.ts`

---

### TASK-021: Stale application alert cron job

- **Description:** Implement `POST /api/cron/stale-alert`. Query applications that have had
  no PipelineEvent for ≥ 5 business days and are not in a terminal stage (HIRED, REJECTED,
  WITHDRAWN). For each, enqueue a notification to the assigned location manager (in-app
  notification via a `Notification` record, or email if no in-app system yet).
- **Depends on:** TASK-019
- **Reads:** PRD §4.1 Must-4, ADR-001 §7, api-spec.yaml §/cron/stale-alert
- **Creates:** `src/app/api/cron/stale-alert/route.ts`,
  `src/lib/jobs/stale-alert-worker.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given an application with no PipelineEvent for 6 business days, When the cron runs, Then
    the assigned location manager receives an alert
  - Given a HIRED application, When the cron runs, Then no alert is generated for it
- **Verifies:** `pnpm vitest run src/lib/jobs/stale-alert-worker.test.ts`

---

## Phase 6: Interview Scheduling (Must-5)

---

### TASK-022: Interview slot propose API and candidate notification

- **Description:** Implement `POST /api/applications/[applicationId]/interview-slots`. Create
  up to 3 `InterviewSlot` records with status PROPOSED. Generate a `slotToken` (cuid stored
  on the application or as a query param). Send the candidate an SMS/email with the public
  slot selection URL (`/interview/[slotToken]`).
- **Depends on:** TASK-018, TASK-014
- **Reads:** api-spec.yaml §/applications/{applicationId}/interview-slots, PRD §4.1 Must-5
- **Creates:** `src/app/api/applications/[applicationId]/interview-slots/route.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a valid application, When POST with `{slots: [{proposedAt: "..."}]}`, Then
    InterviewSlot records are created and the candidate receives an SMS with the selection link
  - Given more than 3 slots in the payload, When POST, Then 400 is returned
- **Verifies:** `pnpm vitest run src/app/api/applications/[applicationId]/interview-slots`

---

### TASK-023: Public interview slot selection page

- **Description:** Build `/interview/[slotToken]`. Fetch proposed slots and display them as
  large tappable cards (date + time + duration). On selection, call `POST /api/public/
  interview-slots/[slotToken]` to confirm the slot. Show `/interview/[slotToken]/confirmed`
  on success. No login required.
- **Depends on:** TASK-022
- **Reads:** ux-spec.md §2 (CA-03, CA-04), §5 (accessibility), PRD §4.1 Must-5
- **Creates:** `src/app/interview/[slotToken]/page.tsx`,
  `src/app/interview/[slotToken]/confirmed/page.tsx`,
  `src/app/api/public/interview-slots/[slotToken]/route.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a valid slot token, When a candidate visits the page, Then proposed slots are shown
    as tappable cards with no login prompt
  - Given the candidate selects a slot, Then the slot status becomes CONFIRMED, a
    PipelineEvent (INTERVIEW_CONFIRMED) is created, and both candidate and manager receive
    a confirmation message
  - Given an expired or already-confirmed token, When the page is visited, Then an appropriate
    message is shown rather than a blank or error screen
- **Verifies:** `pnpm playwright test tests/e2e/interview-slots.spec.ts`

---

### TASK-024: Interview reminder cron job

- **Description:** Implement `POST /api/cron/interview-reminders`. Query CONFIRMED
  InterviewSlots where `proposedAt` is between 23 and 25 hours from now and
  `reminderSentAt` is null. Send reminder SMS/email to candidate and in-app notification
  to location manager. Set `reminderSentAt` on the slot.
- **Depends on:** TASK-023
- **Reads:** PRD §4.1 Must-5, ADR-001 §7
- **Creates:** `src/app/api/cron/interview-reminders/route.ts`,
  `src/lib/jobs/reminder-worker.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a confirmed interview 24 hours away, When the cron runs, Then the candidate and
    manager each receive a reminder and `reminderSentAt` is set
  - Given the same slot, When the cron runs again, Then no duplicate reminder is sent
    (`reminderSentAt` is already set)
- **Verifies:** `pnpm vitest run src/lib/jobs/reminder-worker.test.ts`

---

## Phase 7: UK Right to Work (Must-6)

---

### TASK-025: RTW workflow API and GBG IDVT integration

- **Description:** Implement `POST /api/applications/[applicationId]/rtw` to initiate the
  RTW workflow. Generate an `rtwToken` and send the candidate the `/rtw/[rtwToken]` link.
  Implement the GBG IDVT webhook receiver (`POST /api/webhooks/gbg`) which receives the
  check result, creates an immutable `RightToWorkCheck` record, creates a PipelineEvent
  (RTW_COMPLETED), and notifies the location manager.
- **Depends on:** TASK-018, TASK-014
- **Reads:** PRD §4.1 Must-6, api-spec.yaml §/applications/{applicationId}/rtw,
  db-schema.md §RightToWorkCheck
- **Creates:** `src/app/api/applications/[applicationId]/rtw/route.ts`,
  `src/app/api/webhooks/gbg/route.ts`,
  `src/lib/gbg.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a valid application at a GB location, When POST `/api/applications/[id]/rtw`, Then
    the candidate receives an SMS with the RTW link and the check status is PENDING
  - Given GBG webhook fires with a PASS result, When the webhook is received, Then a
    `RightToWorkCheck` record is created and cannot be subsequently updated (PUT returns 405)
  - Given GBG webhook fires with a FAIL result, Then the location manager is notified and the
    candidate card shows "RTW check failed"
- **Verifies:** `pnpm vitest run src/app/api/applications/[applicationId]/rtw`

---

### TASK-026: Public RTW verification page

- **Description:** Build `/rtw/[rtwToken]`. Present two options as large tappable cards:
  "I have a UK/Irish passport" (IDVT flow via GBG SDK/redirect) and "I have a share code"
  (text input, submits to UKVI-compatible endpoint). Both paths post result back to GBG for
  the webhook to complete. Show a confirmation screen on submission. No login required.
- **Depends on:** TASK-025
- **Reads:** ux-spec.md §3 Flow 5, §2 (CA-06), §4, §5, PRD §4.1 Must-6
- **Creates:** `src/app/rtw/[rtwToken]/page.tsx`,
  `src/components/rtw/check-type-selector.tsx`,
  `src/components/rtw/share-code-form.tsx`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a valid RTW token, When the candidate visits on mobile, Then two check type options
    are displayed as large tappable cards with no login required
  - Given the IDVT option is selected, Then the GBG SDK/redirect is initiated
  - Given the share code option is selected and a code is entered, Then the code is submitted
    and a "Check submitted" confirmation is shown
- **Verifies:** `pnpm playwright test tests/e2e/rtw.spec.ts`

---

### TASK-027: RTW OFFER stage gate and Group Admin override

- **Description:** Extend the stage change API (TASK-017) to check: if the target stage is
  HIRED and the location is GB country, then block unless a PASS `RightToWorkCheck` exists
  for the application. The OFFER stage itself is not blocked — only HIRED. Implement a Group
  Admin override endpoint `POST /api/applications/[applicationId]/rtw/override` that allows
  HIRED with a reason; logs to AuditLog with `eventType: RTW_CHECK_OVERRIDDEN`.
- **Depends on:** TASK-025, TASK-017
- **Reads:** PRD §4.1 Must-6, ux-spec.md §3 Flow 5 (RTW gate), db-schema.md §AuditLog
- **Creates:** `src/app/api/applications/[applicationId]/rtw/override/route.ts`
- **Modifies:** `src/app/api/applications/[applicationId]/stage/route.ts`
- **Tier:** Small
- **Acceptance criteria:**
  - Given a UK application without a PASS RTW check, When PATCH stage to HIRED, Then 409 is
    returned with a clear message
  - Given a group_admin calls the override endpoint with a reason, Then the stage change
    succeeds and an AuditLog entry with `RTW_CHECK_OVERRIDDEN` is created
  - Given a location_manager calls the override endpoint, Then 403 is returned
- **Verifies:** `pnpm vitest run src/app/api/applications/[applicationId]/rtw`

---

## Phase 8: GDPR Compliance Infrastructure (Must-7)

---

### TASK-028: GDPR nightly purge cron job

- **Description:** Implement `POST /api/cron/gdpr-purge`. Execute the deletion query from
  db-schema.md §5 to identify eligible candidates. For each: delete Candidate personal fields
  (set `deletedAt`, null out `firstName`, `lastName`, `mobileNumber`, `email`), cascade-delete
  Application documents from R2, delete ConsentRecord. Create an AuditLog entry with
  `eventType: GDPR_CANDIDATE_DELETED` and `candidateRef` as SHA-256 hash. Mark JobQueue entry
  DONE.
- **Depends on:** TASK-003, TASK-012
- **Reads:** PRD §4.1 Must-7, db-schema.md §5 (GDPR deletion logic), ADR-001 §7
- **Creates:** `src/app/api/cron/gdpr-purge/route.ts`,
  `src/lib/jobs/gdpr-purge-worker.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a candidate whose consent expired 13 months ago with only REJECTED applications,
    When the cron runs, Then their personal data fields are nulled and an AuditLog entry is
    created — the Candidate row is retained (soft delete) for referential integrity
  - Given a candidate with a PASS RTW check from 18 months ago (within the 2-year retention
    window), When the cron runs, Then they are NOT deleted
  - Given an active application (not REJECTED/WITHDRAWN), Then the candidate is NOT deleted
    regardless of consent expiry
- **Verifies:** `pnpm vitest run src/lib/jobs/gdpr-purge-worker.test.ts`

---

### TASK-029: DSAR export and right-to-erasure endpoints

- **Description:** Implement `POST /api/candidates/[candidateId]/dsar` — enqueues a job that
  collects all data for the candidate and writes a JSON export to R2, then emails the Group
  Admin a download link. Implement `POST /api/candidates/[candidateId]/erasure` — enqueues
  immediate deletion (same logic as TASK-028 purge, bypassing the retention period check,
  except for RTW records within the 2-year window).
- **Depends on:** TASK-028
- **Reads:** api-spec.yaml §/candidates/{candidateId}/dsar and /erasure, PRD §4.1 Must-7
- **Creates:** `src/app/api/candidates/[candidateId]/dsar/route.ts`,
  `src/app/api/candidates/[candidateId]/erasure/route.ts`,
  `src/lib/jobs/dsar-worker.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a DSAR request, When the job is processed, Then a JSON file containing all candidate
    data is uploaded to R2 and the Group Admin receives an email with a presigned download link
    valid for 24 hours
  - Given an erasure request, When the job is processed, Then all personal data is deleted
    within the same session, AuditLog entry created
  - Given an application with a PASS RTW check from 6 months ago, When erasure runs, Then the
    RTW record is retained and the AuditLog notes the retention exception
- **Verifies:** `pnpm vitest run src/lib/jobs/dsar-worker.test.ts`

---

### TASK-030: Talent pool re-consent reminder cron job

- **Description:** Implement `POST /api/cron/reconsent-remind`. Query ConsentRecords of type
  TALENT_POOL where `consentExpiry` is within 30 days and `renewedAt` is null and
  `revokedAt` is null. For each, send a re-consent SMS/email with a re-consent link. If
  `consentExpiry` has already passed and no renewal, enqueue a `GDPR_PURGE_CANDIDATE` job for
  the candidate.
- **Depends on:** TASK-028, TASK-018
- **Reads:** PRD §4.2 Should-1, ADR-001 §7, db-schema.md §ConsentRecord
- **Creates:** `src/app/api/cron/reconsent-remind/route.ts`,
  `src/lib/jobs/reconsent-worker.ts`
- **Modifies:** —
- **Tier:** Small
- **Acceptance criteria:**
  - Given a talent pool entry whose consent expires in 25 days, When the cron runs, Then the
    candidate receives a re-consent message
  - Given a talent pool entry whose consent expired 5 days ago with no renewal, When the cron
    runs, Then a GDPR_PURGE_CANDIDATE job is enqueued for that candidate
- **Verifies:** `pnpm vitest run src/lib/jobs/reconsent-worker.test.ts`

---

## Phase 9: Offer Management (Should-3)

---

### TASK-031: Offer create API and public acceptance page

- **Description:** Implement `POST /api/applications/[applicationId]/offer`. Generate an offer
  record with a unique `acceptanceToken`. Optionally attach a generated offer letter PDF (basic
  HTML-to-PDF via a server-side library; template is plain text at MVP). Send the candidate
  a link to `/offer/[acceptanceToken]`. Build the public offer page — show offer details and
  two buttons: "Accept" and "Decline". POST result to `POST /api/public/offers/[acceptanceToken]`.
  On acceptance, advance application to HIRED (triggers RTW gate check).
- **Depends on:** TASK-027, TASK-018, TASK-012
- **Reads:** api-spec.yaml §/applications/{applicationId}/offer and §/public/offers,
  PRD §4.2 Should-3, ux-spec.md §2 (CA-05)
- **Creates:** `src/app/api/applications/[applicationId]/offer/route.ts`,
  `src/app/offer/[acceptanceToken]/page.tsx`,
  `src/app/api/public/offers/[acceptanceToken]/route.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given an application at OFFER stage, When POST `/api/applications/[id]/offer`, Then an
    Offer record is created and the candidate receives an SMS with the acceptance link
  - Given the acceptance page, When the candidate clicks "Accept", Then the Offer status
    becomes ACCEPTED, the application moves to HIRED (UK RTW gate applies), and the manager
    is notified
  - Given "Decline", Then Offer status becomes DECLINED and manager is notified
- **Verifies:** `pnpm playwright test tests/e2e/offer.spec.ts`

---

## Phase 10: Screening Questions (Should-2)

---

### TASK-032: Screening questions on job form and application display

- **Description:** Add up to 5 screening questions to the job create/edit form (TASK-010).
  Store via `ScreeningQuestion` records. Render questions on the public apply page (TASK-013)
  as the additional form screen. Save responses as `ScreeningResponse` records on submission.
  Display responses and knockout flag on the candidate card in the pipeline.
- **Depends on:** TASK-010, TASK-014, TASK-017
- **Reads:** PRD §4.2 Should-2, api-spec.yaml §ScreeningQuestionCreate, ux-spec.md §7
- **Creates:** `src/components/jobs/screening-questions-builder.tsx`
- **Modifies:** `src/components/jobs/job-form.tsx` (add screening questions section),
  `src/app/apply/[applyLinkToken]/page.tsx` (add questions screen),
  `src/app/api/public/jobs/[applyLinkToken]/apply/route.ts` (persist responses),
  `src/components/pipeline/candidate-card.tsx` (show responses + knockout badge)
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a job with 2 knockout questions, When a candidate answers both unfavourably, Then
    their candidate card shows a knockout flag — they are NOT hidden and NOT auto-rejected
  - Given a job with 3 questions, When a candidate applies, Then the questions appear as
    a screen in the application form with appropriate input types
- **Verifies:** `pnpm playwright test tests/e2e/screening.spec.ts`

---

## Phase 11: Talent Pool CRM (Should-1)

---

### TASK-033: Talent pool entry creation on hire record close

- **Description:** When a HIRED application is closed (employee departs), add a UI action
  "Close hire record" on the candidate card that prompts for a `TalentPoolTag`. On confirm:
  create a `TalentPoolEntry` + a new `ConsentRecord` (type: TALENT_POOL, expiry: +12 months
  from today). This consent is distinct from the application consent.
- **Depends on:** TASK-017, TASK-014
- **Reads:** PRD §4.2 Should-1, db-schema.md §TalentPoolEntry, db-schema.md §ConsentRecord
- **Creates:** `src/components/pipeline/close-hire-sheet.tsx`,
  `src/app/api/applications/[applicationId]/close-hire/route.ts`
- **Modifies:** `src/components/pipeline/candidate-card.tsx`
- **Tier:** Small
- **Acceptance criteria:**
  - Given a HIRED candidate card, When "Close hire record" is tapped and "Re-hire eligible"
    is selected, Then a TalentPoolEntry and a TALENT_POOL ConsentRecord are created
  - Given the same candidate, When the talent pool is viewed, Then they appear with the
    correct tag and consent expiry date
- **Verifies:** `pnpm vitest run src/app/api/applications/[applicationId]/close-hire`

---

### TASK-034: Talent pool list UI and bulk re-engagement campaign

- **Description:** Build `/talent-pool` page. List entries with: name, original role, location,
  tag badge, consent expiry. Filter by tag and location. Bulk select. "Send Re-engagement"
  button opens campaign compose sheet (`/talent-pool/campaigns/new` as a sheet, not a page).
  Campaign compose: editable message template, recipient count, channel selector. Submit calls
  `POST /api/talent-pool/campaigns`.
- **Depends on:** TASK-033
- **Reads:** ux-spec.md §3 Flow 3, §2 (OP-10, OP-11), PRD §4.2 Should-1,
  api-spec.yaml §/talent-pool/campaigns
- **Creates:** `src/app/(dashboard)/talent-pool/page.tsx`,
  `src/components/talent-pool/talent-pool-table.tsx`,
  `src/components/talent-pool/campaign-compose-sheet.tsx`,
  `src/app/api/talent-pool/campaigns/route.ts`,
  `src/app/api/talent-pool/route.ts`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a talent pool with 20 entries, When the page loads, Then all entries are listed with
    tag badges and consent expiry dates visible
  - Given the user selects 15 entries and clicks "Send Re-engagement", Then a compose sheet
    opens showing "15 recipients"
  - Given the message is sent, Then 15 SMS/email messages are dispatched and a JobQueue entry
    with the batch is created
- **Verifies:** `pnpm playwright test tests/e2e/talent-pool.spec.ts`

---

## Phase 12: AI Interview Questions (Should-4)

---

### TASK-035: AI interview question suggestions endpoint and UI

- **Description:** Implement `POST /api/ai/interview-questions`. Use role title and
  locationType as context only — no candidate PII. Return 5–8 questions as a JSON array. Log
  to AuditLog. On the candidate detail page, add an "Interview Prep" section with a "Suggest
  Questions" button that fetches and renders questions as a selectable checklist.
- **Depends on:** TASK-009, TASK-017
- **Reads:** PRD §4.2 Should-4, api-spec.yaml §/ai/interview-questions, ADR-001 §6
- **Creates:** `src/app/api/ai/interview-questions/route.ts`,
  `src/components/pipeline/interview-prep.tsx`
- **Modifies:** `src/app/(dashboard)/jobs/[jobId]/applications/[applicationId]/page.tsx`
- **Tier:** Small
- **Acceptance criteria:**
  - Given an open application, When the operator clicks "Suggest Questions", Then 5–8
    role-appropriate interview questions are returned and displayed as a checklist
  - Given the questions are displayed, When the operator checks 3, Then those 3 are saved to
    the application's interview plan (stored as a JSON field on InterviewSlot or as notes)
  - Given the AI provider is unavailable, Then an inline error is shown and the checklist
    area remains empty
- **Verifies:** `pnpm vitest run src/app/api/ai/interview-questions`

---

## Phase 13: Analytics (Should-5)

---

### TASK-036: Analytics API and dashboard UI

- **Description:** Implement `GET /api/analytics` returning time-to-fill by location/role,
  application volume by source, pipeline conversion rates, and per-location cost-per-hire
  estimate for the trailing 90 days. Build `/analytics` page with summary cards and a table.
  Add "Export CSV" button that triggers a client-side CSV download from the API response.
- **Depends on:** TASK-015, TASK-014
- **Reads:** PRD §4.2 Should-5, api-spec.yaml §/analytics (implicit), ux-spec.md §2 (OP-12)
- **Creates:** `src/app/api/analytics/route.ts`,
  `src/app/(dashboard)/analytics/page.tsx`,
  `src/components/analytics/metrics-table.tsx`
- **Modifies:** —
- **Tier:** Medium
- **Acceptance criteria:**
  - Given a tenant with 3 months of hire data, When GET `/api/analytics`, Then time-to-fill
    and conversion rates are returned for each location
  - Given the analytics page, When "Export CSV" is clicked, Then a CSV file downloads with the
    displayed data
  - Given a location_manager session, When GET `/api/analytics`, Then only data for their
    assigned locations is returned
- **Verifies:** `pnpm vitest run src/app/api/analytics`

---

## Self-Review Checklist

Run before presenting the complete stack for operator review:

- [ ] Every PRD Must-Have feature maps to at least one task with a `verifies:` command
- [ ] Every Should-Have feature maps to at least one task
- [ ] Every API endpoint in `api-spec.yaml` is implemented by a task
- [ ] Every `db-schema.md` entity is created in TASK-002 and used by at least one subsequent task
- [ ] GDPR deletion, DSAR, and erasure are all covered with test-verified tasks
- [ ] RTW gate (TASK-027) is covered by E2E test
- [ ] AI features (TASK-009, TASK-020, TASK-035) all log to AuditLog
- [ ] No task has a `creates:` scope that another task also creates (no overlapping ownership)
- [ ] All cron endpoints are secured by CRON_SECRET check
- [ ] All public endpoints (apply, interview, offer, RTW) have no Clerk auth requirement
