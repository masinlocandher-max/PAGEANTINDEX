# Production Architecture

## Product position

Pageant Index is **The Global Network for Pageantry**. The public website and
mobile-first application share one reviewed data ecosystem for enthusiasts,
candidates, suppliers, media, and pageant organizations.

Public discovery remains open without registration. Accounts add private tools,
personalization, saved records, publishing workflows, or official management
capabilities. They must not become an unnecessary barrier to merchandise guest
checkout, pay-per-view, livestream access, tickets, or public voting.

## Recommended application stack

- Next.js with TypeScript and server-rendered public pages
- Design-token CSS or Tailwind CSS with responsive and safe-area support
- Supabase Auth, PostgreSQL, Storage, and Row-Level Security
- Transactional email for authentication, inquiries, review decisions, receipts,
  access links, and organizer notices
- International payment providers appropriate to each supported market
- Background jobs for email delivery, review reminders, scheduled publishing,
  access expiry, analytics aggregation, and sitemap generation
- CDN image transformation, caching, and authorized media delivery
- Error monitoring, database backups, audit logs, and rate limiting

## Canonical application boundaries

### Shared public discovery

Crawlable pages for suppliers, candidates, approved pageant editions, media,
announcements, featured campaigns, public experiences, categories, countries,
and methodology. Only reviewed and published records appear publicly.

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
audit records. Administrator actions must use protected functions and must not
mix paid visibility with approval, verification, editorial judgment, or results.

## Data and trust separations

- `public.suppliers` is the reviewed public supplier directory.
- Private identity is separate from public profiles.
- Each audience has owner-scoped draft tables protected by RLS.
- Public reads are limited to records with approved review state and publication
  timestamps where applicable.
- Owner column grants exclude review state, publication timestamps, verification,
  and administrative controls.
- Candidate roster visibility requires explicit authorization and an approved
  pageant edition.
- Official results use a separate reviewed model rather than editing candidate
  profiles.
- Featured and sponsored content always carries a visible label.
- Organic ranking remains separate from paid placement inventory.
- Verification evidence is private and served only through controlled access.
- Negative feedback is not removed merely because a listed party objects.
- No invented profiles, pageants, candidates, ratings, reviews, results,
  campaigns, inventory, or engagement figures are seeded into production.

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

## Migration discipline

`supabase/migrations/` is the production source of truth. Migration versions
must be unique and applied in timestamp order. `supabase/schema.sql` is a future
reference and must never be applied as a shortcut.

Required order for this launch branch:

1. `20260731215441_add_pageantindex_intake_and_profile_drafts.sql`
2. `20260803163000_global_candidate_supplier_ecosystem.sql`
3. `20260803164000_global_public_supplier_fields.sql`
4. `20260803170000_expand_audiences_media_content.sql`
5. `20260803171000_add_pageant_organizers.sql`
6. `20260803171500_admin_moderation_extensions.sql`
7. `20260803171900_prepare_organizer_review_hardening.sql`
8. `20260803172000_harden_pageant_organizer_reviews.sql`
9. `20260803173000_fix_public_pageant_column_grants.sql`
10. `20260803174000_admin_rpc_compatibility.sql`

After applying migrations, run the Supabase Security Advisor and test anonymous,
Enthusiast, Candidate, Supplier owner, Media owner, Organizer owner, and
Administrator access separately.

## Suggested deployment phases

1. Reviewed supplier discovery, audience registration, private workspaces, and
   administrator moderation
2. Approved pageant editions, candidate rosters, public experiences,
   announcements, and official results
3. Verification, transactional email, payments, receipts, guest access links,
   and organizer integrations
4. Authenticated reviews and analytics after sufficient real activity exists
5. Ranking and recommendation systems only after trustworthy data volume,
   methodology, appeals, and audit controls are established
