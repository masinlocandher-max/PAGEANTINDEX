# Supabase Auth Configuration

The PageantIndex client now handles email confirmation, recovery sessions,
password updates, and delayed role-profile creation. The corresponding Supabase
Auth settings must be configured in the project dashboard before real-account
browser testing.

## Site URL

Set the production Site URL to:

```text
https://www.pageantindex.com
```

## Redirect URL allowlist

Add these exact production URLs:

```text
https://www.pageantindex.com/sign-in/
https://www.pageantindex.com/sign-in/?auth=confirmed
https://www.pageantindex.com/sign-in/?auth=recovery
https://app.pageantindex.com/
```

Add these local testing URLs:

```text
http://localhost:4173/sign-in/
http://localhost:4173/sign-in/?auth=confirmed
http://localhost:4173/sign-in/?auth=recovery
http://localhost:4173/app/
```

The website sends confirmation and recovery emails back to the sign-in route.
The browser consumes the returned Supabase session, creates any missing
role-specific records, and removes authentication tokens from the visible URL.

## Email confirmation

Keep email confirmation enabled for public registration. Test each account type:

1. Enthusiast
2. Candidate
3. Supplier
4. Media
5. Pageant Organization

The signup browser stores a password-free onboarding payload for no more than 24
hours. After confirmation, it creates the selected role profile. A normal later
sign-in does not overwrite established profile information.

## SMTP

Configure a production SMTP provider before inviting public users. Confirm:

- sender domain authentication
- verified From address
- confirmation email delivery
- password recovery delivery
- rate limits appropriate for launch traffic
- branded confirmation and recovery templates
- links use the approved PageantIndex domains

Do not place SMTP credentials, service-role keys, or private API secrets in the
browser repository.

## Recovery flow

The client adds an explicit recovery redirect, consumes the recovery session,
and shows a password-update form requiring at least 10 characters. The password
is sent directly to Supabase Auth and is never written to local storage.

Test:

1. Request a reset from the sign-in page.
2. Open the email link in a clean browser session.
3. Set and confirm a new password.
4. Continue to the private workspace.
5. Confirm the old password no longer works.
6. Confirm an expired or reused link displays an error.

## Session behavior

Website callback sessions use session storage by default. The mobile-first app
supports an explicit keep-signed-in option. Sign-out must remove both session
and local storage copies of `pi_supabase_session`.

## Required real-account QA

For every role, verify:

- registration
- confirmation email
- role profile creation
- sign-in
- sign-out
- password recovery
- expired-link handling
- correct private workspace
- no access to another user's records
- no access to administrator review controls

For the administrator account, set the protected role only in Supabase Auth
`app_metadata`:

```json
{"role":"admin"}
```

Never place the administrator role in user-editable `user_metadata`.
