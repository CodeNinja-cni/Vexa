# Vexa Pilot Boundary: Real MVP vs Demonstration Surfaces

Status: implementation baseline for the nine-day pilot window

## Release principle

Vexa must never present simulated information as live customer data. Every surface is assigned one of three states:

- **Live**: connected to an authorized provider, tenant-scoped, persisted, and covered by failure handling.
- **Hybrid**: live core evidence with a clearly labelled demonstration of an upcoming capability.
- **Demo**: fixture-backed and visibly labelled. No external action is performed.

## Must be real for the pilot

1. Google OAuth authorization-code flow with state validation, PKCE, offline access, and granular read-only scopes.
2. Server-side sessions using opaque HTTP-only cookies and hashed database tokens.
3. Encrypted-at-rest Google access and refresh tokens.
4. Tenant- and user-scoped Gmail and Calendar synchronization.
5. Idempotent source-record persistence and connector freshness/status reporting.
6. A live attention queue derived from cited Gmail and Calendar records.
7. Fixture fallback that can be disabled in production with `VEXA_ALLOW_FIXTURE_FALLBACK=false`.
8. Deterministic Gmail-grounded reply preparation with persisted source lineage.
9. Deterministic Orb retrieval over user-owned Gmail and Calendar records with source excerpts and lineage.
10. Approval payload versioning, stale-approval rejection, duplicate-execution protection, and audit records.

## Hybrid for the pilot

- AI ranking and summaries: start with deterministic, inspectable rules over live records; add model-generated synthesis only after citation and evaluation coverage exists.
- Reply preparation: live Gmail context is retrieved with tenant-scoped access and stored as evidence for a deterministic proposed reply. The exact payload can be approved and audited, but sending remains disabled until the Gmail write scope and idempotent executor are complete.
- Focus planning: real Calendar availability may be displayed, while automatic rescheduling remains simulated.

## Explicit demos until after the pilot

- Slack, LinkedIn, WhatsApp, Instagram, news, and financial/protection feeds.
- Cross-channel people graph and long-term relationship memory.
- Voice briefing generation and voice commands.
- Autonomous opportunity research and market monitoring.
- Automatic calendar changes, social publishing, and third-party messaging.
- Mobile push notifications and native mobile applications.

## Current implementation status

### Implemented

- Google OAuth start and callback routes.
- PKCE, expiring encrypted state cookie, safe internal return paths, and verified Google profile lookup.
- User/workspace provisioning, tenant membership, encrypted credential persistence, and opaque sessions.
- Automatic Google access-token refresh.
- Gmail metadata and Calendar event connectors using read-only scopes.
- Normalized, idempotently upserted source records.
- Protected manual sync endpoint with partial connector failure reporting.
- Live briefing loader with a clear demo fallback.
- Visible Live, Connected/Sync Needed, and Demo product states.
- Tenant-scoped evidence retrieval for selected Gmail records.
- Deterministic grounded reply preparation without an AI-provider dependency.
- Persisted suggested actions, evidence lineage, approval requests, payload versions, and audit events.
- Server-owned action transitions; client-supplied action aggregates are rejected by the deprecated endpoint.
- Review UI that distinguishes persisted grounded drafts from fixture-backed demonstrations.
- Grounded Orb query endpoint with tenant-and-user isolation, deterministic relevance ranking, confidence labels, inspectable source excerpts, and fixture fallback.
- Orb reply handoff into the same persisted, approval-gated draft workflow used by the attention queue.
- Action Center read model joining each user-owned action to its exact payload version, evidence records, approval decisions, execution attempts, and audit events.
- Action Center interface with live/demo mode labels, status filters, approve/reject controls, payload inspection, evidence lineage, and decision history.
- Immutable payload version snapshots with a migration that backfills existing actions.
- Transactional reply revision: edit the subject/body, invalidate a pending or previous approval, create version N+1, and request approval again without changing destination or evidence lineage.
- Unified inbox read model over tenant-and-user-scoped Gmail records with deterministic Priority, Waiting, Opportunity, and FYI classification.
- Inbox search, visible ranking rationale, live/demo mode disclosure, and handoff of a selected Gmail record into the existing grounded reply approval flow.
- Honest fixture fallback when Google is not connected or no synchronized Gmail messages are available; LinkedIn and every non-Google channel remain demonstration-only.
- Relationship read model that groups recent Gmail records by external sender or recipient without creating unsupported profile facts.
- Deterministic opportunity, needs-reply, waiting, and active signals with message counts, evidence excerpts, and source links.
- Commitment extraction from Gmail subject/snippet action language, with open, due, and waiting states plus grounded follow-up handoff.
- Focus-plan read model for the next local workday using tenant-and-user-scoped Google Calendar records.
- Deterministic conflict detection, merged busy-time calculation, ten-minute meeting buffers, free-window evidence, and up to two protected-work proposals.
- Proposal staging that visibly makes no Calendar change; live writes remain out of scope until write access, exact payload approval, idempotency, and execution audit are implemented.

### Configuration required before live testing

1. Create a Google Cloud OAuth web application.
2. Enable Gmail API and Google Calendar API.
3. Add the callback URL from `VEXA_APP_URL`, for example `http://localhost:3000/api/auth/google/callback`.
4. Copy `.env.example` to `.env.local`.
5. Set a unique `AUTH_SECRET` containing at least 32 characters.
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
7. Start PostgreSQL and run `npm run db:migrate`.

An OpenAI API key is not required for the implemented pilot path. Add one later for model-generated synthesis only after citation checks and evaluation coverage are in place.

## Pilot exit criteria

- A visitor can understand Vexa's value, implemented features, evidence model, and action-safety boundary from the public landing page.
- A user can create a workspace with name, work email, role, workspace name, and a strong password, then receive an opaque HTTP-only session.
- Passwords are stored only as memory-hard scrypt hashes; login failures use a generic credential error and authenticated `/app` routes redirect unauthenticated visitors.
- The public investor demo is separated from the authenticated workspace and cannot imply a live connector or external action.
- A user can connect Google and return to Vexa with a secure session.
- Sync imports recent Gmail metadata and the next 14 days of Calendar events without cross-tenant access.
- Re-running sync does not duplicate records.
- Expired access tokens refresh without user interaction; revoked tokens produce a reconnect state.
- The attention queue cites the live source behind every item.
- A selected Gmail record can produce a persisted, evidence-linked draft and approval record.
- The Orb can answer from synchronized Gmail and Calendar evidence without an AI-provider key and expose every source used.
- The Inbox can rank synchronized Gmail messages without an AI-provider key, explain each ranking, and preserve the selected record as reply evidence.
- The People view can derive a relationship memory from synchronized Gmail metadata, expose the underlying records, and prepare a follow-up without an AI-provider key.
- The Focus view can calculate a conflict-aware workday from synchronized Calendar events, expose every free window, and stage a proposal without changing Google Calendar.
- Approving a draft never sends it while external execution is disabled.
- A user can review and reject or approve an awaiting action from the Action Center; the decision is persisted and immediately visible in its audit timeline.
- Editing an awaiting or approved reply creates a new immutable payload version and makes every previous approval unusable for that revised payload.
- All simulated actions and sources remain explicitly labelled.
