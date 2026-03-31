---
title: "Mission Control — Build Specification"
agent: ops-agent
status: approved
version: "1.1"
date: "2026-03-31"
reads:
  - projects/mission-control/CLAUDE.md
  - mapal-master-style-guide-v2.md (in project knowledge)
  - Agent IDENTITY.md files in each workspace
---

# Mission Control — Build Specification

> The SPO builds its own office. This spec defines what Jaro builds.

---

## 1. What This Is

A production internal dashboard for the Mapal Synthetic Product Organisation that serves two simultaneous audiences:

1. **Operator (Daniel):** Real-time visibility into agent status, project progress, and cost across all SPO projects.
2. **Executive observers:** An immediately legible visualisation that the SPO is a *team of working specialists* — not a tool being operated.

The dashboard is at `projects/mission-control/` in the `Lapam-SPO` repo. It is a separate Next.js application from the ATS (`projects/ats/`). The two applications share the same Git repo but are otherwise independent.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI components | shadcn/ui |
| Data visualisation | Tremor |
| Real-time backend | Convex (cloud-hosted, free tier) |
| Styling | Tailwind CSS + Mapal design tokens (CSS vars) |
| Font | Montserrat (Google Fonts) |
| Motion | CSS transitions only — 120/180/240ms, cubic-bezier(0.2, 0, 0, 1) |
| Icons | lucide-react |
| Language | TypeScript (strict) |
| Lint/format | Biome |
| Tests | Vitest (unit); Playwright deferred to Tier 2 |
| CI | GitHub Actions (`.github/workflows/mc-ci.yml`) |
| Deploy | Vercel (Hobby, same account as ATS) |
| Package manager | pnpm |

**Do not use:** Framer Motion, Inter font, teal for buttons or text.

---

## 3. Design System

All visual decisions follow **Mapal Master Style Guide v2** (`mapal-master-style-guide-v2.md` in project knowledge).

### 3.1 Shell vs. Workspace

```
Shell (sidebar, topbar, outer frame): background #1D122C (dark purple)
Workspace (main content area):        background #F3F2F5 (neutral-50)
Cards/panels on workspace:            background #FFFFFF
```

### 3.2 Colour tokens (CSS variables — define in `globals.css`)

```css
--color-shell-bg: #1D122C;
--color-workspace-bg: #F3F2F5;
--color-surface: #FFFFFF;
--color-neutral-600: #23252E;
--color-neutral-500: #2D2F3A;
--color-neutral-400: #3D424F;
--color-neutral-300: #585F7B;
--color-neutral-200: #9BA2C0;
--color-neutral-100: #DADBE7;
--color-neutral-50:  #F3F2F5;
--color-brand-purple: #5B2D8E;
--color-brand-purple-100: #EDE9F5;
--color-success-300: #278740;
--color-success-100: #ECF4EE;
--color-error-300: #DA242D;
--color-error-100: #FCEEEF;
--color-warning-300: #FFAC3D;
--color-warning-100: #FFF3E2;

/* Agent accent colours */
--agent-lyra:  #1E3A5F;   /* Research */
--agent-maren: #0D9488;   /* Specification */
--agent-kai:   #D97706;   /* Building */
--agent-tova:  #7C3AED;   /* Marketing */
--agent-jaro:  #475569;   /* Ops */
```

### 3.3 Typography

```css
font-family: 'Montserrat', sans-serif;
/* Weights: 400 (body), 500 (label), 600 (subheading), 700 (heading) */
```

### 3.4 Motion tokens

```css
--motion-fast:   120ms cubic-bezier(0.2, 0, 0, 1);
--motion-base:   180ms cubic-bezier(0.2, 0, 0, 1);
--motion-slow:   240ms cubic-bezier(0.2, 0, 0, 1);
```

### 3.5 Radius + spacing

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
```

---

## 4. Navigation Structure

```
Shell sidebar (left, always visible, dark background)
  ├── Mapal logo + "Mission Control" wordmark
  ├── Nav items:
  │     Team          (icon: Users)
  │     Projects      (icon: FolderKanban)
  │     Live Activity (icon: Activity)
  └── Footer: OpenClaw version, operator name

Main content area (right, light workspace)
  └── Current screen content
```

Active nav item: white text + agent-purple accent left-border indicator.
Inactive: neutral-200 text, no border.

---

## 5. The Three Screens

### 5.1 Screen 1: Team

**Purpose:** Meet the team. Click any agent to see their full profile.

**Team screen header (above cards):**
- Left: green dot + "All Systems Operational" + timestamp (from LivenessIndicator)
- Centre: "Synthetic Product Organisation" + tagline "An autonomous team of AI agents that collaborate to deliver valuable projects — our first fully-digital workforce"
- Right: "£87,420 equivalent human execution to date" (computed from capability constellation day rates × project duration)
- Below: stats strip — "5 Agent employees | 7 +2 Tasks today | $142 ↑8% Monthly spend" + "Add Agent" button (non-functional v1, shows extensibility)

**Agent card (one per agent — 5 total, 3-column grid on desktop, 2 on tablet, 1 on mobile):**

Each card is a horizontal layout with two zones:

- **Left zone (~35% width):** Full-height avatar illustration image with agent accent colour overlay at bottom showing: role label (e.g. "Research"), status badge (green "Active" / grey "Idle"), current task text (truncated, 1 line). Sparkline overlaid at very bottom of image.
- **Right zone (~65% width):** Agent name + role (e.g. "Lyra - Research"), model name below (e.g. "Claude Sonnet 4.5", neutral-200, 12px). MISSION section with rocket icon (🎯) — 2-line description of what the agent does. STYLE section with sparkle icon (✨) — 2-3 line description of working personality. "▶ RECENT ACTIVITY" expandable section at bottom.

Card dimensions: min-height 280px, rounded-xl, white background, subtle shadow-sm. Agent name uses agent accent colour for the circular letter badge (L/M/K/T/J) next to the name.

**Agent profile page (click-through from card, route: `/team/[agentId]`):**

Layout: full-width page with back navigation ("← Back to Team").

- **Identity header row:** Avatar image (left, ~300px wide, with agent accent colour band below image, showing role and metadata), name + title centre ("Maren - Specifications", "Claude 4 Opus"), style description, "Combines capabilities equivalent to £245k/yr in specialist talent". Two pill tabs: "Soul" and "Personality" — clicking either opens a modal overlay showing the agent's SOUL.md content or personality description. Capability Constellation SVG positioned top-right of header.

- **Operating Envelope section:** White card, 3-column horizontal layout:
  - Column 1 "READS" — purple (#EDE9F5) background chips showing input file paths
  - Column 2 "PRODUCES" — green (#ECF4EE) background chips showing output file paths
  - Column 3 "BOUNDARIES" — red (#FCEEEF) background chips showing restrictions

- **Tools & Access section:** White card, flat row of neutral-50 chips (e.g. "Filesystem", "Exec", "Git", "Web (denied)" with strikethrough for denied tools)

- **Bottom 3-column section:**
  - Column 1 "PERFORMANCE" — 4 KPI tiles stacked 2×2: tasks completed (large number), PRs merged, avg CI pass rate (%), monthly cost with "Equivalent daily rate: ~£Xk/day" below
  - Column 2 "WORK JOURNAL" — last 5 activity events as timeline cards with timestamps
  - Column 3 "CHAT WITH [NAME]" — greyed placeholder input, "Start a conversation with [Name]" caption, non-functional v1

- **Recent Tasks:** Below the 3-column section, a list view showing last 10 tasks with status badges (Complete/In Progress/Deferred)

### 5.2 Screen 2: Projects

**Purpose:** See what the team is building and what it has delivered.

**Multi-project cards (top row):**
- Active: "Lapam ATS" — "Clean-room Applicant Tracking System for UK hospitality", status badge "Active" (green), progress bar (89%), row of 5 small agent avatar circles at bottom-right
- Placeholder: "Mapal OS Integration Hub" — "API gateway for third-party POS and payroll systems", status badge "Planning" (orange, faded), progress 0%, only Lyra + Maren avatars shown. Non-interactive in v1.

Clicking the active project card expands the full project detail below.

**Business Context Header (expanded view):**
- Left: "LAPAM ATS : STRATEGIC OBJECTIVE" label (uppercase, neutral-300, 12px) + objective text ("Build or learn: produce a viable ATS prototype") + scope description ("Clean-room separation from M&A intelligence. All research from public data. Zero-to-one scope: no customers, no feedback loops, all conclusions hypothesis-grade.")
- Right: metrics grid — "14 phases, 36 tasks" (Scope), "34 days active" (Duration), "$487 Cost to date (~3 days of a mid-level developer)", "£87,420 Equivalent human execution at market rates"

**Context Chain / Project Lifecycle (5 phases, horizontal):**
```
Market Research (Lyra) → Product Specification (Maren) → Implementation (Kai) → Go-to-Market (Tova) → Operations (Jaro)
```
Each phase card: white card, agent avatar (small circular), phase name (bold), status badge (green "Complete" / green dot "Active" / grey "Pending"), key output count (e.g. "7 research files", "42 PRs merged, 2 open", "15 deliverables"). Arrow connectors (`>`) between cards. Implementation card has orange/highlighted border when active. Responsive: horizontal scroll on mobile.

**Phase detail drawer:** Clicking any lifecycle phase card opens a right-side drawer/panel showing:
- Phase name + agent name at top
- Status badge + duration (e.g. "Complete · 6 days")
- Summary paragraph describing what was accomplished
- "OUTPUTS (N)" section: list of output files with filename, path, status badge (Complete), and download/link icon
- "Total deliverables: N" count at bottom

**Active Phase Detail section:**
- Section label: "↓ ACTIVE PHASE DETAIL" (orange text)
- Phase title + agent name (e.g. "Phase 13: Analytics & AI Features · Kai — Development")
- "View Live System →" button (top-right, green outline, links to Vercel production URL)
- Kanban board: 4 columns — Backlog | In Progress | Review | Merged
- Task cards: task ID (e.g. "TASK-035"), title, agent avatar + name, status badge (colour-coded: green "Merged" with PR# link, orange "In Progress" with duration, amber "Deferred", red "High Risk"), time-in-column indicator

**Project Outputs Summary (bottom, 6 metric tiles in a row):**
```
7 Research analyses | 7 Specification documents | 42 Pull requests merged | 15 Marketing deliverables | ~12,000 Lines of code | 78% Test coverage
```
Each tile: large number (600 weight, neutral-600), label below (400 weight, neutral-300). White card, rounded-lg.

### 5.3 Screen 3: Live Activity

**Purpose:** Watch the team work. Rolling timeline of all agent actions.

**Agent activity count cards (top row, clickable filters):**
One card per agent: avatar + name + action count for selected time period. Click to filter feed to that agent.

**Activity feed (main area):**
- Grouped by time: "This Afternoon (N)", "This Morning (N)", "Yesterday (N)", "This Week (N)", "Earlier"
- Each item: timestamp (left, 13:22 format), agent avatar (24px circular), agent name (bold, in agent accent colour), action chip (colour-coded), task/PR description text
- Action chips: Merged (green, success-300), Started (blue-500), Completed (teal, brand-teal), Delivered (purple-500), Reviewed (orange, warning-300), Blocked (red, error-300)
- Agent accent colour on left border of each feed item (3px solid)
- Time group headers: collapsible with chevron, show count in parentheses

**Activity breakdown sidebar:**
- Donut chart by action type (Tremor)
- Total actions in period
- Most active agent

**Liveness indicator (top right):** "Updated Xs ago" — refreshes every 10 seconds.

---

## 6. Data Architecture

### 6.1 Convex schema

```typescript
// agents — static, seeded from IDENTITY.md files
agents: {
  id: string,           // "lyra" | "maren" | "kai" | "tova" | "jaro"
  name: string,
  fullTitle: string,
  shortRole: string,
  model: string,        // "claude-sonnet-4-5"
  accentColor: string,
  status: "active" | "idle" | "offline",
  currentTask: string | null,
  avatarUrl: string | null,
  operatingEnvelope: {
    reads: string[],
    produces: string[],
    boundaries: string[],
    tools: string[],
  },
  capabilityRoles: {
    title: string,
    ukDayRate: number,
    nodeX: number,      // SVG position (0–100)
    nodeY: number,
  }[],
}

// activity_events — from GitHub webhooks + agent status polling
activity_events: {
  agentId: string,
  action: "merged" | "started" | "completed" | "delivered" | "reviewed" | "blocked",
  description: string,
  prNumber: number | null,
  taskId: string | null,
  timestamp: number,    // ms epoch
}

// tasks — from TASKS.md seed + GitHub PR state
tasks: {
  id: string,           // "TASK-001"
  projectId: string,
  title: string,
  agentId: string,
  phase: number,
  status: "backlog" | "in-progress" | "review" | "merged" | "blocked",
  prNumber: number | null,
  risk: "low" | "medium" | "high",
  mergedAt: number | null,
}

// projects
projects: {
  id: string,
  name: string,
  status: "active" | "planning" | "complete",
  startDate: number,
  totalCostUsd: number,
  outputs: Record<string, number>,
}

// cost_snapshots — from Helicone API (Phase 1, optional)
cost_snapshots: {
  agentId: string,
  periodStart: number,
  periodEnd: number,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
}
```

### 6.2 Data sources

| Data | Source | Method |
|------|--------|--------|
| Agent identity, operating envelope | IDENTITY.md files (operator-created) | Static seed on Phase 1 |
| ATS task history (42 PRs) | GitHub API — `DanFitzParis/Lapam-SPO` | Backfill query in Phase 1 |
| Agent live status | Derived from `activity_events` timestamps | Convex query: active if event within 10 min, idle if >30 min, offline if no events ever |
| New GitHub events (MC build onwards) | GitHub webhook → Convex HTTP action | Push, real-time |
| Agent cost | Helicone API (if configured) | Convex cron, every 15 min |

### 6.3 Agent status derivation (replaces status.json polling)

Agent status is derived from the `activity_events` table — no external polling or status files needed.

```
active  = most recent activity_event for this agent is < 10 minutes old
idle    = most recent activity_event is > 30 minutes old (or agent has historical events but none recent)
offline = no activity_events exist for this agent at all
```

This is computed as a Convex query, not a cron. It evaluates on every read of the `agents` data (which happens on every Team screen render via the live query). The status dot on the agent card reflects this derived state.

**Trade-off:** There is a ~5-minute lag between an agent starting work and their first GitHub event appearing. This is acceptable for v1. The "active" state appears once the agent opens their first PR or pushes their first commit.

---

## 7. Capability Constellation Data

Each agent's profile shows their own constellation — 3–5 professional roles that map to their capabilities, with UK day-rate data. This makes the value argument concrete without a dedicated slide.

```json
{
  "lyra": [
    { "title": "Market Research Analyst", "ukDayRate": 400 },
    { "title": "Competitive Intelligence Lead", "ukDayRate": 650 },
    { "title": "UX Research Consultant", "ukDayRate": 550 }
  ],
  "maren": [
    { "title": "Senior Product Manager", "ukDayRate": 900 },
    { "title": "Business Analyst", "ukDayRate": 600 },
    { "title": "Solutions Architect", "ukDayRate": 1100 }
  ],
  "kai": [
    { "title": "Senior Full-Stack Engineer", "ukDayRate": 950 },
    { "title": "DevOps Engineer", "ukDayRate": 800 },
    { "title": "QA Lead", "ukDayRate": 600 }
  ],
  "tova": [
    { "title": "Brand Strategist", "ukDayRate": 750 },
    { "title": "Content Marketing Lead", "ukDayRate": 550 },
    { "title": "GTM Consultant", "ukDayRate": 1200 }
  ],
  "jaro": [
    { "title": "Platform Engineer", "ukDayRate": 900 },
    { "title": "Data Engineer", "ukDayRate": 850 },
    { "title": "Internal Tools Developer", "ukDayRate": 700 }
  ]
}
```

SVG node positions are defined per-agent as `nodeX`/`nodeY` percentages (0–100). Connected by thin lines (neutral-100). Node size proportional to day rate.

---

## 8. Operator Pre-Build Checklist

Before triggering Phase 0, the operator must complete:

- [ ] Create Discord bot + `#ops-agent` channel (see Jaro deployment plan)
- [ ] Create `~/.openclaw/workspace-ops/` and deploy Jaro
- [ ] Update `openclaw.json` with Jaro agent block
- [ ] Bounce gateway after config update

Before triggering Phase 1 (Data Layer):
- [ ] Configure Helicone proxy (optional — skip if not ready; cost data will use estimates)

Before triggering Phase 2 (Team Screen):
- [ ] Export Lovable prototype screenshots and commit to `projects/mission-control/docs/design-reference/` — Jaro needs these as visual targets
- [ ] Commission / generate avatar illustrations (5 agents) and commit to `projects/mission-control/public/avatars/`
- [ ] Decide on avatar style (recommendation: illustrated professional, ~60% stylisation — not sci-fi, not photorealistic)

---

## 9. Phase and Task Definitions

---

### Phase 0: Scaffold

**Goal:** Running Next.js + Convex project deployed to Vercel. No features — just a working skeleton that CI passes on.

---

#### MC-001: Initialise project structure

- **Description:** Create the Next.js 15 project at `projects/mission-control/`, configure TypeScript strict mode, install and configure Biome for lint/format. Set up `pnpm-workspace.yaml` at repo root if not already present. Do not scaffold any features — just the working Next.js shell.
- **Depends on:** none
- **Reads:** `projects/mission-control/CLAUDE.md` (once created in MC-002)
- **Creates:** `projects/mission-control/` (full Next.js scaffold), `projects/mission-control/package.json`, `projects/mission-control/tsconfig.json`, `projects/mission-control/biome.json`, `.github/workflows/mc-ci.yml`
- **Modifies:** `pnpm-workspace.yaml` (add `projects/mission-control` to workspace packages if file exists; create if it doesn't)
- **Tier:** Medium
- **Risk:** medium — new project, modifies repo root config
- **Acceptance criteria:**
  - Given the project is cloned, When `cd projects/mission-control && pnpm install && pnpm build` is run, Then the build succeeds with zero errors
  - Given Biome is configured, When `pnpm biome check .` is run, Then it exits 0
  - Given TypeScript strict mode is on, When `npx tsc --noEmit` is run, Then it exits 0
- **Verifies:** `cd projects/mission-control && pnpm build`

---

#### MC-002: Create CLAUDE.md and install design dependencies

- **Description:** Write `projects/mission-control/CLAUDE.md` (under 200 lines — project context, stack, commands, boundaries). Install shadcn/ui, Tremor, lucide-react, Montserrat from Google Fonts. Configure Tailwind with Mapal design tokens as CSS variables in `globals.css`. Implement the dark shell + light workspace layout: outer shell `#1D122C`, workspace `#F3F2F5`.
- **Depends on:** MC-001
- **Reads:** `mc-spec.md §2, §3`
- **Creates:** `projects/mission-control/CLAUDE.md`, `projects/mission-control/src/app/globals.css`, `projects/mission-control/src/components/layout/Shell.tsx`, `projects/mission-control/src/components/layout/Sidebar.tsx`
- **Modifies:** `projects/mission-control/package.json`, `projects/mission-control/tailwind.config.ts`
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given the app is running, When the root URL is visited, Then the shell renders with a dark left sidebar (`#1D122C`) and a light workspace area (`#F3F2F5`)
  - Given the design tokens are configured, When Tailwind classes like `bg-workspace` are used, Then they resolve to the correct hex values
  - Given Montserrat is loaded, When any text renders, Then the font is Montserrat (verified via browser DevTools)
- **Verifies:** `cd projects/mission-control && pnpm dev` — visual inspection at localhost:3000

---

#### MC-003: Implement navigation shell

- **Description:** Build the persistent left sidebar with three nav items (Team, Projects, Live Activity), logo/wordmark, and footer. Implement client-side routing between the three placeholder screen pages. Active state: white text + 3px left border in `--color-brand-purple`. Inactive: neutral-200 text.
- **Depends on:** MC-002
- **Reads:** `mc-spec.md §4`
- **Creates:** `projects/mission-control/src/app/team/page.tsx`, `projects/mission-control/src/app/projects/page.tsx`, `projects/mission-control/src/app/activity/page.tsx`, `projects/mission-control/src/components/layout/NavItem.tsx`
- **Modifies:** `projects/mission-control/src/components/layout/Sidebar.tsx`, `projects/mission-control/src/app/layout.tsx`
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given the app is running, When the user clicks "Projects" in the sidebar, Then the URL changes to `/projects` and the Projects nav item has the active state style
  - Given three placeholder screens exist, When the user navigates between them, Then each renders without error and the active nav item updates correctly
  - Given the sidebar footer, When rendered, Then it shows the OpenClaw version string and "Operator: Daniel"
- **Verifies:** `cd projects/mission-control && pnpm dev` — click all three nav items

---

#### MC-004: Configure CI and deploy to Vercel

- **Description:** Write `.github/workflows/mc-ci.yml` with TypeScript check, Biome lint, Vitest test run, and Next.js build. Add branch protection rule for `main` using the CI status check context name `MC: Type Check + Lint + Test + Build`. Deploy the project to Vercel (new Vercel project, same account), set auto-deploy from main. Note: Vercel Hobby plan — if deploy fails citing commercial-use restriction, report in Discord and operator will decide on upgrade.
- **Depends on:** MC-003
- **Reads:** `mc-spec.md §2`
- **Creates:** `.github/workflows/mc-ci.yml`
- **Modifies:** nothing
- **Tier:** Small
- **Risk:** medium — CI and deployment config, Vercel Hobby limitation possible
- **Acceptance criteria:**
  - Given a push to main, When the CI workflow triggers, Then all four checks complete and the workflow exits green
  - Given the Vercel project is configured, When CI passes on main, Then a production deployment is triggered automatically
  - Given the deployment completes, When the Vercel URL is visited, Then the shell with navigation renders correctly
- **Verifies:** Push a trivial change to main; confirm green CI in GitHub Actions; confirm Vercel deployment URL is live

---

### Phase 1: Data Layer

**Goal:** All Convex data infrastructure is live. Seed data shows real ATS project history. Agent status derivation is working.

---

#### MC-005: Initialise Convex and define schema

- **Description:** Install and configure Convex in the MC project. Define the full schema from `mc-spec.md §6.1` (agents, activity_events, tasks, projects, cost_snapshots tables). Set up Convex environment variables in Vercel. Verify the Convex dashboard shows the schema deployed.
- **Depends on:** MC-004
- **Reads:** `mc-spec.md §6.1`
- **Creates:** `projects/mission-control/convex/schema.ts`, `projects/mission-control/convex/_generated/` (auto-generated), `projects/mission-control/convex/` (config files)
- **Modifies:** `projects/mission-control/package.json`, `projects/mission-control/.env.local` (add `CONVEX_URL`)
- **Tier:** Medium
- **Risk:** medium — new external service, schema definition
- **Acceptance criteria:**
  - Given Convex is configured, When `npx convex dev` runs, Then it connects to the Convex deployment without error
  - Given the schema is deployed, When the Convex dashboard is opened, Then all 5 tables (agents, activity_events, tasks, projects, cost_snapshots) are visible
  - Given `CONVEX_URL` is set in Vercel env vars, When the production deployment loads, Then it connects to Convex without error
- **Verifies:** `npx convex dev` exits cleanly; Convex dashboard shows all tables

---

#### MC-006: Seed agent identity data

- **Description:** Write a Convex seed mutation that populates the `agents` table with all 5 agents using the identity data from `mc-spec.md §7` (capability constellations) and `mc-spec.md §5.1` (operating envelopes). Avatar URLs set to `null` as placeholder until MC-operator-avatars pre-build step completes. Also seed the `projects` table with the Lapam ATS project record (status: active, startDate: Feb 2026, totalCostUsd: 487, outputs: {researchFiles: 7, specDocs: 7, prs: 42, marketingDeliverables: 15, linesOfCode: 12000, testCoverage: 78}).
- **Depends on:** MC-005
- **Reads:** `mc-spec.md §6.1, §7, §5.1`
- **Creates:** `projects/mission-control/convex/seeds/agentSeed.ts`, `projects/mission-control/convex/seeds/projectSeed.ts`, `projects/mission-control/convex/mutations/seed.ts`
- **Modifies:** nothing
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given the seed mutation is run, When the `agents` table is queried, Then all 5 agents are present with correct accent colours, operating envelopes, and capability roles
  - Given the seed mutation is run, When the `projects` table is queried, Then the Lapam ATS project record is present with correct output counts
  - Given agent `lyra`, When her operating envelope is inspected, Then `reads`, `produces`, `boundaries`, and `tools` arrays are populated with at least 3 items each
- **Verifies:** Run seed via Convex dashboard; query agents table and confirm 5 records

---

#### MC-007: Backfill ATS task history from GitHub

- **Description:** Write a Convex action (not a cron — a one-time action callable from the dashboard) that queries the GitHub REST API for all closed PRs in `DanFitzParis/Lapam-SPO`, parses the PR body for task ID and risk classification, and inserts matching records into the `tasks` table (status: merged) and `activity_events` table (action: merged). This backfills the complete 42-PR history of the ATS build. GitHub token read from Convex environment variable `GITHUB_TOKEN`.
- **Depends on:** MC-006
- **Reads:** `mc-spec.md §6.2`
- **Creates:** `projects/mission-control/convex/actions/backfillGitHub.ts`
- **Modifies:** nothing
- **Tier:** Medium
- **Risk:** low — read-only GitHub API, no side effects
- **Acceptance criteria:**
  - Given the backfill action is run, When the `tasks` table is queried, Then at least 36 task records are present with status "merged"
  - Given the backfill action is run, When the `activity_events` table is queried, Then at least 42 events are present with action "merged"
  - Given a task record, When its `agentId` field is inspected, Then it is one of the 5 valid agent IDs (parsed from PR body or defaulted to "kai" for ATS PRs)
- **Verifies:** Call action from Convex dashboard; query tasks table and confirm 36+ records

---

#### MC-008: Agent status derivation query

- **Description:** Write a Convex query helper that derives each agent's live status from the `activity_events` table. Logic: if the agent's most recent event timestamp is less than 10 minutes old → "active"; if more than 30 minutes old → "idle"; if no events exist → "offline". This helper is used by the Team screen's live query to populate the status dot on each agent card. Also write a Convex mutation that updates the `agents` table `currentTask` field when a "started" event is received (parsed from webhook PR title). No polling cron needed — status is computed on read.
- **Depends on:** MC-006
- **Reads:** `mc-spec.md §6.3`
- **Creates:** `projects/mission-control/convex/queries/agentStatus.ts`
- **Modifies:** `projects/mission-control/convex/queries/agents.ts` (add status derivation to the agents query)
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given kai has an activity_event with timestamp 5 minutes ago, When the agents query runs, Then kai's derived status is "active"
  - Given maren has no activity_events newer than 2 hours, When the agents query runs, Then maren's derived status is "idle"
  - Given a newly seeded agent with no activity_events, When the agents query runs, Then the agent's status is "offline"
- **Verifies:** Insert a test activity_event for kai with recent timestamp; query agents and confirm status is "active"

---

#### MC-009: GitHub webhook receiver

- **Description:** Write a Convex HTTP action that receives GitHub webhook events (`push`, `pull_request`, `check_run`, `workflow_run`) and inserts corresponding records into `activity_events`. Parse PR body for task ID and risk label. This action is used for future SPO projects — for the ATS build, data comes from the backfill (MC-007). Include webhook signature verification using `GITHUB_WEBHOOK_SECRET` env var. After this task, the operator must register the webhook in GitHub repo settings (see post-task operator action note in PR body).
- **Depends on:** MC-007
- **Reads:** `mc-spec.md §6.2`
- **Creates:** `projects/mission-control/convex/http.ts` (Convex HTTP router), `projects/mission-control/convex/actions/webhookReceiver.ts`
- **Modifies:** nothing
- **Tier:** Medium
- **Risk:** medium — inbound webhook, signature verification
- **Acceptance criteria:**
  - Given a valid signed webhook payload, When the HTTP action receives it, Then the event is parsed and inserted into `activity_events`
  - Given an unsigned or incorrectly-signed payload, When the HTTP action receives it, Then it returns HTTP 401 and inserts nothing
  - Given a `pull_request` event with `action: "closed"` and `merged: true`, When received, Then an `activity_events` record with action "merged" is created
- **Verifies:** Use a webhook testing tool (e.g. `ngrok` + Postman or GitHub's webhook re-delivery) to send a test PR payload; confirm record appears in Convex activity_events table

---

### Phase 2a: Team Screen — Visual Shell (skin-first, hardcoded mock data)

**Goal:** Team screen looks correct against the Lovable prototype. All components render with hardcoded mock data. No Convex wiring yet.

**Operator gate:** Before this phase, export Lovable prototype screenshots to `projects/mission-control/docs/design-reference/`. Commit agent avatar illustrations to `projects/mission-control/public/avatars/` (filenames: `lyra.png`, `maren.png`, `kai.png`, `tova.png`, `jaro.png`). If avatars are not ready, use placeholder coloured circles — do not block the build.

**Visual review gate:** After this phase completes, operator compares Vercel preview against Lovable prototype screenshots. Any visual deviations are corrected before proceeding to Phase 2b.

---

#### MC-010: Team screen header and agent card component

- **Description:** Build the Team screen with two sections: (1) the header stats bar, and (2) the agent card grid. Use hardcoded mock data for all values — do NOT wire to Convex yet.

  **Header stats bar layout:** Full-width white card at top. Left: green pulsing dot + "All Systems Operational" + timestamp. Centre: "Synthetic Product Organisation" (h2, 700 weight) + tagline below (neutral-300, 14px). Right: "£87,420" (h2, 700 weight) + "equivalent human execution to date" (neutral-300, 14px). Below the header: stats strip — "5 Agent employees | 7 +2 Tasks today | $142 ↑8% Monthly spend" + "+ Add Agent" button (brand-purple, non-functional).

  **Agent card layout:** 5 cards in a responsive grid (3 columns desktop ≥1280px, 2 columns tablet ≥768px, 1 column mobile). Each card: white background, rounded-xl, shadow-sm, min-height 280px. Two-zone horizontal layout:

  - Left zone (~35% width, full height): Avatar illustration image (object-cover, rounded-l-xl). At the bottom of the image, a semi-transparent dark overlay band showing: role label text (white, 14px, 600 weight), status badge (green "Active" with dot or grey "Idle"), current task text (white/70, 12px, truncated 1 line). Sparkline (Tremor, 7 data points, white stroke) at the very bottom of the overlay.
  - Right zone (~65% width, p-5): Agent name badge (circular letter in agent accent colour, 32px) + "Name - Role" (16px, 600 weight). Model name below (neutral-200, 12px). MISSION section: rocket icon (🎯) + "MISSION" label (uppercase, 11px, 500 weight, neutral-300) + 2-line description (14px). STYLE section: sparkle icon (✨) + "STYLE" label (same as mission) + 2-3 line personality description (14px). "▶ RECENT ACTIVITY" disclosure button at bottom (neutral-300, 13px).

  Cards for Lyra (Research, deep blue, idle), Maren (Specifications, teal, idle), Kai (Development, amber, active), Tova (Marketing, purple, idle), Jaro (Operations, slate, active). Use hardcoded text for all mission/style descriptions.

- **Depends on:** MC-004
- **Reads:** `mc-spec.md §5.1, §3`, design reference screenshots `docs/design-reference/screen-team.png`
- **Creates:** `projects/mission-control/src/components/agents/AgentCard.tsx`, `projects/mission-control/src/components/agents/StatusBadge.tsx`, `projects/mission-control/src/components/shared/TeamHeader.tsx`, `projects/mission-control/src/lib/mockData.ts`
- **Modifies:** `projects/mission-control/src/app/team/page.tsx`
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given the Team screen loads, Then 5 agent cards render in a 3-column grid with avatar images, names, missions, and styles visible
  - Given Kai's card, When rendered, Then the status badge shows "Active" (green) and the left image zone has an amber-tinted overlay
  - Given the header stats bar, When rendered, Then "All Systems Operational", "Synthetic Product Organisation", and "£87,420" are visible in the correct positions
  - Given the screen is resized to 768px, When rendered, Then cards display in a 2-column grid
- **Verifies:** `pnpm dev` — visual comparison against `docs/design-reference/screen-team.png`

---

#### MC-011: Agent profile page (visual shell)

- **Description:** Build the full agent profile page at `/team/[agentId]` using hardcoded mock data. Do NOT wire to Convex yet.

  **Header row:** "← Back to Team" link (top-left). Avatar image (left, ~300px, rounded-lg), with agent accent colour band below. Name + title ("Maren - Specifications"), model ("Claude 4 Opus"), style text, "Combines capabilities equivalent to £245k/yr in specialist talent". Two pill-shaped tab buttons: "Soul" (sparkle icon) and "Personality" (person icon) — each opens a modal overlay. Capability Constellation SVG positioned top-right of the header area.

  **Operating Envelope:** White card, "OPERATING ENVELOPE" label (uppercase, 13px, 600 weight). 3-column horizontal layout. Column headers: "READS" / "PRODUCES" / "BOUNDARIES" (uppercase, 12px, 500 weight). Chips below each header:
  - READS: purple background (#EDE9F5), neutral-600 text, rounded-md, px-3 py-1.5
  - PRODUCES: green background (#ECF4EE), neutral-600 text
  - BOUNDARIES: red background (#FCEEEF), neutral-600 text
  Wrap within columns, vertical gap-2.

  **Tools & Access:** White card, "TOOLS & ACCESS" label. Flat row of neutral-50 chips. "Web (denied)" chip uses neutral-200 text with strikethrough.

  **Bottom 3-column layout:**
  - Column 1 "PERFORMANCE": 4 metric tiles in 2×2 grid. Each: large number (28px, 700 weight, neutral-600), label below (12px, neutral-300). Tiles: "42 Tasks completed", "38 PRs merged", "94% Avg CI pass rate", "$23.40 This month's cost / Equivalent daily rate: ~£940/day".
  - Column 2 "WORK JOURNAL": Timeline cards with timestamp header (neutral-300, 12px) and description text (14px). Light neutral-50 card background, rounded-lg, gap-3 between entries.
  - Column 3 "CHAT WITH [NAME]": White card, chat input at bottom (disabled, neutral-200 placeholder text), mock response bubble showing "[Name] will respond when chat is enabled (v2)".

  **Recent Tasks section:** Below the 3 columns. List of tasks: green "Complete" badge + task description + timestamp. Right-aligned.

  **Soul/Personality modals:** Overlay modal (centred, max-width 640px, white, rounded-xl, shadow-lg). Title "Name's Soul.md". Renders the SOUL.md content as formatted markdown sections: Purpose, Identity, Values, Working Style, Boundaries, What I Care About. Close button (X) top-right.

- **Depends on:** MC-010
- **Reads:** `mc-spec.md §5.1, §3`, design reference screenshots `docs/design-reference/screen-agent-profile.png`
- **Creates:** `projects/mission-control/src/app/team/[agentId]/page.tsx`, `projects/mission-control/src/components/agents/OperatingEnvelope.tsx`, `projects/mission-control/src/components/agents/CostSection.tsx`, `projects/mission-control/src/components/agents/WorkJournal.tsx`, `projects/mission-control/src/components/agents/SoulModal.tsx`
- **Modifies:** `projects/mission-control/src/components/agents/AgentCard.tsx` (add click navigation)
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given the user clicks Maren's agent card, When the profile page loads, Then all sections render with mock data and the accent colour band is teal (#0D9488)
  - Given the Operating Envelope section, When rendered, Then 3 columns are visible with correctly coloured chips: purple READS, green PRODUCES, red BOUNDARIES
  - Given the "Soul" tab is clicked, When the modal opens, Then it shows formatted SOUL.md content with Purpose, Identity, Values, Working Style, Boundaries sections
  - Given the bottom 3-column layout, When rendered, Then PERFORMANCE, WORK JOURNAL, and CHAT sections are side by side
- **Verifies:** Navigate to `/team/maren` — visual comparison against `docs/design-reference/screen-agent-profile.png`

---

#### MC-012: Capability constellation SVG

- **Description:** Build the `CapabilityConstellation` component — a custom SVG visualisation showing 3–5 professional role nodes connected by thin lines to a central agent node. Node size proportional to day rate. Render within the agent profile header area (top-right). Central node: agent letter badge in accent colour. Surrounding nodes: role title + formatted day rate (e.g. "£950/day"), circular with agent accent fill at 20% opacity, text in neutral-600. Connected by thin lines (neutral-200, 1px). The constellation includes a headline below: "Combines capabilities equivalent to £Xk/yr in specialist talent". Use hardcoded data from the mock data file (will be wired to Convex in Phase 2b).
- **Depends on:** MC-011
- **Reads:** `mc-spec.md §7, §5.1`
- **Creates:** `projects/mission-control/src/components/agents/CapabilityConstellation.tsx`
- **Modifies:** `projects/mission-control/src/app/team/[agentId]/page.tsx`
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given Kai's profile page, When the constellation renders, Then 3 nodes appear (Senior Full-Stack Engineer, DevOps Engineer, QA Lead) with correct day rates
  - Given the constellation nodes, When rendered, Then node circles are sized proportionally to day rate (largest = highest rate)
  - Given the headline, When rendered, Then it shows the correct summed annual equivalent for the agent
  - Given the SVG, When the window is resized, Then the constellation scales within its container without overflow
- **Verifies:** Navigate to `/team/kai` — confirm constellation renders with 3 nodes, correct rates, proportional sizing

---

### Phase 2b: Team Screen — Data Wiring

**Goal:** Replace all hardcoded mock data in Team screen components with Convex live queries.

---

#### MC-010b: Wire team screen to Convex

- **Description:** Replace hardcoded mock data in `AgentCard`, `TeamHeader`, agent profile page, `OperatingEnvelope`, `CostSection`, `WorkJournal`, and `CapabilityConstellation` with Convex `useQuery` hooks reading from the `agents`, `tasks`, and `activity_events` tables. The derived agent status (MC-008) should now populate the status badge. Remove the `mockData.ts` file (or keep as fallback for loading states).
- **Depends on:** MC-010, MC-011, MC-012, MC-006, MC-007, MC-008
- **Reads:** `mc-spec.md §6.1`
- **Creates:** `projects/mission-control/convex/queries/agents.ts`, `projects/mission-control/convex/queries/agentProfile.ts`
- **Modifies:** All Team screen components (replace mock data imports with useQuery hooks)
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given Convex has seeded agent data, When the Team screen loads, Then all 5 cards show data from Convex (not hardcoded)
  - Given Convex has ATS task history, When Kai's profile loads, Then "Tasks Completed: 36" and "PRs Merged: 42" display from live query
  - Given a new activity_event is inserted for Kai, When the Team screen is open, Then Kai's status dot updates without page reload
- **Verifies:** Insert a test activity_event via Convex dashboard; confirm Team screen reflects the change

---

### Phase 3a: Projects Screen — Visual Shell (skin-first, hardcoded mock data)

**Goal:** Projects screen looks correct against the Lovable prototype. All components render with hardcoded mock data.

**Visual review gate:** After this phase, operator compares Vercel preview against Lovable prototype screenshots. Correct deviations before Phase 3b.

---

#### MC-013: Project cards, business context header, and "View Live System" button

- **Description:** Build the Projects screen with hardcoded mock data. Two project cards at top: Lapam ATS (active, brand-purple accent, 89% progress bar, 5 small agent avatar circles) and Mapal OS Integration Hub (planning, greyed, 0% progress, only Lyra + Maren avatars, non-interactive). The expanded Lapam ATS section shows the Business Context Header: "LAPAM ATS : STRATEGIC OBJECTIVE" label, objective text, scope description, and right-side metrics grid (phases/tasks, duration, cost, equivalent human execution). Add a "View Live System →" button (green outline, top-right of Active Phase Detail section) linking to the Vercel production URL `https://lapam-spo.vercel.app`.
- **Depends on:** MC-004
- **Reads:** `mc-spec.md §5.2, §3`, design reference screenshots `docs/design-reference/screen-projects.png`
- **Creates:** `projects/mission-control/src/components/projects/ProjectCard.tsx`, `projects/mission-control/src/components/projects/BusinessContextHeader.tsx`
- **Modifies:** `projects/mission-control/src/app/projects/page.tsx`
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given the Projects screen, When it loads, Then two project cards render — one active with progress bar, one greyed placeholder
  - Given the Lapam ATS expanded view, When rendered, Then the strategic objective, metrics grid, and cost comparison are visible
  - Given the "View Live System" button, When clicked, Then it opens `https://lapam-spo.vercel.app` in a new tab
- **Verifies:** `pnpm dev` — navigate to `/projects`, visual comparison against prototype screenshot

---

#### MC-014: Context chain component

- **Description:** Build the 5-phase `ContextChain` component with hardcoded mock data. Five horizontal cards with arrow connectors: Market Research (Lyra, Complete, "7 research files") → Product Specification (Maren, Complete, "7 spec documents") → Implementation (Kai, Active with green dot, "42 PRs merged, 2 open", "Phase 13 of 14", orange/highlighted border) → Go-to-Market (Tova, Complete, "15 deliverables") → Operations (Jaro, Active, "Building Mission Control s..."). Each card: white, rounded-lg, agent avatar (small circular), phase name (bold), status badge, output count. Arrow `>` connectors between cards. Responsive: horizontal scroll on mobile.
- **Depends on:** MC-013
- **Reads:** `mc-spec.md §5.2, §3`
- **Creates:** `projects/mission-control/src/components/projects/ContextChain.tsx`, `projects/mission-control/src/components/projects/PhaseCard.tsx`
- **Modifies:** `projects/mission-control/src/app/projects/page.tsx`
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given the Projects screen, When the context chain renders, Then exactly 5 phase cards appear in correct order with arrow connectors
  - Given the Implementation card, When rendered, Then it has an orange/highlighted border and shows "Active" status
  - Given a mobile viewport, When the chain renders, Then it is horizontally scrollable
- **Verifies:** Navigate to `/projects` — confirm 5 cards in order; resize to mobile

---

#### MC-014b: Phase detail drawer

- **Description:** Build a `PhaseDetailDrawer` component — a right-side slide-out panel that opens when any context chain phase card is clicked. Panel content: phase name + agent name header, status badge + duration, summary paragraph, "OUTPUTS (N)" section showing a list of output files (filename, file path in neutral-300, status badge "Complete", download/link icon). "Total deliverables: N" count at bottom. Panel width: 380px. Close on X button or clicking outside. Use hardcoded output file lists per phase.
- **Depends on:** MC-014
- **Reads:** `mc-spec.md §5.2`, design reference `docs/design-reference/screen-projects.png`
- **Creates:** `projects/mission-control/src/components/projects/PhaseDetailDrawer.tsx`
- **Modifies:** `projects/mission-control/src/components/projects/PhaseCard.tsx` (add click handler)
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given the user clicks "Market Research" phase card, When the drawer opens, Then it shows "Market Research / Lyra — Research", "Complete · 6 days", and 7 output files
  - Given the drawer is open, When the X button is clicked, Then the drawer closes with a slide transition
  - Given the output file list, When rendered, Then each file shows filename, path, "Complete" badge, and a link icon
- **Verifies:** Navigate to `/projects` — click each phase card and confirm drawer shows correct data

---

#### MC-015: Active phase kanban board

- **Description:** Build the kanban board with hardcoded mock data showing the ATS Phase 13 tasks. Four columns: Backlog (1 card) | In Progress (2 cards) | Review (1 card) | Merged (2 cards). Task cards show: task ID (e.g. "TASK-035"), title, agent avatar + "Kai — Development", status badge (colour-coded: green "Merged" with PR# link, orange "In Progress" with duration "1d", amber "Deferred", red "High Risk"), time-in-column. Section header: "↓ ACTIVE PHASE DETAIL" (orange text), "Phase 13: Analytics & AI Features · Kai — Development" with agent green dot.
- **Depends on:** MC-013
- **Reads:** `mc-spec.md §5.2, §3`
- **Creates:** `projects/mission-control/src/components/projects/KanbanBoard.tsx`, `projects/mission-control/src/components/projects/TaskCard.tsx`
- **Modifies:** `projects/mission-control/src/app/projects/page.tsx`
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given the kanban board renders, Then 4 columns are visible with correct task cards distributed across them
  - Given a "Merged" task card, When rendered, Then it shows a green "Merged" badge and linked PR number (e.g. "PR #47")
  - Given a "High Risk" task, When rendered, Then it shows both an "In Progress" orange badge and a "High Risk" red badge
  - Given a "Deferred" task, When rendered, Then it shows an amber "Deferred" badge
- **Verifies:** Navigate to `/projects` — confirm kanban renders with correct mock task distribution

---

#### MC-016: Project outputs summary

- **Description:** Build the Project Outputs Summary at the bottom of the Projects screen. 6 metric tiles in a horizontal row: "7 Research analyses", "7 Specification documents", "42 Pull requests merged", "15 Marketing deliverables", "~12,000 Lines of code", "78% Test coverage". Each tile: white card, rounded-lg, p-5, large number (28px, 600 weight, neutral-600), label below (13px, 400 weight, neutral-300). Hardcoded values.
- **Depends on:** MC-013
- **Reads:** `mc-spec.md §5.2, §3`
- **Creates:** `projects/mission-control/src/components/projects/OutputsSummary.tsx`
- **Modifies:** `projects/mission-control/src/app/projects/page.tsx`
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given the Projects screen, When scrolled to bottom, Then 6 metric tiles are visible in a row
  - Given the tiles, When rendered, Then values match: 7, 7, 42, 15, ~12,000, 78%
- **Verifies:** Navigate to `/projects` — confirm 6 output metrics render correctly

---

### Phase 3b: Projects Screen — Data Wiring

**Goal:** Replace all hardcoded mock data in Projects screen with Convex live queries.

---

#### MC-013b: Wire projects screen to Convex

- **Description:** Replace hardcoded data in ProjectCard, BusinessContextHeader, ContextChain, PhaseDetailDrawer, KanbanBoard, TaskCard, and OutputsSummary with Convex `useQuery` hooks reading from `projects`, `tasks`, and `activity_events` tables. Task cards on the kanban should show PR numbers as linked badges to `https://github.com/DanFitzParis/Lapam-SPO/pull/{prNumber}`.
- **Depends on:** MC-013, MC-014, MC-014b, MC-015, MC-016, MC-006, MC-007
- **Reads:** `mc-spec.md §6.1`
- **Creates:** `projects/mission-control/convex/queries/projects.ts`, `projects/mission-control/convex/queries/tasks.ts`
- **Modifies:** All Projects screen components (replace mock data with useQuery hooks)
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given Convex has seeded project data, When the Projects screen loads, Then Lapam ATS card shows data from Convex
  - Given Convex has 36+ task records, When the kanban renders, Then the Merged column shows task cards from the backfilled ATS data
  - Given a task's prNumber, When its PR badge is clicked, Then it opens the correct GitHub PR URL
- **Verifies:** Navigate to `/projects` — confirm all data matches Convex seed values

---

### Phase 4a: Live Activity Screen — Visual Shell (skin-first, hardcoded mock data)

**Goal:** Live Activity screen looks correct against the Lovable prototype with hardcoded mock data.

**Visual review gate:** After this phase, operator compares Vercel preview against prototype. Correct deviations before Phase 4b.

---

#### MC-017: Activity feed with time grouping

- **Description:** Build the main activity feed on the Live Activity screen with hardcoded mock data. Screen header: "LIVE ACTIVITY" label (uppercase, brand-purple, 12px) + green dot + "Updated 12s ago" (LivenessIndicator). "Activity Feed" title (h1), subtitle "Real-time log of all agent actions across the organisation". Items grouped by time period: "THIS AFTERNOON (9)" / "THIS MORNING (6)" / "YESTERDAY (3)" / "THIS WEEK (3)" — collapsible sections with chevron and count in parentheses. Each feed item: timestamp (left, 14:32 format, neutral-300, 13px), agent avatar (24px circular), agent name (bold, in agent accent colour), action chip (colour-coded, rounded-full, px-2.5 py-0.5, 12px), description text (neutral-600, 14px). Left border of each item uses agent accent colour (3px solid). Action chip colours: Merged=success-300 on success-100 bg, Started=blue-500 on blue-50, Completed=teal on teal-50, Delivered=purple-500 on purple-50, Reviewed=warning-300 on warning-100, Blocked=error-300 on error-100.
- **Depends on:** MC-004
- **Reads:** `mc-spec.md §5.3, §3`, design reference screenshots `docs/design-reference/screen-activity.png`
- **Creates:** `projects/mission-control/src/components/activity/ActivityFeed.tsx`, `projects/mission-control/src/components/activity/FeedItem.tsx`, `projects/mission-control/src/components/activity/ActionChip.tsx`, `projects/mission-control/src/components/activity/TimeGroup.tsx`
- **Modifies:** `projects/mission-control/src/app/activity/page.tsx`
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given the Activity screen loads, Then mock feed items appear grouped by time period with correct section headers and counts
  - Given a "Merged" event for Jaro, When rendered, Then it shows Jaro's avatar, "Jaro - Operations" in slate (#475569), a green "Merged" chip, and a #475569 left border
  - Given the "This Afternoon" group, When the chevron is clicked, Then the group collapses/expands
- **Verifies:** `pnpm dev` — visual comparison against `docs/design-reference/screen-activity.png`

---

#### MC-018: Agent filter cards and activity breakdown

- **Description:** Build the agent filter row at the top of the Live Activity screen with hardcoded mock data. One card per agent: agent accent colour background at 10% opacity, avatar (24px), agent name (bold, white on the coloured bg), action count (large, 600 weight). Clicking a card filters the feed to that agent (highlight the card with full accent colour). Clicking again deselects (show all). Activity Breakdown sidebar (right, 280px): "ACTIVITY BREAKDOWN" label, list of action types with coloured dots and counts (Completed: 11, Merged: 7, Started: 9, Delivered: 6, Reviewed: 3), "Total events: 36" at bottom.
- **Depends on:** MC-017
- **Reads:** `mc-spec.md §5.3, §3`
- **Creates:** `projects/mission-control/src/components/activity/AgentFilterCard.tsx`, `projects/mission-control/src/components/activity/ActivityBreakdown.tsx`
- **Modifies:** `projects/mission-control/src/app/activity/page.tsx`, `projects/mission-control/src/components/activity/ActivityFeed.tsx`
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given 5 agent filter cards render, When "Kai" is clicked, Then the feed filters to Kai's events only and Kai's card has a highlighted/selected state
  - Given Kai is selected and clicked again, When deselected, Then the feed returns to all agents
  - Given the breakdown sidebar, When rendered, Then action type counts are visible with coloured dots
- **Verifies:** Navigate to `/activity` — click agent filter cards, confirm filtering works with mock data

---

#### MC-019: Liveness indicator

- **Description:** Build the "Updated Xs ago" liveness indicator in the top-left of the Live Activity screen (next to the "LIVE ACTIVITY" label). Update the timestamp every 10 seconds using `setInterval`. Show a green pulsing dot when rendering normally, amber when page is hidden (visibilitychange API). This component should be extracted as a shared component and also used on the Team screen header.
- **Depends on:** MC-017
- **Reads:** `mc-spec.md §5.3`
- **Creates:** `projects/mission-control/src/components/shared/LivenessIndicator.tsx`
- **Modifies:** `projects/mission-control/src/app/activity/page.tsx`, `projects/mission-control/src/app/team/page.tsx`
- **Tier:** Small
- **Risk:** low
- **Acceptance criteria:**
  - Given the Live Activity screen, When rendered, Then "Updated 0s ago" appears with a green pulsing dot
  - Given 15 seconds pass, When the indicator updates, Then it shows "Updated 15s ago"
- **Verifies:** Navigate to `/activity` — wait 30 seconds and confirm counter increments

---

### Phase 4b: Live Activity Screen — Data Wiring

**Goal:** Replace all hardcoded mock data in Live Activity screen with Convex live queries.

---

#### MC-017b: Wire activity feed to Convex

- **Description:** Replace hardcoded mock data in ActivityFeed, FeedItem, AgentFilterCard, and ActivityBreakdown with Convex `useQuery` hooks reading from `activity_events` and `agents` tables. The feed should update in real-time when new events are inserted (via webhook or seed). Time grouping should use actual timestamps from the data. The breakdown sidebar should compute counts from real data.
- **Depends on:** MC-017, MC-018, MC-019, MC-007, MC-009
- **Reads:** `mc-spec.md §6.1`
- **Creates:** `projects/mission-control/convex/queries/activityEvents.ts`
- **Modifies:** All Live Activity screen components (replace mock data with useQuery hooks)
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given Convex has backfilled ATS activity events, When the Activity screen loads, Then feed items appear with real data grouped by time
  - Given a new activity_event is inserted via Convex dashboard, When the Activity screen is open, Then the new event appears at the top without page reload
  - Given the agent filter cards, When rendered, Then event counts reflect actual Convex data
- **Verifies:** Insert a test event via Convex dashboard; confirm it appears in the feed within seconds

---

### Phase 5: Polish and Presentation Mode

---

#### MC-020: Presentation mode

- **Description:** Build "Presentation Mode" — triggered by a keyboard shortcut (F, for fullscreen) or a button in the top-right of each screen. In presentation mode: sidebar collapses to icon-only (64px), font sizes scale up 1.15×, status indicators animate more prominently, the active screen is displayed full-width. Auto-cycle mode (press P to toggle): cycles through all three screens every 30 seconds with a smooth fade transition. Press Escape to exit. This feature targets the exco demo scenario.
- **Depends on:** MC-019
- **Reads:** `mc-spec.md §5`
- **Creates:** `projects/mission-control/src/components/layout/PresentationMode.tsx`, `projects/mission-control/src/hooks/usePresentationMode.ts`
- **Modifies:** `projects/mission-control/src/components/layout/Sidebar.tsx`, `projects/mission-control/src/app/layout.tsx`
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given the dashboard is open, When the user presses F, Then presentation mode activates: sidebar collapses to icons, content scales up
  - Given presentation mode is active, When the user presses P, Then auto-cycle begins, switching screens every 30 seconds with a fade transition
  - Given auto-cycle is running, When Escape is pressed, Then presentation mode exits and the sidebar returns to full width
- **Verifies:** Open dashboard — press F, confirm layout change; press P, wait 35 seconds, confirm screen transitions

---

#### MC-021: Motion, responsive polish, and final QA

- **Description:** Audit all three screens against the Mapal motion spec (§3.4): verify all transitions use CSS only with the correct timing values. Verify responsive breakpoints: desktop (1280px+), tablet (768–1279px), mobile (< 768px) — stack cards to single column on mobile, collapse sidebar to bottom nav or hamburger. Run a visual QA pass comparing each screen against the Lovable prototype screenshots in `docs/design-reference/`. Fix any deviations. Update CLAUDE.md Patterns and Conventions section with any conventions established during the build.
- **Depends on:** MC-020
- **Reads:** `mc-spec.md §3.4, §5`, design reference screenshots
- **Creates:** nothing
- **Modifies:** multiple files across all three screens
- **Tier:** Medium
- **Risk:** low
- **Acceptance criteria:**
  - Given all interactive elements, When hovered or activated, Then they transition using CSS at 120/180/240ms with cubic-bezier(0.2, 0, 0, 1) — no Framer Motion imports present
  - Given the dashboard on a 768px viewport, When rendered, Then agent cards stack to 2-column grid, sidebar is hidden or collapsed
  - Given the dashboard on a 375px viewport, When rendered, Then content is readable with no horizontal overflow
  - Given CLAUDE.md, When reviewed, Then the Patterns and Conventions section documents at least 5 conventions established during the build
- **Verifies:** Browser DevTools responsive view at 1280px, 768px, 375px — confirm layout at each breakpoint; grep codebase for `framer-motion` imports and confirm zero results

---

## 10. CI Workflow (`mc-ci.yml`)

The CI workflow must be named with the context string `MC: Type Check + Lint + Test + Build` (branch protection checks this exact string).

```yaml
name: MC CI

on:
  push:
    branches: [main]
    paths: ["projects/mission-control/**", ".github/workflows/mc-ci.yml"]
  pull_request:
    branches: [main]
    paths: ["projects/mission-control/**", ".github/workflows/mc-ci.yml"]

jobs:
  ci:
    name: "MC: Type Check + Lint + Test + Build"
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: projects/mission-control
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm", cache-dependency-path: "projects/mission-control/pnpm-lock.yaml" }
      - run: pnpm install --frozen-lockfile
      - run: npx tsc --noEmit
      - run: pnpm biome check .
      - run: pnpm vitest run
      - run: pnpm build
        env:
          CONVEX_URL: ${{ secrets.MC_CONVEX_URL }}
```

**Required GitHub secrets for MC CI:**
- `MC_CONVEX_URL` — Convex deployment URL

---

## 11. Auto-Merge Configuration

Same pattern as the ATS build. The CI workflow parses the PR body for risk labels.

```yaml
# Add to mc-ci.yml after the build step:
      - name: Auto-merge if low/medium risk
        if: github.event_name == 'pull_request' && github.event.pull_request.merged == false
        run: |
          RISK=$(echo "${{ github.event.pull_request.body }}" | grep -oiP '(?<=## Risk\n)\*{0,2}(low|medium)\*{0,2}' | head -1 | tr '[:upper:]' '[:lower:]' | tr -d '*')
          if [[ "$RISK" == "low" || "$RISK" == "medium" ]]; then
            gh pr merge ${{ github.event.pull_request.number }} --squash --auto
          fi
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 12. Task Summary

| Phase | Tasks | Risk profile |
|-------|-------|-------------|
| 0: Scaffold | MC-001 – MC-004 | 1 medium, 3 low |
| 1: Data Layer | MC-005 – MC-009 | 2 medium, 3 low |
| 2a: Team Screen (visual shell) | MC-010, MC-011, MC-012 | 3 low |
| 2b: Team Screen (data wiring) | MC-010b | 1 low |
| 3a: Projects Screen (visual shell) | MC-013, MC-014, MC-014b, MC-015, MC-016 | 5 low |
| 3b: Projects Screen (data wiring) | MC-013b | 1 low |
| 4a: Live Activity (visual shell) | MC-017, MC-018, MC-019 | 3 low |
| 4b: Live Activity (data wiring) | MC-017b | 1 low |
| 5: Polish | MC-020 – MC-021 | 2 low |
| **Total** | **25 tasks** | |

**Skin-first approach:** Phases 2a, 3a, and 4a build the visual shell with hardcoded mock data. The operator reviews each screen against the Lovable prototype via Vercel preview. Visual deviations are corrected before the corresponding "b" phase wires the components to Convex live queries. This prevents visual drift from compounding with data integration bugs.

---

## 13. Non-Goals (v1)

This spec explicitly excludes:

- Helicone cost tracking — optional infrastructure; build proceeds without it. Cost fields show estimates.
- Orchestration or automation layer — human operator remains orchestrator.
- Value/ROI screen — removed. Value elements are distributed across Team and Projects screens.
- Multi-tenant access — single operator view only.
- Dark/light mode toggle — dark shell + light workspace is fixed. No toggle.
- Playwright E2E tests — deferred to Tier 2.
- Real-time agent chat — Chat placeholder only (v2 scope).
- Framer Motion — CSS transitions only.
- status.json polling — agent status is derived from activity_events timestamps, not from polling external files.
- "New Project" initialisation workflow — the "+ New Project" button is non-functional in v1.

---

*Spec version 1.1 — updated 2026-03-31. Changes from v1.0: Agent card layout rewritten to match Lovable prototype (horizontal image+text card, not compact circular avatar). Team screen header stats bar added. Agent profile layout updated (3-column sections, Soul.md modal, constellation top-right). Phase detail drawer added to Projects screen. "View Live System" button added. Time groupings updated (This Afternoon/This Morning). Agent status changed from polling-based to webhook-derived. Phases 2–4 restructured into a/b (skin-first + data wiring) to prevent visual drift. Task count increased from 21 to 25.*
*Visual source of truth: Lovable prototype screenshots in `projects/mission-control/docs/design-reference/` (operator must export before Phase 2a).*
