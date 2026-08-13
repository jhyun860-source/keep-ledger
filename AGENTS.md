# AI Development Guide

This repository is the production source for **VELLUM Keep Ledger**, a Korean bar and liquor-store back-office application. It records kept bottles, staff members, and customer withdrawal history.

## Fast Start

Use Node.js 22 and pnpm. Configure the required values in your local untracked environment file or your host's secrets manager according to `CONFIGURATION.md`, then run `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm run db:migrate`, and `pnpm run dev`.

Before submitting a change, always run `pnpm run verify`. This runs Vitest, TypeScript validation, and the production build.

## Architecture

| Area | Location | Responsibility |
|---|---|---|
| Frontend | `client/src/` | React 19, Wouter routes, Tailwind 4, shadcn/ui components |
| API | `server/routers.ts` | Typed tRPC procedures and input validation |
| Database access | `server/db.ts` | Drizzle queries only; return raw records |
| Schema | `drizzle/schema.ts` | MySQL/TiDB tables and relations |
| Migrations | `drizzle/*.sql` | Generated SQL that must be reviewed and committed |
| Tests | `server/*.test.ts` | Validation and server procedure coverage |

## Mandatory Change Flow

For an API or database feature, update the schema first, generate a migration with `pnpm run db:generate`, review and commit the SQL, then apply it with `pnpm run db:migrate`. Add or modify helpers in `server/db.ts`, expose the capability through a tRPC procedure, connect the React UI through `trpc.*` hooks, and add or update Vitest coverage.

Do not seed customer, bottle, employee, review, or testimonial data. Production records must come from actual users.

## Product Rules

The active employee list is the sole source for the author and withdrawal-staff selectors. Deleting an employee is a soft deletion: existing bottle authorship and withdrawal history must remain intact. A withdrawal always stores both the customer name and the staff member who carried the bottle to the table. Remaining liquor percentage is an integer from 0 to 100.

The visual system uses the VELLUM premium hospitality direction: espresso, parchment, and muted gold; Korean UI copy; serif micro-labels; calm spacing; and a ledger-like internal-tool layout. Preserve this visual language when extending the interface.

## Authentication and Hosting

The current code uses Manus OAuth through `server/_core/oauth.ts` and `client/src/const.ts`. It works unchanged on Manus when its injected environment variables are available. For a fully independent production host, replace that adapter with the host team's chosen provider before exposing the app publicly. See `DEPLOYMENT.md` for exact setup and release steps.
