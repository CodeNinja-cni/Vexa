# Vexa Implementation Stack

## Delivery strategy

Vexa will ship first as a responsive web application. The nine-day build will prove the central journey: observe authorized sources, identify what matters, explain it with citations, prepare an action, request approval, execute safely, and record the result.

## Languages

- **TypeScript** for the web interface, server routes, connector adapters, domain contracts, background jobs, and tests.
- **SQL** for PostgreSQL schema, migrations, tenant isolation, audit records, and retrieval queries.
- **CSS** for the Vexa visual system and responsive layouts.
- **JSON/YAML** for configuration, fixtures, continuous integration, and deployment manifests.

## Application stack

| Area | Tool | Purpose |
|---|---|---|
| Web framework | Next.js with React | Responsive product interface and server APIs in one deployable application |
| Runtime | Node.js 22+ | Local development, builds, server execution, and worker processes |
| Validation | Zod | Validate API inputs, connector payloads, and AI tool parameters |
| Database | PostgreSQL | Tenant-owned operational data, approvals, executions, citations, and audit events |
| ORM and migrations | Drizzle ORM and Drizzle Kit | Typed schema, SQL migrations, and database access |
| Background work | Inngest initially | Synchronization, briefing generation, retries, and scheduled work without operating a queue cluster |
| Search | PostgreSQL full-text plus pgvector | Keyword and semantic retrieval with mandatory tenant filters |
| Authentication | Auth.js or the team's existing identity provider | Sign-in, sessions, organizations, and provider OAuth |
| AI | OpenAI Responses API behind a provider interface | Grounded synthesis, structured extraction, and tool-driven Orb interactions |
| Voice | OpenAI speech-to-text and text-to-speech behind interfaces | Voice capture, transcription, and spoken responses |
| Connectors | Google APIs plus Slack or Telegram | Initial live mail, calendar, files, and messaging journeys |
| News | RSS/GNews/NewsAPI adapter | Personalized news ingestion with source links |
| UI icons | Lucide React | Consistent accessible interface icons |

## Engineering and operations tools

| Area | Tool | Purpose |
|---|---|---|
| Package management | npm | Dependency and script management |
| Source control | Git and GitHub | Reviewable changes and protected integration |
| Code quality | ESLint and TypeScript strict mode | Static analysis and type safety |
| Unit/component tests | Vitest and Testing Library | Domain logic and interface behavior |
| End-to-end tests | Playwright | Critical briefing, Orb, approval, and connector journeys |
| API inspection | Bruno or Postman | Connector and callback debugging |
| Local services | Docker Compose | Reproducible PostgreSQL development environment |
| CI | GitHub Actions | Lint, type checking, tests, build, and migration validation |
| Hosting | Vercel for the web app; managed PostgreSQL | Fast demo deployment with preview environments |
| Monitoring | Sentry plus structured application logs | Error capture, correlation IDs, and demo diagnostics |
| Product analytics | PostHog, after consent rules are approved | Funnel and feature-usage measurement |
| Secrets | Hosting-provider encrypted environment variables | OAuth credentials and service keys; never committed to Git |

## Repository shape

The first implementation uses one Next.js application so the team can move quickly. Domain logic, connectors, and AI providers remain behind explicit interfaces so workers or services can be split out later without rewriting the product.

```text
src/
  app/          routes, layouts, and API endpoints
  components/   reusable product interface
  lib/
    connectors/ external-service adapter contracts
    domain/     entities, validation, and business rules
    fixtures/   clearly labelled demo fallback data
```

## Tools intentionally deferred

- Redis and a dedicated queue cluster, unless synchronization volume requires them.
- Elasticsearch or a standalone vector database, until PostgreSQL retrieval is insufficient.
- Native iOS and Android applications during the nine-day demo build.
- Kubernetes and multi-region infrastructure before product demand justifies the operational cost.
