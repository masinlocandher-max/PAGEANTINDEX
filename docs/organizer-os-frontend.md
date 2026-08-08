# PageantIndex Organizer OS — Front-End Structure

Branch: `agent/pageantindex-frontend-os`

This branch adds the front-end operating system for pageant organizations without changing the production data model yet.

## Product rule

The Organizer OS must never imply that preview scores, votes, ticket sales, analytics, or financial values are live. Until production tables and server-side controls are connected, every transactional or competition-sensitive surface stays explicitly preview-only.

## Modules

1. **Overview** — pageant command center and readiness map.
2. **Applications** — submission, screening, changes requested, acceptance, and roster conversion.
3. **Candidates** — roster, requirements, readiness, media, travel, wardrobe, and pageant-week operations.
4. **Schedule** — candidate, production, judging, sponsor, and media timelines.
5. **Judging & Tabulation** — criteria, weights, judge access, competition rounds, score display, locks, certification state, and result publication controls.
6. **Voting** — campaign setup, ballot preview, free/paid/hybrid models, vote-ledger readiness, fraud-control readiness, and certification state.
7. **Tickets** — ticket tiers, checkout, QR admission, check-in, settlement, refunds, and inventory readiness.
8. **Official Event Record** — permanent PageantIndex edition identity linking the organization, candidates, judges, results, suppliers, sponsors, media, voting, and tickets.
9. **Marketplace** — organizer sourcing flow from discovery through shortlist, invite, quote, hire, and review.
10. **Intelligence** — zero-data analytics surfaces for real future edition, marketplace, transaction, and historical data.

## Front-end route

- `/platform/`

The existing organizer app links to this command center from `app/organizer.js`.

## Intended data contracts

### Applications

Future primary records should expose at minimum:

- application id
- edition id
- applicant user/profile id when available
- display name
- representation
- contact and eligibility fields
- application answers
- requirement/document manifest
- completion state
- screening state
- organizer notes
- submitted / reviewed / accepted timestamps
- audit history

### Candidates

Future roster records should expose:

- edition id
- candidate id
- candidate number
- representation
- participation status
- requirement checklist
- attendance / call-time state
- measurements and production details where appropriate
- advocacy / talent / media assets
- sponsor obligations
- travel / accommodation state
- readiness percentage derived from source records

### Judging & Tabulation

This must be treated as competition-critical infrastructure. The backend should separate configuration from submitted scores.

Recommended entities:

- competition rounds
- criteria
- criterion weights
- judge assignments
- judge access/session state
- candidate eligibility per round
- signed score submissions
- score revisions with reason
- score locks
- calculation snapshots
- tie-break rules
- advancement rules
- certification records
- audit events

The browser must never be the authoritative calculator for official results.

### Voting

Recommended entities:

- voting campaign
- eligible candidates
- vote packages / pricing rules
- ballot configuration
- voter / session / payment reference as permitted by policy
- immutable vote ledger
- fraud / anomaly flags
- refunds / reversals when applicable
- campaign closure
- certified result snapshot

### Tickets

Recommended entities:

- event ticket tier
- inventory / capacity
- order
- buyer record
- payment reference
- issued ticket
- QR credential
- check-in event
- refund / cancellation
- settlement and payout state

### Official Event Record

The permanent record should connect reviewed entities instead of copying free-form text whenever possible:

`Organization → Edition → Candidates → Judges → Competition → Results → Sponsors → Suppliers → Media → Voting → Tickets`

A public PageantIndex Event ID should be created only by the production data layer, not by the front end.

## Security / integrity gates for the integration phase

- Organizer ownership and staff permissions must be server-enforced.
- Judges must not be able to inspect other judges' unpublished scores.
- Official score calculations and locks must be server-side and auditable.
- Voting must use server-side validation and an immutable ledger.
- Payment webhooks, not browser success screens, must determine paid state.
- Ticket issuance must follow confirmed payment and unique credential creation.
- Official results require certification / authorization before public publication.
- Analytics must reconcile to source records and show honest zero-data states.

## Existing live data that can be reused

The repository already contains reviewed organization editions, candidate roster drafts, result drafts, public experience requests, candidate profiles/history, suppliers, media, announcements, authentication, row-level security, and administrator review concepts. The Organizer OS should bind to these where they are sufficient and add new migrations only for missing operational entities.

## Next implementation phase

Connect the front-end modules to production-safe data in this order:

1. organization + edition context
2. applications
3. candidate requirements and schedules
4. judging configuration and judge assignments
5. signed score submission + server tabulation
6. voting campaigns + ledger + payments
7. official results certification
8. ticket orders + issuance + check-in
9. marketplace sourcing pipeline
10. intelligence and historical reporting
