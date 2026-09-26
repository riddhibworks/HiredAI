# HiredAI — AI-Powered Job Application Automation Platform

Implementation of [job-application-automation-spec.md](job-application-automation-spec.md).
Every prepared application stops at a review screen — nothing is ever submitted
without an explicit user click on **Apply**.

## What's implemented

**Backend (Spring Boot 3 / Java 21)** — `backend/`
- JWT auth (register/login), BCrypt password hashing
- Profile CRUD
- Resume upload (PDF/DOCX) with Apache Tika text extraction + keyword-based parsing,
  stored on disk with parsed JSON in Postgres
- Platform connection CRUD with AES-256-GCM encrypted credential storage
  (`EncryptionService`)
- Job listing search/pagination + a keyword-overlap `MatchingService`
- `PlatformAdapter` interface (`search`, `prepareApplication`, `submit`) with:
  - **LinkedIn** and **Indeed** `search()` implemented via Selenium/ChromeDriver
    browser automation (`LinkedInEasyApplyAdapter`, `IndeedAdapter`) — see the
    **Platform automation risk** section below before using these
  - **Workday** left as a `TODO` stub (account creation/consent flow not built)
  - `prepareApplication()`/`submit()` are still `TODO` stubs for all three —
    only search/ingestion is wired up to real browser automation so far
- Apply queue: RabbitMQ-backed prepare pipeline (`ApplyQueueService` →
  `ApplyQueueWorker`), daily per-user rate limiting on preparation
- Review/Apply/Discard/Field-edit/Log endpoints — `ApplySubmissionService` is the
  **only** code path allowed to call an adapter's `submit()`, and it is only ever
  invoked from the user-initiated `POST /api/applications/{id}/apply` endpoint
- `JobIngestionScheduler` runs per connected platform per user, using that user's
  saved search criteria + decrypted stored credentials; also triggerable on-demand
  via `POST /api/platforms/{name}/sync` ("Fetch Jobs Now" button in the UI). A login
  failure or CAPTCHA/security checkpoint marks the connection `NEEDS_REAUTH` instead
  of retrying automatically.

**Frontend (React 18 + TypeScript)** — `frontend/`
- Auth pages, JWT stored via Zustand + persisted to localStorage
- Profile, Resumes (drag-and-drop upload), Platform connections (connect + **Fetch
  Jobs Now** to sync on demand), Job feed (search + "Prepare Application"),
  Applications dashboard, and a Review screen that renders every filled field + the
  live-session screenshot with the single **Apply** button

**Infra**
- `docker-compose.yml` wires Postgres, Redis, RabbitMQ, backend, and frontend
- Dockerfiles for both services; the backend image installs Chromium +
  chromedriver (Alpine packages) so Selenium can run inside the container

## ⚠️ Platform automation risk — read before connecting real accounts
LinkedIn's and Indeed's Terms of Service prohibit automated scraping and bot logins.
The `LinkedIn`/`Indeed` adapters log in with your stored credentials and drive a real
Chrome session to read search results:
- LinkedIn actively detects automation and can rate-limit, checkpoint (CAPTCHA), or
  **suspend the account** — even when it's your own account and credentials.
- Indeed's search page uses bot-detection that may block headless/automated Chrome
  outright.
- CSS selectors in both adapters target each site's current DOM and **will break**
  as LinkedIn/Indeed ship UI changes; treat them as a starting point to maintain,
  not a stable integration.
- `app.automation.headless=false` (default) runs a visible browser window so you can
  watch it work and manually solve a CAPTCHA if one appears, per the spec's
  "pause and notify" policy — a `PlatformAuthException` marks the connection
  `NEEDS_REAUTH` rather than retrying blindly.

Use this at your own risk and discretion, ideally on a low-stakes/secondary account
first. The officially-sanctioned path is a real API partnership (LinkedIn Talent
Solutions, Indeed's employer/publisher APIs) — those require applying for partner
access and are the only integration path with no ToS risk.



## Not yet implemented (flagged as TODO in code)
- Real Selenium/Playwright `prepareApplication()`/`submit()` flows (LinkedIn Easy
  Apply, Workday multi-step wizard, held-session lifecycle/expiry) — search/ingestion
  is wired up for LinkedIn and Indeed, but filling and submitting applications is not
- Workday account auto-creation + consent prompt + email verification flow
- Real Greenhouse/Lever API integration and an official Indeed/LinkedIn partner API
  path (the current adapters scrape public/logged-in pages instead — see the risk
  section above)
- LLM-based match scoring (current `MatchingService` is keyword overlap only)
- CAPTCHA detection surfaced to the user for manual solving mid-session (currently
  just marks the connection `NEEDS_REAUTH` after the fact)
- Vault-based secrets management (currently a config-driven AES key — fine for
  dev, swap for HashiCorp Vault/Jasypt-backed secret before production)

## Running locally

### Full stack via Docker
```powershell
docker compose up --build
```
Backend on http://localhost:8080, frontend on http://localhost:5173.

### Backend only (for development)
Requires Postgres/Redis/RabbitMQ reachable (or run just those three from
`docker-compose.yml`), Java 21, and Maven with access to Maven Central.
```powershell
cd backend
mvn spring-boot:run
```
Config lives in `src/main/resources/application.yml`; every value is
overridable via environment variable (`DB_HOST`, `JWT_SECRET`,
`ENCRYPTION_SECRET`, etc.). **Never use the default dev secrets in production.**

### Frontend only
Requires Node 20+ with npm registry access.
```powershell
cd frontend
npm install
npm run dev
```
Vite dev server proxies `/api` to `http://localhost:8080`.

> Note: dependencies could not be downloaded/verified in this environment
> (no network access to Maven Central / npm registry), so `mvn compile` and
> `npm install` have not been run against this scaffold yet — run them in an
> environment with registry access before first use.

## Project layout
```
backend/   Spring Boot API (entities, repositories, security, services, controllers, adapters)
frontend/  React + TypeScript SPA
docker-compose.yml
```
