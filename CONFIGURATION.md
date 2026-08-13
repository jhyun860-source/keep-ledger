# Configuration Reference

Use this reference to create untracked local environment settings or configure a deployment provider's secrets manager. **Never commit real credentials, tokens, database URLs, or session secrets.**

| Variable | Required | Purpose |
|---|---:|---|
| `NODE_ENV` | Yes | Use `development` locally and `production` for a release. |
| `PORT` | Host-defined | HTTP listening port. Most hosts inject it automatically. |
| `DATABASE_URL` | Yes | MySQL 8+ or TiDB-compatible database URL. |
| `JWT_SECRET` | Yes | Long random key used to sign the app session cookie. Use a different value in each environment. |
| `VITE_APP_ID` | Manus only | Manus OAuth application identifier. |
| `OAUTH_SERVER_URL` | Manus only | Manus OAuth service address. |
| `VITE_OAUTH_PORTAL_URL` | Manus only | Browser login portal address. |
| `OWNER_OPEN_ID` | Manus only | Owner identity that is initially assigned the admin role. |
| `BUILT_IN_FORGE_API_URL` | Optional | Manus-native server utility endpoint. |
| `BUILT_IN_FORGE_API_KEY` | Optional | Token for Manus-native server utilities. |
| `VITE_FRONTEND_FORGE_API_URL` | Optional | Manus-native browser utility endpoint. |
| `VITE_FRONTEND_FORGE_API_KEY` | Optional | Browser token for Manus-native utilities. |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Analytics endpoint supplied by the selected provider. |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Analytics site identifier. |

## Local development

Create a local `.env` file that is excluded from Git and set at minimum `DATABASE_URL`, `JWT_SECRET`, and the current authentication adapter's required values. The current adapter is Manus OAuth; therefore the Manus variables must be available when exercising the checked-in login flow.

## Independent hosting

Do not copy Manus credentials to another platform. First replace the Manus OAuth adapter described in `DEPLOYMENT.md` with the selected provider, then configure that provider's client ID, client secret, issuer, callback URL, and session values only in the destination host's secret manager.
