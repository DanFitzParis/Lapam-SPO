---
title: "Lapam-ATS — Technology Landscape"
type: research
agent: research
status: draft
version: 1.0
created: 2026-03-20
parent: initial-brief.md
evidence_quality:
  confidence: medium
  notes: "Stack options reflect industry-standard choices for B2B SaaS in 2024–2025. No proprietary benchmarks accessed. Pricing and market share figures sourced from public reports and vendor documentation. Three options are presented without recommendation — the choice is a product and business decision that depends on budget, timeline, and risk tolerance. All three are technically viable."
---

# Technology Landscape: Hospitality ATS

This file presents three viable technical approaches for building a hospitality-native ATS. It does not recommend one. Each option has a different risk/reward profile across time-to-market, differentiation ceiling, build cost, vendor dependency, and compliance complexity. The Specification Agent and product decision-makers should use this as input to a build-vs-buy-vs-compose decision.

---

## Framing: What the Technology Must Do

The technical approach must enable — or at minimum not block — the following requirements derived from passes 1–4:

| # | Requirement | Source |
|---|------------|--------|
| T1 | Multi-tenant: one platform, isolated data per operator group | ICP: multi-location operators |
| T2 | Multi-region data residency (EU + US at minimum) | GDPR: EU data sovereignty |
| T3 | Mobile-first candidate application (sub-3 minute, no login) | Domain patterns: 80% mobile |
| T4 | WhatsApp Business API integration | Domain patterns: EU candidate preference |
| T5 | GDPR consent lifecycle management with auto-deletion | GDPR: mandatory |
| T6 | Right-to-work check workflow (UK IDVT integration) | UK right to work: mandatory |
| T7 | I-9 / E-Verify workflow (US) | US compliance: mandatory |
| T8 | Seasonal talent pool / CRM with re-consent workflow | Competitive gap: S1 differentiation |
| T9 | Multi-location pipeline dashboard (real-time) | ICP: group-level visibility |
| T10 | WFM/scheduling handoff (7shifts, Deputy, Rotaready, Planday) | Integration landscape |
| T11 | Payroll handoff (Sage, Xero, ADP, Gusto via Merge.dev/Finch) | Integration landscape |
| T12 | Human-in-the-loop for any AI screening (EU AI Act + EEOC) | Regulatory: mandatory |
| T13 | Job board multi-posting | Baseline market expectation |
| T14 | Mobile admin app for GMs (action applications, schedule interviews) | ICP: Marco persona |

---

## Option A: Full Greenfield Build (Cloud-Native SaaS)

### Summary

Build every layer purpose-for-purpose on a modern cloud-native stack. Maximum long-term control and differentiation ceiling; highest upfront build cost and longest path to market.

### Proposed Stack

**Frontend (Web Dashboard — Siobhán/Yusuf persona)**
- **Framework:** Next.js 14+ (App Router) with React 18
- **Rationale:** Server-side rendering for performance; strong ecosystem; widely hireable; excellent TypeScript support; Vercel deployment option for rapid frontend iteration
- **UI:** Tailwind CSS + Radix UI (accessible, composable) or Shadcn/ui
- **State management:** Zustand or TanStack Query (React Query)

**Frontend (Mobile App — Manager app for Marco persona)**
- **Framework:** React Native (Expo managed workflow)
- **Rationale:** Single codebase for iOS and Android; large talent pool; good performance for the use case; Expo simplifies build/distribution
- **Alternative:** Progressive Web App (PWA) for manager interface — avoids app store dependency for B2B; simpler maintenance; sufficient for core manager actions (view applications, send messages, schedule)

**Candidate-facing application form**
- Lightweight, mobile-first web form (not a native app — no download barrier)
- Standalone subdomain (apply.tenant-domain.com) or embedded widget
- No authentication required for initial application submission
- Progressive disclosure: 4–6 fields minimum to complete; additional data gathered post-offer

**Backend API**
- **Language/Runtime:** Node.js (TypeScript) or Python 3.12+ (FastAPI)
- Node.js/TypeScript: strong ecosystem for real-time (WebSockets for live pipeline updates), widely hired, same language as frontend team
- Python/FastAPI: stronger data science ecosystem (relevant if AI screening features are added later); equally valid choice
- **Architecture:** REST API for core CRUD; GraphQL considered but not recommended — adds complexity without sufficient benefit for this use case at MVP
- **Real-time:** WebSockets (socket.io or native WS) for live pipeline updates; alternatively SSE (Server-Sent Events) for lighter-weight one-way updates

**Database**
- **Primary:** PostgreSQL 16+ (managed — AWS RDS Aurora or Supabase)
- **Multi-tenancy model:** Row-level security (RLS) with tenant_id on all tables — simplest to operate, GDPR-friendly (logical isolation; physical isolation available if required by enterprise buyer)
- **Schema-per-tenant** alternative: stronger GDPR physical isolation; harder to operate at scale; recommended if enterprise hotel chains are target (they will ask)
- **Search:** PostgreSQL full-text search for MVP; Elasticsearch/OpenSearch for scale (>100k candidates per tenant)
- **File storage:** AWS S3 (cv documents, right-to-work copies, contracts) with tenant-scoped prefixes and access control

**Authentication and Multi-tenancy**
- **Auth provider:** Clerk or Auth0 (B2B-optimised, supports SSO/SAML for enterprise accounts, multi-org management, MFA)
- **Permissions:** Role-based access control (RBAC): Group Admin, Location Manager, Read-Only, Candidate (for self-service portal)

**Communications Layer**
- **SMS:** Twilio Messaging API
- **WhatsApp:** Twilio for WhatsApp Business (Twilio is an approved BSP; handles Meta compliance layer) — or 360dialog (lower cost in EU; preferred by EU-native ATS vendors)
- **Email:** Postmark (transactional; high deliverability) or AWS SES (cheaper at scale)
- **In-app notifications:** Firebase Cloud Messaging (FCM) for mobile push

**Cloud Infrastructure**
- **Provider:** AWS (recommended primary)
  - Reason: Strongest multi-region maturity for GDPR (eu-west-1 Ireland; eu-central-1 Frankfurt for Germany); best marketplace of compliance certifications (ISO 27001, SOC 2 Type II); widest ecosystem of services; most hireable ops/DevOps talent
  - Primary regions: us-east-1 (N. Virginia) + eu-west-1 (Ireland) at launch
  - Add eu-central-1 (Frankfurt) for German enterprise accounts (Betriebsrat will ask about data location)
- **Containerisation:** Docker + ECS Fargate (serverless containers — no cluster management) or Kubernetes via EKS (more powerful but more complex; recommend Fargate for MVP, EKS for scale)
- **CDN:** CloudFront (candidate-facing application form must be fast globally)
- **Secrets:** AWS Secrets Manager
- **Queue/async jobs:** AWS SQS + Lambda (background processing: GDPR deletion jobs, auto-deletion scheduler, re-consent reminder sends, report generation)
- **Cost note:** AWS egress charges are the highest of the three major clouds (30–50% of high-volume app bills). Factor this into pricing model from day one.

**Integration Infrastructure**
- **Payroll/HRIS:** Merge.dev or Finch (unified API layer — connect once, access 50+ payroll systems)
- **Background checks:** Certn (primary; UK/EU/US) + HireRight (US I-9/E-Verify)
- **Job boards:** Adzuna multi-post API or Broadbean; direct Indeed API for US
- **WFM:** Direct REST API integrations with 7shifts, Deputy, Rotaready, Planday (each documented; estimated 2–4 weeks build per integration)

**Compliance Infrastructure (built-in, not bolted on)**
- GDPR consent management: first-class data model — every candidate record carries consent_id, consent_type, consent_date, consent_expiry
- GDPR deletion: scheduled job that auto-deletes candidate records after configurable retention period; includes cascading deletion from talent pool, chat history, documents
- Right-to-work: document collection workflow + GBG or Onfido IDVT API integration for UK digital checks
- I-9: HireRight Electronic I-9 API for US
- Audit log: immutable log of all hire/reject decisions (required for EEOC and EU AI Act)

### Advantages
- No platform dependency or licensing constraints — full roadmap control
- Can build hospitality-native features (talent pool CRM, seasonal batch workflows, WFM handoff) without fighting a vendor's data model
- Full GDPR architecture control — can offer schema-level tenant isolation for enterprise buyers
- Long-term unit economics: no per-seat licensing to a third-party platform
- Can iterate candidate-facing application form independently of admin UI

### Disadvantages
- **Longest time to market:** A credible MVP (application form + multi-location pipeline + basic comms + right-to-work for UK) is 4–6 months with a small focused team (4–6 engineers)
- **Compliance build cost is real:** GDPR consent lifecycle, GDPR deletion, I-9, right-to-work — these are collectively 3–4 months of engineering effort and require legal review
- **WhatsApp Business API setup:** 2–4 weeks of account verification + template approval before usable in production
- **No inherited integrations:** every job board, every WFM connector, every payroll integration is bespoke work

### Time to MVP
4–6 months (credible beta; UK-focused, no US compliance at launch)  
8–12 months (full EU/UK/US compliance; WhatsApp; payroll integration via Merge.dev)

### Estimated Build Cost
£400k–£800k for 12-month MVP with a 4–6 person engineering team (London/EU market rates). Lower with offshore engineering; higher with senior enterprise-grade security requirements.

---

## Option B: White-Label ATS with Hospitality Overlay

### Summary

License an existing ATS platform as a white-label foundation and build hospitality-specific features (multi-location dashboard, seasonal talent pool CRM, WFM integrations, WhatsApp) as a product layer on top. Fastest to market; most constrained long-term.

### Platform Candidates

**Candidly (wearecandidly.com)**
- UK-based white-label ATS specifically positioned for HRIS/HR tech companies wanting to add ATS to their portfolio
- White-label: full custom branding; embedded in operator's platform
- Target: HRIS vendors adding ATS capability — closest match to Lapam's use case if Lapam wants to embed rather than standalone launch
- GDPR-aware (UK-native)
- Limitation: limited public information on hospitality-specific features or API depth; not a mass-market product

**ATS Anywhere (atsanywhere.io)**
- White-label recruiting platform + API
- Designed for HR platforms looking to expand via ATS
- API-first: allows custom UI and workflow on top of their core infrastructure
- Limitation: limited market visibility; small vendor risk

**Teamtailor (teamtailor.com)**
- Swedish ATS; strong in EU mid-market; employer brand focus
- Not white-label by default but has an API and has been used as a backend by overlay products
- GDPR-native (EU-built)
- Limitation: not designed as an OEM/white-label platform; using as a backend requires their terms to permit it; their own product roadmap takes priority

### What Would Be Built On Top (the hospitality layer)

Regardless of base platform:
1. Multi-location dashboard aggregating pipeline data from the base ATS API
2. Seasonal talent pool CRM (if the base ATS doesn't support this natively — most don't)
3. WhatsApp integration layer (base ATS likely won't have this)
4. WFM connectors (7shifts, Deputy, etc.) — unlikely in base platform
5. Hospitality-specific job templates, screening question library
6. Right-to-work workflow (UK) — may need to build even if base ATS has GDPR features
7. Branded candidate-facing application form (mobile-first)

### Advantages
- Core ATS pipeline management, notifications, and basic reporting inherited from base platform
- Faster initial MVP: 2–3 months to a functioning product with branding and basic hospitality overlay
- GDPR compliance partially addressed by EU-native platforms (Teamtailor, Candidly)
- Allows commercial validation before deep engineering investment

### Disadvantages
- **Vendor dependency:** Base platform roadmap decisions affect product at every level
- **Differentiation ceiling:** The product will always be constrained by what the base platform's data model and API expose. Hospitality-native features that require structural changes to the data model (e.g., talent pool re-consent lifecycle, cross-location candidate sharing) may be impossible or require workarounds
- **GDPR liability ambiguity:** Who is the data controller when candidate data sits in the white-label vendor's infrastructure? Requires careful DPA negotiation and may limit EU enterprise sales
- **Candidate experience still requires custom build:** The mobile-first no-login application form must be built custom regardless — base platforms typically expect a login
- **Cost at scale:** White-label licensing fees erode margins as revenue grows

### Time to MVP
2–3 months (functional product with hospitality branding + basic overlay)  
6–9 months (meaningful differentiation vs base platform competitors)

### Estimated Build Cost
£80k–£200k for first 6 months (licensing + 2–3 engineers building the overlay)  
Plus ongoing licensing fees (typically 15–30% of revenue share or fixed per-seat; not publicly disclosed by most white-label ATS vendors)

---

## Option C: Composable / Service-Oriented Architecture

### Summary

Build the hospitality ATS as an assembly of purpose-built services: a headless ATS core (open-source or API-first vendor) + independently built hospitality services (talent pool CRM, multi-location dashboard, mobile candidate form, WFM connectors) + a unified integration layer. The ATS core handles basic pipeline mechanics; all hospitality differentiation is in the overlay services. This is architecturally more sophisticated than Option B and more modular than Option A.

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Operator-facing Web App                  │
│             (Next.js — multi-location dashboard)          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                  API Gateway / BFF                        │
│          (routes requests to appropriate service)         │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┘
   │          │          │          │          │
┌──▼──┐   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐   ┌──▼──┐
│ ATS │   │ CRM │   │Comm │   │Comp │   │Integ│
│Core │   │Svc  │   │ Svc │   │lian │   │Layer│
│     │   │     │   │     │   │ce   │   │     │
│Jobs │   │Talent│  │SMS  │   │GDPR │   │WFM  │
│Apps │   │Pool  │  │WA   │   │RTW  │   │Pay  │
│Pipe │   │Reeng │  │Email│   │I-9  │   │Brd  │
└─────┘   └─────┘   └─────┘   └─────┘   └─────┘
```

**ATS Core options:**
- **OpenCATS** (open-source PHP ATS — not recommended; outdated stack)
- **Custom minimal ATS** (jobs, applications, pipeline stages — ~6 weeks to build; recommended)
- **Lever API** (closed SaaS but strong API; not truly composable)
The recommended approach: build a minimal ATS core from scratch (job postings → applications → pipeline stages → offers) rather than inheriting technical debt from open-source options. The core is small; differentiation is in the overlay services.

**CRM Service (seasonal talent pool)**
- Independent microservice: stores past candidate profiles, re-hire flags, seasonal availability, consent records
- Re-consent scheduler: queues communications at configurable intervals
- Tagging system: re-hire eligible, conditional, do not re-engage
- This service is the primary product differentiator and should be built independently from day one

**Communications Service**
- Unified messaging layer: SMS (Twilio), WhatsApp (360dialog/Twilio), Email (Postmark)
- Message templates, GDPR consent tracking per channel
- Outbound queuing with rate limiting (WhatsApp has send limits)

**Compliance Service**
- GDPR data subject request handler (access, erasure, portability)
- UK right-to-work workflow engine + GBG IDVT integration
- I-9 workflow engine + HireRight integration
- Data retention scheduler
- Audit log (append-only)

**Integration Layer**
- Merge.dev or Finch for payroll/HRIS
- Direct REST integrations for WFM (7shifts, Deputy, Rotaready)
- Adzuna or Broadbean for job board distribution

### Advantages
- **Best differentiation potential:** The hospitality-specific services (CRM, compliance, WFM connectors) are purpose-built with no constraints from a vendor platform
- **Independent deployability:** Each service can be scaled, updated, and replaced independently. If the WFM integration needs to change, it doesn't touch the ATS core
- **GDPR-clean architecture:** The compliance service is a first-class citizen, not integrated into a third-party platform
- **Cleaner long-term codebase** than a monolith that grows organically
- **Faster iteration on differentiators** — the talent pool CRM can evolve independently of the base ATS pipeline

### Disadvantages
- **Most complex to build and operate:** Microservices require more DevOps maturity — service discovery, distributed tracing, inter-service authentication, deployment orchestration
- **Overkill for early stage:** A 3-person engineering team will be slowed, not helped, by service boundaries at the outset. Premature decomposition is a known failure mode
- **Initial investment higher than Option B:** More infrastructure to set up before the first user can apply for a job
- **Operational complexity:** Multiple services means multiple points of failure; requires investment in observability (Datadog, Grafana/Prometheus) from early on

### Practical Recommendation Path
If Option C is chosen: begin as a **modular monolith** — a single deployable application with clear internal module boundaries (ATS, CRM, Compliance, Integrations) — and extract services only when the system and team are ready. This captures the architectural clarity of C without the operational overhead of microservices on day one.

### Time to MVP
4–6 months (modular monolith, UK-focused)  
10–14 months (full service decomposition + EU/UK/US compliance + WhatsApp)

### Estimated Build Cost
£500k–£1M for 12 months (higher operational and architecture overhead vs Option A monolith; more engineers required for distributed systems)

---

## Cross-Option Comparison

| Dimension | Option A (Greenfield Monolith) | Option B (White-label) | Option C (Composable) |
|-----------|-------------------------------|----------------------|----------------------|
| Time to first usable product | 4–6 months | 2–3 months | 4–6 months |
| Time to full EU/UK/US compliance | 8–12 months | 6–9 months | 10–14 months |
| Differentiation ceiling | High | Low–Medium | High |
| Vendor dependency risk | Low | High | Low |
| Build cost (12 months) | £400k–£800k | £80k–£200k + licensing | £500k–£1M |
| GDPR architecture control | Full | Partial (depends on vendor) | Full |
| Hospitality-native CRM | Full control | Constrained by vendor | Full control |
| WhatsApp integration | Full control | Must build regardless | Full control |
| Long-term margin profile | Strong (no platform rent) | Eroded by licensing | Strong (no platform rent) |
| Operational complexity | Medium | Low | High |
| Team requirement | 4–6 engineers | 2–3 engineers | 5–8 engineers |
| Recommended team profile | Full-stack TypeScript/Node; mobile (React Native/PWA); DevOps | Full-stack + 1 platform integrator | Distributed systems experience required |

---

## Infrastructure Decisions Relevant to All Options

### Cloud Provider

All three options require a cloud provider. AWS is the recommended primary platform for this use case:

- **EU compliance:** AWS eu-west-1 (Ireland) and eu-central-1 (Frankfurt) are mature, certified (ISO 27001, SOC 2 Type II), and have explicit GDPR tooling (Artifact, Macie, GuardDuty)
- **Multi-region maturity:** AWS has the largest number of regions globally — relevant for a product targeting 54-country operator clients
- **Ecosystem:** Widest set of managed services (RDS Aurora, ECS, SQS, Lambda, CloudFront, Secrets Manager, Cognito) reduces custom infrastructure build
- **Cost note:** AWS egress is expensive. For a messaging-heavy product (high outbound notification volume), model this carefully. GCP's more flexible reserved instance model and Azure's sovereign cloud options are worth considering at enterprise scale

GCP and Azure are viable alternatives. The choice should be driven by the team's existing expertise if strong preferences exist.

### Mobile: Native App vs PWA

The manager mobile use case (Marco persona) can be addressed two ways:

**Progressive Web App (PWA)**
- Pros: No app store dependency; faster to build; single codebase with web; works on any device; no App Store/Play Store review delays
- Cons: No push notifications on iOS (until iOS 16.4+ — now broadly supported); slightly lower performance ceiling; perception issue ("it's not a real app")
- Recommended for: B2B manager tooling where GMs are given the URL, not asked to install an app

**React Native (Expo)**
- Pros: Native push notifications; better camera/file access (relevant for right-to-work document capture); App Store distribution
- Cons: App Store/Play Store approval cycles; more complex CI/CD; separate codebase from web; Expo managed workflow simplifies this significantly
- Recommended for: If right-to-work document capture and push notifications are day-one requirements

**Recommendation-free note:** A PWA is faster to ship and sufficient for most manager workflows. The right-to-work check workflow (camera access for document photo) pushes toward native. The choice depends on the priority sequencing of the UK compliance feature. If UK is a day-one market, native is the safer choice.

### AI Screening — Architecture Note

Any AI-powered screening feature (CV scoring, keyword matching, candidate ranking) must be designed with these constraints from day one:
1. Human review step required before any rejection (EEOC + EU AI Act)
2. Decision audit log: what the AI scored, what the human decided, timestamp
3. Bias testing capability: operator should be able to review screen pass/fail rates by demographic segment (even if they never look at it — the capability is what satisfies regulators)
4. Transparency notice: candidates must be informed AI was used (EU AI Act; effective August 2026)
5. No emotion analysis, no inferred protected characteristics (EU AI Act ban; effective February 2025)

The safest architecture for an early-stage product: build deterministic rule-based screening first (keyword matching + screening question scoring). Add AI ranking as an assistive feature (suggested ranking, human confirms) once the audit infrastructure is in place. Do not launch with AI as the primary decision-maker.

---

## Key Open Questions for the Specification Agent

1. **Option selection:** Which of A, B, or C best matches the client's risk tolerance, timeline, and budget? This is a strategic decision, not a technical one — all three are viable.

2. **Mobile-first app vs PWA:** Does the day-one UK compliance workflow (right-to-work document capture) require native camera access, or is a mobile browser sufficient?

3. **Multi-region launch sequencing:** UK-first, US-first, or EU-first? Each implies a different day-one compliance requirement set and changes the build order significantly.

4. **AI features scope at MVP:** Is AI screening part of the MVP, or is the MVP deterministic/rules-based? The EU AI Act compliance overhead is materially different for each answer.

5. **Standalone product vs embedded in Lapam platform:** Is this an independent SaaS product or an embedded ATS within Lapam's existing hospitality management software? This changes the integration architecture, the multi-tenancy model, and the go-to-market motion significantly.
