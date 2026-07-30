# Production Architecture

## Recommended application stack

- Next.js with TypeScript and server-rendered public pages
- Tailwind CSS or design-token CSS
- Supabase Auth, PostgreSQL, Storage, and Row-Level Security
- Transactional email provider for inquiries, claims, verification, and renewals
- Philippine-compatible payment gateway for subscriptions and featured placements
- Background jobs for renewal reminders, verification expiry, email delivery, analytics aggregation, and sitemap generation
- CDN image transformation and caching

## Application boundaries

### Public discovery
Server-rendered category, location, category-plus-location, profile, article, event, verification, and methodology pages. Public pages should remain crawlable without client-side JavaScript.

### Account application
Authenticated professional-owner tools for profile editing, media management, services, packages, inquiries, reviews, analytics, subscription, verification, invoices, and team access.

### Administration
Strictly protected routes for claims, verification documents, moderation, complaints, payments, featured placements, content, events, badges, exports, and audit logs.

## Trust separations

- Organic ranking score is computed separately from paid placement inventory.
- Featured and sponsored results always carry a public label.
- Verification evidence is private and served through short-lived signed URLs.
- Review moderation actions are documented and appealable.
- Negative reviews are not removed merely because the listed business objects.
- Founding Member status is a historical distinction, not a permanent ranking advantage.

## Suggested deployment phases

1. Public directory, profiles, inquiry flow, claims, and admin moderation
2. Verification, subscriptions, invoices, owner dashboard, and email automation
3. Reviews, event submissions, analytics, and editorial publishing
4. Ranking engine after sufficient trustworthy data exists
5. Advanced recommendation, CRM, and sponsor campaign tools
