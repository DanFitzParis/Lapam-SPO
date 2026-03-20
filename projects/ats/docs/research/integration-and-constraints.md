---
title: "Lapam-ATS — Integrations and Constraints"
type: research
agent: research
status: draft
version: 1.0
created: 2026-03-20
parent: initial-brief.md
evidence_quality:
  confidence: medium
  notes: "Regulatory content sourced from primary government/regulatory sources (GOV.UK, USCIS, EC, EEOC.gov) and legal commentary (Greenberg Traurig, DavidsonMorris, Hogan Lovells). EU AI Act timeline from hiretruffle.com and Ogletree, consistent with European Commission primary documents. Integration landscape sourced from competitor product pages and market reports. All penalty figures cited from primary legislative sources where accessible."
---

# Integrations and Constraints: Hospitality ATS

This file documents: (1) the integration landscape — systems a hospitality ATS must connect with to be credible in the target market; and (2) hard regulatory constraints that shape architecture, feature scope, and go-to-market by geography. Both are treated as first-class product requirements, not afterthoughts.

---

## Part 1: Integration Landscape

### Integration Priority Framework

Not all integrations carry equal weight. Priority is determined by two factors: how often the ICP operator uses the system, and how painful the absence of integration is to the buyer.

| Priority | Tier | Rationale |
|----------|------|-----------|
| Critical | Must have at launch | Blocking issues: operators will reject the product without these |
| High | Target within 6 months | Significant friction without; reduces win rate vs competitors |
| Medium | 12-month roadmap | Meaningful to specific ICP sub-segments |
| Low | Opportunistic | Nice-to-have; unlikely to be a buying criterion |

---

### 1.1 Scheduling and WFM (Critical)

The transition from "hired" to "rostered and working" is the most operationally critical handoff for a hospitality operator. An ATS that cannot pass a new hire's profile and availability directly to scheduling forces a manual re-entry step — precisely the kind of admin overhead the ICP is trying to eliminate.

**Systems to integrate:**

| System | Segment | Geography | Notes |
|--------|---------|-----------|-------|
| **7shifts** | Restaurant groups (10–500 locations) | US-primary; growing UK/EU | API available; widely adopted in growing QSR and casual dining groups. REST API for employee data sync. |
| **Deputy** | Hospitality (restaurant + hotel) | UK, Australia, EU, US | API available; dominant in UK/EU mid-market hospitality shift scheduling |
| **Workforce.com** | Restaurant and hospitality WFM | US, UK | Purpose-built for hourly hospitality; payroll integrations built-in |
| **Fourth / HotSchedules** | Enterprise restaurant + hotel chains | US, UK | Won't partner with a competing ATS — integration likely impossible for direct competitor positioning |
| **Harri** | Enterprise hospitality WFM | US, UK | Same constraint as Fourth — owns full lifecycle; integration only relevant if ATS positions as complementary |
| **Rotaready** | UK hospitality-specific scheduling | UK | Used by mid-market UK pub groups, restaurants, care homes |
| **Planday** | EU hospitality scheduling | EU (Denmark origin) | Popular in Nordics, Germany, Netherlands for hospitality scheduling; API documented |

**Integration mechanics:** REST API; OAuth 2.0 employee record sync; webhook on hire confirmation to trigger scheduling account creation.

**Critical constraint:** Any operator on Harri or Fourth cannot run a separate ATS without significant friction — those platforms own the full lifecycle and discourage third-party ATS. The realistic integration addressable market is operators using standalone scheduling tools (7shifts, Deputy, Rotaready, Planday) who do not have an ATS module built in.

---

### 1.2 Property Management Systems / POS (High)

For hotel-facing ICP (Siobhán managing a hotel group, Claire at a seasonal resort), the PMS is the operational core. New hires need to be provisioned into the PMS for access control, communication systems, and housekeeping task assignment. This is not an automated integration today for any mainstream ATS — it represents a genuine differentiator opportunity.

**Hotel PMS landscape (2024–2025):**

| System | Market Position | Geography | API/Integration |
|--------|----------------|-----------|-----------------|
| **Oracle OPERA Cloud** | Enterprise leader (~30–35% global share with Maestro) | Global | REST API available; enterprise complexity |
| **Mews** | Mid-market independent hotels; open marketplace | EU, UK, US growing | Open API; Mews Marketplace with pre-built connectors |
| **Cloudbeds** | Boutique and independent hotel groups | Global | Open API; integration marketplace; REST |
| **Guesty** | Short-term rentals / vacation properties | Global | REST API |

**Restaurant POS landscape:**

| System | Market Position | Geography | ATS Integration Relevance |
|--------|----------------|-----------|--------------------------|
| **Toast** | ~68% US publicly-traded restaurant tech market share | US dominant | HR/payroll module adjacent; new employee provisioning use case |
| **Lightspeed** | EU/Canada/Australia | EU, Canada, AU, UK | New employee system access post-hire |
| **Square for Restaurants** | SMB US/UK | US, UK | Common in independent restaurants |
| **Oracle MICROS** | Enterprise chains | Global | Complex; enterprise-only integration |

**Integration value for ATS:** Not direct data exchange for hiring, but new-hire employee profile sync (name, role, start date, access level) would reduce admin at the point of onboarding. This is a medium-term roadmap item, not a day-one requirement. The highest-value integration in this category is **Mews** (open API, mid-market hotel group — directly matches ICP) and **Toast** for US restaurant-facing ICP.

---

### 1.3 Payroll (Critical)

The point at which an ATS fails most visibly is when a hired candidate's details have to be re-entered manually into payroll. For the mid-market ICP, this is a real daily friction point. Getting a new hire into payroll before their first shift requires correct data, correct tax code, correct bank details — and mistakes create trust-destroying first-day experiences.

**Common payroll systems in the ICP segment:**

| System | Geography | Segment | Notes |
|--------|-----------|---------|-------|
| **Sage (Sage 50, Sage Payroll, Sage HR)** | UK, EU | SMB to mid-market | Dominant UK payroll; Sage HR has ATS module but weak |
| **Xero Payroll** | UK, AU, NZ | SMB | Very common in UK independent restaurant groups |
| **QuickBooks Payroll** | US, UK | SMB | Common in owner-operated groups |
| **BambooHR** | US (primary), EU | Mid-market | Integrated ATS + HRIS + payroll for 25–500 staff |
| **ADP** | US, UK, global | Mid-market to enterprise | API-connected; 30+ ATS integrations pre-built |
| **Gusto** | US | SMB-mid | Popular for US restaurant/hospitality SMB |
| **Fourth Payroll** | UK, EU | Enterprise hospitality | Integrated with Fourth WFM; won't be a partner |
| **Harri Payroll** | UK only | Enterprise hospitality | Same constraint |

**Integration approach:** The most pragmatic path is:
1. Native integration with **Sage** and **Xero** (covers the bulk of UK mid-market)
2. Native integration with **ADP** and **Gusto** (covers US mid-market)
3. Webhook/CSV export for all others initially
4. Merge.dev or Finch (unified payroll/HRIS API aggregators) as a fast-path to cover the long tail

**Merge.dev** and **Finch** are unified HRIS/payroll integration APIs that provide a single API to connect to 50+ payroll systems. This is the recommended build approach for payroll integration — building integrations one-by-one is expensive and brittle. One integration to Merge/Finch yields connectivity to ADP, Gusto, BambooHR, Rippling, and more.

---

### 1.4 Job Boards and Sourcing (Critical)

Multi-board job posting is a baseline expectation. Operators expect to post once and have the role appear everywhere relevant. This is achieved via direct API connections or an aggregator.

**Priority job boards by geography:**

| Board | Geography | Segment | Notes |
|-------|-----------|---------|-------|
| **Indeed** | Global | All | Dominant volume source in all key markets; sponsored posts via Indeed API or Programmatic |
| **LinkedIn** | Global | Supervisor/management level | Less relevant for frontline; essential for management hires |
| **Google for Jobs** | Global | All | Structured data markup on career page = free Google indexing |
| **Glassdoor** | US, UK | All | Employer brand; review management adjacent |
| **Totaljobs / Reed** | UK | All | Major UK generalist boards |
| **Indeed (UK)** | UK | Frontline | Indeed still dominant in UK |
| **Jobteaser / EURES** | EU | All | EU multi-country generalist |
| **Hospitality Online** | US | Hotel/hospitality-specific | $425/month unlimited |
| **Poached Jobs** | US | Restaurant | ~$59/post; good quality |
| **Culinary Agents** | US | Chef/F&B | ~$49–69/post |
| **OysterLink** | US | Restaurant | ~$150/post; hospitality-focused |

**Integration approach:** Broadbean, Idibu, or Adzuna's direct API (multi-posting aggregators) cover the major boards with a single API. Alternatively, direct Indeed API + structured data for Google for Jobs + manual connectors for niche hospitality boards. Direct job board API integration vs programmatic spend management is a product positioning choice: pure ATS (operator controls spend) vs managed distribution (ATS controls distribution).

---

### 1.5 Background Checks and Verification (High)

Background checks are a standard part of the hire workflow for hospitality, particularly in hotel and multi-site contexts. Right-to-work verification is a legal requirement in the UK. The integration should trigger seamlessly post-offer without requiring the operator to log into a separate system.

**Recommended integration partners:**

| Provider | Geography | Strengths | ATS Integration |
|----------|-----------|-----------|-----------------|
| **Sterling** | Global (US + UK + EU) | 30+ ATS integrations; enterprise-grade; right-to-work + criminal checks | REST API; pre-built connectors for major ATS |
| **Certn** | UK, EU, US, Canada | Global criminal checks, credit, reference, ID verification; white-label option; ATS API | REST API; white-label UI embeddable in ATS |
| **Checkr** | US-primary | Background check + I-9 adjacent; hospitality content; strong API | Used by Harri, Workstream; well-documented API |
| **GB Group (GBG)** | UK-primary | UK right-to-work verification; identity; digital checks | REST API; widely used by UK employment platforms |
| **HireRight** | US, global | I-9 + E-Verify + international checks; 30+ ATS integrations | Pre-built or REST API |

**Recommendation for MVP:** Certn (covers UK/EU/US from one API; white-label option) + HireRight for US I-9/E-Verify. Sterling as an alternative if Certn lacks a required check type. Checkr for US only if needed.

---

### 1.6 Communication Channels (Critical)

Based on domain-patterns.md findings, communication channel preference divides sharply by geography:

| Channel | Region | ATS Integration Path |
|---------|--------|---------------------|
| **SMS/Text** | US-primary | Twilio, MessageBird, or direct carrier API |
| **WhatsApp** | UK, EU, Global | WhatsApp Business API (Meta Cloud API) via Twilio or 360dialog |
| **Email** | All (secondary) | SendGrid, Postmark, AWS SES |
| **In-app messaging** | All (for post-hire) | Native; no third-party dependency |

**WhatsApp Business API — critical technical notes:**
- Requires verified Meta Business account; business verification process takes 1–4 weeks
- Message templates must be approved by Meta before use in bulk sends
- Conversations are session-based: 24-hour messaging window after candidate initiates; outside that window, only pre-approved templates can be sent
- End-to-end encrypted (good for candidate data privacy); but Meta is data processor — GDPR DPA with Meta required
- Twilio and 360dialog are the two main BSPs (Business Solution Providers) for WhatsApp API; Twilio is higher cost but more familiar; 360dialog is lower cost and increasingly preferred in EU
- **This is a non-trivial build** — WhatsApp API has meaningful setup overhead and ongoing compliance requirements. It is a genuine differentiator vs US-native competitors (none of whom offer it) but is not a day-one requirement. It should be on the 6-month roadmap and is essential before meaningful EU/UK commercial traction.

---

### 1.7 Identity and Authentication (Medium)

For multi-location groups, SSO is a common request from IT/operations teams.

- **Google Workspace SSO** (Workspace is dominant in mid-market hospitality for email and calendar)
- **Microsoft 365 SSO** (more common in enterprise hotel groups; Eploy already integrates with Microsoft)
- **Standard email/password** for SMB operators without SSO infrastructure
- **SAML 2.0 / OAuth 2.0** as underlying protocols

---

## Part 2: Regulatory Constraints

These are hard constraints — they shape product architecture, data handling, and feature scope, and create legal risk if not addressed before market entry. They are ordered by severity and immediacy of impact on the build.

---

### 2.1 GDPR (EU) and UK Data Protection Act 2018 — Hard Constraint

**Applies to:** Any operator processing candidate data from EU/UK-located individuals. This includes US-based ATS vendors serving EU/UK operators.

**Core obligations:**

| Obligation | Practical ATS Requirement |
|-----------|--------------------------|
| Lawful basis for data processing | Consent capture at application point; or documented legitimate interest; pre-contractual basis acceptable for active candidates |
| Right to access | Candidate-facing portal or admin workflow to export all data held on a specific individual in machine-readable format |
| Right to erasure ("right to be forgotten") | Complete deletion — not archiving — of candidate record on request; including from talent pools, chat history, and audit logs |
| Right to rectification | Mechanism for candidates to correct their own data |
| Data minimisation | Application form must not collect data that isn't necessary for the hiring decision |
| Storage limitation | Clear data retention policy: recommended maximum 6–12 months for unsuccessful candidates. The talent pool CRM feature must handle re-consent before this period expires |
| Data portability | Exportable candidate data in structured format (CSV/JSON) |
| Privacy by design | Default settings should minimise data collection; no pre-ticked consent boxes |
| Data Processing Agreements (DPA) | Required with every sub-processor (Twilio, AWS, WhatsApp/Meta, background check providers, etc.) |

**Data residency:**
- GDPR does not mandate EU hosting, but transfers outside the EEA require additional safeguards (Standard Contractual Clauses or adequacy decision country)
- For EU clients, offering EU data residency (e.g., AWS eu-west or eu-central regions) is the path of least resistance to enterprise sales
- UK data after Brexit: UK has its own adequacy arrangement with EU (currently in force); UK-to-EU transfers are generally permitted
- **Architecture implication:** Multi-region cloud deployment from day one if targeting EU and US simultaneously. Single-region US deployment is a structural barrier to EU enterprise accounts.

**Penalties:** Up to €20 million or 4% of global annual turnover (whichever higher). UK ICO can fine up to £17.5 million or 4% of global turnover.

**Talent pool / CRM feature — specific GDPR risk:**
The seasonal re-engagement CRM is the product's most differentiated feature and also its highest GDPR risk surface. Storing past candidate data for future re-engagement requires:
1. Consent captured at original application for re-engagement use case (not just "applying for this role")
2. Regular re-consent workflows (recommended: every 12 months)
3. Clear candidate-facing UI showing what data is held and allowing deletion
4. Separate retention period logic for talent pool vs active applications vs hired employees

**This is a design requirement, not a post-launch compliance task.** The talent pool feature cannot launch without the consent and re-consent workflow built.

---

### 2.2 UK Right to Work — Hard Constraint

**Applies to:** All UK hires. Must be completed **before** the employee starts work.

**Obligation:** Employers must verify every employee's right to work in the UK before employment begins. Failure creates civil liability of:
- Up to **£45,000 per illegal worker** (first breach)
- Up to **£60,000 per illegal worker** (repeat breach within 3 years)
- In knowing employment of illegal worker: criminal liability

**Check types:**

| Check Type | How | Who uses it |
|-----------|-----|-------------|
| **Manual document check** | In-person inspection of original documents (passport, BRP, etc.) | Legacy; still valid but less common |
| **Online share code** | Candidate provides share code from UK Visas and Immigration; employer checks on gov.uk | Standard for EU nationals with digital status, BRP holders |
| **IDVT (Identity Document Validation Technology)** | Certified digital check via IDVT provider (e.g., GBG, Yoti, Onfido) — valid for UK/Irish passports | Remote/digital hiring workflow; IDSP provider must be certified |
| **Home Office Employer Checking Service** | For cases where candidate cannot provide normal documentation | Exception; handled via ECS portal |

**ATS product requirement:**
- Workflow step in onboarding that prompts candidate to provide share code OR upload document
- Integration with a certified IDVT provider (GBG or similar) for digital checks
- Timestamped record of check stored for duration of employment + 2 years
- Automated follow-up reminder for time-limited permissions (visa expiry tracking)
- **Must not discriminate:** The check must be applied to every candidate equally, regardless of nationality — applying it selectively creates race discrimination liability

---

### 2.3 US Employment Eligibility (I-9 / E-Verify) — Hard Constraint

**Applies to:** All US hires. Form I-9 must be completed within 3 business days of start date.

**Requirements:**
- Section 1 completed by employee on or before first day
- Section 2 completed by employer within 3 business days
- Documents must be physically inspected (remote hire exception exists for E-Verify participants only)
- Records retained for 3 years from date of hire or 1 year after termination (whichever later)

**E-Verify:**
- Voluntary at federal level; mandatory for federal contractors and in some US states (Arizona, Georgia, North Carolina, South Carolina, Alabama, Mississippi, Tennessee, Utah)
- Integrates with I-9 process; electronic case creation
- HireRight, DISA, Accurate all provide E-Verify + I-9 combined solutions with ATS integration

**ATS product requirement:**
- Electronic I-9 workflow (Section 1 candidate-facing; Section 2 employer-facing)
- Integration with HireRight, Checkr, or similar for I-9 management and optional E-Verify
- Document retention tracking and expiry alerts

---

### 2.4 EEOC / Anti-Discrimination in Screening — Hard Constraint

**Applies to:** All US hiring. Title VII of the Civil Rights Act (plus ADEA for age, ADA for disability, GINA for genetic information).

**Core rule:** Neither the screening criteria nor their outcome may have a disparate impact on a protected class (race, colour, religion, sex, national origin, age 40+, disability, genetic information) without a legitimate business justification.

**2023 EEOC AI Disparate Impact Guidance (key implications for ATS):**
- The "four-fifths rule" applies to AI screening tools: if a protected group passes the screen at less than 80% of the rate of the highest-passing group, disparate impact is indicated
- Employers **remain liable** even when using a third-party AI tool — cannot delegate liability to the vendor
- Automated keyword filtering, pre-screen question logic, and scoring algorithms all fall in scope
- EEOC does not provide a safe harbour for AI tools — each must be validated

**ATS product requirements:**
- Screening questions must be reviewed for disparate impact potential
- No AI scoring that considers characteristics correlating with protected class without validation
- EEO data collection (voluntary) with reporting capability (required for employers with 100+ employees under EEO-1 rules)
- Audit trail of screening decisions for each candidate
- Human override at every automated stage — no fully automated rejection without human review in the pipeline

---

### 2.5 EU AI Act — Hard Constraint (Full Compliance by August 2026)

**Applies to:** Any organisation placing AI on the EU market or whose AI outputs affect EU individuals. Applies to non-EU ATS vendors used by EU operators.

**Timeline:**
| Date | What Applies |
|------|-------------|
| 1 Aug 2024 | AI Act entered into force |
| 2 Feb 2025 | **Prohibitions effective** — banned AI practices must stop |
| 2 Aug 2025 | GPAI model transparency obligations |
| **2 Aug 2026** | **Full obligations for high-risk systems (including hiring AI)** |
| 2 Aug 2027 | Extended deadline for AI embedded in regulated products |

**Banned AI practices (effective February 2025):**
- Emotion recognition in workplaces (e.g., facial expression analysis in video interviews)
- Biometric categorisation inferring protected traits (race, political views, sexual orientation)
- Social scoring based on broad personal/online behaviour
- Any manipulation causing harm to candidate decision-making

**High-risk classification (hiring systems):**
The following ATS features are **high-risk** under the AI Act and must comply with full obligations by August 2026:
- AI CV screening and ranking
- Automated candidate scoring
- Interview analysis tools (video, voice)
- Skills testing and performance prediction
- Any system making or influencing hiring decisions using algorithmic tools

**Obligations for high-risk AI systems (by August 2026):**
1. Risk management system documented and maintained
2. Data governance and data quality procedures
3. Technical documentation and record-keeping
4. Transparency: candidates must be informed when AI is used in decisions affecting them
5. Human oversight: must be technically feasible for a human to override, monitor, and correct AI outputs
6. Accuracy, robustness, and cybersecurity requirements
7. CE marking (for systems placed on EU market)
8. Registration in EU AI Act database

**Penalties:** Up to €35 million or 7% of global annual turnover for prohibited uses; up to €15 million or 3% for other violations.

**Product design implication:**
Any AI screening or scoring feature in the EU deployment must be built with human oversight from the start. Fully automated rejection is not permissible. Every AI-assisted decision must be reviewable and overridable by a human, with the override logged. This is not a compliance retrofit — it is a fundamental architecture constraint for any EU-facing AI feature.

---

### 2.6 France CNIL — Jurisdiction-Specific Constraint

**Applies to:** French operators or processing data of France-located candidates.

France's CNIL has published a 19-point guidance framework specifically for recruitment data processing (updated to be consistent with GDPR, but more prescriptive). Key points:

- Acceptable legal bases for recruitment: pre-contractual measures (most common) or legitimate interests
- "Innovative tools" such as psychometric testing, personality assessments, or AI behavioural scoring require separate documented justification and are treated with greater scrutiny
- Candidates must be informed of the categories of data collected, the purpose, the retention period, and their rights — at the point of data collection (not buried in a privacy policy)
- Data collected specifically for a vacancy must not be used for other vacancies without renewed consent

**Practical implication:** French operators will scrutinise the ATS privacy notice and data processing agreement more carefully than most. The consent workflow and transparency features must be granular enough to satisfy CNIL requirements, which go beyond standard GDPR implementation. Flag this for the Specification Agent: CNIL compliance may require a localised privacy notice template and a consent workflow that supports per-purpose opt-in (not a single global consent).

---

### 2.7 Germany BDSG and Works Council (Betriebsrat) — Sales Cycle Constraint

**Applies to:** German operators deploying the ATS at enterprise scale where a works council exists.

**Betriebsrat consultation requirement:**
Under the German Works Constitution Act (BetrVG), employers with a works council must consult and reach agreement with the works council before introducing IT systems that monitor or process employee or applicant data. This includes:
- ATS deployment
- Any feature that tracks employee performance, communication, or activity
- Changes to existing HR tool configurations

**Practical implication:**
- Enterprise accounts in Germany face an extended sales cycle — typically 4–12 weeks for works council consultation
- The ATS must be able to provide a detailed data processing description (what data is collected, stored, who has access, how long retained) that can be submitted to the works council
- Features that could be perceived as surveillance (e.g., time-tracking in the ATS, communication sentiment analysis) will face rejection or require modification
- This is not a dealbreaker, but it is a budget and timeline implication for the sales team and the customer success function

---

### 2.8 Employment Contract and Fixed-Term Regulations — Operational Constraint

For the seasonal ICP (Claire and the seasonal hotel group), fixed-term and temporary contract management intersects with employment law in every jurisdiction:

| Jurisdiction | Key Rule | ATS Implication |
|-------------|----------|-----------------|
| **UK** | Fixed-term employees entitled to same terms as permanent after 4 years; redundancy rights after 2 years | Contract type tracking; expiry alerts; re-engagement management |
| **EU (Working Time Directive)** | Minimum rest periods, maximum weekly hours apply to all employees including seasonal | Contract terms must reflect WTD; the ATS should not enable scheduling that creates WTD violations |
| **France** | CDD (fixed-term contracts) strictly regulated; renewal limits; gap periods required | Contract type validation in onboarding workflow |
| **Germany** | Befristeter Arbeitsvertrag requires written form; limited renewal without objective reason | Written contract generation; renewal count tracking |
| **Spain** | Recent reform: stronger protections for seasonal/temporary workers | Document collection must capture correct contract type |
| **US** | At-will employment in most states; no fixed-term contract requirement; state-specific rules | Simpler contract workflow; I-9 remains required |

**Practical implication:** The ATS onboarding module must support contract type selection (permanent, fixed-term, seasonal, zero-hours/casual) and associate expiry dates with right-to-work follow-up checks. This is moderately complex to build correctly across jurisdictions but is essential for the seasonal hotel ICP.

---

## Part 3: Constraint Priority Summary

| Constraint | Geography | Severity | Launch Blocker? | Architecture Impact |
|-----------|-----------|----------|-----------------|---------------------|
| GDPR candidate consent + retention | EU, UK | Critical | Yes — cannot launch EU/UK without | Consent workflow, auto-deletion, data residency option |
| Talent pool re-consent workflow | EU, UK | Critical | Yes — talent pool feature blocked without | Separate consent logic for CRM vs ATS |
| UK Right to Work check | UK | Critical | Yes — UK operators require this | IDVT integration (GBG/Onfido) |
| US I-9 / E-Verify | US | Critical | Yes — US operators require this | E-I-9 workflow + HireRight/Checkr integration |
| EEOC disparate impact | US | High | No — but legal exposure without | Screening audit trail; human override; EEO reporting |
| EU AI Act (Aug 2026) | EU | High | Not at launch — but roadmap blocker | Human oversight architecture for any AI feature |
| WhatsApp Business API | UK, EU | High | No — but adoption risk without it | Meta BSP integration; consent per GDPR |
| EU AI Act bans (Feb 2025) | EU | Critical | Yes if emotion AI features are planned | Must not build emotion recognition or biometric inference |
| France CNIL specifics | France | Medium | No — but France sales blocked without | Localised consent workflow; per-purpose opt-in |
| Germany works council | Germany | Medium | No — sales cycle impact only | Data processing documentation ready for BetVR submission |
| Fixed-term contract support | EU, UK | High | No — but seasonal ICP blocked without full feature | Contract type tracking; expiry alerts |

---

## Key Architectural Decisions Implied by This File

These decisions should be escalated explicitly to the Specification Agent:

1. **Multi-region infrastructure from day one.** EU data residency (AWS eu-west/eu-central or equivalent) must be available at EU launch. Building this as a retrofit is expensive. If the product launches US-only first, the architecture must be designed to support multi-region deployment from the start.

2. **No fully automated rejection.** Any AI-assisted screening must include a human review step to comply with EEOC (US) and EU AI Act (EU). Design the pipeline with human-in-the-loop by default.

3. **Consent as a first-class data model.** Every candidate record must carry consent metadata: what they consented to, when, the source of consent, and an expiry. This is especially critical for the talent pool CRM feature. It cannot be bolted on later.

4. **Background check integration on day one for UK.** UK right-to-work verification is not optional for any UK operator. This means an IDVT provider integration (GBG or Onfido) must be part of the MVP scope, not a later milestone.

5. **WhatsApp is a 6-month roadmap requirement, not a day-one feature.** The Meta Business API verification process, template approval, and GDPR DPA with Meta take time to set up. But without WhatsApp, the EU candidate engagement story is materially weaker. Begin the Meta Business verification process in parallel with product build.
