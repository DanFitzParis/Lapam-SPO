---
title: "PRD — Lapam-ATS"
type: prd
agent: specification
status: draft
version: 1.0
created: 2026-03-22
parent: docs/research/executive-summary.md
architecture: docs/specs/ADR-001-tech-stack.md
---

# Product Requirements Document: Lapam-ATS

---

## 1. Problem Statement

Independent hospitality groups operating 5–50 locations across 2+ countries hire 200–2,000
people per year using informal stacks: job board subscriptions, spreadsheets, email, and WhatsApp
group chats. This stack fails them in three specific, costly ways.

**Visibility failure.** Group-level HR cannot see which locations have a staffing crisis until a
manager calls them. There is no pipeline. There is no early warning. Decisions are reactive.

**Speed failure.** The hospitality candidate takes another job within hours of applying if they
receive no response. Manual routing of applications through email means most operators respond
in days. Candidates are gone.

**Compliance failure.** GDPR consent is not captured at application. UK right-to-work checks are
done manually with paper documents and no audit trail. The informal stack cannot survive a
compliance audit.

Enterprise ATS platforms (Harri, Fourth) solve these problems but are priced and scoped for
500+ location chains with dedicated TA teams. SMB tools (Workstream, StaffedUp, HigherMe) are
US-only and do not serve multi-jurisdiction operators. The mid-market multi-location international
group is unserved.

Lapam-ATS is a standalone, multi-tenant SaaS ATS built specifically for this segment: multi-
location pipeline visibility, mobile-first candidate experience, seasonal talent pool management,
and UK/EU compliance built into the data model — at accessible, location-based pricing.

---

## 2. Strategic Context

This is a zero-to-one experiment. All strategic conclusions are hypothesis-grade pending customer
validation. The following assumptions are carried into this PRD from research:

- The mid-market international hospitality group is the right ICP (medium-high confidence —
  competitive gap confirmed; addressable market size unquantified)
- The seasonal talent pool CRM is a purchase-level differentiator (medium confidence —
  unvalidated in operator interviews; treat as a strong hypothesis, not a validated finding)
- The candidate engagement window is hours, not days (high confidence — multiple converging
  sources)
- UK-first is the correct launch geography (operator decision confirmed in Decision Gate)
- Compliance architecture (GDPR + UK RTW) is a structural moat vs US-native competitors
  (high confidence — grounded in primary regulatory sources)

---

## 3. Personas

Derived from research (icp-and-personas.md). The Building Agent must not access raw research
files. Design intent is encoded here.

### Persona 1: Siobhán — Group People Director
18-location UK/Ireland group. Needs multi-location pipeline visibility, GDPR compliance
confidence, and board-level reporting on hiring performance. Buys the product. Signs the
contract. Willingness to pay: £300–600/month for the group. Decision horizon: 30 days if
demo + peer reference are positive.

**Primary JTBD:** Know which location has a staffing crisis before it becomes a service failure.

### Persona 2: Marco — Restaurant General Manager
3-location restaurant group, Netherlands. No dedicated HR. Hires between service shifts from
his phone. Every unnecessary step in the hiring workflow costs him a candidate. Will cancel
within 2 weeks if the product feels like it was designed for a 200-person HR department.

**Primary JTBD:** Post a job, see applicants, contact the good ones — all from mobile, in under
10 minutes total.

### Persona 3: Claire — Head of HR, Seasonal Hotel Group
6 UK coastal properties. Sole HR. Rebuilds the workforce from scratch every spring. Primary
use case is re-engaging last season's workers before touching new sourcing. Spends March in
controlled panic. Willingness to pay: £150–350/month. Buying trigger is the seasonal CRM
feature specifically.

**Primary JTBD:** Arrive at March with a partially filled roster instead of an empty one.

### Persona 4: Yusuf — Owner-Operator
8-location UK casual dining group. No HR. Site managers hire independently. Needs a single
view across all 8 sites without becoming a bottleneck. Will not engage with a sales team —
must self-serve to value in the first 15 minutes.

**Primary JTBD:** Know which sites have a hiring problem without making 8 phone calls on a
Monday morning.

### Persona 5: Aisha — Candidate (design constraint persona)
22-year-old, London. Applies on iPhone. Uses WhatsApp and Instagram. Abandons applications that
require account creation or are too long on mobile. Takes the job from whoever contacts her
first. Represents the conversion-rate reality of the frontline hospitality candidate pool.

**Design constraint this persona enforces:** No login required to apply. Application completable
in under 3 minutes on mobile. Automated response within 2 minutes of submission.

---

## 4. Features

### 4.1 Must-Have (defines MVP — must ship before public launch)

Must-haves are ordered: Must-1 ships before Must-2, and so on. The Building Agent must not skip
ahead.

---

#### Must-1: Candidate Application — Mobile-First, No-Login

Candidates apply via a unique job link or QR code. No account creation. No login wall.
Application completes in 4 or fewer screens on mobile. GDPR consent captured at point of
submission.

**Acceptance criteria:**

- WHEN a candidate follows a job link or scans a QR code, THEN the system SHALL render the
  application form without requiring account creation or login
- WHEN a candidate views the application form on a mobile viewport (< 768px), THEN the system
  SHALL display a single-column layout completing in 4 or fewer distinct screens
- WHEN a candidate submits personal data via the application form, THEN the system SHALL present
  a GDPR consent notice specifying the data collected, its purpose, retention period, and the
  candidate's rights before storing any data
- WHEN a candidate provides explicit consent and submits, THEN the system SHALL create a
  candidate record with a linked consent record (consent_type, consent_date, consent_expiry)
  stored as a first-class entity
- WHEN a candidate does not provide consent, THEN the system SHALL not store any personal data
  and SHALL display a confirmation of non-storage
- WHEN a candidate submits an application, THEN the system SHALL associate the application with
  the specific location and role derived from the job link used — no manual routing required

**Minimum application fields (Must-1 scope):**
First name, last name, mobile number (required), email address, role interest confirmation,
availability (checkbox: full-time / part-time / flexible), GDPR consent checkbox with inline
notice. CV upload is optional, not required.

---

#### Must-2: Job Posting — Multi-Location with Templates

Operators create job postings from role templates. Posts publish to Indeed and generate Google
for Jobs structured data. A single posting action can create parallel pipeline instances across
multiple locations.

**Acceptance criteria:**

- WHEN a Group Admin or Location Manager creates a job posting, THEN the system SHALL publish
  the role to Indeed via the Indeed API and generate structured data markup (JSON-LD schema.org
  JobPosting) within 15 minutes of publication
- WHEN creating a job posting, THEN the system SHALL allow selection from a library of role
  templates pre-populated with job title, description, and up to 5 screening questions
- WHEN a job posting is created for multiple locations simultaneously, THEN the system SHALL
  create an independent pipeline instance per location, each independently manageable by its
  assigned Location Manager
- WHEN a job posting is closed or expires, THEN the system SHALL stop accepting new applications
  and request removal from active job board listings within 30 minutes
- WHEN a job description draft is generated via AI (Must-9), THEN the system SHALL populate the
  job description field of the posting form with the draft for operator review before publication

---

#### Must-3: Multi-Location Pipeline Dashboard

The central hiring command view for Group Admin and People Director personas. Real-time.
Location-scoped for managers. Surfaces bottlenecks and stalled locations proactively.

**Acceptance criteria:**

- WHEN a user with Group Admin role views the dashboard, THEN the system SHALL display the
  hiring pipeline status for all locations in the organisation on a single screen, including:
  open roles per location, application counts per stage, and days since last activity per role
- WHEN a user with Location Manager role views the dashboard, THEN the system SHALL display only
  the pipeline for locations assigned to that user — no other location data is visible
- WHEN the application count for any pipeline stage changes, THEN the system SHALL update the
  dashboard within 10 seconds without requiring a page refresh (server-sent events or websocket)
- WHEN a location has an open role with zero active candidates and the role has been open for
  5 or more days, THEN the system SHALL display a visual alert on that location's pipeline card
- WHEN a Group Admin clicks a location card, THEN the system SHALL navigate to that location's
  detailed pipeline view showing individual candidate cards in Kanban-style stages:
  Applied → Screening → Interview → Offer → Hired / Rejected

---

#### Must-4: Automated Candidate Communication

Every application receives an immediate automated acknowledgement. Operators are alerted when
candidates go cold.

**Acceptance criteria:**

- WHEN a candidate submits an application, THEN the system SHALL send an automated
  acknowledgement message to the candidate within 2 minutes via SMS (if mobile number provided)
  or email (if only email provided)
- WHEN an operator moves a candidate from one pipeline stage to another, THEN the system SHALL
  offer a pre-drafted stage-transition message for the operator to review, edit, and send — the
  message SHALL NOT be sent automatically without operator action
- WHEN a candidate has received no pipeline stage update for 5 business days and remains in
  the pipeline (not hired or rejected), THEN the system SHALL send an alert notification to the
  assigned Location Manager
- WHEN a candidate is moved to "Rejected" stage, THEN the system SHALL offer the operator a
  rejection message template for review and optional dispatch — rejection SHALL NOT be sent
  automatically

---

#### Must-5: Interview Scheduling

Lightweight scheduling integrated into the pipeline. No third-party calendar tool required for
MVP.

**Acceptance criteria:**

- WHEN a Location Manager selects a candidate for interview, THEN the system SHALL allow the
  manager to propose up to 3 interview time slots and send them to the candidate in a single
  outbound message
- WHEN a candidate receives interview slot options, THEN the system SHALL provide a mobile-
  accessible slot selection interface requiring no login or account creation
- WHEN a candidate selects an interview time slot, THEN the system SHALL confirm the booking to
  both the candidate (via SMS or email) and the Location Manager (via in-app notification) and
  record the confirmed interview in the candidate's pipeline timeline
- WHEN an interview is confirmed, THEN the system SHALL send a reminder to both the candidate
  and the Location Manager 24 hours before the scheduled time
- WHEN a candidate does not respond to interview slot options within 48 hours, THEN the system
  SHALL alert the Location Manager

---

#### Must-6: UK Right to Work Verification

A launch blocker for the UK market. Every UK hire must have a timestamped right-to-work record
before their first shift. GBG IDVT integration for digital verification.

**Acceptance criteria:**

- WHEN a candidate is moved to "Offer" stage for a role at a UK location, THEN the system SHALL
  initiate the right-to-work verification workflow and prevent the candidate's status from
  advancing to "Hired" until verification is complete or explicitly overridden by a Group Admin
  with a reason recorded
- WHEN a candidate is prompted to complete right-to-work verification, THEN the system SHALL
  send them a mobile-accessible verification link requiring no login
- WHEN a candidate submits verification via share code or document, THEN the system SHALL
  submit the request to GBG IDVT and return a pass or fail result within the candidate's
  verification session
- WHEN a right-to-work verification check is completed (pass or fail), THEN the system SHALL
  store an immutable record containing: result, check type, document type, verifying operator
  ID, candidate ID, and timestamp — this record SHALL NOT be editable after creation
- WHEN right-to-work verification is passed and the check covers a time-limited permission
  (e.g. visa or BRP), THEN the system SHALL record the permission expiry date and schedule an
  alert to the Group Admin 30 days before expiry
- WHEN right-to-work verification fails, THEN the system SHALL notify the Location Manager and
  prevent the candidate from advancing to "Hired" status
- WHEN right-to-work checks are conducted, THEN the system SHALL apply the verification
  workflow to every candidate for a UK role regardless of perceived nationality, to prevent
  race discrimination liability

---

#### Must-7: GDPR Compliance Infrastructure

Consent is a first-class data entity. Retention, deletion, and data subject rights are
automated or workflow-triggered — not manual. This is a structural requirement, not a feature.

**Acceptance criteria:**

- WHEN a candidate record reaches its retention expiry (12 months after last activity for
  unsuccessful candidates), THEN the system SHALL automatically delete all personal data
  associated with that record, including: candidate fields, uploaded documents, communication
  history, and the consent record — this job runs nightly via the scheduled job queue
- WHEN a Group Admin receives a data subject access request (DSAR) for a candidate, THEN the
  system SHALL generate a machine-readable JSON export of all data held on that individual
  within 24 hours of the request being logged
- WHEN a right-to-erasure request is received for a candidate, THEN the system SHALL delete
  all personal data within 72 hours, with the exception of: right-to-work check records
  (retained for employment duration + 2 years per legal requirement) and anonymised aggregate
  analytics data
- WHEN a data sub-processor (Twilio, Resend, Cloudflare R2, GBG, Anthropic) processes
  candidate personal data, THEN the system SHALL only transmit the minimum data necessary for
  the specific processing task
- WHEN a candidate's consent record expires (12-month default), THEN the system SHALL queue
  a re-consent notification; if no renewed consent is received within 30 days, the system
  SHALL delete the candidate record automatically
- WHEN the GDPR deletion job runs, THEN the system SHALL log a deletion event record
  (candidate ID anonymised via hash, timestamp, reason) for audit purposes — the log entry
  SHALL NOT contain personal data

---

#### Must-8: Organisation and Location Management

Multi-tenant foundation. Clerk manages organisations and users. Application layer enforces
location-scoped data access.

**Acceptance criteria:**

- WHEN a new organisation is provisioned, THEN the system SHALL create an isolated tenant
  context with a unique tenantId applied to all data records — no data from one organisation
  SHALL be accessible to users of another organisation under any condition
- WHEN a Group Admin adds a location to the organisation, THEN the system SHALL create a
  Location record with a name, country, and optional timezone — country is required and
  determines which compliance workflows apply (UK triggers RTW; EU triggers GDPR; US triggers
  I-9 when in scope)
- WHEN a Group Admin assigns a user as Location Manager for a specific location, THEN the
  system SHALL restrict that user's pipeline read and write access to the assigned locations
  only
- WHEN a user's role is changed by a Group Admin, THEN the new permissions SHALL take effect
  within the user's active session without requiring logout
- WHEN a location is marked as "UK", THEN the system SHALL automatically apply the right-to-
  work verification requirement to all offers at that location

---

#### Must-9: AI Job Description Generation

Productivity tool. AI drafts; operator edits and publishes. No candidate data in prompt.

**Acceptance criteria:**

- WHEN an operator enters a role title and optionally selects a location type (restaurant /
  hotel / bar / events), THEN the system SHALL generate a draft job description via the
  configured AI provider within 10 seconds
- WHEN an AI-generated job description draft is produced, THEN the system SHALL display it in
  an editable text field within the job posting form — the draft SHALL NOT be published or saved
  automatically
- WHEN the AI job description feature is invoked, THEN the system SHALL log the invocation:
  operator ID, tenant ID, timestamp, feature type ("jd_generation"), and the input structure
  (role title, location type) — no candidate personal data SHALL be included in this log
- WHEN the AI provider is unavailable, THEN the system SHALL display an inline error and allow
  the operator to continue creating the job posting using a blank description field

---

#### Must-10: AI Candidate Communication Drafting

Productivity tool. AI drafts; operator edits and sends. Minimal candidate data in prompt.

**Acceptance criteria:**

- WHEN an operator opens the message compose view for a candidate, THEN the system SHALL offer
  an "AI Draft" option alongside a blank compose field
- WHEN an operator selects "AI Draft", THEN the system SHALL generate a draft message using
  only the candidate's first name, the current pipeline stage, and the role title as context —
  no other candidate personal data SHALL be included in the AI prompt
- WHEN an AI communication draft is generated, THEN the system SHALL display it in an editable
  field — the draft SHALL NOT be sent without explicit operator send action
- WHEN the AI provider is unavailable, THEN the system SHALL display an inline error and allow
  the operator to compose the message manually

---

### 4.2 Should-Have (target for initial release, not MVP launch blockers)

Should-haves are ordered: Should-1 ships before Should-2, and so on.

---

#### Should-1: Seasonal Talent Pool CRM

⚠️ **Assumption flag (medium confidence):** The seasonal re-engagement use case has not been
validated in operator interviews. It is treated here as a strong product differentiator based
on research signals (Claire persona; agency-spend displacement). Post-launch usage data should
validate or challenge this assumption within 90 days of CRM feature release.

The talent pool is a database of past workers and high-quality past candidates tagged for
potential re-engagement. GDPR consent for talent pool membership is separate from application
consent and requires its own lifecycle.

**Acceptance criteria:**

- WHEN a Location Manager ends a hire record (employee departs or seasonal contract closes),
  THEN the system SHALL prompt the manager to tag the departing worker as: "Re-hire eligible" /
  "Conditional re-hire" / "Do not re-engage"
- WHEN a worker is tagged as "Re-hire eligible" or "Conditional re-hire", THEN the system SHALL
  add them to the organisation's talent pool with: tag, original role, location, and a separate
  talent pool consent record — talent pool consent is independent of the original application
  consent
- WHEN an operator triggers a batch re-engagement campaign from the talent pool, THEN the
  system SHALL send a configurable re-engagement message to all selected talent pool members
  via their stored contact channel (SMS or email) in a single operator action
- WHEN a talent pool member's consent record is within 30 days of expiry (default: 12 months
  from last consent date), THEN the system SHALL automatically send a re-consent message to
  the member
- WHEN a talent pool member does not renew consent within 30 days of a re-consent request,
  THEN the system SHALL automatically remove the member from the talent pool and delete their
  talent pool record
- WHEN a talent pool member responds to a re-engagement campaign and expresses interest, THEN
  the system SHALL allow the operator to create a new application record for that member,
  pre-populated with their stored profile, without requiring the member to re-apply from scratch

---

#### Should-2: Screening Questions

Configurable per-role questions added to the application form. Human-reviewed knockout flags —
never automatic rejection.

**Acceptance criteria:**

- WHEN creating or editing a job posting, THEN the system SHALL allow the operator to add up
  to 5 screening questions to the application form (free text, single-choice, or yes/no)
- WHEN a screening question is marked as a "knockout" question, THEN the system SHALL flag
  applications that answer it unfavourably with a visual indicator for human review — the
  system SHALL NOT automatically reject or hide these applications
- WHEN a candidate application includes screening question responses, THEN the system SHALL
  display all responses alongside the candidate card in the pipeline view

---

#### Should-3: Offer Management

Digital offer letters. Mobile-accessible acceptance. No printing, no scanning.

**Acceptance criteria:**

- WHEN an operator moves a candidate to "Offer" stage and right-to-work verification is
  complete (for UK locations), THEN the system SHALL allow the operator to generate a digital
  offer letter from a configurable template
- WHEN a digital offer letter is generated, THEN the system SHALL send the candidate a
  mobile-accessible link to review and accept or decline the offer — no login required
- WHEN a candidate accepts a digital offer, THEN the system SHALL record the acceptance with
  a timestamp, move the candidate to "Hired" status, and send a confirmation to the Location
  Manager
- WHEN a candidate declines a digital offer, THEN the system SHALL record the decline with a
  timestamp and alert the Location Manager

---

#### Should-4: AI Interview Question Suggestions

Productivity tool. Role-appropriate suggestions, operator selects. No candidate assessment.

**Acceptance criteria:**

- WHEN an operator opens the interview preparation view for a candidate, THEN the system SHALL
  offer to generate interview question suggestions using the role title and location type as
  context
- WHEN interview question suggestions are generated, THEN the system SHALL display 5–8 questions
  in a selectable checklist — the operator selects which to include in their interview plan
- WHEN generating interview question suggestions, THEN the system SHALL NOT incorporate any
  candidate personal data into the AI prompt — questions are role-based, not candidate-based

---

#### Should-5: Hiring Analytics

Basic performance metrics for the Group Admin and People Director.

**Acceptance criteria:**

- WHEN a Group Admin views the analytics view, THEN the system SHALL display, for the trailing
  90 days: time-to-fill (days from job posting to hire) by location and role, application volume
  by source (Indeed / direct link / referral), and pipeline conversion rates (applied →
  screened → interviewed → offered → hired) by location
- WHEN a Group Admin views the analytics view, THEN the system SHALL display a per-location
  cost-per-hire estimate calculated as: (monthly subscription cost ÷ locations) ÷ hires in
  period — this figure is labelled as an estimate and does not include external costs such as
  job board spend
- WHEN a Group Admin exports analytics data, THEN the system SHALL produce a CSV export of the
  displayed metrics

---

### 4.3 Could-Have (explicit roadmap items — not in current scope)

These are committed roadmap directions, not features currently being specified. They are listed
here so the Building Agent does not make architectural decisions that block them.

| ID | Feature | Dependency | Target milestone |
|---|---|---|---|
| Could-1 | WhatsApp candidate communication | Meta Business API verification complete; 360dialog BSP onboarded | 6 months post-launch |
| Could-2 | WFM handoff — new hire sync to Deputy and 7shifts | Direct REST API integrations with Deputy and 7shifts | 3 months post-launch |
| Could-3 | Payroll handoff via Merge.dev | Merge.dev integration; Sage and Xero priority | 6 months post-launch |
| Could-4 | Referral programme | Candidate referral tracking; employee-facing referral portal | Post-analytics release |
| Could-5 | US market launch (I-9/E-Verify, EEOC reporting) | HireRight I-9 integration; EEOC EEO-1 data collection | 8–12 months post-launch |

**Architecture constraint for Could-1:** The `Message` entity in the data model carries a
`channel` field (email | sms | whatsapp) from day one. Adding WhatsApp at Could-1 must not
require a database migration.

**Architecture constraint for Could-2:** The `Hire` record carries `externalWfmId` (nullable)
from day one. WFM sync is a write to this field plus a webhook to the target WFM system.

---

### 4.4 Won't-Have (explicit exclusions for MVP)

| ID | Excluded feature | Reason |
|---|---|---|
| Won't-1 | AI candidate scoring, ranking, or CV screening | EU AI Act high-risk classification; EEOC disparate impact liability; phase-two feature with full compliance infrastructure |
| Won't-2 | Video interview tooling | Not a primary pain identified across any persona; adds significant third-party data processing surface |
| Won't-3 | US I-9/E-Verify workflow | US is not a launch market; included in Could-5 |
| Won't-4 | Native iOS/Android app | PWA covers all manager workflows including document capture via browser camera API |
| Won't-5 | Multi-language UI | English only at MVP; EU localisation is a post-launch requirement tied to EU country expansion |
| Won't-6 | Bulk CV import from external sources | Data minimisation principle; GDPR consent complexity for data not originating from the candidate directly |

---

## 5. Non-Goals

These are behaviours the system must be explicitly designed to prevent. The system SHALL NOT:

1. **Automatically reject any candidate** without a human review and explicit operator action
2. **Use AI to score, rank, or assess candidate suitability** for any role
3. **Store candidate personal data beyond the defined retention period** without renewed
   explicit consent from the candidate
4. **Process emotion recognition, facial expression analysis, or biometric inference** in any
   workflow or feature
5. **Expose one tenant's data to users of any other tenant** under any condition, including
   error states, administrative views, or analytics aggregations
6. **Send communications to candidates** via a channel for which the candidate has not
   explicitly provided contact data
7. **Create job board postings** using or referencing candidate personal data
8. **Apply right-to-work verification selectively** by perceived nationality — the workflow
   must apply to every candidate for a UK role equally
9. **Take irreversible action on candidate records** (deletion, rejection, hire) without an
   operator confirmation step
10. **Transmit more candidate personal data to AI providers** than is explicitly necessary for
    the specific generative task invoked

---

## 6. Pricing Model Assumptions

The PRD does not specify billing implementation, but the following assumptions from research
shape the data model:

- Pricing is **per-location per-month**, not per-seat or per-hire (predictability is a buying
  criterion for the ICP)
- The organisation (tenant) is the billing entity; locations are the pricing unit
- A free trial period is required (the ICP will not buy without one); duration is a GTM
  decision, not a product decision
- Pricing at launch targets: £79–149/month per location group (Marco ICP) to £300–600/month
  group rate (Siobhán ICP) — these are research-derived estimates, not validated market prices

The Building Agent does not implement billing in the MVP build sequence. Billing is a post-launch
integration (Stripe) noted in TASKS.md.

---

## 7. Design Rationale

### Why mobile-first is a hard constraint, not a preference

The research evidence (medium confidence, multiple converging sources) shows that 80% of
hospitality job seekers conduct their entire job search on mobile, and approximately 70% abandon
applications requiring account creation. These are not preferences — they are conversion-rate
realities. The ATS that ignores them produces worse hiring outcomes than the informal stack it
replaces. Every Must-Have feature has been designed for mobile interaction as the primary
surface, with desktop as the secondary surface.

### Why consent is a first-class data model entity

Most ATS products handle GDPR consent as a checkbox on a form — a UI element, not a data
model decision. Lapam-ATS treats consent as a first-class entity because the seasonal talent
pool CRM (Should-1) requires a consent lifecycle that is distinct from the original application
consent: different purpose, different expiry, separate re-consent workflow. If consent is a UI
element, the talent pool feature requires a data model retrofit. If consent is a first-class
entity from the start, the talent pool feature is an extension, not a rearchitecture.

### Why no AI candidate assessment at MVP

The research identified a precise boundary in EU AI Act Annex III: systems that assess, rank,
or screen candidates in employment contexts are high-risk. The compliance obligations for high-
risk systems (audit infrastructure, bias testing, CE marking, registration, human oversight
architecture) represent 3–4 months of additional engineering before any AI screening feature
can legally ship in the EU. The primary pains across all four operator personas are speed,
visibility, and compliance — not smarter screening. Deterministic rules-based screening (Must-2
templates + Should-2 screening questions) is sufficient to clear the bar versus the informal
stack. AI screening is phase two, built on a fully compliant foundation.

### Why the seasonal CRM is in-scope despite being unvalidated

The research flagged this feature as unvalidated in operator interviews (see Section 2, Strategic
Context). It is nonetheless included in Should-Have scope for two reasons: (1) the GDPR consent
lifecycle infrastructure it requires is architectural — it cannot be added post-launch without
a data migration; and (2) the Claire persona (seasonal hotel group) represents a real segment
with a real pain signal even if the purchase-trigger hypothesis has not been confirmed. Including
it in Should-Have with an explicit assumption flag is the correct risk calibration: build the
infrastructure now, ship the feature in the first release wave, and measure adoption within 90
days.

### Why right-to-work verification is a launch blocker, not a roadmap item

UK operators will not adopt an ATS that does not handle right-to-work verification. The informal
stack they are replacing also fails at this step — it handles RTW via manual document inspection
with no audit trail. An ATS that moves RTW to a digital, timestamped, legally defensible
workflow is solving a genuine compliance pain, not just matching incumbents. Making this a launch
blocker ensures the product's compliance story is concrete from day one and positions Lapam-ATS
credibly against the Group People Director's primary anxiety (a compliance audit or near-miss).
