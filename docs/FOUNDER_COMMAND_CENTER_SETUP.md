# PageantIndex Founder Command Center

Private route: `/founder/`

## Purpose

The Founder Command Center is intentionally narrower than the operational admin dashboard. It is designed to surface only work that should reasonably reach the founder:

- high-value opportunities and partnership intake
- meetings and negotiation preparation
- important inbox review
- founder-level GPT analysis and drafting
- connection health for founder tools
- exceptional operational items that require founder authority or judgment

Routine support, normal profile review, standard organizer operations, billing operations, voting/tabulation execution, and ordinary account administration should remain delegated or automated.

## Security model

- Founder access uses a Supabase Auth session and requires protected `app_metadata.role = admin`.
- Founder login is passwordless: the browser requests a one-time email link only for the designated founder account.
- The founder page consumes the returned Supabase access/refresh tokens from the URL fragment, stores the session, clears the fragment, and re-validates the protected admin claim.
- AI credentials never enter browser JavaScript.
- Vercel AI Gateway OIDC is preferred on Vercel deployments, so an OpenAI API key is not required there.
- Google OAuth client secrets never enter browser JavaScript.
- Gmail access is read-only in v1.
- Google refresh tokens are encrypted with AES-256-GCM before storage.
- The integration table is denied to `anon` and `authenticated`; server functions use the Supabase service role.
- GPT email context is opt-in for each request. Recent email metadata/snippets are included only when the founder enables the inbox-context switch.
- GPT requests use `store: false`.
- The GPT assistant can recommend and draft. It does not send mail, approve transactions, publish pageants, or change account state.

## Live production migrations

The following migrations are part of production and must remain in migration history:

1. `supabase/migrations/20260809030000_founder_integrations.sql`
2. `supabase/migrations/20260809031500_founder_integrations_deny_browser.sql`

The live Pageant Index Supabase project already has these controls applied. Do not expose `founder_integrations` to browser roles.

## Founder account

The designated founder account is `info.senz.pr@gmail.com` and its protected Supabase `app_metadata.role` is `admin`.

Do not use `user_metadata` for founder authorization.

## Supabase Auth URL configuration

Passwordless founder sign-in depends on Supabase accepting the production callback. Configure Authentication URL settings in the Pageant Index Supabase project as follows:

- Site URL: `https://www.pageantindex.com`
- Redirect URL: `https://www.pageantindex.com/founder/`

The founder client sends `redirect_to=https://www.pageantindex.com/founder/` when requesting the one-time link. If that URL is not in the Supabase redirect allow-list, Supabase falls back to the configured Site URL.

After changing these settings, request a new founder sign-in link. Do not reuse an older email generated when the project still pointed at localhost.

## Production environment variables

Configure these in the actual PageantIndex hosting project. Never commit secret values.

Required for founder server routes and Gmail:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTEGRATION_ENCRYPTION_KEY` — a long random secret; changing it after Gmail is connected makes stored refresh tokens unreadable
- `PUBLIC_SITE_URL=https://www.pageantindex.com`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

AI on Vercel:

- Prefer Vercel AI Gateway with deployment OIDC (`VERCEL_OIDC_TOKEN` is supplied/rotated by Vercel when enabled).
- Optional `FOUNDER_AI_MODEL`; default is `openai/gpt-5.4`.
- Optional fallback outside AI Gateway: `OPENAI_API_KEY` and `OPENAI_MODEL`.

## GPT connection

`POST /api/founder/assistant` first uses Vercel AI Gateway when `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN` is available. It falls back to the OpenAI Responses API only when `OPENAI_API_KEY` is configured.

On Vercel, enable AI Gateway/Secure Backend Access so the deployment receives its OIDC token automatically.

## Google Cloud setup

Enable the Gmail API and create a Web application OAuth client.

Production redirect URI:

`https://www.pageantindex.com/api/integrations/google/callback`

If the canonical production host changes, update both `PUBLIC_SITE_URL` and the exact authorized redirect URI in Google Cloud.

The v1 Gmail scope is:

`https://www.googleapis.com/auth/gmail.readonly`

The authorization request also asks for `openid` and `email` so the dashboard can label the connected account.

## Founder API routes

- `GET /api/founder/status`
- `POST /api/founder/assistant`
- `GET /api/founder/gmail`
- `GET /api/integrations/google/start`
- `GET /api/integrations/google/callback`

All founder JSON endpoints except the OAuth callback validate the current Supabase bearer token and require the protected admin role. The callback trusts only a short-lived, HMAC-signed OAuth state created after founder authentication.

## Production verification checklist

1. Confirm the founder integration migrations remain applied and Supabase Security Advisor is clean.
2. Set the Supabase Site URL and founder Redirect URL above.
3. Deploy current `main` to the production PageantIndex host.
4. Open `/founder/`, request a new secure sign-in link, and verify the link returns to `/founder/` rather than localhost.
5. Confirm the founder JWT contains protected `app_metadata.role = admin`.
6. Enable Vercel AI Gateway/Secure Backend Access and confirm GPT shows Connected.
7. Configure the Google OAuth client and exact Gmail callback URL.
8. Click Connect Gmail, grant read-only access, and confirm the connected address appears.
9. Refresh the inbox and verify recent message metadata/snippets load.
10. Ask GPT without email context and verify a response.
11. Enable inbox context and ask which recent messages deserve a meeting.
12. Confirm a non-admin account cannot open founder data or call founder endpoints.
13. Confirm the service-role key, Google client secret, integration encryption key, refresh tokens, OIDC token, and any fallback AI key never appear in browser source, network responses, logs, or the repository.

## Next automation layer

Connect the Founder Command Center to live owner-light metrics rather than hard-coded numbers:

- qualified meeting queue
- revenue and recurring revenue
- voting/tabulation event revenue
- renewals at risk
- enterprise pipeline
- master-license / territory pipeline
- critical trust, security, legal, and reputation escalations
- system health
