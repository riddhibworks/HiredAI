# Job Listing Aggregator — Build Spec

Build a full-stack web application that aggregates job listings from multiple
platforms (LinkedIn, Indeed, etc.) into a single searchable feed. The user browses
and filters listings in one place; clicking a listing takes them to the original
job posting on the source platform to apply there. **No application automation, no
account creation on other platforms, no auto-submit** — this is a discovery/aggregation
tool only.

---

## 1. Tech Stack

**Backend:** Java 21, Spring Boot 3.x
- Spring Web (REST API)
- Spring Data JPA + PostgreSQL (persistence)
- Spring Scheduler or Quartz (periodic job-fetching from each source)
- Redis (cache recent search results, reduce duplicate calls to source APIs)

**Frontend:** React 18+ with TypeScript
- React Router
- React Query (data fetching/caching from backend API)
- Material UI or Tailwind CSS
- Basic filter/search UI (keyword, location, platform, date posted)

**Infra:**
- Docker + docker-compose for local dev (backend, frontend, Postgres, Redis)
- Spring profiles for `dev`/`staging`/`prod` config (API keys per source, DB creds)

---

## 2. Core Features

### 2.1 Job Source Integrations
- One **adapter per platform**, each implementing a common interface:
  `fetchJobs(searchCriteria) -> List<JobListing>`
- Use each platform's **official public API/RSS feed where available**
  (e.g., Indeed Publisher API/RSS, GitHub Jobs-style feeds, company ATS public
  boards like Greenhouse/Lever which often expose open JSON endpoints). Avoid
  scraping platforms whose Terms of Service prohibit it (LinkedIn in particular
  restricts unauthorized scraping) — check each platform's terms/API docs before
  adding an adapter, and skip or use only sanctioned methods where scraping is disallowed
- Each adapter maps the source's raw response into a common `JobListing` shape
  (title, company, location, salary if available, description snippet, postedDate,
  sourceUrl, sourcePlatform)
- Scheduled job (e.g., hourly) refreshes listings per active user search / saved filter,
  or on-demand refresh when the user searches

### 2.2 User Profile & Preferences
- Simple auth (email/password, JWT)
- Saved search criteria: keywords, location(s), remote/hybrid/onsite, seniority,
  salary range
- Toggle list to enable/disable which platforms are included in results (add/remove
  platforms per user, same UX idea as before — just for *search scope*, not applying)
- Optional resume upload purely for **matching/ranking** listings by relevance
  (not for submission anywhere) — parse with Apache Tika/PDFBox into skills/keywords,
  use simple keyword/TF-IDF overlap to compute a `matchScore` per listing

### 2.3 Job Feed UI
- Unified, paginated feed of listings across all enabled platforms
- Filters: keyword, location, platform, date posted, match score (if resume uploaded)
- Sort by: relevance, date posted, salary
- Each listing card shows: title, company, location, salary (if known), platform
  badge/logo, posted date, short description snippet
- **"View & Apply" button/link** on each listing — opens `sourceUrl` in a new tab,
  taking the user directly to the original posting on the source platform to apply
  themselves
- "Save" button to bookmark a listing for later (separate from applying)
- Optional: "Mark as Applied" manual toggle so the user can track their own
  application status locally (purely a personal tracker, does not talk to the
  source platform)

### 2.4 Notifications (optional)
- Daily/weekly email digest of new listings matching saved search criteria

---

## 3. Data Model

```
User(id, email, passwordHash, createdAt)
SearchPreference(id, userId, keywords[], locations[], remoteType, seniority, salaryMin, salaryMax, enabledPlatforms[])
Resume(id, userId, fileUrl, parsedSkillsJson, uploadedAt)
JobListing(id, platform, externalJobId, title, company, location, salaryRange, description, postedAt, sourceUrl, fetchedAt)
SavedJob(id, userId, jobListingId, savedAt, appliedManually [boolean], notes)
```

---

## 4. REST API Surface

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/preferences
PUT    /api/preferences                 (update keywords, locations, enabled platforms, etc.)

POST   /api/resume                      (optional, multipart upload, for match scoring only)

GET    /api/jobs?keyword=&location=&platform=&sort=&page=   (paginated unified feed)
GET    /api/jobs/{id}                   (full listing detail)

POST   /api/jobs/{id}/save              (bookmark)
DELETE /api/jobs/{id}/save
PUT    /api/jobs/{id}/mark-applied       (personal tracker toggle only)

GET    /api/saved-jobs
```

---

## 5. Non-Functional Requirements
- Only use platform data via official APIs/feeds or otherwise permitted access —
  document per adapter which method is used and link to the relevant API/ToS page
- Dedup listings across platforms where possible (e.g., same job cross-posted)
- Cache aggressively (Redis) to minimize redundant calls to source APIs and respect
  their rate limits
- Graceful degradation: if one platform's adapter fails/rate-limits, the feed still
  shows results from the others rather than failing the whole request
- Basic tests for each adapter's mapping logic and for the matching/scoring function

---

## 6. Suggested Build Order
1. Scaffold Spring Boot backend (entities, auth) + React frontend shell
2. Build one adapter end-to-end (pick the platform with the most permissive public
   API first) → unified `JobListing` model → basic feed API
3. Job feed UI: list view, filters, "View & Apply" external link
4. User preferences (keywords, locations, enabled platforms) + wiring into feed query
5. Add remaining platform adapters one at a time, each behind the same interface
6. Optional resume upload + match scoring
7. Save/bookmark + "mark as applied" personal tracker
8. Scheduled refresh job + Redis caching
9. Optional email digest notifications
10. Polish: dedup logic, empty/error states, rate-limit handling per adapter

---

## 7. Open Questions to Resolve Before Building
- Which platforms have a usable public API/feed vs. none at all (this determines
  the realistic platform list — LinkedIn in particular has very limited public
  API access for this kind of use case)
- Whether resume-based match scoring is in scope for v1 or a later enhancement
- Data retention policy for stored resumes (if that feature is included)