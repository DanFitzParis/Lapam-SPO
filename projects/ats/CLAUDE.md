# Lapam-ATS

A standalone, multi-tenant B2B SaaS applicant tracking system for independent hospitality
groups (5–50 locations, 2+ countries). UK-first launch. Built for agentic development.

## Project Overview

Lapam-ATS solves three problems for mid-market hospitality operators: no pipeline visibility
across locations, candidates lost to slow response, and no audit trail for GDPR or right-to-work.
It ships with mobile-first candidate applications, a real-time multi-location dashboard, UK
right-to-work verification, AI productivity tools (job description drafting, comms drafting,
interview question suggestions), and a seasonal talent pool CRM for re-engaging past workers.

Multi-tenancy: each operator group is a Clerk organisation. All database tables carry tenantId
enforced by a Prisma client extension — see `src/lib/prisma.ts`.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | TypeScript | 5.x |
| Runtime | Node.js | 20 LTS |
| Framework | Next.js (App Router) | 15.x |
| UI | Tailwind CSS + shadcn/ui | Tailwind 4.x |
| Database | PostgreSQL via Neon | PostgreSQL 16 |
| ORM | Prisma | 5.x |
| Auth | Clerk | latest |
| File storage | Cloudflare R2 | S3-compatible |
| AI | Vercel AI SDK + Anthropic (claude-haiku-4-5) | AI SDK 4.x |
| Email | Resend + React Email | latest |
| SMS | Twilio | latest |
| Background jobs | Vercel Cron + `job_queue` table | — |
| Testing (unit) | Vitest | latest |
| Testing (E2E) | Playwright | latest |
| Hosting | Vercel | — |

## Commands

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server (localhost:3000)
pnpm build            # production build
pnpm test             # run all Vitest unit/integration tests
pnpm test:e2e         # run Playwright E2E tests
pnpm lint             # ESLint
pnpm prisma migrate dev   # apply migrations to dev database
pnpm prisma studio        # open Prisma data browser
pnpm prisma generate      # regenerate Prisma client after schema changes
```

## Directory Structure

```
projects/ats/
├── CLAUDE.md                  ← you are here
├── docs/specs/                ← all specification files
│   ├── ADR-001-tech-stack.md
│   ├── PRD.md
│   ├── db-schema.md
│   ├── api-spec.yaml
│   ├── ux-spec.md
│   └── TASKS.md
src/
├── app/
│   ├── (dashboard)/           ← operator-facing pages (Clerk-protected)
│   │   ├── dashboard/
│   │   ├── jobs/
│   │   ├── talent-pool/
│   │   ├── analytics/
│   │   └── settings/
│   ├── apply/[applyLinkToken]/    ← public candidate application
│   ├── interview/[slotToken]/     ← public interview slot selection
│   ├── offer/[acceptanceToken]/   ← public offer acceptance
│   ├── rtw/[rtwToken]/            ← public RTW verification
│   └── api/
│       ├── public/            ← no Clerk auth; token-based
│       ├── ai/                ← AI productivity endpoints
│       ├── cron/              ← Vercel Cron handlers (CRON_SECRET)
│       ├── webhooks/          ← GBG IDVT webhook receiver
│       └── uploads/           ← R2 presigned URL generation
├── components/
│   ├── apply/
│   ├── dashboard/
│   ├── jobs/
│   ├── pipeline/
│   ├── talent-pool/
│   └── analytics/
├── lib/
│   ├── prisma.ts              ← Prisma client + tenant extension
│   ├── auth.ts                ← getTenantClient(), session helpers
│   ├── rbac.ts                ← requireRole(), getUserLocations()
│   ├── ai.ts                  ← Vercel AI SDK + Anthropic setup
│   ├── email.ts               ← Resend wrapper
│   ├── sms.ts                 ← Twilio wrapper
│   ├── r2.ts                  ← Cloudflare R2 + presigned URLs
│   ├── gbg.ts                 ← GBG IDVT integration
│   └── indeed.ts              ← Indeed API integration
├── lib/jobs/                  ← background job workers
│   ├── ack-worker.ts
│   ├── gdpr-purge-worker.ts
│   ├── reconsent-worker.ts
│   ├── reminder-worker.ts
│   └── stale-alert-worker.ts
└── emails/                    ← React Email templates
```

## Specification Files

@docs/specs/PRD.md
@docs/specs/db-schema.md
@docs/specs/api-spec.yaml
@docs/specs/ux-spec.md
@docs/specs/TASKS.md

## Boundaries

**NEVER:**
- Automatically reject a candidate without a human confirmation step
- Use AI to score, rank, or assess candidate suitability
- Instantiate the Prisma client without a tenantId in scope
- Store candidate personal data in the AuditLog (use SHA-256 hash refs only)
- Expose one tenant's data to another tenant's session under any condition
- Add emotion recognition, facial expression analysis, or biometric inference features
- Update a `RightToWorkCheck` record after creation (immutable — enforced at DB level)
- Transmit more candidate PII to AI providers than the minimum required for the specific task

**ALWAYS:**
- Use `createTenantClient(tenantId)` from `src/lib/prisma.ts` — never raw `new PrismaClient()`
- Log an AuditLog entry for every AI feature invocation (no PII in metadata)
- Require `consentGiven: true` before creating any Candidate or Application record
- Secure all `/api/cron/*` endpoints with CRON_SECRET header check
- Apply the RTW gate when advancing a GB-location application to HIRED stage
- Use R2 presigned URLs for all file reads — never expose bucket URLs directly
- Write tests before marking a task complete — every task has a `verifies:` command

**ASK FIRST** (do not silently decide):
- Any change to the Prisma schema after the initial migration
- Any new external service or third-party integration not in the ADR
- Any change that would affect data retention periods or consent lifecycle logic
- If a Must-Have task seems infeasible given the current stack

**IF STUCK:**
- Re-read the relevant spec section referenced in the task's `reads:` field
- Check `db-schema.md` for the authoritative data model
- Check `api-spec.yaml` for the expected request/response shape
- Do not invent a different approach without flagging it — the spec is the authority

## Patterns and Conventions

_This section is populated by the Building Agent as conventions are established during
implementation. Placeholder entries below — update as patterns emerge._

- Route Handler pattern: TBD (established in TASK-005)
- Error response shape: TBD (established in TASK-005)
- Zod schema location: TBD (established in TASK-005)
- Server Action vs Route Handler decision rule: TBD (established in TASK-010)
- Test file naming: colocated with source (`foo.ts` → `foo.test.ts`); E2E in `tests/e2e/`
