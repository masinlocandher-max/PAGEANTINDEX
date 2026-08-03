-- Public supplier fields needed by the global website and mobile-first app.
-- Existing rows remain valid and may be completed through the admin review process.

alter table public.suppliers
  add column if not exists primary_category text,
  add column if not exists additional_categories text[] not null default '{}',
  add column if not exists category_other text,
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists region text;

update public.suppliers
set primary_category = coalesce(primary_category, category)
where primary_category is null;

alter table public.suppliers
  drop constraint if exists suppliers_country_code_check,
  add constraint suppliers_country_code_check
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  drop constraint if exists suppliers_additional_categories_check,
  add constraint suppliers_additional_categories_check
    check (cardinality(additional_categories) <= 12),
  drop constraint if exists suppliers_category_other_check,
  add constraint suppliers_category_other_check
    check (
      not (
        primary_category = 'Other'
        or 'Other' = any(additional_categories)
      )
      or nullif(btrim(category_other), '') is not null
    );

create index if not exists suppliers_global_discovery_idx
  on public.suppliers (status, country_code, primary_category, featured desc, sort_order asc);

-- Only administrators may write published supplier records. Public read behavior
-- continues to be controlled by the existing published-supplier RLS policy.
revoke update on public.suppliers from authenticated;
grant update (
  slug, public_name, category, primary_category, additional_categories,
  category_other, location, city, region, country_code, country_name,
  headline, biography, public_email, mobile, website_url, social_url,
  logo_url, cover_url, services, years_experience, accepts_nationwide,
  available_for_travel, status, verification_status, featured,
  featured_label, sort_order, published_at
) on public.suppliers to authenticated;
