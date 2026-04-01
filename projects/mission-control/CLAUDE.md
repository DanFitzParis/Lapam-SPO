# CLAUDE.md — Mission Control

> Internal dashboard for the Mapal Synthetic Product Organisation.

## What This Is

A production dashboard serving two audiences:
1. **Operator (Daniel):** Real-time visibility into agent status, project progress, and costs
2. **Executive observers:** Proof that the SPO is a team of working specialists, not a tool

**Core principle:** Show the team at work, not the infrastructure.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | shadcn/ui + Tremor |
| Backend | Convex (cloud, free tier) |
| Styling | Tailwind CSS + Mapal tokens |
| Font | Montserrat (Google Fonts) |
| Icons | lucide-react |
| Language | TypeScript (strict) |
| Lint/format | Biome |
| Tests | Vitest (unit) |
| CI | GitHub Actions |
| Deploy | Vercel (Hobby) |
| Package manager | pnpm |

**Do not use:** Framer Motion, Inter font, teal for buttons/text.

---

## Commands

```bash
# Development
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Serve production build

# Quality
pnpm lint         # Biome check
pnpm lint:fix     # Biome fix
pnpm test         # Vitest run
pnpm test:watch   # Vitest watch mode
npx tsc --noEmit  # TypeScript check
```

---

## Design System

All visual decisions follow **Mapal Master Style Guide v2** (in project knowledge).

### Shell vs. Workspace

```
Shell (sidebar, topbar):   #1D122C (dark purple)
Workspace (main content):  #F3F2F5 (neutral-50)
Cards/panels:              #FFFFFF
```

### Colour Tokens (CSS variables in globals.css)

```css
--color-shell-bg: #1D122C;
--color-workspace-bg: #F3F2F5;
--color-surface: #FFFFFF;
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

### Typography

```css
font-family: 'Montserrat', sans-serif;
Weights: 400 (body), 500 (label), 600 (subheading), 700 (heading)
```

### Motion

```css
--motion-fast:   120ms cubic-bezier(0.2, 0, 0, 1);
--motion-base:   180ms cubic-bezier(0.2, 0, 0, 1);
--motion-slow:   240ms cubic-bezier(0.2, 0, 0, 1);
```

**CSS transitions only — no Framer Motion.**

---

## File Structure

```
projects/mission-control/
├── app/
│   ├── team/                 # Team screen
│   ├── projects/             # Projects screen
│   ├── activity/             # Live Activity screen
│   ├── layout.tsx            # Root layout with Shell
│   └── globals.css           # Design tokens + Tailwind
├── components/
│   ├── layout/               # Sidebar, Shell, NavItem
│   ├── agents/               # Agent cards, profiles
│   ├── projects/             # Kanban, phase cards
│   ├── activity/             # Feed, filters
│   └── shared/               # Reusable components
├── convex/                   # Convex backend (Phase 1)
│   ├── schema.ts
│   ├── queries/
│   ├── mutations/
│   └── actions/
├── lib/                      # Utilities, helpers
└── vitest.config.ts
```

---

## Three Screens

### 1. Team
Meet the team. Click any agent for full profile (operating envelope, capability constellation, work journal).

### 2. Projects
See what's being built. Active project: Lapam ATS. Lifecycle phases, kanban board, outputs summary.

### 3. Live Activity
Watch the team work. Rolling timeline of all agent actions, grouped by time, filterable by agent.

---

## Data Architecture (Phase 1+)

Convex schema:
- `agents` — identity, operating envelope, capability roles
- `activity_events` — GitHub webhooks, real-time feed
- `tasks` — from TASKS.md + GitHub PRs
- `projects` — Lapam ATS + future projects
- `cost_snapshots` — optional, from Helicone

Agent status derived from `activity_events` timestamps:
- **Active:** event < 10 min ago
- **Idle:** event > 30 min ago
- **Offline:** no events

---

## Boundaries

### Do
- Use CSS transitions (120/180/240ms)
- Follow Mapal design tokens strictly
- Build skin-first (hardcoded mock data, then wire to Convex)
- Keep components small and composable

### Don't
- Use Framer Motion
- Use teal for buttons/text (reserved for agent-maren accent)
- Poll external files for agent status (derive from activity_events)
- Mix Inter font with Montserrat

---

## Patterns & Conventions

### Component naming
- Page components: `page.tsx`
- Layout wrappers: `Shell.tsx`, `Sidebar.tsx`
- Reusable UI: `AgentCard.tsx`, `TaskCard.tsx`

### State
- Server state: Convex `useQuery` hooks
- Client state: React `useState` for UI-only state (filters, modals)

### Styling
- Tailwind utility classes first
- CSS variables for design tokens
- Avoid inline styles

### Testing
- Unit tests for utilities and helpers
- Component tests deferred to Tier 2
- E2E (Playwright) deferred to Tier 2

---

## Reference

- Full spec: `projects/mission-control/docs/mc-spec.md`
- Design reference: `projects/mission-control/docs/design-reference/` (Lovable prototype screenshots)
- Mapal Style Guide: in project knowledge

---

## Design QA Notes

Visual consistency is critical. Follow these rules when implementing UI:

- **Authoritative visual spec:** `sidebar-visual-reference.md` in `docs/design-reference/` contains exact computed values from the Lovable prototype. Check all properties against this file, not by guessing.
- **Sidebar brand:** "SPO" (h1) with "Mission Control" (subtitle) — not the reverse
- **Visual source of truth:** Lovable prototype at `projects/mission-control/docs/design-reference/`
- **Sidebar width:** w-60 (240px), not w-48 or w-64
- **Active nav:** Background `#301E4A`, not brand-purple (`#5B2D8E`)
- **Text colors:** Subtitle uses `rgba(255,255,255,0.64)`, inactive nav uses `rgba(255,255,255,0.88)`
- **Border radius:** Nav items use `rounded-2xl` (16px), not `rounded-lg` (8px)
- **DevTools inspection:** Always inspect Lovable prototype with DevTools for exact values rather than eyeballing
- **When in doubt:** Flag for operator review rather than guessing

---

_Version 1.0 — 2026-03-31_
