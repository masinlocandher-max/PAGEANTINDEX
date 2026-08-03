# Pageant Index

**The Global Network for Pageantry.**

Pageant Index connects enthusiasts, candidates, suppliers, media, pageant
organizations, hotels, flights, travel providers, and opportunities worldwide.

Official website: [www.pageantindex.com](https://www.pageantindex.com)

Mobile-first application: [app.pageantindex.com](https://app.pageantindex.com)

## Audience model

- **Enthusiast**: optional account for app personalization, saved suppliers,
  followed pageants, and linked history
- **Candidate**: supplier discovery plus a private record of current and previous
  pageants, titles, placements, and official links
- **Supplier**: reviewed professional profile, services, portfolio, inquiries,
  travel coverage, and clearly labeled advertising tools
- **Media**: reviewed column profile, private article drafts, publishing review,
  canonical links, and shareable published stories
- **Pageant Organization**: official organization profile, pageant editions,
  candidate rosters, announcements, results, voting, broadcasts, tickets,
  merchandise, and approved partners

The public website remains open. Browsing, merchandise guest checkout,
pay-per-view access, livestream access, tickets, and public voting must not
require a Pageant Index account unless a specific organizer or payment provider
legitimately requires identity verification.

## Shared experience

Every audience can see the same reviewed foundation:

- Supplier directory
- Official announcements
- Clearly labeled featured advertising
- Pageant calendar
- Media articles
- Countries and flags
- Flights, hotels, travel agencies, transportation, and tour providers

## Product surface

- Five clear account types with role-specific private workspaces
- One clean public menu: Home, Suppliers, Candidates, Pageants, Media,
  Announcements, and Experiences
- One clean mobile-app menu: Discover, Pageants, Media, Updates, and Account
- Supplier profiles with one primary category and multiple additional categories
- Separate Photographer and Videographer categories, which may both be selected
- Complete country selection with country codes and flag display
- Candidate current and previous pageant history
- Media columns and shareable, reviewed articles
- Official organization and pageant-edition workflows
- Candidate roster, voting, broadcast, ticket, merchandise, announcement, and
  official result requests under administrator review
- Approved editions, public experiences, and results on both website and app
- Public announcements and clearly labeled featured campaigns
- Guest-friendly voting, pay-per-view, livestream, merchandise, and ticket hubs
- Public ranking methodology and separation of organic, featured, sponsored,
  and editorial visibility
- Responsive desktop, tablet, and mobile layouts
- A separate mobile-first application using the same data model and policies
- Canonical metadata, social metadata, `robots.txt`, `sitemap.xml`, manifest,
  security headers, and custom-domain configuration
- Versioned Supabase migrations with row-level security and owner/admin boundaries

Pageant Index connects users to independent travel and accommodation providers.
Availability, prices, bookings, refunds, and service terms are handled directly
by each provider. The platform must not claim booking inventory without an
approved integration or official provider relationship.

## Run locally

```bash
python3 serve.py
```

Open `http://localhost:4173/`.

The mobile-first app is available at `http://localhost:4173/app/`.

## Primary routes

- `/`
- `/directory/`
- `/candidates/`
- `/pageant-calendar/`
- `/media/`
- `/announcements/`
- `/experiences/`
- `/categories/`
- `/locations/`
- `/rankings/`
- `/articles/`
- `/list-your-business/`
- `/claim-profile/`
- `/verification/`
- `/ranking-methodology/`
- `/advertise/`
- `/sign-in/`
- `/sign-up/`
- `/dashboard/`
- `/admin/`
- `/app/`

Commercial terms are confidential. The public interface describes profile and
visibility options without publishing a rate card.

Candidate, supplier, media, and organization information is published only
after the applicable review process. The platform intentionally contains no
invented businesses, candidates, organizations, media outlets, ratings,
reviews, inquiries, partnerships, advertisements, events, results, or activity
records.

## Live data model and trust controls

The canonical live supplier directory is `public.suppliers`. Private audience
profiles, drafts, saved records, official pageant records, public experiences,
and results use separate RLS-protected tables.

All public tables have row-level security enabled. Owner column grants exclude
review state, publication timestamps, linked public announcements, and other
administrator controls. An Organizer owner may create and edit records only for
her own organization and editions. Owners cannot self-publish, self-verify, or
purchase trust.

Administrator review endpoints are public-schema `SECURITY INVOKER` wrappers.
The privileged implementation lives in the non-exposed `private` schema,
requires the protected `app_metadata.role = admin` claim, accepts submitted
records only, and cannot be executed anonymously.

The private `pageant-profile-drafts` storage bucket accepts JPEG, PNG, and WebP
files up to 10 MB. Owners can access only files inside their own user folder;
administrators may review them.

## Production migration history

`supabase/migrations/` mirrors the migration versions recorded by the live
Supabase project. Apply them in timestamp order after the three existing
supplier-admin migrations:

1. `20260803172117_pageantindex_foundation.sql`
2. `20260803172305_pageantindex_profiles.sql`
3. `20260803172436_pageantindex_media_content.sql`
4. `20260803172616_pageantindex_organization_core.sql`
5. `20260803172919_pageantindex_organization_operations.sql`
6. `20260803173041_pageantindex_admin_functions.sql`
7. `20260803173134_revoke_anonymous_admin_rpc_access.sql`
8. `20260803173310_isolate_admin_review_implementations.sql`
9. `20260803173435_optimize_pageantindex_rls_and_indexes.sql`

The former draft migration chain was removed because it referenced a nonexistent
`public.events` table. Saved pageants now correctly reference reviewed
`public.pageant_edition_drafts` records.

`supabase/schema.sql` remains a future-platform reference. It must not be applied
to the live project as a shortcut.

## Verification completed

- Supabase Security Advisor reports no findings.
- Every public table has RLS enabled.
- Anonymous execution of administrator RPCs is revoked.
- Non-administrators are rejected by protected review functions.
- Organizer owners cannot write review or publication columns.
- Organizer owners can create editions only for their own organization.
- Anonymous reads return approved, submitted, published records only.
- Foreign-key indexes and duplicate SELECT policies were optimized.
- Repository regression tests cover the five roles, migration history,
  protected grants, public feeds, admin RPC signatures, and responsive clients.

## Remaining operational checks

Before a public launch:

1. Configure Supabase Auth site URLs, recovery redirects, SMTP, and allowed
   origins.
2. Test registration, confirmation, sign-in, recovery, and sign-out for all five
   account types.
3. Test supplier portfolios, candidate history, media submission, organization
   editions, rosters, public experiences, announcements, and results with real
   accounts.
4. Test administrator review and publication using an account whose protected
   `app_metadata.role` is `admin`.
5. Test guest voting, livestream, pay-per-view, ticket, and merchandise entry
   paths without forcing unnecessary registration.
6. Run `npm test` and complete mobile, tablet, and desktop browser QA before
   merging the launch branch.
