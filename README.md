# Pageant Index

**The Global Network for Pageantry.**

Pageant Index connects candidates, pageant suppliers, organizations, hotels,
flights, travel providers, and opportunities worldwide.

Official website: [www.pageantindex.com](https://www.pageantindex.com)

Mobile-first application: [app.pageantindex.com](https://app.pageantindex.com)

## Product surface

- Two clear account types: Candidate and Supplier
- Candidate-specific profile and workspace
- Supplier profiles with one primary category and multiple additional categories
- Separate Photographer and Videographer categories, which may both be selected
- Complete country selection with country codes and flag display
- Category and country discovery pages
- Flights, airlines, travel agencies, hotels, accommodation, transportation,
  and tour providers as reviewed supplier categories
- Owner-submitted directory with category, location, and verification standards
- Listing applications, profile claims, and verification requests
- Public ranking methodology and clear separation of organic, featured,
  sponsored, and editorial visibility
- Complete editorial guides and a reviewed event-submission calendar
- Responsive desktop, tablet, and mobile layouts
- A separate mobile-first application that uses the same categories, countries,
  account identity, saved suppliers, and published directory data
- Canonical metadata, social sharing metadata, `robots.txt`, `sitemap.xml`,
  web-app manifest, security headers, and custom-domain configuration
- Versioned Supabase migrations for the reviewed supplier directory, private
  intake queue, candidate drafts, supplier drafts, saved profiles, and private
  portfolio assets

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
- `/categories/`
- `/locations/`
- `/pageant-calendar/`
- `/list-your-business/`
- `/claim-profile/`
- `/verification/`
- `/rankings/`
- `/ranking-methodology/`
- `/articles/`
- `/sign-in/`
- `/sign-up/`
- `/dashboard/`
- `/admin/`
- `/app/`

Commercial terms are confidential. The public interface describes profile and
visibility options without publishing a rate card.

Candidate and supplier information is published only after the applicable
review process. The public directory intentionally contains no invented
businesses, ratings, reviews, inquiries, partnerships, or activity records.

## Data model and deployment order

The canonical live directory model is `public.suppliers`, created and extended
through versioned files in `supabase/migrations/`. Public clients can read only
published rows. Only accounts with an administrator role in protected
`app_metadata` may create, edit, verify, feature, or remove published suppliers.

Private account identity is stored separately from public candidate or supplier
profile information. Candidate and supplier drafts have their own row-level
security policies. Owners cannot self-publish, self-verify, or purchase trust.

`supabase/schema.sql` is a future-platform reference, not a production migration.
It must not be run against the live project as a shortcut.

For a release containing database and frontend changes:

1. Review and apply pending files in `supabase/migrations/` in timestamp order.
2. Run the Supabase security advisor and verify RLS with anonymous, candidate,
   supplier-owner, and administrator accounts.
3. Configure the production site URL, allow the `/sign-in/` recovery redirect,
   and verify that Supabase Auth SMTP delivery is working.
4. Confirm `www.pageantindex.com` and `app.pageantindex.com` point to the reviewed
   deployment.
5. Deploy the frontend only after every required migration succeeds.
6. Run `npm test` and smoke-test candidate registration, supplier registration,
   multi-category selection, country flags, password recovery, profile saving,
   portfolio uploads, admin review, published profiles, inquiries, saved
   suppliers, and mobile-app discovery.
