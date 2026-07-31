# PageantIndex Philippines

Official website for the Philippine pageant professionals and suppliers
directory.

Official website: [www.pageantindex.com](https://www.pageantindex.com)

## Product surface

- Owner-submitted directory with category, location, and verification standards
- Category and location discovery pages
- Listing applications, profile claims, and verification requests
- Public ranking methodology and clear separation of organic, featured,
  sponsored, and editorial visibility
- Complete editorial guides and a reviewed event-submission calendar
- Responsive desktop, tablet, and mobile layouts
- Canonical metadata, social sharing metadata, `robots.txt`, `sitemap.xml`,
  web-app manifest, and custom-domain configuration
- Versioned Supabase migrations for the reviewed supplier directory, private
  intake queue, authenticated profile drafts, and private portfolio assets

## Run locally

```bash
python3 serve.py
```

Open `http://localhost:4173/`.

## Primary routes

- `/`
- `/directory/`
- `/list-your-business/`
- `/claim-profile/`
- `/verification/`
- `/rankings/`
- `/ranking-methodology/`
- `/articles/`
- `/sign-in/`
- `/dashboard/`
- `/admin/`

Commercial terms are confidential. The public interface describes profile and
visibility options without publishing a rate card.

Supplier profiles and calendar entries are published only after owner
submission and review. The public directory intentionally contains no invented
businesses, ratings, reviews, or event records.

## Data model and deployment order

The canonical live directory model is `public.suppliers`, created through the
files in `supabase/migrations/`. Public clients can read only published rows;
only accounts with an administrator role in protected `app_metadata` can create,
edit, verify, feature, or remove suppliers.

`supabase/schema.sql` is a future-platform reference, not a production migration.
It must not be run against the live project as a shortcut.

For a release containing database and frontend changes:

1. Review and apply pending files in `supabase/migrations/`.
2. Run the Supabase security advisor and verify RLS with anonymous,
   professional-owner, and administrator accounts.
3. Configure the production site URL, allow the `/sign-in/` recovery redirect,
   and verify that Supabase Auth SMTP delivery is working.
4. Deploy the frontend only after the migration succeeds.
5. Run `npm test` and smoke-test public submission, authentication, dashboard,
   and administration routes.
