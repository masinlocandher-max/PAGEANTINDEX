# Production Architecture

## Product position

Pageant Index is **The Global Network for Pageantry**. The public website and
mobile-first application share one reviewed data ecosystem for enthusiasts,
candidates, suppliers, media, and pageant organizations.

Public discovery remains open without registration. Accounts add private tools,
personalization, saved records, publishing workflows, or official management
capabilities. They must not become an unnecessary barrier to merchandise guest
checkout, pay-per-view, livestream access, tickets, or public voting.

## Application stack

- Responsive static website and separate mobile-first application
- Supabase Auth, PostgreSQL, Storage, and Row-Level Security
- Transactional email for authentication, inquiries, review decisions, receipts,
  access links, and organizer notices
- International payment providers appropriate to each supported market
- Background jobs for email delivery, review reminders, scheduled publishing,
  access expiry, analytics aggregation, and sitemap generation
- Controlled image storage and authorized media delivery
- Error monitoring, database backups, audit logs, and rate limiting

## Canonical application boundaries

### Shared public discovery

Crawlable pages for suppliers, candidates, approved pageant editions, media,
announcements, featured campaigns, public experiences, categories, countries,
and methodology. Only reviewed, submitted, and published records appear publicly.

### Enthusiast workspace

Optional personalization, followed pageants, saved suppliers, preferences, and
account-linked history. Guest transactions remain available when identity is not
required by law, the organizer, or the payment provider.

### Candidate workspace

Private candidate profile, current pageant, current title, previous pageant
history, saved suppliers, travel discovery, and optional public history records.

### Supplier workspace

Professional profile drafts, one primary category, multiple additional
categories, original or authorized portfolio assets, service coverage,
inquiries, and explicit review submission. Owners cannot self-publish,
self-verify, feature themselves, or change organic trust signals.

### Media workspace

Media column profile, private article drafts, canonical links, attribution,
share controls, and explicit editorial-review submission. Review and publication
states remain administrator-controlled.

### Pageant Organization workspace

Official organization profile, pageant edition drafts, candidate roster records,
applications and rules links, announcement requests, voting, livestream,
pay-per-view, ticket and merchandise requests, and official result requests.
Organization owners can prepare and submit records but cannot self-approve or
self-publish official claims.

### Administration

Strictly protected moderation for supplier profiles, media profiles and
articles, pageant organizations, editions, public experiences, announcement
requests, official results, featured campaigns, verification, complaints, and
audit records. Administrator actions must not mix paid visibility with approval,
verification, editorial judgment, or results.

Public Data API review functions are `SECURITY INVOKER` wrappers. Their privileged
implementation lives in the non-exposed `private` schema and requires the
protected administrator claim from `app_metadata`. Anonymous execution is
revoked, and only submitted records can be reviewed.

## Data and trust separations

- `public.suppliers` is the reviewed public supplier directory.
- Private identity is separate from public profiles.
- Each audience has owner-scoped draft tables protected by RLS.
- Every public table has RLS enabled.
- Public reads are limited to approved, submitted, and published records where
  applicable.
- Owner column grants exclude review state, publication timestamps, linked public
  announcements, verification, and administrative controls.
- Candidate roster visibility requires explicit authorization and an approved
  pageant edition.
- Official results use a separate reviewed model rather than editing candidate
  profiles.
- Saved pageants reference `public.pageant_edition_drafts`; there is no dependency
  on a nonexistent generic events table.
- Featured and sponsored content always carries a visible label.
- Organic ranking remains separate from paid placement inventory.
- Verification evidence and draft portfolio files remain private.
- Negative feedback is not removed merely because a listed party objects.
- No invented profiles, pageants, candidates, ratings, reviews, results,
  campaigns, inventory, or engagement figures are seeded into production.

## Storage boundary

The private `pageant-profile-drafts` bucket accepts JPEG, PNG, and WebP files up
to 10 MB. Folder-level policies require the first path segment to match the
signed-in user ID. Owners can insert, read, replace, and delete their own assets;
administrators can review owner assets without making the bucket public.

## Mobile and responsive architecture

The mobile-first application keeps five universal tabs:

1. Discover
2. Pageants
3. Media
4. Updates
5. Account

Role-specific tools appear inside Pageants and Account rather than expanding the
bottom navigation. Existing mobile safe areas, tablet expansion, desktop
sidebars, and device-specific breakpoints must remain intact.

## Live migration discipline

`supabase/migrations/` is the production source of truth. Migration versions
must match the live Supabase migration history, remain unique, and be applied in
timestamp order. `supabase/schema.sql` is a future reference and must never be
applied as a shortcut.

After the three existing supplier-administration migrations, the live order is:

1. `20260803172117_pageantindex_foundation.sql`
2. `20260803172305_pageantindex_profiles.sql`
3. `20260803172436_pageantindex_media_content.sql`
4. `20260803172616_pageantindex_organization_core.sql`
5. `20260803172919_pageantindex_organization_operations.sql`
6. `20260803173041_pageantindex_admin_functions.sql`
7. `20260803173134_revoke_anonymous_admin_rpc_access.sql`
8. `20260803173310_isolate_admin_review_implementations.sql`
9. `20260803173435_optimize_pageantindex_rls_and_indexes.sql`

The earlier draft migration sequence was removed because its saved-pageant table
referenced `public.events`, which was not part of the production schema.

## Verified database behavior

- Supabase Security Advisor reports no findings.
- Anonymous users cannot execute administrator review RPCs.
- Authenticated non-administrators are rejected by the protected implementation.
- Organizer owners can create editions only for their own organization.
- Organizer owners cannot update review or publication controls.
- Administrators can approve submitted records and generate publication
  timestamps.
- Anonymous reads return approved records and exclude private drafts.
- Foreign-key indexes are present for review queues and ownership relations.
- Duplicate permissive SELECT policies were consolidated by role.

## Remaining launch phases

1. Configure Supabase Auth URLs, recovery redirects, SMTP, and allowed origins.
2. Test all five registration types and their complete private workspaces using
   real accounts.
3. Test approved public pageants, candidate rosters, experiences,
   announcements, and official results.
4. Add transactional email, payments, receipts, guest access links, and approved
   organizer integrations.
5. Add authenticated reviews and analytics only after sufficient real activity
   exists.
6. Build ranking and recommendation systems only after trustworthy data volume,
   methodology, appeals, and audit controls are established.
