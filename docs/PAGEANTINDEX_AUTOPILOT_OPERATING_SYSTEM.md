# PageantIndex Autopilot Operating System

## Objective

PageantIndex must be designed to operate as an owner-light recurring-revenue platform. The founder should not be required for routine operations.

Founder involvement is reserved for:

- investor meetings
- major pageant partnerships
- enterprise negotiations
- national/international licensing or territory deals
- exceptional reputation, legal, trust, or strategic decisions

Routine onboarding, billing, renewals, event setup, voting/tabulation setup, support, reporting, sales follow-up, partner onboarding, and standard account administration should be automated or delegated.

## Operating principle

The core test is simple:

> If the founder does not touch operations for 30 days, can PageantIndex still onboard customers, collect money, service pageants, renew subscriptions, respond to routine support, and surface only genuine exceptions?

If not, the workflow is not finished.

## Revenue engine

PageantIndex should support multiple independent revenue streams so no single product carries the company.

1. Professional subscriptions
2. Organizer subscriptions
3. Voting transaction revenue
4. Tabulation/event licenses
5. Voting + tabulation event packages
6. Featured visibility and advertising
7. Ticketing/platform fees where legally and operationally appropriate
8. Premium organizer tools
9. Enterprise contracts
10. Territory or master-license agreements

Commercial rates remain private and configurable rather than hard-coded into public marketing pages.

## Autopilot architecture

### 1. Acquisition

System responsibilities:

- capture supplier, candidate, media, organizer, and partner leads
- identify account type
- store source/campaign attribution
- send the correct onboarding path
- schedule automated follow-ups for incomplete onboarding
- stop sales sequences after conversion, opt-out, rejection, or escalation

Founder involvement: only high-value partnership/enterprise leads that meet escalation thresholds.

### 2. Self-service onboarding

Each account type receives a role-specific onboarding checklist.

Supplier:
- create/claim profile
- complete professional information
- add portfolio/services
- submit verification if desired
- choose plan
- pay
- publish after applicable review

Organizer:
- create organization
- create edition
- add candidate roster
- configure event products
- select voting/tabulation/ticketing tools
- accept commercial terms
- pay or activate contracted plan
- complete launch checklist

Candidate and media onboarding should follow the same principle: self-service first, review only where trust/publication requires it.

### 3. Billing and renewals

System responsibilities:

- create checkout/payment requests
- record successful and failed payments
- activate entitlements after confirmed payment
- send invoices/receipts through the configured provider
- send renewal reminders
- attempt allowed recurring renewal flows
- mark past-due accounts
- apply grace periods
- downgrade or suspend paid-only capabilities when required
- restore access after payment recovery
- generate revenue summaries

Founder involvement: none for standard transactions.

### 4. Voting operations

Organizer self-service flow:

1. choose edition
2. choose voting product/package
3. confirm candidates
4. configure opening/closing times
5. configure voting rules and public disclosures
6. configure payment method where paid voting is used
7. preview public voting page
8. complete automated validation
9. submit/activate according to trust rules
10. monitor results dashboard
11. close voting automatically at the configured deadline
12. produce immutable event export/audit summary

High-risk changes after voting opens must be logged and may require staff/admin approval.

### 5. Tabulation operations

Organizer self-service flow:

1. create competition segments
2. define criteria and weights
3. add judges
4. generate secure judge access
5. run rehearsal/test scoring
6. lock configuration before live scoring
7. receive judge scores
8. compute totals automatically
9. flag ties, missing scores, abnormal inputs, or rule conflicts
10. require authorized resolution only for exceptions
11. lock final results
12. generate official result and audit exports

The founder must never be the routine tabulator.

### 6. Relationship and credit graph

Professional credits must be structured around:

- Pageant Name
- Year/Edition
- Candidate Name when candidate-specific
- Supplier/User
- Role

Organizer invitations should carry the pageant, edition, inviter, proposed role/credit, and candidate relationship when applicable. Existing suppliers attach the credit to their profile; new suppliers can create/claim a profile before acceptance.

Standard relationship confirmation should be self-service. Disputes or conflicting claims escalate to review.

### 7. Verification and trust

Automation may:

- check completeness
- validate file type/size
- detect duplicates
- verify email/domain ownership where technically possible
- request missing evidence
- route requests by risk level
- send reminders

Automation must not silently convert unverified claims into verified facts.

Human/admin review remains required where documentary judgment, identity disputes, official status, fraud risk, conflicting claims, or reputational harm is possible.

Verification, rankings, editorial treatment, and trust outcomes cannot be purchased.

### 8. Support

Support hierarchy:

Tier 0: searchable help center, contextual help, setup checklists

Tier 1: automated answers for routine account, billing, setup, and product questions

Tier 2: operations/support staff for non-standard cases

Tier 3: admin/trust/legal/technical escalation

Founder: only executive/reputation/major-partner escalations

Every support request should have category, priority, owner, status, timestamps, resolution, and escalation reason.

### 9. Sales follow-up

Standard sales should not depend on the founder.

System should:

- capture lead
- classify market level: local, national, international
- classify requested product
- send appropriate private proposal/rate path
- track opened/replied/qualified/meeting/booked/won/lost
- send timed follow-ups
- stop after defined no-response sequence
- create founder meeting only when qualified/high-value

### 10. Territory and master-license operations

Territory agreements should grant operating/commercial rights without transferring ownership of:

- PageantIndex technology
- core brand
- ranking methodology
- verification authority
- data standards
- platform governance
- source code

License operations should include:

- territory
- term
- products authorized
- setup/license fee
- recurring platform/royalty obligations
- reporting requirements
- brand standards
- training/certification
- minimum performance requirements
- audit rights
- renewal/termination conditions

Do not publicly call arrangements a legal franchise until counsel confirms that the structure and local law support that classification. “Territory License” or “Master License” may be more appropriate for technology rights.

## Founder escalation rules

Only escalate to founder when at least one is true:

- enterprise or strategic partnership
- investor or acquisition discussion
- national/international master-license negotiation
- high-value contract above configured threshold
- legal or regulatory risk
- major reputation/media risk
- security incident with material impact
- unresolved trust dispute involving a major organization
- policy exception that changes platform precedent

Everything else goes to staff, automation, or standard policy.

## Founder dashboard

The founder dashboard should not be an operational inbox. It should show only:

- revenue today / month / recurring revenue
- active subscriptions
- event revenue
- voting transaction revenue
- renewals at risk
- major qualified meetings
- enterprise pipeline
- territory-license pipeline
- critical incidents
- trust/reputation escalations
- system health summary

No routine support tickets should appear here unless escalated.

## Operating KPIs

Track at minimum:

- MRR/ARR where applicable
- gross transaction value
- net platform revenue
- active paying organizations
- active paying professionals
- conversion rate
- renewal rate
- churn
- payment recovery rate
- voting events activated
- tabulation events completed
- average event revenue
- support tickets per 100 active accounts
- automated resolution rate
- percentage of workflows completed without staff intervention
- percentage of workflows requiring founder intervention

Target founder-intervention rate should trend toward near zero for routine operations.

## Build order

### Phase 1: Revenue and customer autonomy
- production authentication
- role onboarding
- payment provider integration
- subscription entitlement engine
- organizer checkout
- private pricing/configuration model
- automated renewals and failed-payment handling

### Phase 2: Event autonomy
- self-service voting setup
- self-service tabulation setup
- judge access
- rules/weights configuration
- audit logs
- event close/finalization
- result exports

### Phase 3: Operations autonomy
- support queue and escalation system
- onboarding reminders
- CRM stages and automated follow-ups
- notification engine
- operational dashboards
- exception routing

### Phase 4: Scale
- organizer analytics
- revenue-share settlement reporting
- territory/master-license management
- partner accounts
- standardized enterprise onboarding
- fraud/risk monitoring
- localization and multi-currency readiness

## Definition of done

PageantIndex is owner-light when a normal local or national pageant can discover the platform, create an organizer account, set up an edition, pay, configure voting/tabulation, run the event, receive results/reports, renew or purchase again, and receive routine support without requiring the founder.

The founder should enter the workflow only when a meeting, major relationship, exceptional risk, or major strategic decision genuinely requires founder authority.
