# Building Methodology

This is the full build workflow reference for the Building Agent. Read this
document at the start of every session. AGENTS.md (auto-injected) contains
operating rules; this document contains the detailed procedures, decision
trees, and edge-case handling that support those rules.

If anything in this document contradicts AGENTS.md, AGENTS.md governs.

---

## 1. Session Lifecycle

A session corresponds to one build phase. The operator triggers it, you
execute it, and the session ends when all tasks in the phase are complete
or blocked.

### Session start

1. This document is at `docs/ops/building-methodology.md` — you are reading
   it now.
2. Pull latest:
   ```
   cd /root/.openclaw/workspace-build/[repo_name]
   git pull --rebase origin main
   ```
3. Read `[project_root]/CLAUDE.md` for project context (stack, commands,
   patterns, boundaries).
4. Post in Discord: `Session started. Ready for phase trigger.`
5. Wait for the operator to specify which phase to work on.

### After phase trigger

6. Read the triggered phase from `[project_root]/docs/specs/TASKS.md`.
   Focus on the tasks for that phase — avoid loading unrelated phases in
   detail unless needed to resolve a dependency reference or confirm phase
   boundaries.
7. Identify the dependency graph within the phase: which tasks are
   independent, which depend on earlier tasks.
8. Begin the task execution loop (Section 2) with the first independent
   task.

### Session end

When all tasks in the phase are complete or blocked:

1. Post the phase summary in Discord (see Section 5).
2. The session is done. The operator will start a fresh session for the
   next phase.

If context is getting long before the phase is finished: complete the
current task, open its PR, post a partial phase summary in Discord noting
which tasks are done and which remain, and request a fresh session.

---

## 2. Task Execution Loop

Execute tasks in the dependency order defined by TASKS.md. For each task:

### Step 1: Load task context

Read the spec sections listed in the task's `reads:` field. Example:

> reads: PRD.md §3.1, db-schema.md §Candidates, api-spec.yaml §/candidates

Load those specific sections — not the full files. If a section reference
does not exactly match the current spec structure:
- **Cosmetic mismatch** (heading renamed, section renumbered, but the
  content is clearly identifiable): load the matching section and note the
  discrepancy in the PR body.
- **Substantive ambiguity** (multiple plausible sections, unclear which
  requirement applies, or referenced section appears to have been removed):
  set the task to Blocked and ask the operator in Discord. Do not guess.

Also check:
- `depends-on:` — is the dependency merged? If not, skip this task and
  work on an independent one (see Section 4).
- `creates:` and `modifies:` — these are your expected file footprint.
  Know them before you start.

### Step 2: Create a branch

```
git checkout main
git pull --rebase origin main
git checkout -b task/TASK-{ID}-{slug}
```

The branch name is always `task/` prefix + task ID + short kebab-case slug.
Examples:
- `task/TASK-001-scaffold-nextjs`
- `task/TASK-007-candidate-api-endpoints`
- `task/TASK-022-gdpr-deletion-endpoint`

Always branch from `main`. Never branch from another feature branch.

### Step 3: Implement

Write the code that satisfies the task's acceptance criteria.

**What to follow:**
- CLAUDE.md for project conventions (naming, structure, patterns)
- The task's `reads:` spec sections for requirements
- The task's acceptance criteria (Gherkin) as your definition of done
- Existing code patterns in `src/` for consistency

**What to create/modify:**
- The files listed in the task's `creates:` and `modifies:` fields
- If you need to touch files outside those lists, do so only if strictly
  necessary and note the deviation in the PR body under Notes

**Implementation decisions:**
Where the spec is silent on implementation details (naming, error messages,
empty states, loading patterns, test fixture structure), make a sensible
local decision. Follow CLAUDE.md patterns if they exist. If you are
establishing a new convention, note it in the PR body and update the
Patterns and Conventions section of CLAUDE.md.

**What NOT to do:**
- Do not add features, routes, components, or logic not specified in the
  task. If the spec doesn't mention it, it's out of scope.
- Do not refactor existing code unless the task explicitly requires it.
- Do not optimise prematurely. Working and correct first.

### Step 4: Run local checks

Run all three checks before opening a PR.

**Baseline failure policy:** Before running checks on your implementation,
run them once on the clean branch (after `git checkout -b` but before any
code changes) to establish a baseline. If a check is already failing before
you write any code, record it as a pre-existing baseline issue. You may
proceed with your task only if: (a) your changes do not introduce
additional failures beyond the baseline, and (b) the task's own acceptance
criteria are satisfied. Note any pre-existing baseline failures clearly in
the PR body under Notes and in Discord.

#### Check 1: TypeScript compilation

```
npx tsc --noEmit
```

**What it catches:** Type errors, missing imports, interface mismatches.

**If it fails:**
- Read the error output. Most failures are missing types, wrong argument
  counts, or interface mismatches.
- Fix the code and re-run.
- If the error is in code you did not write, check your baseline run. If
  the same error existed before your changes, it is a pre-existing baseline
  issue — proceed per the baseline failure policy above.

#### Check 2: Biome lint and format

```
npx biome check .
```

**What it catches:** Style violations, lint errors, formatting issues.

**If it fails:**
- The PostToolUse hook already auto-formats files on write, so most Biome
  issues should be resolved automatically.
- If errors persist, they are likely lint violations (not formatting). Read
  the specific rule and fix the code.
- Do not add `// biome-ignore` suppressions unless you have a clear
  justification. Note any suppressions in the PR body.

#### Check 3: Tests

```
pnpm vitest run
```

**What it catches:** Failing unit and integration tests.

**If it fails:**
- If a test you wrote fails: fix your implementation or your test.
- If an existing test fails because of your changes: fix your
  implementation to satisfy the existing test.
- If an existing test fails and you believe the test is wrong (testing
  behaviour that contradicts the approved spec): do NOT modify the test.
  Set the task to Blocked and explain in Discord why you believe the test
  is incorrect, citing the specific spec section.

#### Local check failure protocol

If any check fails and you cannot fix it after 3 attempts at the same root
cause:
1. Do not open a PR.
2. Set the task to Blocked.
3. In Discord, report: the check that failed, the error output, what you
   tried, and why you could not resolve it.
4. Move to the next independent task in the phase.

### Step 5: Commit and push

Stage all changes, commit with a conventional message, and push:

```
git add -A
git commit -m "feat(TASK-{ID}): {short description}"
git push origin task/TASK-{ID}-{slug}
```

**Commit message prefixes:**
- `feat` — new functionality (most tasks)
- `fix` — correcting a bug or issue
- `chore` — config, tooling, dependency changes
- `test` — test-only changes

If a task involves multiple logical steps, you may make multiple commits on
the branch. Use the task ID in every commit message. The PR title always
uses the task title from TASKS.md: `TASK-{ID}: {title from TASKS.md}`.

### Step 6: Open a pull request

Use the GitHub REST API. The full procedure:

```bash
# Read the GitHub token
GITHUB_TOKEN=$(cat /root/.openclaw/workspace-build/.github-token)

# Derive owner and repo from git remote
REMOTE_URL=$(git remote get-url origin)
OWNER=$(echo "$REMOTE_URL" | sed -n 's|.*github\.com/\([^/]*\)/.*|\1|p')
REPO=$(echo "$REMOTE_URL" | sed -n 's|.*github\.com/[^/]*/\([^.]*\).*|\1|p')

# Set PR metadata
BRANCH="task/TASK-{ID}-{slug}"
TITLE="TASK-{ID}: {title from TASKS.md}"
```

Construct the PR body with all required sections:

```
## Task
TASK-{ID}: {title from TASKS.md}

## Risk
{low | medium | high} — {rationale from TASKS.md risk classification}

## Spec References
- {each item from the task's reads: field}

## Changes
- {each file created or modified, with brief description}

## Acceptance Criteria
{paste the Gherkin acceptance criteria from TASKS.md verbatim}

## Verifies
```
{verifies command from TASKS.md}
```

## Out of Scope / Deferred
{anything intentionally left out, follow-up items, or known gaps. Write
"None" if the task is fully self-contained.}

## Notes
{implementation decisions where spec was silent, new conventions
established, deviations from creates:/modifies: lists, Biome suppressions,
or issues encountered. Write "None" if straightforward.}
```

Create the PR:

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/$OWNER/$REPO/pulls \
  -d "$(jq -n --arg title "$TITLE" --arg head "$BRANCH" --arg body "$BODY" \
    '{title: $title, head: $head, base: "main", body: $body}')"
```

**After the PR is created:**
1. Note the PR number from the API response (`.number` field).
2. Post in Discord: `✅ TASK-{ID}: PR #{number} opened ({risk} risk)`
3. If high risk, also post: `⚠️ TASK-{ID}: PR #{number} is HIGH RISK —
   needs operator merge after preview review.`
4. Move immediately to the next task. Do not wait for CI.

**If the curl command fails:**
- Check that the GitHub token is valid: `curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user`
- Check that the branch was pushed: `git log --oneline origin/$BRANCH`
- If the token is expired or invalid, report in Discord and set all
  remaining tasks to Blocked.

### Step 7: Move to next task

After opening the PR, return to Step 1 for the next task in the phase.
Do not wait for CI results on the previous PR. CI and auto-merge operate
asynchronously.

If the next task depends on the previous one and it hasn't merged yet,
skip it and work on any independent task. If no independent tasks remain,
report in Discord and wait.

---

## 3. Risk-Tier Behaviour

Each task in TASKS.md carries a risk classification. Your workflow does not
change between risk levels — you always open a PR and move on. The
difference is in how GitHub handles the PR after you've moved on:

| Risk | Auto-merge | Your action |
|------|-----------|-------------|
| Low | Yes, on green CI | Open PR, move on |
| Medium | Yes, on green CI | Open PR, move on |
| High | No — requires operator | Open PR, flag in Discord, move on |

**What makes a task high risk** (defined in TASKS.md):
- Auth and permissions
- GDPR or data deletion
- Right-to-work verification
- Database migrations
- Cron jobs and background processing
- Secrets and environment configuration

The operator reviews high-risk PRs via Vercel preview URLs before clicking
merge. You do not wait for this review.

---

## 4. Dependency Handling

### Within a phase

Tasks within a phase may have dependencies on each other. Before starting
each task, check its `depends-on:` field:

- **No dependencies:** Start immediately.
- **Dependency is merged into main:** Start immediately — your
  `git pull --rebase` at branch creation picks it up.
- **Dependency has an open PR (not yet merged):** Skip this task. Work on
  any other independent task in the phase. Check back after completing
  other tasks — the PR may have auto-merged by then.
- **Dependency is Blocked:** This task is also Blocked. Include it in the
  phase summary as blocked due to dependency.

### Across phases

Tasks should not depend on tasks in a later phase. If you encounter this,
report it as a spec issue in Discord.

Tasks may depend on tasks from a previous phase. Those should already be
merged (the operator triggers phases in order). If a cross-phase dependency
is not merged, report in Discord and wait.

### Reordering

You may reorder tasks within a phase to maximise throughput as long as you
respect dependency constraints. If tasks A, B, C are in a phase and B
depends on A but C is independent, you may work on A then C while waiting
for A's PR to merge, then B.

---

## 5. Phase Completion and Reporting

When all tasks in the phase are done or blocked, post a phase summary in
Discord:

```
Phase {N} complete.

✅ TASK-{ID}: PR #{number} — {merged | open | auto-merging}
✅ TASK-{ID}: PR #{number} — {merged | open | auto-merging}
🔴 TASK-{ID}: Blocked — {one-line reason}
🔴 TASK-{ID}: Blocked (dependency on TASK-{ID})

{N} tasks complete, {M} blocked.
Ready for Phase {N+1} when you are.
```

If the phase was interrupted due to context length:

```
Phase {N} partial — session limit reached.

✅ TASK-{ID}: PR #{number} — {status}
⏳ TASK-{ID}: Not started (needs fresh session)
⏳ TASK-{ID}: Not started (needs fresh session)

Completed {X}/{Y} tasks. Remaining tasks need a fresh session.
```

---

## 6. Error Recovery Decision Tree

### Test failure

```
Is it your test or an existing test?
├── Your test → Fix your test or your implementation
└── Existing test
    ├── Failed because of your code change → Fix your implementation
    └── Appears to contradict the spec
        └── Do NOT modify the test
        └── Set task to Blocked
        └── Cite the specific spec section in Discord
```

### Build or type check failure

```
Is the error in your code?
├── Yes → Fix it
│   ├── Fixed after attempt 1-2 → Continue
│   └── Same root cause after 3 attempts → Block the task
└── No — check the baseline run
    ├── Same error in baseline → Pre-existing issue
    │   └── Proceed per baseline failure policy
    │   └── Note in PR body and Discord
    └── Not in baseline → Your changes caused it → Fix it
```

### Rebase conflict

```
git pull --rebase origin main
├── No conflict → Continue
├── Trivial conflict (adjacent lines, package.json) → Resolve and continue
└── Non-trivial conflict (overlapping logic)
    └── Stop
    └── Report in Discord: which files conflict and with which PR
    └── Do NOT force push
```

### PR creation failure

```
curl returns error
├── 401/403 → Token invalid or expired
│   └── Report in Discord, block all remaining tasks
├── 422 → Branch not pushed or PR already exists
│   └── Check: git log --oneline origin/$BRANCH
│   └── If branch exists, check for existing PR
│   └── If PR exists, note it and move on
└── Network error
    └── Retry once
    └── If still failing, report in Discord
```

### Dependency not merged

```
Task depends on TASK-X
├── TASK-X PR is merged → git pull --rebase, proceed
├── TASK-X PR is open, CI running → Skip, work independent tasks
├── TASK-X PR is open, CI failed → TASK-X may need fixing
│   └── Do NOT attempt to fix another task's PR
│   └── Report in Discord
└── TASK-X is Blocked → This task is also Blocked
```

---

## 7. Environment Reference

### Paths

| What | Path |
|------|------|
| Workspace root | `/root/.openclaw/workspace-build/` |
| Git repo | `/root/.openclaw/workspace-build/[repo_name]/` |
| Project root | `[repo_name]/[project_root]/` |
| Source code | `[repo_name]/[project_root]/src/` |
| Tests | `[repo_name]/[project_root]/tests/` |
| Prisma | `[repo_name]/[project_root]/prisma/` |
| Specs (read-only) | `[repo_name]/[project_root]/docs/specs/` |
| Research (off-limits) | `[repo_name]/[project_root]/docs/research/` |
| CLAUDE.md | `[repo_name]/[project_root]/CLAUDE.md` |
| GitHub token | `/root/.openclaw/workspace-build/.github-token` |
| This methodology | `docs/ops/building-methodology.md` |
| AGENTS.md | Auto-injected at session start |
| SOUL.md | Auto-injected at session start |

### Tools available

| Tool | Location | Purpose |
|------|----------|---------|
| git | system | Version control |
| node | system | JavaScript runtime |
| pnpm | system | Package manager |
| npx | via node | Run project-local binaries (tsc, biome) |
| curl | system | GitHub API calls |
| jq | /usr/bin/jq (v1.7) | JSON construction for PR bodies |

### Hooks (automatic, not under your control)

**PreToolUse** — triggers on Edit/Write/MultiEdit operations:
- Blocks writes to any path matching `docs/specs/` or `docs/research/`
- Exit code 2 = blocked (hard rejection, no override)
- Read access is not affected

**PostToolUse** — triggers on Edit/Write/MultiEdit operations:
- Runs `npx biome check --write "$FILE_PATH"` after every write
- Auto-formats your code to match project style
- You do not need to manually format; write clean code and let Biome
  handle the rest

---

## 8. Common Patterns

This section covers recurring implementation patterns. Consult CLAUDE.md
for project-specific conventions — the Patterns and Conventions section
there is the living reference. This section covers methodology-level
patterns that apply across projects.

### Installing dependencies

When a task requires a new npm package:

```
pnpm add {package}
```

or for dev dependencies:

```
pnpm add -D {package}
```

Before adding any package, verify it exists and is actively maintained:

```
pnpm view {package} name version description
```

If `pnpm view` returns an error, the package does not exist in the
registry — do not install it. Do not install packages based on memory
alone. Include the dependency addition in your commit.

### Database changes (Prisma)

When a task involves database schema changes:

1. Edit `prisma/schema.prisma`
2. Generate the client: `npx prisma generate`
3. Run migration only when the task explicitly requires it and the local
   database environment is configured:
   `npx prisma migrate dev --name {slug}`
   If the database environment is unavailable (missing env vars, no
   connection), set the task to Blocked and report the missing dependency.
4. Commit both the schema change and any generated migration

### Test file conventions

- Follow test placement conventions in CLAUDE.md if they exist; if none are
  established, default to colocated tests (next to the code they test) or
  the `tests/` directory
- Use the naming pattern from CLAUDE.md (if established)
- Each test file should be runnable independently:
  `pnpm vitest run {path/to/test}`
- Write tests that match the Gherkin acceptance criteria from TASKS.md

### Multiple commits on one branch

You may make multiple commits on a task branch. Use cases:
- Separating schema changes from implementation
- Committing a working checkpoint before a risky change
- Separating test additions from code changes

Every commit message must include the task ID:
`feat(TASK-{ID}): {description}`

The PR title uses the task title from TASKS.md.

---

*End of building methodology.*
