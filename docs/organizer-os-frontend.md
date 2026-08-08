# PageantIndex Front-End Experience Contract

Branch: `agent/pageantindex-frontend-os`

This branch completes the front-end structure for the PageantIndex ecosystem before production database, payments, voting, scoring, ticket issuance, and event-history records are connected.

## Product rule

The front end must never imply that preview scores, votes, ticket sales, analytics, financial values, applications, inquiries, or official results are live. Transactional and competition-sensitive surfaces stay explicitly preview-only until protected production services exist.

## Complete experience map

- `/platform/` — Organizer OS and command center.
- `/candidate/` — candidate application record, requirements, schedule, and profile history.
- `/judge/` — scoped judge invitation, candidate-by-candidate scoring, validation, final review, submission, and locked state.
- `/vote/` — guest-friendly public ballot, candidate selection, quantity, confirmation, receipt, and campaign-closed state.
- `/tickets/` — public ticket tiers, sold-out state, cart, guest checkout, confirmation, and non-scannable preview QR state.
- `/supplier-workspace/` — qualified organizer inquiries, event brief, quote response, status filters, and closed-opportunity state.
- `/tabulation/` — judge submission monitoring, round lock, result snapshot, certification, controlled publication, and audit trail.
- `/event/` — canonical public edition page for candidates, schedule, voting, tickets, and certified results.
- `/experience/` — role map connecting all user journeys.

## Organizer modules

1. Overview and coronation readiness.
2. Applications and screening.
3. Candidate roster, requirements, readiness, media, travel, wardrobe, and pageant-week operations.
4. Master schedule.
5. Judging and tabulation configuration.
6. Voting campaign configuration.
7. Ticket configuration.
8. Official event record.
9. Marketplace sourcing.
10. Intelligence and honest zero-data analytics.

## Candidate journey

`Discover pageant → Apply → Save application → Submit evidence → Screening → Acceptance → Candidate portal → Requirements → Schedule → Competition → Result/history → Public profile review`

Minimum future data contract:
- application ID and edition ID
- applicant identity/profile reference
- contact and eligibility data
- application answers
- private document manifest
- completion and screening state
- organizer review notes
- accepted/declined timestamps
- candidate roster link after acceptance
- per-candidate requirement state
- attendance/call times
- production, wardrobe, talent, advocacy, sponsor, travel, and accommodation information
- candidate-controlled public biography/history

## Judge journey

`Invitation → Secure access → Criteria briefing → Candidate scoring → Validation → Review all scorecards → Submit → Server acceptance → Locked confirmation`

Competition-critical entities should be separate:
- competition rounds
- criteria and weights
- judge assignments and scoped access
- candidate eligibility per round
- signed score submissions
- revisions with reason and authorization
- score locks
- calculation snapshots
- tie-break and advancement rules
- certification records
- audit events

The browser must never be the authoritative official-result calculator. Judges must never be able to inspect other judges' unpublished scores.

## Voting journey

`Event → Candidate → Ballot → Quantity/package → Rules → Payment when applicable → Server-confirmed vote → Receipt → Campaign close`

Required future entities:
- campaign and campaign status
- eligible candidates
- voting rules/packages
- voter/session reference as permitted by policy
- payment reference where applicable
- immutable vote ledger
- fraud/anomaly flags
- reversals/refunds
- closure and certified result snapshot

Campaign status and closing time must be server-controlled. Browser success screens cannot determine paid or counted state.

## Ticket buyer journey

`Event → Tier → Quantity/seat → Cart → Guest checkout → Payment → Inventory confirmation → Ticket issuance → Mobile credential → Venue check-in → Refund/cancellation when applicable`

Required future entities:
- tier and inventory/capacity
- order and buyer record
- payment reference
- issued ticket
- unique QR credential
- scan/check-in event
- cancellation/refund
- settlement/payout state

Ticket issuance follows server-confirmed payment and inventory only.

## Supplier journey

`Organizer sourcing → Qualified inquiry → Private event brief → Supplier response → Quote → Shortlist → Hire/decline → Delivery → Review/verified transaction`

Required future entities:
- sourcing request
- invited supplier/profile IDs
- event/edition relationship
- private brief and permissions
- messages/responses
- quote and validity
- organizer decision status
- contract/payment relationship when later supported
- delivery/review state

## Tabulator / administrator journey

`Configure round → Issue judge access → Monitor submissions → Review anomalies → Receive all signed submissions → Lock round → Calculate protected snapshot → Certify → Publish authorized official result → Preserve audit trail`

Emergency unlocks, score corrections, judge replacements, and publication reversals must require explicit authorization and audit reasons.

## Public event journey

`Discover event → Official edition information → Candidates → Schedule → Vote → Tickets/watch → Certified results → Permanent historical record`

The public PageantIndex Event ID must be created by the production data layer and connect reviewed entities rather than copying free-form text:

`Organization → Edition → Candidates → Judges → Competition → Results → Sponsors → Suppliers → Media → Voting → Tickets`

Before coronation, the results surface must honestly say results are not yet published. Preview or organizer-only rankings must never leak to the public edition page.

## Cross-experience UX states

The front-end structure now explicitly represents:
- loading/readiness architecture
- honest empty states
- validation failures
- local save success
- confirmation dialogs for irreversible actions
- disabled actions when prerequisites are incomplete
- offline banner
- voting-closed state
- sold-out ticket state
- locked judge submission state
- closed supplier opportunity
- unpublished-result state
- non-scannable preview ticket QR
- success receipts that clearly distinguish preview completion from production acceptance

## Security and integrity gates for integration

- Organizer/staff ownership and permissions are server-enforced.
- Candidate private files remain private and owner-scoped.
- Judges have scoped, expiring access and cannot inspect other ballots.
- Official calculation, locking, tie-break, advancement, and certification are server-side and auditable.
- Voting uses server-side validation and an immutable ledger.
- Payment webhooks determine paid state.
- Ticket issuance follows confirmed payment and unique credential creation.
- Official results require certification/authorization before publication.
- Analytics reconcile to source records and show zero rather than fabricated activity.

## Existing live data that can be reused

The repository already contains reviewed organization editions, candidate roster drafts, result drafts, public experience requests, candidate profiles/history, suppliers, media, announcements, authentication, row-level security, and administrator review concepts. Reuse those where sufficient and add new migrations only for missing operational entities.

## Recommended integration order

1. organization + edition context
2. candidate applications
3. candidate requirements + schedules
4. organizer/staff permissions
5. judge assignments + scoring configuration
6. signed score submissions + protected tabulation
7. result locking + certification
8. voting campaigns + immutable ledger + payments
9. ticket inventory + orders + payment + credential issuance + check-in
10. marketplace sourcing pipeline
11. public event permanent record
12. intelligence and historical reporting
