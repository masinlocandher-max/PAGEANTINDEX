-- Optional Pageant Index launch calendar seed
-- Safe to run after supabase/schema.sql. The public calendar also contains a reviewed static fallback.

insert into public.events
  (name, slug, organization_name, description, event_type, starts_at, ends_at, venue_name, official_url, status, published_at)
values
  ('Miss Supranational 2026','miss-supranational-2026','Supranational Organisation','The international final of Miss Supranational 2026 during the Festival of Beauty in Poland.','International Final','2026-07-31 19:00:00+02','2026-07-31 23:00:00+02','Festival of Beauty 2026, Poland','https://www.misssupranational.com/miss-supranational-2026-finale-dates-announced/','published',now()),
  ('Mister Supranational 2026','mister-supranational-2026','Supranational Organisation','The international final of Mister Supranational 2026 during the Festival of Beauty in Poland.','International Final','2026-08-01 19:00:00+02','2026-08-01 23:00:00+02','Festival of Beauty 2026, Poland','https://www.misssupranational.com/miss-supranational-2026-finale-dates-announced/','published',now()),
  ('Reina Filipinas 2026','reina-filipinas-2026','Reina Filipinas','The inaugural coronation of Reina Filipinas.','National Final','2026-08-07 18:00:00+08','2026-08-07 23:00:00+08','Philippines','https://www.gmanetwork.com/news/lifestyle/content/991068/reina-filipinas-opens-applications-for-inaugural-pageant-sets-coronation-for-august-7/story/','published',now()),
  ('Miss World 75th Anniversary Festival','miss-world-75th-anniversary-2026','Miss World Organization','Miss World''s 75th anniversary program in Vietnam, with the final show scheduled for September 5.','International Festival','2026-08-09 09:00:00+07','2026-09-05 23:00:00+07','Vietnam; final week in Nha Trang','https://www.missworld.com/news/nha-trang-vietnam-to-host-the-final-show-of-miss-worlds-75th-anniversary-celebration','published',now()),
  ('Miss America 2027','miss-america-2027','Miss America Organization','The 2026 competition program culminating in the crowning of Miss America 2027.','National Competition','2026-08-28 09:00:00-04','2026-09-06 23:00:00-04','West Palm Beach, Florida, USA','https://missamerica.org/2026/05/07/miss-america-announces-west-palm-beach-as-new-host-city/','published',now()),
  ('Ms. International World 2026','ms-international-world-2026','Ms. International World','The 2026 international program in Fort Lauderdale.','International Competition','2026-09-17 09:00:00-04','2026-09-21 23:00:00-04','Bahia Mar Fort Lauderdale Beach, Florida, USA','https://www.msinternationalworld.com/','published',now()),
  ('Universal Woman 2026','universal-woman-2026','Universal Woman','Cambodia has been announced as host for September 2026; exact dates remain pending.','International Competition','2026-09-01 00:00:00+07',null,'Cambodia','https://universalwomanofficial.com/news/','published',now()),
  ('Miss Malaysia Tourism Pageant 2026','miss-malaysia-tourism-2026','D''Touch International','The pageant period runs October 6 to 18, with the national final on October 17.','National Tourism Pageant','2026-10-06 09:00:00+08','2026-10-18 18:00:00+08','Kinta Riverfront Hotel, Ipoh, Malaysia','https://www.missmalaysia.com.my/','published',now()),
  ('Miss Universe 2026: 75th Anniversary','miss-universe-2026','Miss Universe Organization','Puerto Rico will host the 75th anniversary edition in November 2026; exact date pending.','International Competition','2026-11-01 00:00:00-04',null,'Coliseo de Puerto Rico José Miguel Agrelot, San Juan, Puerto Rico','https://www.missuniverse.com/press-releases/miss-universe-press-release-11/','published',now())
on conflict (slug) do update set
  name=excluded.name,
  organization_name=excluded.organization_name,
  description=excluded.description,
  event_type=excluded.event_type,
  starts_at=excluded.starts_at,
  ends_at=excluded.ends_at,
  venue_name=excluded.venue_name,
  official_url=excluded.official_url,
  status=excluded.status,
  published_at=coalesce(public.events.published_at,excluded.published_at),
  updated_at=now();
