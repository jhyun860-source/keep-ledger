# Deployment Guide

## 1. Repository and local development

The canonical external repository is **`https://github.com/jhyun860-source/keep-ledger`**. Claude Code, Codex, Cursor, and comparable tools can clone it directly, read `AGENTS.md`, and work from the same source tree.

```bash
git clone https://github.com/jhyun860-source/keep-ledger.git
cd keep-ledger
corepack enable
pnpm install --frozen-lockfile
# Configure secrets as described in CONFIGURATION.md.
pnpm run db:migrate
pnpm run dev
```

The application uses a standard Node server and binds to `PORT`, so a typical Node host can use the following commands.

| Stage | Command |
|---|---|
| Install | `corepack enable && pnpm install --frozen-lockfile` |
| Build | `pnpm run build` |
| Run migrations | `pnpm run db:migrate` |
| Start | `pnpm run start` |
| Validate before release | `pnpm run verify` |

Configure environment variables using [`CONFIGURATION.md`](./CONFIGURATION.md). Never commit `.env` files or secret values.

## 2. Database release procedure

Use a managed MySQL 8+ or TiDB-compatible database. Set `DATABASE_URL` first. Any schema change should follow this order: edit `drizzle/schema.ts`, execute `pnpm run db:generate`, review the new SQL under `drizzle/`, commit it, and execute `pnpm run db:migrate` in the target environment before releasing the new application version.

Do not use unreviewed schema generation against production. Back up the database before destructive changes.

## 3. Authentication portability

> The checked-in authentication adapter is currently **Manus OAuth**.

The application runs unchanged on Manus because the platform supplies `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`, and session-related secrets. A generic host cannot use those platform credentials automatically.

For an independent public deployment, an AI developer should first replace the adapter in `server/_core/oauth.ts`, `server/_core/sdk.ts`, `client/src/const.ts`, and the authentication hook with the chosen provider, such as an organization-approved OAuth/OIDC service. Preserve the existing `users` table and the `protectedProcedure` authorization boundary. After replacement, set the provider's callback URL to `https://YOUR_DOMAIN/api/oauth/callback`, configure cookie security for the final HTTPS domain, and test sign-in, sign-out, and a protected ledger mutation.

## 4. Deployment options

For the least operational work, keep the repository connected to Manus and publish from the project interface after an approved GitHub change is synced. For a separate Node hosting provider, provision the MySQL/TiDB database, configure all environment variables in that host's secrets manager, run the migration command once per release, and use the build/start commands above. The existing server already reads `PORT` from the runtime environment.

## 5. Release checklist

1. Confirm `.env` files and credentials are never committed.
2. Run `pnpm run verify` locally or through GitHub Actions.
3. Review and apply any pending SQL migration once.
4. Confirm login and a protected action with a non-production account.
5. Deploy the application and confirm the selected custom domain is serving HTTPS.
