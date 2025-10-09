# Marketplace 2025 Roadmap and Prompt Engineering Playbook

Purpose
- A precise, prompt-engineered roadmap and reusable prompts to guide architecture, delivery, and decision-making for a standalone marketplace that surpasses Facebook Marketplace in trust, UX, and performance.
- Serves as shared context for planning, building, reviewing, and operating the system.

Guiding principles
- Trust first: verify users, escrow payments, prevent scams, protect privacy.
- Performance by design: TTFB < 200ms, LCP < 2.5s, p95 API < 250ms, chat RTT < 150ms.
- Predictable delivery: small, incremental milestones with clear acceptance criteria.
- Observability and safety: logs, traces, metrics, rate limits, and feature flags from day one.
- Prompt discipline: every change starts from a structured prompt with inputs, constraints, tests.

Stack baseline (for reference)
- Frontend: Next.js (App Router), React, Tailwind, Radix UI, Cloudflare CDN.
- Mobile: React Native (Expo) in Phase 2.
- API: Node.js, Express, Apollo GraphQL, Socket.io for real-time.
- Data: PostgreSQL (Prisma) for ACID entities; MongoDB (Mongoose) for flexible listings/media/chats; Redis (cache, rate limits, queues); Neo4j optional for recommendations.
- Infra: Docker, CI, Cloud hosting, Sentry, OpenTelemetry, Prometheus/Grafana; Stripe (payments), Shippo (shipping), ID verification provider.

Non-functional targets (DoD gates)
- Web vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms.
- Backend: p95 latency < 250ms; error rate < 0.5%; uptime ≥ 99.9% (MVP), 99.99% (post-M3).
- Security: OAuth2/JWT + refresh tokens; 2FA ready; minimum password and lockout policy; rate limits per-IP/device/user.
- Privacy: PII encrypted at-rest and in-transit; least-privilege IAM; audit trails for sensitive actions.
- Compliance posture: basic PCI-DSS scope isolation for payments via Stripe; content moderation process established.

Milestones and acceptance criteria
- M0: Foundations
  - Monorepo skeleton, linting/formatting, CI.
  - Auth (email+password), sessions/JWT, basic roles.
  - Listings CRUD, image upload, SSR pages, search with filters.
  - Acceptance: e2e flow (sign up → list item → search → view → contact) passes and meets performance budget on a test dataset of 10k listings.
- M1: Reliability and real-time
  - Chat with presence, typing, read receipts; scheduling slots; reminders.
  - Push/browser notifications; rate limiting; abuse filters.
  - Acceptance: no-show mitigation via reminders in chat; p95 chat RTT < 150ms on 5k concurrent sockets in staging.
- M2: Transactions
  - Stripe: save payment method, escrow-style auth/capture, refunds.
  - Shipping integration (Shippo) and order lifecycle; seller dashboard.
  - Acceptance: buyer can escrow, receive item (local or shipped), mark complete; dispute flow stubs; money movement reconciles.
- M3: Trust and moderation
  - Reviews/ratings, verified badges (ID provider), device fingerprint, fraud heuristics + rules.
  - Reporting pipeline and moderator console; content scanning queue.
  - Acceptance: fraudulent pattern test cases are flagged; user report triage SLA and audit log.
- M4: Discovery and personalization
  - Similar items, comps-based price insights; saved searches + alerts.
  - Basic recommender (heuristic/bandits) with click-through uplift measurement.
  - Acceptance: A/B harness; ≥ X% CTR lift on recommendations vs control in staging.
- M5: Mobile and AR pilots
  - React Native parity for core flows; optional AR try-ons for selected categories.
  - Acceptance: feature-flagged pilots with crash-free sessions ≥ 99.5%.

Architecture overview (concise)
- Monorepo: apps/web, apps/api, apps/workers; packages/shared, packages/ui, packages/config.
- GraphQL API with Express and Socket.io; REST where simpler (uploads, webhooks).
- Data split: Postgres (users, orders, payments, reviews), Mongo (listings, media, chat), Redis (cache/queues), optional Neo4j (graph edges for recs).
- Observability: structured logs (pino), traces (OTel), metrics (Prom/Grafana), Sentry.

Performance budget and tactics
- Server: SSR/ISR for listing pages; HTTP/2 + gzip/brotli; edge caching for anon traffic.
- Client: Next/Image, AVIF/WebP, lazy-load, route prefetch; bundle splitting and RSC where safe.
- API: DB indexes, connection pooling, Redis caching, n+1 guards, backpressure on sockets.

Security and fraud posture (initial)
- Account: email verification, password policy, 2FA-ready, device fingerprint, session rotation.
- Payments: Stripe Escrow (auth/capture), dispute hooks, idempotency keys, webhook signature verification.
- Fraud: velocity checks, IP/ASN reputation, mismatched geo signals, disposable email detection, basic anomaly scores.
- Abuse: link scanners in chat, image moderation queue, rate limits per route and per socket namespace.

Risk register (top 8)
- Fraud/chargebacks → mitigations: escrow, ID verification, device fingerprint, rules + ML.
- No-shows/ghosting → mitigations: scheduling/reminders, deposit option, intent score exposure.
- Performance regressions → mitigations: budgets in CI, profiling, canary releases.
- Data consistency across stores → mitigations: source-of-truth boundaries, outbox pattern, idempotent consumers.
- PII leakage → mitigations: encryption, secrets mgmt, code review gates.
- Vendor lock-in → mitigations: abstractions for payments/shipping; infra as code.
- Moderation load → mitigations: queue + triage, batch actions, simple auto-filters.
- Access control bugs → mitigations: policy tests, authz middleware, least privilege.

Reusable prompt templates

1) System prompt — Implementation Agent
```
You are an expert full-stack engineer (Next.js, Node.js/Express, GraphQL, Socket.io, PostgreSQL, MongoDB, Redis) optimizing for trust, performance, and security.
Constraints:
- Follow performance budgets (TTFB < 200ms, LCP < 2.5s, p95 API < 250ms).
- Enforce security best practices (JWT + refresh, rate limits, CSRF where relevant, input validation with zod).
- Preserve existing code style and patterns. Write minimal diffs. Include tests.
Inputs:
- Feature goal and scope
- Affected packages/files
- Data model changes (if any)
- Acceptance criteria and tests
Output:
- Plan of changes
- Exact file diffs or new files
- Tests (unit/integration/e2e) and how to run them
- Rollout plan and metrics to monitor
```

2) Feature PRD prompt
```
Goal:
User story:
Non-goals:
Success metrics:
UX notes (psychology cues, visual hierarchy, copy):
Dependencies:
Risks and mitigations:
Acceptance criteria:
Rollout and flags:
```

3) API design prompt (GraphQL-first)
```
Context: describe feature and entities.
Design the GraphQL schema changes and necessary resolvers.
Constraints: no n+1, pagination, input validation, authz rules.
Output:
- SDL (schema)
- Resolver outline (queries/mutations/subscriptions)
- Data access strategy (Postgres/Mongo/Redis)
- Indexes and rate limits
- Tests and example queries
```

4) Data model change prompt
```
Context: current schema and desired behavior.
Propose: Postgres (Prisma) changes and Mongo (Mongoose) updates.
Include:
- Migration plan (forwards/backwards)
- Index strategy
- Data backfill or defaults
- Rollout safety (gates, read-compat, write-compat)
- Tests
```

5) Frontend component/page prompt
```
Context: page/component purpose and data needs.
Output:
- Wireframe-level structure and states (loading/empty/error)
- Accessibility checklist
- Data fetching strategy (SSR/ISR/client) and cache keys
- Interaction details (optimistic updates, skeletons)
- Styling with Tailwind + Radix; performance considerations
- Test plan (unit, visual, e2e)
```

6) Real-time feature prompt (Socket.io)
```
Context: room model, events, presence, scaling concerns.
Design:
- Namespaces/rooms, event contracts
- Backpressure, rate limits, reconnection policy
- Persistence model (what to store and where)
- Monitoring of socket metrics
- Tests with simulated load
```

7) Payments/escrow prompt (Stripe)
```
Context: item, buyer, seller, totals, fees, currency.
Design:
- Payment intents (auth/capture), escrow timings, refunds
- Idempotency, webhooks, signature verify, retries
- Ledger entries and reconciliation
- Dispute handling hooks
- Tests in Stripe test mode
```

8) Fraud/risk prompt
```
Context: observed abuse vectors.
Propose:
- Rules (velocity, IP, device, geo, email domain)
- Signals to log; scoring function
- Block/allow actions and appeals
- Monitoring and thresholds
- Privacy and fairness considerations
- Tests with synthetic bad actors
```

9) Security review prompt
```
Surface:
- Authn/authz risks
- Injection, XSS, CSRF, SSRF
- Secrets and key mgmt
- Data exposure and PII
- 3rd-party integrations
Output: findings, severities, fixes, and verification steps
```

10) Test authoring prompt
```
Context: feature behavior and edge cases.
Output:
- Unit tests (coverage of branches)
- Integration tests (API/DB/wires)
- E2E tests (happy path + failures)
- Fixtures/factories and data seeding plan
- How to run locally and in CI
```

11) Commit message prompt (Conventional Commits)
```
Choose type: feat|fix|perf|refactor|docs|test|chore
Scope: package or feature area
Message: imperative, concise summary
Body: what/why, risks, perf impact
Footer: BREAKING CHANGE: ... (if any), issue refs
```

12) PR review checklist prompt
```
Scope:
- Correctness vs PRD
- Tests and coverage
- Performance budget respected
- Security and privacy check
- Observability (logs, metrics, traces)
- Rollout/flags and rollback plan
- Docs updated
Verdict with actionable feedback
```

Operational playbook (minimum viable)
- On-call basics: SLOs, alert runbooks, error budget policy.
- Incident levels: Sev1 to Sev3; comms template; postmortem template with 5-Whys.
- Release: trunk-based dev; feature flags; canary; rollback scripts; migration safety (double-write/read compat).

Scaffolding commands (PowerShell-friendly; do not run in production shells)
- Prereqs: Node LTS, pnpm, Docker Desktop, Git.
- Initialize monorepo, apps, and packages as needed using pnpm and create-next-app.
- Use env files per app; never commit secrets.

Definition of Done (feature-level)
- Meets acceptance criteria and non-functional targets.
- Tests: unit ≥ 80% critical paths, integration and e2e for main flows.
- Security reviewed; rate limits and validation in place.
- Observability wired; dashboards updated.
- Docs and ADR (if architecture changed) merged.

Appendix — API and errors (concise conventions)
- GraphQL: cursor pagination, explicit nullability, errors via typed extensions.
- REST: JSON; consistent error shape { code, message, details, requestId }.
- Rate limiting defaults: 60 rpm public endpoints; stricter for auth/transactions.

How to use this file
- Copy the relevant prompt template when starting any task.
- Fill inputs and constraints; paste into your AI/dev workflow.
- Keep acceptance criteria and budgets visible in PRs and CI.

End of document.
