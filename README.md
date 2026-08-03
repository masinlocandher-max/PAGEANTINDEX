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

- Four clear account types with role-specific private workspaces
- One clean public menu: Home, Suppliers, Candidates, Pageants, Media,
  Announcements, and Experiences
- One clean mobile-app menu: Discover, Pageants, Media, Updates, and Account
- Supplier profiles with one primary category and multiple additional categories
- Separate Photographer and Videographer categories, which may both be selected
- Complete country selection with country codes and flag display
- Candidate current and previous pageant history
- Media columns and shareable, reviewed articles
- Public announcements and clearly labeled featured campaigns
- Guest-friendly voting, pay-per-view, livestream, merchandise, and ticket hubs
- Owner-submitted directory with category, location, and verification standards
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

Candidate, supplier, and media information is published only after the
applicable review process. The platform intentionally contains no invented
businesses, candidates, media outlets, ratings, reviews, inquiries,
partnerships, advertisements, events, or activity records.

## Data model and deployment order

The canonical live supplier directory model is `public.suppliers`, created and
extended through versioned files in `supabase/migrations/`. Public clients can
read only published rows. Only accounts with an administrator role in protected
`app_metadata` may verify, feature, or publish supplier and media records.

Private identity is stored separately from public profile information.
Enthusiast preferences, candidate drafts and history, supplier drafts, media
profiles, and media article drafts have their own row-level security policies.
Owners cannot self-publish, self-verify, or purchase trust.

`supabase/schema.sql` is a future-platform reference, not a production migration.
It must not be run against the live project as a shortcut.

For a release containing database and frontend changes:

1. Review and apply pending files in `supabase/migrations/` in timestamp order.
2. Run Supabase Security Advisor and verify RLS with anonymous, enthusiast,
   candidate, supplier-owner, media-owner, and administrator accounts.
3. Configure production Site URL, recovery redirects, SMTP, and allowed origins.
4. Confirm `www.pageantindex.com` and `app.pageantindex.com` point to the reviewed
   deployment.
5. Deploy the frontend only after every required migration succeeds.
6. Run `npm test` and smoke-test all four registration types, sign-in, recovery,
   supplier multi-category selection, candidate history, media drafts and review,
   announcements, featured ads, saved suppliers, guest experiences, country
   flags, portfolio uploads, admin review, and responsive layouts.
