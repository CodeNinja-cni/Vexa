# Vexa

Vexa is a grounded AI workspace that combines authorized work, social, news, and protection signals into a cited briefing and approval-gated actions.

## Current implementation

- Public product landing page with feature showcase, safety positioning, responsive product preview, and conversion paths
- Secure email/password signup and login with minimal onboarding fields and optional Google sign-in
- Memory-hard scrypt password hashing, opaque database sessions, HTTP-only cookies, same-origin mutation checks, and logout
- Protected `/app` workspace plus a clearly separated public `/demo` for investor review
- Premium responsive Attention OS interface across Today, Inbox, People, Focus, and Actions
- Explainable attention queue with source citations and clear "why now" signals
- Command palette, opportunity radar, adaptive focus planning, and relationship memory
- Grounded Orb search over authorized Gmail and Calendar records with inspectable citations
- Deterministic fixture-backed Orb answers when live sources are unavailable, always visibly labelled
- Review-before-action drawer with destination, exact draft, evidence, and scoped approval
- Action Center with status filters, exact payload inspection, evidence lineage, approval decisions, and audit timelines
- Editable reply drafts with immutable version history and automatic stale-approval invalidation
- Google OAuth with PKCE/state validation and HTTP-only database sessions
- Encrypted Google credentials with automatic access-token refresh
- Live Gmail metadata and Calendar event synchronization with tenant-scoped persistence
- Gmail-ready unified inbox with deterministic Priority, Waiting, Opportunity, and FYI ranking
- Tenant-and-user-scoped live inbox API with search, ranking explanations, and explicit fixture fallback
- Evidence-backed relationship memory grouped from authorized Gmail senders and recipients
- Deterministic opportunity, needs-reply, waiting, and active relationship signals with commitment extraction
- People search, source inspection, conversation-direction metrics, and approval-safe follow-up handoff
- Calendar-derived Focus plan for the next local workday with overlap detection and union busy-time calculation
- Ten-minute meeting buffers, viable-window ranking, and up to two evidence-backed focus proposals
- Honest proposal staging while Google Calendar writes remain disabled behind exact-payload approval
- Live briefing loader with explicit fixture fallback and visible mode labels
- Deterministic reply preparation grounded only in selected Gmail evidence
- Persisted evidence lineage, draft payload versions, approval requests, and audit events
- Typed connector adapter contract and fixture adapter
- Tenant-aware PostgreSQL schema
- Approval state machine with stale-approval and duplicate-execution protection
- Protected briefing, Orb query, draft, hydrated Action Center, and server-owned approval transition APIs
- Health endpoint, strict TypeScript, ESLint, Vitest, and production build checks

## Local setup

1. Install Node.js 22 or newer and Docker.
2. Copy `.env.example` to `.env.local` and keep real secrets out of Git.
3. Run `npm install`.
4. Start PostgreSQL with `docker compose up -d postgres`.
5. Generate migrations with `npm run db:generate`, then apply them with `npm run db:migrate:local`. The local command loads the ignored `.env.local`; hosted migration jobs should continue using `npm run db:migrate` with injected environment variables.
6. Start Vexa with `npm run dev` and open `http://localhost:3000`.

Email/password signup and login require PostgreSQL. The public landing page and `/demo` remain available when the database is offline; auth endpoints return an explicit `503` instead of presenting a false credential failure.

The dashboard automatically uses authorized Gmail and Calendar data when Google is connected, with a clearly labelled fixture fallback for review. The Inbox ranks synchronized Gmail messages without a paid AI provider and hands selected live records into the same evidence-linked reply and approval workflow. The People view groups recent Gmail exchanges by contact, surfaces relationship signals and commitments, and preserves the exact source behind each memory. Focus calculates availability, conflicts, recovery buffers, and proposed deep-work blocks from authorized Calendar events. Grounded reply drafts can be prepared and approved, but external Gmail and Calendar writes are intentionally disabled until write permission and idempotent executors are added.

Google does not require a generic API key for this flow. Live Google testing requires a web OAuth client ID and client secret. An OpenAI API key is not required for the current deterministic briefing and draft pipeline; it is only needed when model-generated synthesis is introduced.

Migration `0003_glossy_mephisto.sql` adds immutable payload snapshots and backfills the current version of existing actions. Migration `0004_odd_puma.sql` adds nullable job-title and credential-hash fields while preserving Google-only accounts. Apply both before testing live Action Center editing or email/password signup.

For hosted deployments, `DATABASE_URL` is the pooled runtime connection and `DATABASE_URL_UNPOOLED` (or `POSTGRES_URL_NON_POOLING`) is preferred automatically by Drizzle Kit for migrations. Vercel functions limit themselves to one pooled connection per instance to avoid exhausting the serverless database connection budget.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Product documentation

- `docs/VEXA_PRODUCT_DOCUMENTATION.md` - consolidated product requirements and delivery scope
- `docs/IMPLEMENTATION_STACK.md` - technology choices and implementation rationale
- `docs/COMPETITIVE_PRODUCT_STRATEGY.md` - competitor analysis, differentiation, and nine-day plan
- `docs/MVP_REAL_VS_DEMO_BOUNDARY.md` - binding pilot scope and live/demo release criteria
- `deliverables/Vexa_Competitive_Product_Strategy_and_Nine_Day_Plan.docx` - shareable team document
