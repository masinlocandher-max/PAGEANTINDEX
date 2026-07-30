# PageantIndex Philippines

Responsive front-end prototype for the Philippine pageant professionals and
suppliers directory.

Official website: [www.pageantindex.com](https://www.pageantindex.com)

## Product surface

- Searchable directory with keyword, category, location, verification, service
  area, travel, and featured-placement filters
- Category and location discovery pages
- Professional profiles with portfolio, services, reviews, verification,
  saving, sharing, reporting, and private inquiry flows
- Claim-profile, verification, sign-in, professional dashboard, and
  administrative preview flows
- Public ranking methodology and clear separation of organic, featured,
  sponsored, and editorial visibility
- Editorial articles and a demonstration pageant calendar
- Responsive desktop, tablet, and mobile layouts
- Canonical metadata, social sharing metadata, `robots.txt`, `sitemap.xml`,
  web-app manifest, and custom-domain configuration
- Supabase/PostgreSQL production schema with roles, row-level security,
  private-document handling, audit logs, and supporting indexes

## Run locally

```bash
python3 serve.py
```

Open `http://localhost:4173/`.

## Primary routes

- `/`
- `/directory/`
- `/professional/alon-mendoza-designs/`
- `/list-your-business/`
- `/claim-profile/`
- `/verification/`
- `/rankings/`
- `/ranking-methodology/`
- `/articles/`
- `/sign-in/`
- `/dashboard/`
- `/admin/`

## Preview status

This repository currently uses sample profiles, reviews, events, activity, and
browser storage so the product flows can be evaluated without production
accounts. Preview-only and account surfaces are marked `noindex`.

Commercial terms are confidential. The public interface describes profile and
visibility options without publishing a rate card.

A production launch still requires live Supabase credentials, authentication,
storage, transactional email, legal policies, moderation operations, and
replacement of all demonstration records with approved data.
