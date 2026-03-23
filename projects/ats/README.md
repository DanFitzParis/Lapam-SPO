# Lapam ATS

A standalone, multi-tenant B2B SaaS applicant tracking system for independent hospitality groups.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4.x + shadcn/ui
- **Database:** PostgreSQL (Neon) + Prisma ORM
- **Auth:** Clerk
- **Storage:** Cloudflare R2
- **AI:** Vercel AI SDK + Anthropic Claude
- **Email:** Resend + React Email
- **SMS:** Twilio
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 20 LTS
- pnpm 9+
- PostgreSQL database (Neon recommended)
- Clerk account

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Available Commands

```bash
pnpm dev              # Start dev server with Turbopack
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run unit tests (Vitest)
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm prisma studio    # Open Prisma data browser
```

## Project Structure

```
projects/ats/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/              # Utilities and integrations
├── modules/          # Domain modules
├── prisma/           # Database schema and migrations
└── docs/             # Specifications and documentation
```

## Documentation

- [PRD](docs/specs/PRD.md) - Product requirements
- [Database Schema](docs/specs/db-schema.md)
- [API Specification](docs/specs/api-spec.yaml)
- [UX Specification](docs/specs/ux-spec.md)
- [Tasks](docs/specs/TASKS.md) - Implementation roadmap

## Multi-tenancy

All database queries are automatically scoped to the current tenant (Clerk organization) via a Prisma client extension. See `src/lib/prisma.ts` for implementation.

## License

Private - All rights reserved
