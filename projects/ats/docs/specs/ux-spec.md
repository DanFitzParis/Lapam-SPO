---
title: "UX Spec — Lapam-ATS"
type: ux-spec
agent: specification
status: draft
version: 1.0
created: 2026-03-22
parent: docs/specs/PRD.md
architecture: docs/specs/ADR-001-tech-stack.md
---

# UX Spec: Lapam-ATS

---

## 1. Design Principles

These principles are derived directly from the persona research and must be respected in every
design decision. They are not aspirational — they are constraints.

**P1 — Manager-first mobile.** The operator experience is designed mobile-first. The dashboard
and candidate actions must work fluently on a phone held in one hand between services. Desktop
is additive, not primary.

**P2 — Candidate zero-friction.** The candidate application flow has a hard constraint: no
login, no account creation, completable in under 3 minutes on a mobile device. Every screen
added to this flow loses candidates. This is not a design preference — it is a conversion-rate
reality.

**P3 — Progressive disclosure.** Show the minimum required. Siobhán needs a dense data view;
Marco needs two taps. The same product serves both only if complexity is hidden behind
progressive disclosure — summary cards that expand, actions that reveal on tap, data that
surfaces on demand.

**P4 — Compliance confidence, not compliance anxiety.** GDPR consent, right-to-work checks,
and audit trails must be visible enough that Siobhán feels protected, not so prominent that
Marco feels like he's operating a legal system.

**P5 — AI as a shortcut, never a decision.** AI-generated drafts appear as editable suggestions.
They are never presented as completed actions. The send/publish button always belongs to the
operator.

---

## 2. Page Inventory

### Operator-Facing Pages (authenticated, Clerk session required)

| ID | Route | Primary Persona | Description |
|---|---|---|---|
| OP-01 | `/` | All | Root — redirects to `/dashboard` if authenticated, `/sign-in` if not |
| OP-02 | `/sign-in` | All | Clerk-hosted or embedded sign-in |
| OP-03 | `/dashboard` | Siobhán, Yusuf | Multi-location pipeline overview |
| OP-04 | `/locations` | Siobhán | Location list and management |
| OP-05 | `/locations/new` | Siobhán | Create location form |
| OP-06 | `/jobs` | All operators | Job listing across accessible locations |
| OP-07 | `/jobs/new` | All operators | Create job form (with AI JD generator) |
| OP-08 | `/jobs/[jobId]` | All operators | Job detail — Kanban pipeline for this role |
| OP-09 | `/jobs/[jobId]/applications/[applicationId]` | All operators | Candidate detail card |
| OP-10 | `/talent-pool` | Claire, Siobhán | Talent pool list and re-engagement |
| OP-11 | `/talent-pool/campaigns/new` | Claire, Siobhán | Batch re-engagement message compose |
| OP-12 | `/analytics` | Siobhán, Yusuf | Hiring analytics dashboard (Should-5) |
| OP-13 | `/settings` | Siobhán (Group Admin) | Org settings: locations, users, billing placeholder |
| OP-14 | `/settings/users` | Group Admin | User management and role assignment |

### Candidate-Facing Pages (public, token-based, no login)

| ID | Route | Description |
|---|---|---|
| CA-01 | `/apply/[applyLinkToken]` | Mobile-first job application form |
| CA-02 | `/apply/[applyLinkToken]/success` | Application confirmed — thank you screen |
| CA-03 | `/interview/[slotToken]` | Interview slot selection |
| CA-04 | `/interview/[slotToken]/confirmed` | Interview confirmation screen |
| CA-05 | `/offer/[acceptanceToken]` | Offer review and accept/decline |
| CA-06 | `/rtw/[rtwToken]` | Right-to-work verification instructions and submission |

---

## 3. Primary User Flows

### Flow 1: Group Admin publishes a job and monitors applications
**Persona: Siobhán**

```
/dashboard
  → [Tap location card showing 0 candidates for open role]
  → /jobs/[jobId] (Kanban pipeline — empty APPLIED column)
  → [Tap "+ Post a Job"]
  → /jobs/new
      → Enter role title
      → [Tap "Generate Description"] → AI draft appears in editable field
      → Edit description if needed
      → Select location(s)
      → Optionally add screening questions (up to 5)
      → [Publish]
  → /jobs/[jobId] (status: PUBLISHED, applyUrl QR code displayed)
  → [Share apply link / QR to site managers]
  → [Return to /dashboard — new applications appear in real-time]
```

**Key UX requirements for this flow:**
- The "Generate Description" button is inline in the description field — not a separate modal
- AI draft appears in place of the empty field, cursor positioned at start for immediate editing
- Publishing triggers a visible confirmation with the applyUrl and a one-tap copy/share action
- Dashboard updates within 10 seconds of first application without page refresh

---

### Flow 2: GM reviews and contacts a candidate
**Persona: Marco**

```
[Receives push notification or checks /jobs/[jobId] between services]
  → Candidate card in APPLIED column
  → [Tap candidate card]
  → /jobs/[jobId]/applications/[applicationId]
      → Name, availability, screening responses visible immediately
      → [Tap "Draft Message"] → AI-drafted acknowledgement appears
      → Edit or send as-is
      → [Send] → SMS dispatched; message appears in timeline
  → [Tap "Schedule Interview"]
      → Select up to 3 time slots from date picker
      → [Send Slots] → Candidate receives SMS with selection link
  → [Candidate selects slot — notification arrives]
  → Interview confirmed in timeline
```

**Key UX requirements for this flow:**
- Entire flow completable from a phone with one thumb
- Candidate card displays: name, availability type, screening responses, time since applied
- "Draft Message" and "Schedule Interview" are primary CTAs — always visible without scrolling
- No modals that require a close button to dismiss — use bottom sheets on mobile

---

### Flow 3: Seasonal hotel re-engagement campaign
**Persona: Claire**

```
[February — new season approaching]
/talent-pool
  → Filter by tag: REHIRE_ELIGIBLE
  → Sort by location / last-season role
  → [Select all — or select subset]
  → [Tap "Send Re-engagement Message"]
  → /talent-pool/campaigns/new
      → Pre-populated message template (editable)
      → Recipient count shown
      → Channel: SMS (default) or Email
      → [Send Campaign]
  → Confirmation: "Message sent to [X] people"
  → [Return to talent pool — availability responses begin coming in]
  → [Interested candidate] → [Tap "Create Application"] → pre-filled application record
```

**Key UX requirements for this flow:**
- Talent pool list has bulk select — select all visible / select by filter
- Campaign compose screen shows recipient count before sending
- Interested responses surface as a notification; tapping creates a pre-filled application
- GDPR consent expiry date visible on each talent pool entry card

---

### Flow 4: Candidate applies on mobile
**Persona: Aisha**

```
[Sees job posting on Instagram → taps link]
/apply/[applyLinkToken]
  Screen 1: Job summary (title, location, hours) + "Apply Now" CTA
  Screen 2: Name + mobile number (required) + email (optional)
  Screen 3: Availability (full-time / part-time / flexible — 3 large tappable options)
  Screen 4 (if screening questions exist): 1–3 questions per screen, large tap targets
  Final screen: GDPR consent notice (plain English, inline) + "Submit Application" button
/apply/[applyLinkToken]/success
  → "Thanks [first name] — we'll be in touch within [X] hours."
  → [SMS arrives within 2 minutes]
```

**Key UX requirements for this flow:**
- Single-column layout, no horizontal scrolling, no pinch-zoom required
- No login prompt at any point
- Progress indicator across screens (e.g. step 2 of 4)
- Buttons are minimum 48px tap target height
- GDPR consent is plain English — not a legal block of text
- CV upload is optional and clearly labelled as such — never a required field
- Apply link token in URL; if token is invalid or job is closed, clear message with no dead end

---

### Flow 5: UK right-to-work check
**Persona: Siobhán (triggers), Candidate completes**

```
[Siobhán moves candidate to OFFER stage — UK location]
  → System surfaces RTW requirement inline on candidate card
  → [Tap "Initiate RTW Check"]
  → Candidate receives SMS with verification link

[Candidate receives SMS]
/rtw/[rtwToken]
  → Instruction screen: "We need to confirm your right to work in the UK"
  → Two options presented:
      Option A: "I have a UK/Irish passport" → IDVT flow via GBG (document upload + selfie)
      Option B: "I have a share code" → Share code entry field → submits to UKVI
  → On completion: "Check submitted — your employer will be notified"

[Back in Siobhán's view]
  → Candidate card shows RTW status: PENDING → PASS / FAIL
  → PASS: "Hired" stage becomes available
  → FAIL: Alert shown; "Hired" stage blocked
```

**Key UX requirements for this flow:**
- RTW gate is surfaced automatically when OFFER stage is reached at a UK location — operator
  does not have to remember to trigger it
- RTW status is a persistent banner on the candidate card until resolved
- The two check type options are presented as large tappable cards — not a dropdown
- IDVT document upload uses native device camera via browser (no app required)

---

## 4. Responsive Breakpoints

All operator-facing pages are designed mobile-first with the following breakpoint system:

| Breakpoint | Min-width | Layout |
|---|---|---|
| Mobile | 0px | Single column; bottom-sheet overlays; stacked cards |
| Tablet | 768px | Two-column dashboard; sidebar navigation visible |
| Desktop | 1280px | Full dashboard with multi-column Kanban; data-dense views |

**Mobile-specific conventions:**
- Navigation: bottom tab bar on mobile (Dashboard, Jobs, Talent Pool, Settings)
- Overlays: bottom sheet (slides up) — not centre modals that require close buttons
- Actions: primary actions always above the fold; secondary actions in `...` overflow menu
- Kanban pipeline: horizontal scroll on mobile (swipe between stages); full column view on desktop

**Candidate-facing pages** are exclusively optimised for mobile (320px–768px). They must render
usably on a 320px-wide screen (iPhone SE width). No sidebar, no navigation chrome.

---

## 5. Accessibility Requirements (WCAG 2.1 AA)

All pages must meet WCAG 2.1 AA. Mandatory requirements:

| Requirement | Detail |
|---|---|
| Colour contrast | Minimum 4.5:1 for body text; 3:1 for large text and UI components |
| Keyboard navigation | All interactive elements reachable and operable via keyboard |
| Focus indicators | Visible focus ring on all focusable elements (not removed via `outline: none`) |
| Touch targets | Minimum 44×44px for all interactive elements on touch devices |
| Form labels | All form inputs have associated `<label>` elements or `aria-label` |
| Error messages | Form errors are associated with inputs via `aria-describedby` |
| Image alt text | All non-decorative images have descriptive alt text |
| Heading hierarchy | Logical heading order (h1 → h2 → h3) on every page |
| Live regions | Pipeline dashboard updates announced to screen readers via `aria-live="polite"` |

Shadcn/ui (Radix UI primitives) is selected as the component library because its components
implement ARIA roles, keyboard navigation, and focus management by default.

---

## 6. Design Tokens

Token values are illustrative. The Building Agent should treat these as the token names to
implement; exact values are set during visual design and may be refined. Token names must be
used consistently across Tailwind config and component code.

### Colour

```
--color-primary:         #1a1a2e   /* Dark navy — primary actions, headings */
--color-primary-hover:   #16213e
--color-accent:          #e94560   /* Alert red — pipeline alerts, rejection states */
--color-accent-positive: #0f9b58   /* Green — hired, pass states */
--color-accent-warning:  #f5a623   /* Amber — pending RTW, stale alerts */
--color-surface:         #ffffff
--color-surface-subtle:  #f8f9fa   /* Card backgrounds */
--color-border:          #e2e8f0
--color-text-primary:    #1a202c
--color-text-secondary:  #718096
--color-text-inverse:    #ffffff
```

### Typography

```
--font-sans:    'Inter', system-ui, sans-serif
--font-mono:    'JetBrains Mono', monospace   /* used for tokens, IDs only */
--text-xs:      12px / 1.5
--text-sm:      14px / 1.5
--text-base:    16px / 1.6
--text-lg:      18px / 1.4
--text-xl:      20px / 1.3
--text-2xl:     24px / 1.2
--text-3xl:     30px / 1.2
```

### Spacing

4px base grid. All spacing values are multiples of 4px.

```
--space-1:   4px
--space-2:   8px
--space-3:  12px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-12: 48px
--space-16: 64px
```

### Border radius

```
--radius-sm:  4px
--radius-md:  8px
--radius-lg: 12px
--radius-full: 9999px  /* pill badges */
```

### Elevation (shadows)

```
--shadow-card:   0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)
--shadow-modal:  0 10px 40px rgba(0,0,0,0.15)
--shadow-toast:  0 4px 16px rgba(0,0,0,0.12)
```

---

## 7. Component Conventions

### Candidate Card (pipeline Kanban)

Used in: `/jobs/[jobId]`, `/dashboard` (summary counts link to this)

**Mobile (< 768px):** Single card per row, full width. Shows: name, role, time since applied,
availability badge, knockout flag indicator (if flagged), primary CTA ("View").

**Desktop:** Kanban column card. Shows same fields. Drag between stages is a Could-Have,
not MVP — MVP uses tap/click stage change only.

**Stage indicator colours:**
- APPLIED: `--color-text-secondary` pill
- SCREENING: `--color-accent-warning` pill
- INTERVIEW: `--color-primary` pill
- OFFER: `--color-accent-positive` dimmed
- HIRED: `--color-accent-positive` solid
- REJECTED: `--color-text-secondary` with strikethrough name
- WITHDRAWN: `--color-text-secondary`

### Pipeline Stage Change

Triggered by: tap "Move to [stage]" on candidate card action menu.

1. Bottom sheet (mobile) / dropdown (desktop) shows valid next stages
2. For OFFER at a UK location: RTW requirement surfaced inline with a "Start RTW check" CTA —
   does not block the stage move, but adds a persistent RTW status banner to the candidate card
3. For REJECTED: rejection message draft offered (AI or template) before confirming
4. Confirmation step for HIRED and REJECTED — one extra tap required

### AI Draft Indicator

Any field populated by AI must display a subtle "AI draft — review before sending" label.
Use `--color-accent-warning` background with a small sparkle icon. Label disappears once
the operator edits the field content. This convention ensures the operator always knows
when they are looking at generated content.

### GDPR Consent Inline Notice (candidate-facing)

Displayed on the final application submission screen. Must be:
- In plain English (not legal language)
- Maximum 80 words
- Includes: what data is stored, why, for how long, and a link to full privacy policy
- Must not use pre-ticked checkbox — explicit unchecked checkbox, minimum 44px tap target

---

## 8. Empty States and Error States

### Empty pipeline

When a location has no open jobs: full-bleed illustrated empty state with primary CTA
"Post your first job". Not a blank screen.

When a job has no applications yet: "Waiting for applications" with the apply URL / QR code
displayed prominently for easy copying and sharing.

### Stale alert empty state

When no locations have stale applications: positive reinforcement — "All pipelines active.
No stale candidates." In `--color-accent-positive`.

### AI provider unavailable

Inline error below the AI trigger button: "AI drafting is unavailable right now. You can
write this manually." No toast, no modal — inline only. The field remains editable.

### Right-to-work failure

Candidate card shows: red banner "RTW check failed — hiring blocked". A "View details" link
opens the RTW check record. Group Admin can override with a reason (logged to AuditLog).

---

## 9. Design Rationale

### Why bottom sheets instead of modals

Modals with close buttons require precise tap targeting on mobile. Bottom sheets slide up from
the bottom of the screen and are dismissed by swiping down — a natural thumb gesture. For the
Marco persona operating between services on a small phone, bottom sheets are significantly
faster to use and harder to accidentally dismiss than centre modals.

### Why the candidate flow has a progress indicator

Research shows 73% of candidates abandon applications perceived as too long on mobile. A
progress indicator ("Step 2 of 4") communicates the remaining effort explicitly, reducing
abandonment from uncertainty rather than actual length. The indicator creates a completion
commitment effect even when the actual form is minimal.

### Why AI draft labels use warning amber, not a success colour

If AI-generated content were styled positively (green, checkmark), operators might subconsciously
trust it more than they should. Amber is a review colour — it communicates "this needs your
eyes before it goes further." The colour choice is a deliberate nudge toward the human-review
step that the PRD Non-Goals require.

### Why the RTW gate is automatic, not manual

Research found that UK operators' primary compliance anxiety is forgetting a step — not
deliberately bypassing it. Making the RTW requirement surface automatically when a candidate
is moved to OFFER stage at a UK location removes reliance on operator memory. The gate is
informational (it does not block the OFFER stage move), but it makes the compliance step
impossible to overlook. Group Admins can override a failed check with a reason code, which
is logged — this satisfies the UK legal requirement that the employer "cannot turn a blind eye"
while allowing legitimate edge cases (e.g. a candidate with pending documentation).
