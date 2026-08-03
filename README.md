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
pay-per-view access, and public voting must not require a Pageant Index account
unless a specific organizer or payment provider legally requires identity
verification.

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

## Data model and deployment order

The canonical live supplier directory model is `public.suppliers`, created and
extended through versioned files in `supabase/migrations/`. Public clients can
read only published rows. Only accounts with an administrator role in protected
`app_metadata` may verify, feature, or publish supplier, media, organization,
pageant-edition, public-experience, announcement, and official-result records.

Private identity is stored separately from public profile information.
Enthusiast preferences, candidate drafts and history, supplier drafts, media
profiles and articles, organization profiles, pageant editions, rosters,
experience requests, announcement requests, and official result requests have
their own row-level security policies. Owners cannot self-publish, self-verify,
or purchase trust.

`supabase/schema.sql` is a future-platform reference, not a production migration.
It must not be run against the live project as a shortcut.

For a release containing database and frontend changes, apply these migrations
in order:

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

Then:

1. Run Supabase Security Advisor and verify RLS with anonymous, Enthusiast,
   Candidate, Supplier owner, Media owner, Organizer owner, and Administrator
   accounts.
2. Configure production Site URL, recovery redirects, SMTP, and allowed origins.
3. Confirm `www.pageantindex.com` and `app.pageantindex.com` point to the reviewed
   deployment.
4. Deploy the frontend only after every required migration succeeds.
5. Run `npm test` and smoke-test all five registration types, sign-in, recovery,
   supplier multi-category selection, candidate history, media drafts and review,
   organization editions and rosters, voting and broadcast requests, official
   results, announcements, featured ads, saved suppliers, guest experiences,
   country flags, portfolio uploads, admin review, and responsive layouts.
