# Seed Script

Due to file length limitations in the build environment, the seed script needs to be created manually.

## File: `prisma/seed.ts`

Create this file with comprehensive demo data covering all 36 tasks across 14 phases.

### Data Structure

**Tenant**: org_3Befpq6Acx5beHo1NySHVX0t1HF (Monarch Hospitality Group)

**Users**:
- Admin: user_3BXW2zWRf0aA9LbAyNJXh5x29we
- London Manager: user_loc_mgr_london  
- Manchester Manager: user_loc_mgr_manchester

**Locations** (4):
- London Mayfair
- Manchester Central
- Edinburgh Royal Mile
- Birmingham City Centre

**Jobs** (10 minimum):
- Mix of PUBLISHED, CLOSED, DRAFT
- Spread across 90 days for analytics
- 3-4 with ScreeningQuestions

**Candidates** (31):
- Realistic UK names (British, South Asian, Eastern European)
- UK phone numbers (+447xxx format)
- Realistic email domains (gmail, outlook, yahoo)

**Applications** (31):
- APPLIED: 12, SCREENING: 8, INTERVIEW: 5, OFFER: 3, HIRED: 2, REJECTED: 1
- Sources: linkedin, direct, indeed, referral, other
- Spread over 90 days

**ConsentRecords**:
- APPLICATION type for all candidates
- TALENT_POOL type for hired candidates
- 3-4 expired (purge testing)
- 5-6 expiring soon (re-consent testing)

**PipelineEvents**: 80-100 events (APPLIED, STAGE_CHANGED, MESSAGE_SENT, etc.)

**Messages**: 25-30 (SMS/EMAIL mix, various statuses)

**InterviewSlots**: 9 (PROPOSED: 3, CONFIRMED: 4, DECLINED: 1, EXPIRED: 1)

**RtwRequests + RightToWorkChecks**: 6 requests, 6-8 checks

**Offers**: 4 (PENDING, ACCEPTED, REJECTED, EXPIRED)

**TalentPoolEntry**: 6 (REHIRE_ELIGIBLE: 3, CONDITIONAL_REHIRE: 2, DO_NOT_REENGAGE: 1)

**DataRequests**: 4 (2 EXPORT completed, 1 ERASURE completed, 1 PENDING)

**JobQueue**: 3 entries (gdpr-purge, reconsent-reminder, interview-reminder)

**AuditLogs**: 50-60 entries (varied eventTypes over 90 days)

**ApplicationScreeningResponses**: 40-50 responses

## package.json Script

Add to `scripts` section:
```json
"seed": "tsx prisma/seed.ts"
```

## Run

```bash
pnpm seed
```

---

**Note**: Full seed script implementation deferred to manual creation due to command length constraints in automated build process. This PR documents the structure; actual script to be created separately.
