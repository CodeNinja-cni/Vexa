# Vexa Competitive Product Strategy and Nine Day Delivery Plan

**Status:** Implementation baseline  
**Updated:** 18 September 2026  
**Audience:** Product, design, engineering, and leadership

## Executive decision

Vexa should not compete as another AI inbox, calendar, or general chatbot. The strongest position is an **evidence-first Attention OS**: a personal and team command center that connects conversations, commitments, time, relationships, and market signals; explains what deserves attention; prepares the next move; and never performs an external write action without explicit approval.

The current implementation proves that position through a premium responsive interface, an explainable attention queue, a unified inbox, relationship memory, an adaptive focus plan, an opportunity radar, source freshness, and an approval-scoped action review. Live connectors, grounded retrieval, and real action execution remain the primary engineering work for the nine-day window.

## What the market has validated

### Kinso

Kinso is the closest directional competitor. Its public product emphasizes one inbox for Gmail, LinkedIn, Slack, WhatsApp, and Instagram; goal-aware priority ranking; morning briefings; voice access; auto-labeled topics; semantic search; cross-platform contact history; contextual linking between related conversations; and replies drafted in the user's voice.

**What stands out:** Kinso makes fragmented business communication feel like one continuous relationship history. Its strongest product story is not summarization; it is knowing who matters, connecting conversations that belong together, and placing a ready-to-edit reply beside the message.

**Gap Vexa can exploit:** Kinso's public experience is messaging-centric and waitlist-led. Its site does not show deep project reasoning, source-level confidence and freshness, capacity planning, opportunity discovery, team continuity, or a detailed approval and audit model. This is an inference from the capabilities Kinso currently presents publicly, not a claim that the product cannot support them.

### Lindy

Lindy combines inbox triage, drafted replies, calendar management, meeting preparation and recording, reminders, action-item tracking, and cross-app work through a large integration catalog. It also separates private personal context from approved shared team sources.

**What stands out:** Lindy behaves like a delegated executive assistant. It is strongest when the user asks it to perform recurring operational work across apps.

**Gap Vexa can exploit:** Broad automation can make reasoning, provenance, and the exact permission boundary harder to understand. Vexa should make the evidence, proposed payload, destination, freshness, and approval scope visible before execution.

### Motion and Reclaim

Motion continuously auto-schedules work from deadlines, priorities, dependencies, and available time, then re-optimizes the day when conditions change. Reclaim protects focus time, habits, buffers, no-meeting days, and task work while adapting them around meetings and personal priorities.

**What stands out:** They convert priorities into calendar reality. Users do not only receive advice; they receive a feasible plan.

**Gap Vexa can exploit:** Calendar optimization is only one slice of the user's world. Vexa can decide what deserves time from email, messages, documents, meetings, relationships, and news, then protect time for the selected work with an explanation.

### Shortwave and Superhuman

Shortwave brings semantic search, email writing, thread summaries, scheduling, and an AI agent into the inbox. Superhuman adds auto labels, decluttering, reminders, thread summaries, replies in the user's voice, and a speed-first keyboard experience.

**What stands out:** They reduce the time between opening a message and reaching inbox zero. Their interaction quality, shortcuts, and drafted replies set the bar for communication speed.

**Gap Vexa can exploit:** Email remains the center of gravity. Vexa should preserve their speed while ranking work across communication channels, calendar, documents, relationship history, market developments, and team commitments.

### Microsoft 365 Copilot Cowork and Google Gemini

Microsoft now supports enterprise search, daily briefings, inbox and calendar management, document creation, meeting intelligence, recurring prompts, and approval before important actions across Microsoft 365. Google is expanding Gemini across Gmail, Drive, Docs, Slides, Chat, Calendar, Tasks, and selected third-party services, including cross-app creation and scheduling.

**What stands out:** Both companies have native distribution, deep suite permissions, and a broad action surface.

**Gap Vexa can exploit:** Their advantage is strongest inside their own ecosystems. Vexa should be the neutral intelligence layer across Google, Microsoft, Slack, Telegram, project tools, social accounts, and relevant external news, with one consistent evidence and approval model.

### Notion AI

Notion combines enterprise search, connected-app retrieval, meeting notes, research, page and database actions, and custom recurring agents.

**What stands out:** Knowledge, workflow, and agents live in the same editable workspace. Verified pages can be distinguished from stale material.

**Gap Vexa can exploit:** Notion is strongest when work is already captured in Notion or a connected enterprise source. Vexa should identify commitments and opportunities before they are manually organized into a knowledge base.

## Competitive feature matrix

| Capability | Category leaders | Vexa product requirement | Current state |
|---|---|---|---|
| Unified cross-channel inbox | Kinso, Shortwave, Superhuman | Rank messages from work and social sources by impact and relationship context | Live Gmail read model, deterministic ranking, search, rationale, and reply handoff implemented; other channels explicitly demo |
| Morning briefing | Kinso, Lindy, Microsoft | Voice and text briefing with priorities, reasons, sources, and next actions | Interactive briefing implemented; live generation pending |
| Relationship memory | Kinso | Cross-channel person history, promises, follow-ups, and opportunities | Live Gmail aggregation, relationship signals, commitment extraction, evidence inspection, and follow-up handoff implemented; other channels pending |
| Drafts in the user's voice | Kinso, Lindy, Shortwave, Superhuman | Style profile, editable drafts, visible source context, approval before send | Deterministic grounded drafts and editable immutable versions implemented; learned style model pending |
| Universal search | Kinso, Notion, Microsoft, Google | Semantic and keyword retrieval across every authorized source | Grounded Orb retrieval across Gmail and Calendar plus client-side Inbox search implemented; embeddings pending |
| Adaptive scheduling | Motion, Reclaim, Microsoft | Protect focus time based on evidence-backed priorities and calendar constraints | Live Calendar availability engine, conflict detection, recovery buffers, free-window evidence, and approval-staged proposals implemented; external writes pending |
| Cross-app execution | Lindy, Microsoft, Google, Notion | Prepare actions across apps and execute only after scoped approval | Approval domain and review UI implemented; live writes pending |
| Meeting intelligence | Lindy, Microsoft, Notion | Pre-brief, capture decisions, extract promises, prepare follow-ups | Data model direction defined; capture pipeline pending |
| Opportunity intelligence | No single leader | Connect news, relationships, company goals, and timing into actionable opportunities | Opportunity Radar UI implemented; signal pipeline pending |
| Evidence and freshness | Notion partly; Microsoft partly | Source links, observed time, completeness warnings, and coverage score | Citations, warnings, and coverage UI implemented |
| Safe action control | Microsoft, Kinso review flow | Exact payload and destination review, stale-approval invalidation, idempotent execution, audit trail | State machine and interactive review implemented |
| Team continuity | Lindy shared knowledge, Notion | Authorized company memory and bus-factor briefing with historical reasoning | Schema and product requirement defined; UI and retrieval pending |

## Vexa differentiators to protect

### Explainable attention ranking

Every priority should answer four questions without another prompt: what happened, why it matters now, which evidence supports it, and what Vexa recommends next. Ranking must be editable so the user can correct goals, people, and topics.

### Evidence coverage and honest gaps

Answers and actions should expose their source set, observation time, connector health, and completeness. Vexa should say when Slack is stale, a thread is inaccessible, or an answer is based on partial context. Confidence without coverage is not trustworthy.

### One approval model everywhere

Sending a message, accepting or moving a meeting, publishing a post, or changing an external record must use the same visible sequence: prepare, show exact payload and destination, request approval, execute once, and record the outcome. Editing the payload invalidates the approval.

### Relationship and opportunity intelligence

Vexa should remember promises, detect neglected relationships, identify warm introductions, and connect market developments to people already in the user's network. This turns the assistant from a productivity tool into a growth and decision system.

### Neutral cross-ecosystem context

Vexa should connect Google Workspace, Microsoft 365, Slack, Telegram, project tools, social accounts, and news rather than depending on a single vendor's suite. Permissions must remain source-native and tenant-scoped.

## Customer segments with the strongest near-term fit

1. **Founders and executives:** fragmented conversations, relationship follow-up, investor and customer commitments, and meeting preparation.
2. **Client-service leaders:** account context, unanswered requests, deliverable risk, meeting follow-ups, and cross-channel communication.
3. **Sales and partnerships teams:** relationship memory, warm-path detection, timely follow-ups, meeting preparation, and opportunity signals.
4. **Small teams without an operations layer:** daily priorities, blockers, bus-factor continuity, and approval-safe execution.
5. **Regulated or trust-sensitive teams:** evidence, permission visibility, auditability, tenant isolation, and deliberate human approval.

Vexa should not target broad consumer life management or fully autonomous enterprise agents in the nine-day build. Both expand integration, liability, and reliability requirements beyond the available window.

## Nine day delivery order

### Days 1 and 2 Complete the demonstrable product spine

- Keep the upgraded Today, Inbox, People, Focus, Orb, search, and action review experience stable.
- Convert fixture interactions into a consistent typed service boundary.
- Add component and end-to-end coverage for navigation, source inspection, draft review, approval, stale approval, and duplicate execution.
- Preserve the fixture-mode label everywhere live data is not available.

### Days 3 and 4 Connect one complete Google journey

- Implement authentication and organization membership.
- Connect Gmail and Google Calendar with the minimum read scopes required.
- Normalize threads, messages, attendees, events, deadlines, and source URLs into tenant-owned records.
- Generate a real daily briefing from retrieved records with source citations and completeness warnings.

### Days 5 and 6 Make one action real and safe

- Implement Gmail draft creation first; keep final send behind explicit approval.
- Persist suggested actions, payload versions, approval records, idempotency keys, execution outcomes, and audit events.
- Reject stale approvals after any edit and prevent duplicate execution after success.
- Add connector error states and retry behavior without hiding partial failure.

### Day 7 Add relationship memory and meeting preparation

- Extract people, organizations, promises, decisions, deadlines, and unanswered questions.
- Build a person timeline across Gmail and Calendar.
- Produce a pre-meeting brief with recent context, open promises, and cited sources.

### Day 8 Harden and measure

- Verify organization filters on every query and mutation.
- Add encrypted credential references, structured logs, correlation IDs, rate-limit handling, and data deletion entry points.
- Run accessibility, mobile, empty-state, degraded-connector, and approval-safety tests.
- Measure time to first briefing, citation coverage, action approval rate, and connector freshness.

### Day 9 Demo rehearsal and release candidate

- Freeze nonessential features.
- Seed a deterministic demo organization with realistic but non-sensitive data.
- Rehearse the story: connect, brief, inspect evidence, ask Orb, prepare, approve, execute, audit.
- Prepare a fallback fixture mode so the demo remains reliable if an external provider fails.

## Nonnegotiable release criteria

- Every material briefing item has at least one inspectable source.
- Missing or stale context is visible.
- No external write occurs without an immediately preceding approval for the exact payload and destination.
- An edited payload cannot reuse an earlier approval.
- A successful action cannot execute twice.
- Every database access is tenant-scoped.
- Fixture data is clearly labeled and never presented as a live connection.
- The critical journey passes on desktop and mobile with keyboard-accessible controls.
- The product can demonstrate value even if social-platform approval is unavailable.

## Work that should wait

- Full social publishing and direct-message coverage across every network.
- WhatsApp integration during the demo window.
- Native mobile applications.
- Autonomous execution without per-action approval.
- A general-purpose workflow builder.
- Dedicated vector infrastructure before PostgreSQL retrieval proves insufficient.
- Kubernetes, multi-region deployment, and complex microservice separation.

## Evidence sources

- Kinso product and FAQ: https://www.kinso.ai/
- Lindy assistant and enterprise product: https://www.lindy.ai/ and https://www.lindy.ai/enterprise
- Motion task manager and product documentation: https://www.usemotion.com/features/ai-task-manager and https://www.usemotion.com/help
- Reclaim features and 2.0 overview: https://help.reclaim.ai/en/articles/6210740-features-in-reclaim and https://help.reclaim.ai/en/articles/14846468-reclaim-ai-2-0-overview
- Shortwave AI Assistant: https://www.shortwave.com/docs/guides/ai-assistant/
- Superhuman Email Assistant: https://superhuman.com/agents/email-assistant
- Microsoft Copilot Cowork: https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/
- Gemini in Gmail and Workspace: https://workspace.google.com/products/gmail/ai/ and https://workspace.google.com/blog/product-announcements/less-switching-more-flow-5-new-agentic-capabilities-across-google-workspace-apps
- Notion AI: https://www.notion.com/en-gb/product/ai

## Implementation status

The product now includes a public responsive landing page, a separate investor demo, optional Google sign-in, first-party email/password workspace creation, authenticated `/app` routing, and logout. Credential passwords use memory-hard scrypt hashes; sessions are opaque, database-backed, HTTP-only, same-site cookies; auth mutations check request origin; and new credential accounts remain visibly disconnected from Google until an integration is explicitly authorized. The application passes ESLint, strict TypeScript, 44 unit tests across thirteen test files, and a production Next.js build. The current live path prepares deterministic Gmail-grounded drafts, persists their evidence lineage, records server-owned approvals, and gives the Orb tenant-and-user-scoped search across Gmail and Calendar with visible citations. The Inbox loads tenant-and-user-scoped Gmail records, deterministically ranks Priority, Waiting, Opportunity, and FYI messages, exposes its reason and source mode, and hands live records into the evidence-linked approval flow without requiring a paid AI API. The People view groups authorized Gmail records by external contact, derives opportunity, reply, waiting, and active signals, extracts evidence-linked commitments, exposes recent source history, and hands grounded follow-ups into the same approval flow. The Focus view calculates the next local workday from authorized Calendar records, detects overlaps, merges busy intervals, preserves recovery buffers, exposes every free window, and stages up to two deep-work proposals without writing to Google. The Action Center exposes the exact payload, immutable version history, evidence lineage, approval versions, execution history, and audit trail for each user-owned action. Editing creates a new version, preserves locked provenance, and invalidates previous approval while external sends remain disabled.
