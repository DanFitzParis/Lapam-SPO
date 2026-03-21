---
title: "ADR-001: Technology Stack — Lapam-ATS"
type: adr
agent: specification
status: draft
version: 1.0
created: 2026-03-22
parent: docs/research/tech-landscape.md
---

# ADR-001: Technology Stack — Lapam-ATS

## Context and Problem Statement

Lapam-ATS is a standalone, multi-tenant B2B SaaS product targeting independent hospitality groups
(5–50 locations, 2+ countries, 200–2,000 hires/year). The product launches UK-first, with EU and US
expansion on the 8–12 month roadmap.

Three architectural constraints shape every stack decision:

1. **Single-developer agentic workflow.** This product is designed to be built and maintained by AI
   coding agents operating solo or in small sequences. Stack choices optimise for: strong typing,
   deep LLM training data coverage, clear file conventions, minimal implicit magic, and excellent
   test infrastructure. Architectural choices that assume team parallelism or complex DevOps are
   explicitly excluded.

2. **GDPR + UK compliance from day one.** Candidate data must be stored in EU data residency.
   Consent is a first-class data model. UK Right to Work verification is an MVP blocker.

3. **AI as productivity tooling, not automated decision-making.** MVP includes generative AI for
   job description drafting, candidate communication drafting, and interview question suggestions.
   No AI scoring, ranking, or candidate screening — those cross into EU AI Act high-risk territory
   and are phase-two features with separate compliance infrastructure.

---

## Decision Drivers

In priority order, derived from the Decision Gate:

- **D1** — Optimised for AI agent development: deep training-data coverage, explicit conventions,
  strong typing end-to-end
- **D2** — Single deployable unit: one developer can run, test, and deploy the entire product
- **D3** — EU data residency for candidate data (GDPR mandatory)
- **D4** — Multi-tenant isolation: each operator group's data is logically isolated
- **D5** — AI generative features in MVP without triggering EU AI Act high-risk classification
- **D6** — UK Right to Work verification workflow at launch
- **D7** — Mobile-first candidate experience (no-login application, browser-based, PWA for managers)
- **D8** — No native mobile app: PWA covers all manager workflows including document capture

---

## Architectural Decisions

### 1. Language and Runtime

**Decision:** TypeScript throughout. Node.js 20 LTS as runtime.

**Rationale:** TypeScript is the highest-signal choice for agentic development. Explicit types reduce
the surface area for agent errors, type errors surface immediately in CI, and TypeScript has
unmatched LLM training data coverage across the full stack (frontend, backend, database schema,
tests). A single language across the entire codebase means an agent never needs to context-switch
between language semantics.

**Alternatives considered:**
- Python (FastAPI backend): excellent for AI/ML workloads; weaker frontend story; splits language
  context for agentic workflows — rejected
- Go: excellent performance; smaller LLM training data footprint for web application patterns;
  no meaningful benefit at this scale — rejected

---

### 2. Web Framework

**Decision:** Next.js 15 (App Router) for all web surfaces: operator dashboard, candidate-facing
application forms, and API route handlers.

**Rationale:** Next.js App Router has unambiguous file conventions (layout.tsx, page.tsx,
route.ts, loading.tsx, error.tsx) that an agent can follow deterministically. Server Components,
Server Actions, and Route Handlers are sufficiently distinct in capability and naming that an agent
rarely confuses them. The framework has the largest web-framework LLM training corpus of any
TypeScript option. Candidate-facing forms and the operator dashboard share the same deployment
unit, eliminating cross-service integration for the single developer.

API endpoints are Next.js Route Handlers (`/app/api/**`). For the complexity level of this
application at MVP, this is preferable to a separate backend service.

**Alternatives considered:**
- Separate Express/Fastify backend: clean separation but two deployments, two CI pipelines, and
  an internal API contract to maintain — adds overhead for no benefit at single-developer scale
- tRPC: excellent type safety; less LLM training coverage; adds a non-obvious abstraction layer;
  rejected in favour of conventional REST Route Handlers with explicit request/response types
- Remix: viable but smaller training corpus and less community convention depth than Next.js

---

### 3. Database

**Decision:** PostgreSQL 16 via Neon (serverless, EU Frankfurt region).

**Rationale:** PostgreSQL is the most widely modelled relational database in LLM training data.
Neon is chosen over AWS RDS Aurora or Supabase for two reasons specific to agentic development:
(1) Neon supports database branching — an agent can create an isolated database branch for a
feature or test run and discard it, without touching the production schema; (2) serverless scaling
means no idle cost during development cycles. The EU Frankfurt (eu-central-1 equivalent) region
satisfies GDPR data residency for candidate personal data without additional configuration.

**ORM:** Prisma 5. Schema-first — the `schema.prisma` file is a single authoritative source of
truth for the database model that agents can read and reason about without executing queries.
Generated TypeScript client provides full type safety. Prisma Migrate produces deterministic,
reviewable migration files. Widely covered in LLM training data.

**Multi-tenancy model:** Shared database, tenant isolation via `tenantId` column on all tables
containing user or candidate data, enforced by a Prisma client extension (middleware) that injects
`tenantId` into every query. This is simpler to operate and reason about than schema-per-tenant
or database-per-tenant at this scale. PostgreSQL row-level security (RLS) policies are added as a
defence-in-depth layer but the primary enforcement is in application code.

**Alternatives considered:**
- Supabase (PostgreSQL): viable; includes extras (realtime, storage) but also includes its own
  auth system (we use Clerk), and its RLS model is designed for Supabase's JWT tokens — requires
  configuration work to integrate with Clerk; Neon is cleaner
- AWS RDS Aurora: production-grade but no branching; requires VPC configuration; higher
  operational complexity for a single developer
- PlanetScale (MySQL): no PostgreSQL; no native JSONB; rejected

---

### 4. Authentication and Multi-Tenancy

**Decision:** Clerk for authentication, session management, and organisation (tenant) management.

**Rationale:** Clerk's organisation model maps directly to Lapam-ATS's multi-tenancy requirement:
an organisation is an operator group, members are users, roles are Clerk roles (Group Admin,
Location Manager, Read-Only). Clerk handles SSO/SAML (required for enterprise hotel accounts),
MFA, session expiry, and JWT issuance. The `tenantId` stored in Prisma records is the Clerk
organisation ID — no separate tenant management layer required.

Clerk's Next.js SDK (`@clerk/nextjs`) integrates with App Router middleware for route protection
with minimal boilerplate. Clerk is well-covered in LLM training data for Next.js contexts.

**RBAC roles (application-level, stored in Clerk metadata):**
- `group_admin` — full access to all locations within the organisation
- `location_manager` — access scoped to assigned locations only
- `read_only` — view pipeline; no candidate comms or status changes
- `candidate` — access to their own application record only (self-service portal)

**Alternatives considered:**
- Auth.js (NextAuth): good Next.js integration; less out-of-the-box multi-org/SAML support;
  requires more custom code for enterprise SSO — rejected
- Supabase Auth: tied to Supabase client patterns; complicates Prisma integration — rejected
- Custom JWT auth: unacceptable maintenance burden and security surface for a single developer

---

### 5. File Storage

**Decision:** Cloudflare R2 for all binary assets (CV documents, right-to-work document images,
signed contracts).

**Rationale:** R2 is S3-compatible (standard AWS SDK works without modification), has zero egress
fees (critical for a product handling frequent document retrieval across many sessions), and
supports EU jurisdiction data residency. No separate CDN configuration required for the candidate-
facing upload flow. Significantly cheaper than AWS S3 at scale due to zero egress.

Objects are scoped by path convention: `/{tenantId}/{candidateId}/{documentType}/{filename}`.
Pre-signed URLs are generated server-side with short expiry (15 minutes) for all reads.
No direct client access to R2 buckets.

**Alternatives considered:**
- AWS S3 (eu-west-1): viable; higher egress cost; requires IAM configuration — rejected in favour
  of R2's simpler credential model and zero egress
- Supabase Storage: tied to Supabase ecosystem; rejected

---

### 6. AI Integration

**Decision:** Vercel AI SDK with OpenAI API (GPT-4o-mini for drafting tasks; GPT-4o for
higher-quality outputs where latency is acceptable).

**Rationale:** Vercel AI SDK is TypeScript-native, designed for Next.js App Router (streaming
responses work cleanly with Server Actions and Route Handlers), and has a provider-agnostic
interface that allows the underlying model to be swapped without touching feature code. OpenAI
is the primary provider because it has the strongest structured output support (`zod` schema
enforcement on responses) which is essential for generating parseable job descriptions and
structured interview question sets.

**MVP AI features (all productivity tools — human reviews and uses output; AI never acts):**

| Feature | Trigger | Model | Output |
|---|---|---|---|
| JD Generator | Operator enters role title + location type | gpt-4o-mini | Polished job description (editable before posting) |
| Comms Drafter | Operator clicks "Draft message" on candidate card | gpt-4o-mini | Candidate communication draft (editable before sending) |
| Interview Question Suggester | Operator opens interview prep for a candidate | gpt-4o-mini | Suggested questions for the role type (selectable checklist) |

**EU AI Act classification:** These features are assistive productivity tools. They generate
content for a human to review, edit, and choose to use. They do not score, rank, or assess
candidates. They do not process candidate personal data beyond the role title and location type
for JD generation. They do not influence hiring decisions algorithmically. Under EU AI Act
Article 6 and Annex III, these features do not meet the threshold for high-risk classification.

**Audit requirement:** Every AI-assisted output is logged: timestamp, feature invoked, operator
ID, prompt structure (not full prompt — no candidate PII in the log). This supports transparency
reporting and future EU AI Act compliance if feature scope expands.

**Alternatives considered:**
- Anthropic Claude via AI SDK: viable alternative provider; OpenAI selected for stronger
  structured output and broader LLM training data coverage of the SDK
- Hugging Face / self-hosted models: eliminates third-party data processing concerns but
  significantly increases infrastructure complexity; rejected for MVP

---

### 7. Background Jobs and Scheduled Tasks

**Decision:** Vercel Cron Jobs (for scheduled tasks) + database-backed job queue using
`pg-boss` (for async task processing requiring retries and durability).

**Rationale:** Vercel Cron Jobs handle time-based triggers (GDPR auto-deletion scheduler,
re-consent reminder sends, stale application cleanup). `pg-boss` runs as a background worker
using the existing Neon PostgreSQL connection — no additional infrastructure (no Redis, no
separate queue service). Jobs are defined in TypeScript alongside application code. For a single
developer, having the job queue use the same database reduces operational surface to zero.

**Scheduled jobs at MVP:**
- `gdpr.purge` — delete candidate records past retention period (runs nightly)
- `talent-pool.reconsent-remind` — send re-consent requests to expiring talent pool records
  (runs weekly)
- `application.stale-alert` — flag applications with no activity for 48+ hours (runs hourly)

**Alternatives considered:**
- Redis + BullMQ: more capable but requires a Redis instance; additional operational overhead;
  rejected for single-developer constraint
- Inngest: event-driven, excellent DX; newer and smaller training corpus; worth revisiting
  post-MVP

---

### 8. Communications

**Decision:**
- **Email:** Resend (transactional) with React Email for templates
- **SMS:** Twilio Messaging API
- **WhatsApp:** 360dialog BSP — 6-month roadmap item; Meta Business API verification to begin
  in parallel with product build

**Rationale:**
Resend has a clean TypeScript SDK and React Email enables email templates to be written as React
components — type-checked, previewed locally, and composed like UI components. This is
significantly more maintainable for an agentic workflow than raw HTML email templates.

Twilio covers SMS for the UK market (MVP scope). 360dialog is selected over Twilio for WhatsApp
because it is the preferred BSP for EU-market ATS products (lower per-message cost, EU data
processing model, GDPR DPA available).

WhatsApp is explicitly out of MVP scope. The Meta Business API verification process (2–4 weeks)
and template approval workflow mean this cannot ship at day one without significant pre-build
overhead. However, the communications abstraction layer must be designed to accept WhatsApp as a
channel without requiring architectural change — the `Message` entity in the data model carries
a `channel` field from day one.

**Alternatives considered:**
- Postmark: viable; replaced by Resend for its cleaner TypeScript DX and React Email support
- Twilio for WhatsApp: viable but higher cost per message in EU; 360dialog preferred for EU GTM

---

### 9. Testing

**Decision:** Vitest (unit and integration tests) + Playwright (end-to-end tests).

**Rationale:** Vitest is Jest-compatible, TypeScript-native, and significantly faster than Jest
for a Next.js monorepo. Agents can write and run tests without configuration overhead. Playwright
provides E2E coverage for the candidate application flow (the highest-risk user journey) and key
operator workflows. Both are well-covered in LLM training data.

**Test conventions (for agentic consistency):**
- Unit tests colocated with source files: `src/lib/foo.ts` → `src/lib/foo.test.ts`
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/`
- Every TASKS.md task specifies a `verifies:` command the agent runs to confirm completion

**Alternatives considered:**
- Jest: functional but slower; Vitest is a drop-in replacement with better performance
- Cypress: heavier E2E framework; Playwright is lighter and has stronger TypeScript support

---

### 10. Deployment and Infrastructure

**Decision:** Vercel for application hosting; Neon for database; Cloudflare R2 for storage.
No Kubernetes, no Docker orchestration, no managed container infrastructure at MVP.

**Rationale:** Vercel's zero-configuration Next.js deployment, automatic preview deployments
per branch, and built-in cron job support eliminate infrastructure management from the single
developer's scope entirely. Combined with Neon (serverless PostgreSQL) and Cloudflare R2, the
entire production stack is managed-service only. An agent can deploy by pushing to the main
branch — no Dockerfile, no ECS task definition, no infrastructure-as-code required for day one.

**EU data residency compliance path:**
- Neon: EU Frankfurt region (`eu-central-1`) — all candidate personal data stored in EU
- Cloudflare R2: EU jurisdiction bucket — all candidate documents stored in EU
- Vercel: edge functions served from EU PoPs where candidate data is processed; no candidate PII
  stored in Vercel's edge cache
- Resend / Twilio: DPAs with EU standard contractual clauses in place before launch

**Infrastructure growth path:** When scale or enterprise requirements demand it (e.g., a hotel
chain requiring dedicated infrastructure, or performance at >10,000 concurrent candidates),
migration from Vercel to a containerised AWS deployment is straightforward — Next.js is
cloud-agnostic. The decision to start on Vercel does not foreclose AWS later.

**Environments:**
- `production` — Vercel production, Neon production branch
- `staging` — Vercel preview, Neon staging branch
- `development` — local Next.js dev server, Neon development branch (per-developer)

**Alternatives considered:**
- AWS (ECS Fargate + RDS): correct at scale; significant DevOps overhead for a single developer
  at MVP — rejected until team or scale requires it
- Railway: viable all-in-one alternative; Vercel + Neon is better-documented for Next.js
  specifically

---

### 11. External Service Integrations (MVP scope)

| Integration | Provider | Scope | Timeline |
|---|---|---|---|
| UK Right to Work (IDVT) | GBG Identity | UK document verification, timestamped audit record | MVP (UK launch blocker) |
| Background check (supplementary) | Certn | Criminal record, reference checks | 3-month post-launch |
| Job board multi-post | Indeed API + Google for Jobs (structured data) | Job distribution | MVP |
| WFM — new hire handoff | Deputy REST API, 7shifts REST API | Employee record sync post-hire | 3-month post-launch |
| Payroll | Merge.dev (unified HRIS/payroll API) | New hire record push to operator payroll | 6-month roadmap |
| WhatsApp | 360dialog (Meta BSP) | Candidate communication channel | 6-month roadmap |
| I-9 / E-Verify | HireRight | US employment eligibility (US launch) | US-launch milestone |

---

## Decision Outcome

**Chosen stack:**

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.x (latest stable) |
| Runtime | Node.js | 20 LTS |
| Web framework | Next.js (App Router) | 15.x |
| UI components | Tailwind CSS + shadcn/ui | Tailwind 4.x / shadcn latest |
| Database | PostgreSQL via Neon | PostgreSQL 16, Neon latest |
| ORM | Prisma | 5.x |
| Auth | Clerk | latest |
| File storage | Cloudflare R2 | S3-compatible SDK |
| AI | Vercel AI SDK + OpenAI API | AI SDK 4.x / GPT-4o |
| Email | Resend + React Email | latest |
| SMS | Twilio Messaging API | latest |
| Background jobs | pg-boss | 10.x |
| Testing (unit/integration) | Vitest | latest |
| Testing (E2E) | Playwright | latest |
| Hosting | Vercel | — |
| CI/CD | Vercel (push-to-deploy) + GitHub Actions (test runner) | — |

---

## Consequences

### Positive

- An AI coding agent can onboard to the codebase by reading `schema.prisma` (full data model),
  `CLAUDE.md` (project context), and the relevant spec file section — no oral knowledge transfer
- Single language and single deployment unit: no inter-service API contracts to maintain
- Neon branching enables isolated per-task database states for agentic testing
- Vercel preview deployments give every PR a live staging URL automatically
- Managed services only: no infrastructure-on-call burden for the single developer
- EU data residency satisfied by Neon EU + Cloudflare R2 EU from day one

### Negative (accepted risks)

- **Vercel vendor dependency:** If Vercel's pricing or reliability becomes problematic at scale,
  migration to a containerised deployment requires Docker configuration work. Mitigation: Next.js
  is cloud-agnostic; migration is straightforward but not zero-cost.
- **Serverless cold starts (Neon):** Neon's serverless model introduces occasional cold-start
  latency after periods of inactivity. Acceptable for a B2B product; not acceptable if the
  product expands into high-frequency consumer-facing traffic patterns.
- **pg-boss on serverless:** pg-boss requires a persistent connection to poll for jobs. On Vercel
  serverless functions, this requires a long-running worker. Mitigation: Run the pg-boss worker
  as a Vercel Cron Job that polls on a schedule, or use a lightweight persistent process on a
  free-tier Fly.io instance for the worker only.
- **Clerk pricing at scale:** Clerk's per-MAU pricing becomes material at large scale. Acceptable
  at MVP; review at 500+ active organisations.

---

## Design Rationale

### Why agentic-first changes stack selection

The selection criterion introduced in DG-5 — optimise for AI agent development workflows — changes
two decisions that would otherwise be different:

**Neon over AWS RDS:** An agent working on a data migration can create a Neon branch, apply the
migration, run tests, and discard the branch in a single session without affecting production. This
capability does not exist in RDS and is genuinely valuable for safe, autonomous schema evolution.

**Next.js monolith over microservices:** Microservices force an agent to maintain awareness of
service boundaries, inter-service authentication, and distributed tracing. A modular monolith
with clear internal directory boundaries (`/src/modules/talent-pool`, `/src/modules/compliance`,
etc.) provides the same architectural clarity without the operational overhead. The agent has the
entire codebase in context at once; service decomposition adds cognitive surface area without
functional benefit at this stage.

### Why Option A (greenfield) over Option B (white-label)

The research confirmed that the product's three defensibility claims — seasonal talent pool CRM,
global compliance architecture, and WhatsApp candidate engagement — all require structural
control over the data model. A talent pool with GDPR re-consent lifecycle tracking requires a
consent entity that is a first-class citizen in the schema, not a field on an existing record type.
A white-label platform's data model would constrain or prevent this entirely. Full architectural
control is the correct choice for a product whose moat depends on going deeper than competitors,
not faster than them.

### Why AI is scoped as it is

The DG-4 override (AI in MVP, but scoped to productivity tools) required a precise line between
features that assist the human operator and features that assess candidates. The line drawn in this
ADR — AI generates content for human review; AI never scores, ranks, or makes decisions about
candidates — is not arbitrary. It is the boundary that EU AI Act Annex III and the 2023 EEOC AI
guidance both use to distinguish high-risk from low-risk AI applications in employment contexts.
Building to this boundary from day one means the AI features ship without compliance overhead,
and the product can be described accurately as "AI-assisted" rather than "AI-screened" — a
materially different product and legal position.

### Why UK-first changes the MVP feature set

UK-first means right-to-work verification is an MVP launch blocker, not a later roadmap item.
This adds one external integration (GBG IDVT) to the MVP scope but also makes the compliance
story concrete from launch: "Every UK hire is right-to-work verified before their first shift,
timestamped, and stored." This is a genuine differentiator vs the informal stack (spreadsheets
have no RTW workflow) and a trust signal to the Group People Director buying persona who has been
woken up at night by compliance anxiety.
