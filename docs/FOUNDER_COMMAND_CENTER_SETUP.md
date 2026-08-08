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

- Founder access uses the existing Supabase session and requires `app_metadata.role = admin`.
- OpenAI API keys never enter browser JavaScript.
- Google OAuth client secrets never enter browser JavaScript.
- Gmail access is read-only in v1.
- Google refresh tokens are encrypted with AES-256-GCM before being stored.
- The integration table is denied to `anon` and `authenticated`; server functions use the Supabase service role.
- GPT email context is opt-in for each request. The browser sends recent email metadata/snippets only when the founder enables the inbox-context switch.
- The GPT endpoint uses `store: false`.
- The GPT assistant is instructed to recommend and draft only. It does not send mail, approve transactions, publish pageants, or change account state.

## Required production migrations

Apply, in order:

1. `supabase/migrations/20260809030000_founder_integrations.sql`
2. `supabase/migrations/20260809031500_founder_integrations_deny_browser.sql`

Do not expose the `founder_integrations` table to browser roles.

## Required production environment variables

Configure these in the hosting project. Never commit their secret values.

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTEGRATION_ENCRYPTION_KEY` — use a long random secret; changing it after Gmail is connected will make stored refresh tokens unreadable
- `PUBLIC_SITE_URL` — production example: `https://www.pageantindex.com`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` — optional; defaults to `gpt-5-mini`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Founder auth bootstrap

The live PageantIndex project must contain at least one Supabase Auth account whose protected `app_metadata.role` is `admin`. The Founder Command Center deliberately does not grant itself admin access from the browser.

At the time this feature was added, the live PageantIndex Auth project had no registered users yet. Create the founder account through the normal PageantIndex Auth flow, then promote that exact account to the protected admin role using a trusted server-side/admin process. Do not use `user_metadata` for this authorization role.

## Google Cloud setup

Enable the Gmail API and create a Web application OAuth client.

Production redirect URI:

`https://www.pageantindex.com/api/integrations/google/callback`

If the canonical production host is changed, update both `PUBLIC_SITE_URL` and the exact authorized redirect URI in Google Cloud.

The v1 Gmail scope is:

`https://www.googleapis.com/auth/gmail.readonly`

The authorization request also asks for `openid` and `email` so the dashboard can label the connected account.

## OpenAI connection

The dashboard calls the OpenAI Responses API only from the server function at:

`/api/founder/assistant`

The browser never receives `OPENAI_API_KEY`.

## Founder API routes

- `GET /api/founder/status`
- `POST /api/founder/assistant`
- `GET /api/founder/gmail`
- `GET /api/integrations/google/start`
- `GET /api/integrations/google/callback`

All founder JSON endpoints except the OAuth callback validate the current Supabase bearer token and require the protected admin role. The callback trusts only a short-lived, HMAC-signed OAuth state created after that founder authentication check.

## Production checklist

1. Confirm both founder integration migrations are applied.
2. Configure all required environment variables in the actual PageantIndex hosting project.
3. Add the exact Google OAuth redirect URI.
4. Create the founder Supabase Auth account and assign the protected admin app-metadata role through a trusted admin process.
5. Deploy the current `main` branch.
6. Sign into `/founder/` using the authorized admin account.
7. Confirm OpenAI shows Connected.
8. Click Connect Gmail, grant read-only access, and confirm the connected email address appears.
9. Refresh the inbox and verify message metadata/snippets load.
10. Ask GPT a request without email context and verify a response.
11. Enable inbox context and ask which recent messages deserve a meeting.
12. Confirm a non-admin account cannot open founder data or call founder endpoints.
13. Confirm the service-role key, OpenAI key, Google client secret, encryption key, and Google refresh token never appear in browser source, network responses, logs, or the repository.

## Next automation layer

After v1 is verified, connect the Founder Command Center to the owner-light operating model:

- qualified meeting queue
- revenue and recurring revenue
- voting/tabulation event revenue
- renewals at risk
- enterprise pipeline
- master-license / territory pipeline
- critical trust, security, legal, and reputation escalations
- system health

Those should be derived from live PageantIndex data rather than hard-coded display numbers.
