# Vexa Product and Technical Documentation

**Status:** Draft for implementation  
**Version:** 0.1  
**Last updated:** 17 September 2026  
**Primary source:** `Vexa-Overview.html` — “Vexa: What It Is”  
**Delivery context:** Greenfield technical demo with nine calendar days remaining

---

## 1. Purpose

This document converts the Vexa demo briefing into an implementation-ready product specification. It captures:

- The product vision and governing principles
- Functional requirements for Work, Social, News, and Protect
- Required integrations
- Core user journeys
- Proposed architecture and data model
- Security and privacy constraints
- A realistic technical-demo scope
- Acceptance criteria, risks, assumptions, and open decisions

Requirements explicitly stated by the original briefing are treated as authoritative. Architecture, prioritization, and implementation details introduced here are marked as **proposed** until approved.

---

## 2. Product Summary

Vexa is an AI personal and team assistant that connects a person’s work tools, social accounts, and relevant news in one place. It monitors connected systems, identifies what matters, explains why it matters, recommends a next step, prepares the action, and waits for the user’s approval before acting.

### 2.1 Problem statement

People’s responsibilities and conversations are fragmented across applications. A deadline may be in email, a meeting request in a social-media direct message, a commitment in a voice note, and an important industry update on a news site. The user currently acts as the connector by repeatedly checking each system and assembling the context manually.

### 2.2 Product response

Vexa provides a shared intelligence layer over connected applications. It should:

- Present a proactive daily briefing
- Search across all connected sources
- Retain useful personal and organizational context
- Identify messages, commitments, deadlines, and risks
- Prepare replies, meeting changes, posts, and other actions
- Learn the user’s communication style
- Support voice as both input and output
- Require confirmation before every external action
- Preserve traceability to original sources
- Communicate uncertainty and missing context honestly

### 2.3 Target users

Vexa is intended for:

- Individuals managing work and social activity
- Founders and business owners
- Teams that need shared organizational context
- Administrators who manage access, auditing, export, and deletion

### 2.4 Product origin

Vexa builds on an earlier work-only product named **Chorrey**. Chorrey introduced persistent organizational memory, suggestions, and team-wellness insights. Vexa expands that concept by combining the work layer with personal and social accounts for both individuals and teams.

---

## 3. Product Principles

### 3.1 Proactive, not reactive

Vexa must not behave only as a chatbot waiting for a question. On login, it should already present a briefing containing:

- Today’s deadlines
- Today’s meetings
- Unfinished commitments from the previous day
- Unanswered messages
- Recommended next steps

### 3.2 Confirm before acting

Every external action performed on behalf of a user must receive explicit approval immediately before execution. This includes, without exception:

- Sending or replying to a message
- Accepting a meeting
- Rescheduling a meeting
- Publishing a post
- Sending a prepared follow-up
- Performing any equivalent write operation in a connected service

Vexa may detect, explain, recommend, and prepare an action without approval. It must not execute the external action until the user approves it.

### 3.3 Learn the person

Vexa should learn communication patterns such as:

- Email tone and structure
- Comment and direct-message reply style
- Caption style
- Frequently used expressions
- Relevant mannerisms and preferences

Personalization applies across the assistant rather than only to the news feed.

### 3.4 Search everything once

A user must be able to ask a question without knowing which application contains the answer. Search should span Work, Social, and News and preserve the original source of every result.

Example:

> When is my meeting with Tunde, and what did he send it on?

### 3.5 Evidence before confidence

High-impact answers must cite the messages, records, documents, or events used to construct them. When data may be incomplete, Vexa must say so instead of presenting an unsupported answer as certain.

---

## 4. Functional Requirements

### 4.1 Cross-product requirements

| ID | Requirement |
|---|---|
| CORE-001 | Vexa must provide a unified interface over connected work, social, and news sources. |
| CORE-002 | Vexa must generate a proactive voice-and-text briefing when the user logs in. |
| CORE-003 | Vexa must support natural-language search across all connected sources. |
| CORE-004 | Search results and high-impact answers must retain source provenance. |
| CORE-005 | Vexa must support spoken user input and spoken assistant output. |
| CORE-006 | Vexa must transcribe supported voice notes received through connected applications. |
| CORE-007 | Vexa must detect useful entities such as people, promises, deadlines, meetings, tasks, and sources. |
| CORE-008 | Vexa must propose and prepare actions proactively. |
| CORE-009 | Vexa must require explicit approval before executing every external action. |
| CORE-010 | Users must be able to edit or reject a proposed action. |
| CORE-011 | Vexa must retain useful context across connected systems and over time. |
| CORE-012 | Vexa should personalize generated communication to the user’s style. |
| CORE-013 | The product must support individual and team contexts. |
| CORE-014 | Vexa must indicate missing, stale, inaccessible, or potentially incomplete information. |

---

## 5. Vexa Work

Vexa Work is the executive-assistant layer. It reads work-adjacent sources and converts them into an actionable plan.

### 5.1 Daily Briefing

**Requirement:** Generate a voice-and-text greeting on login containing deadlines, meetings, unfinished commitments, unanswered messages, and suggested actions.

**Minimum output for each item:**

- What happened or is due
- Why it matters
- Source application
- Relevant time or deadline
- Suggested next action
- Confidence or completeness warning where appropriate

### 5.2 Inbox and Calendar Sync

Vexa must read Gmail and Google Calendar and synthesize them into a concise “what matters today” view rather than presenting raw inbox and calendar lists.

### 5.3 Message Triage

Vexa should:

- Detect unanswered messages across connected applications
- Rank them by likely importance or urgency
- Explain why a message needs attention
- Draft a suggested reply
- Require approval before sending

### 5.4 Meeting Handling

When a meeting request is detected, Vexa should:

1. Surface the request.
2. Display the sender, proposed time, context, and conflicts.
3. Recommend accepting or proposing an alternative.
4. Prepare the selected response.
5. Ask for confirmation.
6. Execute only after approval.

### 5.5 Company Brain

The Company Brain is persistent organizational memory. It must support questions about both facts and historical reasoning.

Example:

> Why did we delay this?

The response should reconstruct the reasoning from available messages, tasks, meetings, and documents instead of returning only a linked document.

### 5.6 Voice Notes Auto-Highlight

Vexa should transcribe voice notes and identify:

- The person involved
- A promise, request, or commitment
- A deadline or relevant date

If a commitment appears unfulfilled, Vexa may generate a reminder or prepare a follow-up. Sending the follow-up still requires user approval.

### 5.7 Sprint Intelligence

Vexa should reason across connected systems to:

- Explain why work is late
- Identify blockers and incomplete dependencies
- Compare launch commitments with observable progress
- Flag work that may prevent a planned launch

### 5.8 The Orb

The Orb is the single conversational entry point into Vexa’s knowledge and actions. It should support:

- Questions over connected data
- Cross-source search
- Briefing follow-up questions
- Action preparation
- Approval requests
- Source inspection

“Vexa, handle it” is a long-term product direction, not a requirement for unrestricted autonomous execution in the initial demo.

### 5.9 Suggested Actions Ladder

Vexa should follow this progression:

```text
Notice → Explain → Recommend → Prepare → Request approval → Act
```

The system must never skip the approval stage for an external action.

### 5.10 Workload and Capacity Intelligence

Vexa may identify observable work patterns such as:

- Overdue commitments
- Meeting overload
- Repeated after-hours activity
- One person absorbing work that was assigned elsewhere

Privacy constraints:

- Vexa must not make medical, psychological, or wellness diagnoses.
- It should describe only observable activity.
- A capacity warning must be shown privately to the affected person.
- The warning must not be reported to that person’s manager.

### 5.11 Bus-Factor Briefing

If a founder or owner is unavailable, Vexa should prepare continuity information for an authorized replacement, including:

- Outstanding commitments
- Overdue payments
- Open decisions or blockers
- Previously resolved matters
- Source evidence for material claims

Access to this briefing must respect organizational permissions.

---

## 6. Vexa Social

Vexa Social manages a user’s day-to-day social presence inside the same assistant used for work.

| ID | Requirement |
|---|---|
| SOCIAL-001 | Connected social accounts must appear in the unified assistant. |
| SOCIAL-002 | Vexa should read supported incoming direct messages and comments. |
| SOCIAL-003 | Vexa should draft replies in the user’s style. |
| SOCIAL-004 | Vexa should proactively draft captions for upcoming posts. |
| SOCIAL-005 | Caption recommendations should consider the user’s voice and previous performance where data is available. |
| SOCIAL-006 | Vexa should monitor supported comments, mentions, tags, and engagement. |
| SOCIAL-007 | Before a scheduled post is published, Vexa must ask the user to confirm it. |
| SOCIAL-008 | No post, comment, direct message, or reply may be sent without approval. |

Example scheduled-post prompt:

> Your 9 PM post is ready. Send it?

---

## 7. Vexa News

Vexa News provides a personalized feed rather than a generic headline list.

### 7.1 Personalization

The feed should consider:

- Explicit user interests
- The user’s industry
- Relevant business context
- Previously selected or dismissed topics

### 7.2 Suggested Action

Vexa should go beyond summarization by recommending a useful next step when supported by the article and the user’s context. Examples include:

- A person or company worth engaging with
- A topic worth posting about
- A business opportunity to investigate
- A development that may affect existing plans

### 7.3 Documented news sources

- NewsAPI.org or GNews
- Google News RSS
- Bing News Search API
- Nigerian publishers such as Punch and Guardian Nigeria
- Relevant Instagram blogs, subject to available platform permissions

---

## 8. Protect

Protect is the cross-cutting trust, safety, and governance layer.

### 8.1 Tenant Isolation

Each company’s data must be logically and cryptographically isolated from other organizations. The exact deployment model—separate infrastructure, separate database/schema, or shared infrastructure with per-tenant keys—remains an architecture decision.

### 8.2 Admin Visibility

Authorized administrators must be able to see:

- Which integrations are connected
- Which permissions Vexa has
- What data Vexa has accessed
- What actions Vexa proposed or executed
- Who approved each executed action

### 8.3 Audit Log

The audit log should record at least:

- Actor
- Organization
- Timestamp
- Event type
- Source or integration
- Data object affected
- Proposed action
- Approval outcome
- Execution outcome
- Error details where applicable

### 8.4 Export and Deletion

Admins must have a one-click entry point for data export and deletion. Production behavior must define:

- Included data
- Export format
- Deletion confirmation
- Retention exceptions
- Completion timeframe
- Treatment of backups and third-party data

### 8.5 Source Traceability

High-impact answers must link to the exact source records used. A citation should preserve:

- Integration name
- Source object identifier
- Source type
- Author or origin where available
- Timestamp
- Relevant excerpt or summary
- Direct link where permitted

### 8.6 Honest Gaps

When information may be unavailable, incomplete, stale, or inaccessible, Vexa should state the limitation explicitly.

Recommended language:

> Based on what I’ve seen, there may be things nobody has shown me.

---

## 9. Integrations

### 9.1 Planned connections

| Category | Services |
|---|---|
| Google Workspace | Gmail, Google Calendar, Google Drive |
| Work communication | Microsoft Teams, Slack, Telegram |
| Meetings | Zoom |
| Work suites | Zoho Workplace |
| Project management | ClickUp, Trello |
| Documents and knowledge | Notion, SharePoint |
| Social | Instagram, Facebook, TikTok, YouTube |

### 9.2 Not connecting yet

- WhatsApp Business
- Personal WhatsApp

The source briefing excludes WhatsApp because Meta’s API restrictions make integration impractical for the demo timeline.

### 9.3 Integration constraints

An integration should not be considered production-ready until the required credentials, OAuth scopes, app-review approvals, rate limits, webhook capabilities, and read/write operations have been verified.

Social-platform support may be limited by:

- Developer application approval
- Business-account requirements
- Restricted direct-message and comment scopes
- Publishing permission review
- Public privacy-policy and deletion URLs
- Platform-specific verification

---

## 10. Core User Journeys

### 10.1 Connect an account

1. User opens Integrations.
2. User selects a service.
3. Vexa explains the requested permissions.
4. User completes OAuth or the supported authorization flow.
5. Vexa verifies the connection.
6. Initial synchronization starts.
7. The connection and its access level appear in Protect.

### 10.2 Receive a daily briefing

1. User signs in.
2. Vexa gathers relevant meetings, deadlines, commitments, and messages.
3. Vexa ranks the most important items.
4. Vexa presents a text briefing and offers spoken playback.
5. Every item includes its source and a recommended next step.
6. The user can inspect, dismiss, or act on an item.

### 10.3 Search across systems

1. User asks a question through text or voice.
2. Vexa searches all authorized sources.
3. Vexa synthesizes the result.
4. Vexa displays source citations.
5. Vexa communicates missing or uncertain context.

### 10.4 Approve an action

1. Vexa notices a situation requiring action.
2. Vexa explains the situation and recommendation.
3. Vexa prepares the message, event update, or post.
4. The user reviews the exact payload and destination.
5. The user approves, edits, or rejects it.
6. Vexa executes only after approval.
7. Vexa displays the outcome and records it in the audit log.

### 10.5 Process a voice note

1. A supported integration supplies a voice note.
2. Vexa stores the source reference and transcribes the audio.
3. Vexa extracts people, promises, and deadlines.
4. Vexa creates a commitment candidate.
5. The user can confirm or correct the extracted information.
6. Vexa includes confirmed commitments in future briefings.

---

## 11. Proposed Technical Architecture

The following architecture is proposed and was not specified in the original briefing.

```text
Connected services
       ↓
Connector and authorization layer
       ↓
Synchronization, webhook and ingestion workers
       ↓
Normalized source records and event stream
       ↓
Tenant-isolated operational storage
       ↓
Search index and semantic memory
       ↓
Briefing, reasoning and recommendation services
       ↓
The Orb, dashboard, voice and admin interfaces
       ↓
Approval gate
       ↓
External action executor and audit log
```

### 11.1 Proposed components

- Web application
- API/backend service
- User and organization authentication
- OAuth connection manager
- Integration adapter framework
- Background job and scheduling system
- Webhook receiver
- Normalized data store
- Search and semantic retrieval layer
- Citation/provenance service
- AI orchestration and tool layer
- Suggested-action engine
- Approval and execution service
- Speech-to-text and text-to-speech service
- News ingestion and ranking service
- Notification service
- Audit and administrative interface
- Export and deletion service

### 11.2 Integration adapter contract

Each connector should expose only the capabilities it supports, for example:

- Connect and disconnect
- Validate credentials
- Perform initial and incremental synchronization
- Receive webhooks
- Search or retrieve source items
- Draft or prepare supported actions
- Execute an approved action
- Return stable source references
- Report errors, rate limits, and permission gaps

This contract allows real, simulated, and future integrations to share the same product interface.

---

## 12. Proposed Domain Model

| Entity | Purpose |
|---|---|
| User | A person using Vexa |
| Organization | Tenant boundary for a team or company |
| Membership | User role and organization permissions |
| Integration | Authorized connection to an external service |
| Source Record | Normalized representation of an external object |
| Message Thread | Conversation containing messages and participants |
| Meeting | Calendar event or meeting request |
| Task | Explicit piece of work from a source system |
| Commitment | Detected or confirmed promise with an owner and deadline |
| Document | Searchable file or knowledge record |
| News Article | Ingested news item with topic metadata |
| Briefing | Ranked summary generated for a user and time period |
| Suggested Action | A recommendation and prepared action payload |
| Approval Request | User decision required before execution |
| Execution Record | Result of an approved external action |
| Citation | Link between an answer or recommendation and a source record |
| Audit Event | Immutable security and activity record |
| Style Profile | Derived communication preferences for a user |

All tenant-owned entities must include an organization identifier and enforce tenant boundaries at every storage and API layer.

---

## 13. Action and Approval Model

Suggested actions should move through explicit states:

```text
detected
  → recommended
  → prepared
  → awaiting_approval
  → approved | edited | rejected | expired
  → executing
  → succeeded | failed
```

Requirements:

- Approval applies to one exact action payload.
- Editing a payload invalidates any previous approval.
- Approval must record the approving user and timestamp.
- Expired or materially changed actions must be approved again.
- Failed executions must not silently retry in a way that could duplicate the action.
- Execution results must be visible to the user and written to the audit log.

---

## 14. Security, Privacy, and Governance

### 14.1 Required controls

- Tenant isolation
- Encryption in transit and at rest
- Least-privilege integration scopes
- Secure storage of OAuth tokens and secrets
- Role-based access control
- Source-level authorization checks
- Immutable or tamper-evident audit events
- Confirmation before external writes
- Data export and deletion controls
- Protection against duplicate action execution
- Redaction of sensitive data from logs

### 14.2 AI-specific controls

- Treat external messages and documents as untrusted input.
- Do not allow retrieved content to bypass approval rules.
- Separate source content from system instructions.
- Cite evidence for high-impact claims.
- Indicate uncertainty and missing sources.
- Prevent cross-tenant retrieval.
- Require deterministic authorization outside the language model.
- Validate tool inputs and action destinations before execution.

### 14.3 Privacy constraints

- Personalization should use only authorized data.
- Users should be able to inspect and correct important inferred information.
- Workload observations must be private to the affected person.
- Vexa must not present activity patterns as a medical or psychological diagnosis.

---

## 15. Non-Functional Requirements

The original briefing does not define numeric service targets. The following categories must be agreed before production:

- Availability
- API and assistant response latency
- Synchronization freshness
- Maximum briefing-generation time
- Search-result quality
- Voice transcription accuracy
- Connector retry and recovery behavior
- Data-retention periods
- Backup and restore expectations
- Cost limits per active user
- Audit-log retention
- Export and deletion completion time
- Accessibility standard
- Browser and device support

For the demo, every primary journey should remain usable with prepared fixture data if a third-party service is unavailable.

---

## 16. Technical Demo Scope

The complete product vision is larger than a nine-day greenfield implementation. The demo should prove the product’s central interaction:

> Vexa notices something across connected tools, explains why it matters, cites the evidence, prepares an appropriate action in the user’s voice, and waits for approval.

### 16.1 Recommended real capabilities

- Web application
- User sign-in
- Google Gmail, Calendar, and Drive integration
- One real messaging integration, preferably Slack or Telegram
- RSS- or API-based news feed
- Daily briefing
- The Orb conversational interface
- Cross-source search
- Source citations
- Suggested actions
- Approve, edit, and reject flow
- Execution audit trail
- Voice input and spoken output

### 16.2 Real only if credentials and permissions already exist

- Instagram or Facebook reading and publishing
- Social direct-message or comment access
- Scheduled social publishing

### 16.3 Simulated through production-shaped adapters

- Microsoft Teams
- Zoom
- Zoho Workplace
- ClickUp
- Trello
- Notion
- SharePoint
- TikTok
- YouTube
- Any social capability blocked by application review

Simulated connectors must use the same internal data and adapter contracts as real connectors. The product should identify simulated data internally, and the project team must not represent an unavailable integration as production-ready.

---

## 17. Nine-Day Delivery Plan

| Day | Outcome |
|---|---|
| 1 | Lock demo journeys, technology stack, screens, data contracts, credentials, and real integrations. |
| 2 | Build authentication, organizations, integration settings, and the connector framework. |
| 3 | Implement Google ingestion and normalized source storage. |
| 4 | Build search, semantic memory, citations, and the daily briefing. |
| 5 | Build The Orb and the approval-gated action workflow. |
| 6 | Add voice input/output and voice-note commitment extraction. |
| 7 | Add news plus one messaging or social connector. |
| 8 | Add Protect/admin views, audit history, export/delete entry points, fixtures, and UI polish. |
| 9 | Complete end-to-end testing, deployment, fallback preparation, and demo rehearsal. |

Work that depends on external platform approval must be identified on Day 1 and given a fixture-backed fallback.

---

## 18. Demo Acceptance Criteria

The demo is successful when all of the following can be shown reliably:

1. A user signs in and receives a useful daily briefing.
2. The briefing combines information from at least two different source categories.
3. The user can ask a cross-source question through The Orb.
4. Vexa returns a synthesized answer with inspectable citations.
5. Vexa detects or surfaces an unanswered message, conflict, deadline, or commitment.
6. Vexa explains why the item matters.
7. Vexa prepares an appropriate response or action.
8. The user can edit, approve, or reject the action.
9. No external write occurs before approval.
10. An approved action produces a visible success or failure result.
11. The decision and execution appear in the audit log.
12. Vexa communicates when its source data may be incomplete.
13. The primary flows work with text, and at least one flow supports voice input and output.
14. A third-party outage does not prevent the prepared demo because fixture data is available.

---

## 19. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Social-platform approval is unavailable | Social read/write flows cannot use live accounts | Use one approved connector and production-shaped fixture adapters |
| Too many integrations are attempted | Core experience becomes incomplete or unreliable | Prioritize two or three live integrations and keep a common adapter contract |
| AI produces unsupported conclusions | Loss of user trust | Require citations, confidence cues, and explicit gap statements |
| Cross-tenant retrieval occurs | Critical privacy incident | Enforce tenant filtering outside the model and test isolation |
| An action executes without valid approval | Direct violation of product principle | Make the approval service the only path to action execution |
| Duplicate retries send twice | Messages or posts may be duplicated | Use idempotency keys and explicit execution records |
| Live APIs fail during the demo | Demo journey breaks | Cache safe demo data and maintain tested fixtures |
| Voice quality is unreliable | Main interaction appears broken | Keep text available and use a rehearsed supported audio sample |
| Scope expands during the nine-day build | Delivery becomes unlikely | Freeze demo journeys and route additions to a post-demo backlog |

---

## 20. Open Decisions

The following decisions should be resolved before or during Day 1:

1. Is the demo web-only, or is a mobile client required?
2. What are the exact three-to-five demo journeys?
3. Which integrations must be live?
4. Which OAuth credentials and approvals already exist?
5. Which services may use seeded or simulated data?
6. What technology stack and hosting environment will be used?
7. What user roles are required for the demo?
8. What does “isolated environment” mean for the initial architecture?
9. What data-retention and deletion behavior must be demonstrated?
10. Where should proactive notifications appear?
11. How should users correct extracted commitments and personalization?
12. What makes a message unanswered, urgent, or important?
13. What level of source access is permitted for team-wide memory?
14. Which news API will be used?
15. What measurable criteria define a successful demo?

---

## 21. Out of Scope Unless Explicitly Added

The following should not be assumed for the initial demo:

- Fully autonomous external actions
- WhatsApp integration
- Every documented integration operating live
- Native iOS or Android applications
- Production-scale multi-region infrastructure
- Medical or psychological wellbeing diagnosis
- Unrestricted manager access to personal workload insights
- Model fine-tuning on user communication
- Complete enterprise compliance certification
- Guaranteed reconstruction of events that Vexa was not authorized to access

---

## 22. Visual Direction from the Source Briefing

The original HTML suggests—but does not formally specify—the following visual language:

- Deep purple as the primary Vexa color
- Blue for Work
- Magenta or pink for Social
- Gold for News
- Purple for Protect
- Fraunces for display headings
- Inter for body copy and interface text
- Rounded cards on a light-gray surface
- Responsive single-column behavior on narrow screens

This direction may inform the application, but it is not a substitute for screen designs covering onboarding, the dashboard, The Orb, approvals, integrations, and Protect.

---

## 23. Definition of the Vexa Experience

The implementation should preserve the following sequence across every pillar:

```text
Observe authorized sources
        ↓
Identify what matters
        ↓
Explain it with evidence
        ↓
Recommend a next step
        ↓
Prepare the exact action
        ↓
Ask the user for confirmation
        ↓
Execute safely
        ↓
Report and audit the result
```

This sequence—not the number of integration logos—is the central Vexa product experience.

---

## 24. Complete Implementation Work Breakdown

This work breakdown converts the requirements and recommendations into buildable work items. It is intentionally broader than the nine-day demo plan. Items marked **Demo** are required for the recommended demonstration. Items marked **Post-demo** complete or harden the wider product vision.

### 24.1 Product and Delivery Management

| ID | Work item | Target |
|---|---|---|
| PM-01 | Approve the three-to-five end-to-end demo journeys. | Demo |
| PM-02 | Name an owner for product, engineering, design, integrations, AI, security, QA, and demo operations. | Demo |
| PM-03 | Decide which integrations are live, simulated, or deferred. | Demo |
| PM-04 | Inventory existing developer accounts, credentials, OAuth applications, and approval status. | Demo |
| PM-05 | Define measurable demo success criteria and a scope freeze date. | Demo |
| PM-06 | Maintain a decision log, risk register, and daily delivery checkpoint. | Demo |
| PM-07 | Define the post-demo roadmap and production-readiness gates. | Post-demo |

### 24.2 User Experience and Product Design

| ID | Work item | Target |
|---|---|---|
| UX-01 | Map the information architecture for Briefing, Orb, Integrations, Approvals, News, and Protect. | Demo |
| UX-02 | Design account connection and permission-disclosure screens. | Demo |
| UX-03 | Design the daily briefing and source-detail experience. | Demo |
| UX-04 | Design the Orb conversation, citation, and follow-up experience. | Demo |
| UX-05 | Design action preview, edit, approve, reject, expired, success, and failure states. | Demo |
| UX-06 | Design integration health, synchronization, and permission-error states. | Demo |
| UX-07 | Design voice recording, transcription, playback, and correction states. | Demo |
| UX-08 | Design Protect views for access, audit history, export, and deletion. | Demo |
| UX-09 | Define responsive behavior and keyboard-accessible interaction patterns. | Demo |
| UX-10 | Test the primary journeys with representative users and record changes. | Post-demo |

### 24.3 Application Foundation

| ID | Work item | Target |
|---|---|---|
| APP-01 | Select and document the frontend, backend, database, queue, AI, voice, and hosting stack. | Demo |
| APP-02 | Create repository structure, environment configuration, code-quality rules, and local setup instructions. | Demo |
| APP-03 | Add development, staging, and production-like environment boundaries. | Demo |
| APP-04 | Establish database migrations and repeatable seed data. | Demo |
| APP-05 | Implement application logging, error handling, and correlation identifiers. | Demo |
| APP-06 | Create a feature-flag mechanism for live and simulated connectors. | Demo |
| APP-07 | Add continuous integration for linting, type checks, tests, and builds. | Demo |
| APP-08 | Document deployment and rollback procedures. | Demo |

### 24.4 Identity Organizations and Authorization

| ID | Work item | Target |
|---|---|---|
| IAM-01 | Implement user sign-in and sign-out. | Demo |
| IAM-02 | Implement organizations and memberships. | Demo |
| IAM-03 | Define member, admin, and any additional required roles. | Demo |
| IAM-04 | Enforce organization boundaries in every query, job, tool call, and API route. | Demo |
| IAM-05 | Define who may connect, disconnect, export, and delete organizational data. | Demo |
| IAM-06 | Define access rules for shared memory and Bus-Factor Briefings. | Demo |
| IAM-07 | Add authorization tests that attempt cross-tenant access. | Demo |
| IAM-08 | Add session, account-recovery, and account-deactivation controls. | Post-demo |

### 24.5 Connector Platform

| ID | Work item | Target |
|---|---|---|
| CON-01 | Define a common connector capability contract. | Demo |
| CON-02 | Implement secure credential and OAuth-token storage. | Demo |
| CON-03 | Implement connect, refresh, revoke, and disconnect flows. | Demo |
| CON-04 | Implement initial and incremental synchronization jobs. | Demo |
| CON-05 | Implement webhook verification and processing where supported. | Demo |
| CON-06 | Normalize connector errors, rate limits, and permission gaps. | Demo |
| CON-07 | Expose connector health, last-sync time, and available capabilities. | Demo |
| CON-08 | Add idempotency and deduplication for imported records. | Demo |
| CON-09 | Build fixture-backed adapters that use the same contract as live integrations. | Demo |
| CON-10 | Add backfill, retry, and dead-letter handling. | Post-demo |

### 24.6 Initial Integrations

| ID | Work item | Target |
|---|---|---|
| INT-01 | Connect Gmail and ingest authorized messages and threads. | Demo |
| INT-02 | Connect Google Calendar and ingest events and invitations. | Demo |
| INT-03 | Connect Google Drive and index authorized files and metadata. | Demo |
| INT-04 | Connect Slack or Telegram for one live messaging journey. | Demo |
| INT-05 | Connect Google News RSS, GNews, NewsAPI, or another approved news source. | Demo |
| INT-06 | Verify whether Instagram or Facebook permissions already support the planned demo. | Demo |
| INT-07 | Implement one approved social read or publish journey if credentials permit. | Demo |
| INT-08 | Build realistic fixtures for blocked social capabilities. | Demo |
| INT-09 | Implement Teams, Zoom, Zoho, ClickUp, Trello, Notion, SharePoint, TikTok, and YouTube adapters. | Post-demo |
| INT-10 | Reassess WhatsApp Business when API access and schedule permit. | Post-demo |

### 24.7 Data Ingestion and Memory

| ID | Work item | Target |
|---|---|---|
| DATA-01 | Define normalized source-record schemas for messages, events, tasks, documents, posts, and news. | Demo |
| DATA-02 | Preserve stable external identifiers and source links. | Demo |
| DATA-03 | Extract people, organizations, dates, deadlines, promises, and action candidates. | Demo |
| DATA-04 | Store raw authorized source data separately from derived summaries and embeddings. | Demo |
| DATA-05 | Build keyword and semantic retrieval with mandatory tenant filters. | Demo |
| DATA-06 | Attach citations to answers, briefings, and suggested actions. | Demo |
| DATA-07 | Track synchronization freshness and data-access failures. | Demo |
| DATA-08 | Let users confirm or correct important extracted commitments. | Demo |
| DATA-09 | Define memory retention, correction, deletion, and re-indexing behavior. | Post-demo |
| DATA-10 | Add evaluation datasets for retrieval quality and source attribution. | Post-demo |

### 24.8 Artificial Intelligence and Reasoning

| ID | Work item | Target |
|---|---|---|
| AI-01 | Define system instructions and tool boundaries for the Orb. | Demo |
| AI-02 | Ensure retrieved content cannot override system rules or the approval requirement. | Demo |
| AI-03 | Build briefing synthesis with citations and completeness warnings. | Demo |
| AI-04 | Build cross-source question answering. | Demo |
| AI-05 | Build suggested-reply and suggested-action generation. | Demo |
| AI-06 | Create a user-editable communication-style profile from authorized examples. | Demo |
| AI-07 | Add confidence and missing-context language based on source availability. | Demo |
| AI-08 | Add deterministic validation before any AI-requested tool execution. | Demo |
| AI-09 | Create test cases for hallucination, stale data, conflicting sources, and prompt injection. | Demo |
| AI-10 | Evaluate Company Brain, Sprint Intelligence, and Bus-Factor reasoning against reviewed examples. | Post-demo |

### 24.9 Briefing Search and Orb

| ID | Work item | Target |
|---|---|---|
| ORB-01 | Rank meetings, deadlines, commitments, and unanswered messages for the briefing. | Demo |
| ORB-02 | Generate a briefing on sign-in and allow manual refresh. | Demo |
| ORB-03 | Show source, time, rationale, and suggested action for each briefing item. | Demo |
| ORB-04 | Implement text conversation and conversation history. | Demo |
| ORB-05 | Implement cross-source search and citation inspection. | Demo |
| ORB-06 | Allow follow-up questions that retain the current context. | Demo |
| ORB-07 | Show empty, incomplete, stale, loading, and failure states clearly. | Demo |
| ORB-08 | Add proactive notifications outside sign-in after the notification channel is approved. | Post-demo |

### 24.10 Actions and Approvals

| ID | Work item | Target |
|---|---|---|
| ACT-01 | Implement the suggested-action lifecycle and status model. | Demo |
| ACT-02 | Store the exact destination and payload shown for approval. | Demo |
| ACT-03 | Support preview, edit, approve, reject, expiry, and cancellation. | Demo |
| ACT-04 | Invalidate approval when the payload or destination changes. | Demo |
| ACT-05 | Make the approval service the only route to external write operations. | Demo |
| ACT-06 | Add idempotency keys to prevent duplicate sends or posts. | Demo |
| ACT-07 | Record approver, time, payload version, execution result, and errors. | Demo |
| ACT-08 | Implement at least one real approved action end to end. | Demo |
| ACT-09 | Add retry rules that cannot repeat a successful action. | Post-demo |

### 24.11 Voice

| ID | Work item | Target |
|---|---|---|
| VOICE-01 | Implement microphone permission and voice capture. | Demo |
| VOICE-02 | Transcribe user speech and allow correction before submission. | Demo |
| VOICE-03 | Generate and play spoken assistant responses. | Demo |
| VOICE-04 | Transcribe a supported incoming voice note. | Demo |
| VOICE-05 | Extract a person, promise, and deadline from a voice-note transcript. | Demo |
| VOICE-06 | Define audio retention and deletion rules. | Post-demo |

### 24.12 Work Social and News Features

| ID | Work item | Target |
|---|---|---|
| FEAT-01 | Detect unanswered messages and prepare a reply. | Demo |
| FEAT-02 | Detect a meeting request or conflict and prepare a response. | Demo |
| FEAT-03 | Track a confirmed commitment and surface it in a later briefing. | Demo |
| FEAT-04 | Demonstrate Company Brain reasoning with cited source history. | Demo |
| FEAT-05 | Generate a personalized news feed. | Demo |
| FEAT-06 | Recommend a relevant action from a news item. | Demo |
| FEAT-07 | Draft a social caption in the user’s style. | Demo |
| FEAT-08 | Demonstrate a scheduled-post confirmation flow with approved live access or fixtures. | Demo |
| FEAT-09 | Implement production-ready engagement and mention monitoring. | Post-demo |
| FEAT-10 | Implement workload, sprint, and Bus-Factor intelligence with reviewed privacy rules. | Post-demo |

### 24.13 Protect and Data Lifecycle

| ID | Work item | Target |
|---|---|---|
| PRO-01 | Display connected integrations, permissions, capability gaps, and last synchronization. | Demo |
| PRO-02 | Build an audit view for source access, proposals, approvals, and executions. | Demo |
| PRO-03 | Redact secrets and unnecessary personal data from application logs. | Demo |
| PRO-04 | Implement an export request and produce an inspectable export for demo data. | Demo |
| PRO-05 | Implement a protected deletion flow for demo data. | Demo |
| PRO-06 | Add citations to every high-impact demo answer. | Demo |
| PRO-07 | Display explicit warnings for incomplete or stale information. | Demo |
| PRO-08 | Define production retention, backup deletion, legal-hold, and recovery policies. | Post-demo |
| PRO-09 | Conduct an independent security and privacy review. | Post-demo |

### 24.14 Quality Deployment and Demo Operations

| ID | Work item | Target |
|---|---|---|
| QA-01 | Add unit tests for normalization, tenant filters, approval rules, and idempotency. | Demo |
| QA-02 | Add integration tests for each live connector. | Demo |
| QA-03 | Add end-to-end tests for the approved demo journeys. | Demo |
| QA-04 | Test permission denial, expired tokens, rate limits, missing sources, and third-party outages. | Demo |
| QA-05 | Test keyboard navigation, focus order, labels, contrast, and readable error states. | Demo |
| QA-06 | Run a security review focused on tenant isolation, token storage, tool authorization, and prompt injection. | Demo |
| QA-07 | Deploy a stable demo environment with seeded fallback data. | Demo |
| QA-08 | Add health checks, error monitoring, and an operator runbook. | Demo |
| QA-09 | Prepare the demo script, test accounts, reset procedure, and fallback path. | Demo |
| QA-10 | Rehearse the complete demo under realistic network conditions. | Demo |
| QA-11 | Record known limitations and ensure the presenter can explain live versus simulated functionality. | Demo |
| QA-12 | Complete load, recovery, penetration, privacy, and compliance testing before production launch. | Post-demo |

---

## 25. Recommended Immediate Decisions

To protect the delivery date, the team should make the following decisions first:

1. Build a responsive web demonstration rather than separate native mobile applications.
2. Use Gmail, Google Calendar, Google Drive, one messaging service, and one news source as the live integration set.
3. Use fixture-backed adapters for platforms blocked by credentials, app review, or unreliable access.
4. Make the daily briefing, Orb search, cited reasoning, and approval-gated action the primary demo journey.
5. Treat social publishing, voice-note extraction, and Protect as supporting journeys.
6. Freeze additional feature requests after the first implementation day unless they replace an existing committed item.
7. Present live and simulated capabilities accurately to the audience.
