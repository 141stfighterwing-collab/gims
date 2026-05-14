---
name: pre-release
description: WORKFLOW SKILL - WeaveNote pre-release readiness and release decision gate. Use when: preparing a release candidate, deciding patch release vs batching, validating changelog coverage, confirming verification command coverage, checking migration/docs/task-log completeness, and producing a GO or HOLD recommendation for v1.x.
---

# Pre-Release Readiness (WeaveNote)

## Purpose
Run a repeatable release-readiness workflow before cutting any v1.x release of WeaveNote.

This skill supports release decisions — it does not force a release.

Aligned with:
- Docker-based deployment model
- PostgreSQL + Prisma migrations
- API + frontend coupling
- Version tracking (`system_versions`)
- Patch-first release philosophy (1.x.y)

---

## Trigger Phrases
- pre-release check
- release readiness
- should we ship 1.x.x
- patch release gate
- go/no-go release
- release candidate audit
- docker release validation
- migration safety check

---

## Inputs
- Target branch (default: `main` or `dev`)
- Candidate scope:
  - single commit
  - commit range
  - `all Unreleased`
- Proposed version (e.g., `1.6.4`)
- Release urgency (low / medium / high)
- Deployment type (local docker / on-prem / cloud hybrid)

---

## Workflow

### 1) Identify release scope
Collect commits and classify changes:

Impact categories:
- **data integrity / database correctness**
- **security (auth, secrets, exposure)**
- **runtime stability (API, Docker, startup)**
- **UX / AI / frontend behavior**
- **docs / config / maintenance**

Capture:
- commit SHA
- summary
- files touched
- affected layer:
  - frontend
  - backend
  - database
  - docker / infra
- risk level: low / medium / high
- rollback complexity

---

### 2) Detect system-level risk
Special WeaveNote checks:

- Prisma schema changes?
- migration required?
- environment variable changes?
- Docker config / ports changed?
- API contract changed?
- AI integration affected (Gemini)?
- database writes or transformations modified?

Flag anything that affects:
- startup success
- existing user data
- container orchestration

---

### 3) Decide release shape

#### Ship patch (1.x.y)
- isolated fix
- no schema risk OR verified migration
- strong verification coverage
- minimal blast radius

#### Batch
- multiple low-risk improvements
- incomplete verification or docs
- UX-only or maintenance changes

#### HOLD
- migration unclear or unsafe
- security implications not verified
- runtime instability risk
- rollback not defined

---

### 4) Validate changelog coverage
Ensure release notes reflect:

- all user-visible fixes
- API or behavior changes
- migration steps (if any)
- environment variable updates
- Docker or deployment changes
- breaking or risky changes clearly flagged

---

### 5) Validate verification coverage

Expect evidence for:

- Docker build + startup
- API health (`/api/health`)
- database connection + migrations
- frontend load
- auth flow (login/register)
- note CRUD operations
- AI feature sanity check (if touched)

Flag gaps:
- no verification for changed layer
- migration not tested
- only "it builds" validation

---

### 6) Check release-supporting artifacts

| Item | Status |
|------|--------|
| migration notes | required if schema changed |
| rollback steps | required for non-trivial changes |
| .env changes documented | critical |
| API changes documented | required |
| Docker changes validated | critical |
| task log / implementation notes | helpful |
| known issues listed | recommended |

---

### 7) Risk assessment

#### Data integrity
- note storage correctness
- Prisma schema alignment
- migration safety
- export/import unaffected

#### Security
- JWT handling
- secret exposure
- unsafe defaults
- auth bypass risk

#### Runtime stability
- container startup success
- API crash risk
- DB connectivity
- port conflicts

#### UX / AI / docs
- broken UI flows
- confusing changes
- AI degradation
- missing guidance

---

### 8) Produce recommendation

Return:

- **GO**
- **GO with watch items**
- **HOLD**

#### GO requires:
- no high-risk unresolved issues
- migrations safe or not present
- Docker + API verified working
- changelog complete
- rollback path known

#### HOLD if:
- migration unclear
- startup risk exists
- verification gaps in critical paths
- release would risk data or availability

---

## Output Format

### Release Candidate Summary
- branch:
- scope:
- proposed version:
- urgency:
- recommendation:

### Scope Inventory
| SHA | Change | Layer | Risk | Verified | Notes |
|-----|--------|------|------|---------|------|

### Coverage Review
- changelog:
- verification:
- migration/docs:

### Risk Notes
- data integrity:
- security:
- runtime:
- UX/docs:

### Decision
(GO / GO with watch items / HOLD)

### Required Actions Before Release
(blockers only)

### Watch Items After Release
(non-blocking monitoring)

---

## Heuristics (WeaveNote-specific)

- Any **Prisma schema change = automatic scrutiny**
- Any **Docker or port change = startup risk**
- Any **auth/security change = high priority validation**
- Prefer patch releases for:
  - security fixes
  - data correctness fixes
- Prefer batching for:
  - UI tweaks
  - minor refactors
- If migration or rollback is unclear → **HOLD**

---

## Notes
- Be explicit about missing evidence
- Do not assume Docker success without testing
- Separate **blockers vs watch items**
- Bias toward user data safety over release speed
