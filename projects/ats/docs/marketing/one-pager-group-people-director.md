---
title: "Solution One-Pager: Group People Director"
type: marketing
agent: marketing
status: draft
version: 1.0
created: 2026-03-26
parent: product-marketing-context.md
---

# Solution One-Pager: Group People Director

**Persona:** Siobhán — Group People Director, 18-location UK/Ireland restaurant and hotel group  
**Context:** Responsible for HR strategy, compliance, culture, and hiring process across the estate; reports to COO/CEO  
**Primary use case:** Multi-location pipeline visibility and compliance confidence

---

## Your #1 Challenge

You manage hiring for 18 locations. Each location has a general manager who's supposed to handle local recruitment, but you have no idea which sites have open roles, how many applications are in progress, or which pipelines are stalled — until someone rings you.

There is no dashboard. No early warning. You find out about problems reactively: a GM calls you at 9pm on Saturday because they're three people short for a busy service, or the COO asks you in a Monday morning meeting how many open roles the estate has and you genuinely don't know.

You've tried to implement process: a shared spreadsheet, a weekly hiring update call, a group email alias for applications. None of it sticks. Managers are busy running restaurants and hotels. They don't have time to update a spreadsheet. Applications land in individual manager inboxes, and half of them forget to respond for three days. By then, the candidate has taken another job.

The informal stack — spreadsheets, email, WhatsApp, individual Indeed subscriptions — works for 3 locations. At 18 locations, it's invisible chaos. You can't manage what you can't see.

---

## How Lapam-ATS Solves It

### Multi-Location Pipeline Dashboard: One Screen, Every Location, Real-Time

When you log into Lapam-ATS, you see a **single-screen dashboard** showing the hiring status for all 18 locations:

- **Open roles per location** (e.g., Manchester: 3 open roles; Dublin: 1 open role; Cardiff: 5 open roles)
- **Application counts per stage** (Applied → Screening → Interview → Offer → Hired) for each location
- **Days since last activity** for each open role (e.g., "London Southbank — Sous Chef — 7 days since last activity" flagged in amber)
- **Visual alerts** on stalled pipelines (e.g., "Birmingham New Street — Server — 0 active candidates, role open 12 days" flagged in red)

Updates are **real-time** (server-sent events). When a candidate applies at the Manchester location, the dashboard updates within 10 seconds. You don't need to refresh the page. You don't need to ask the GM. You can see it.

When you click a location card, you drill down into that location's **detailed pipeline view**: individual candidate cards in Kanban-style stages. You can see which candidates are moving through the pipeline, which are stalled, and which managers are responding quickly vs which are letting applications sit.

You now know **which location has a staffing crisis before it becomes a service failure**. On Sunday evening, you log in and see that Cardiff has 5 open roles and hasn't moved any candidates past "Applied" in 4 days. You send a quick message to the Cardiff GM: *"I see you've got 5 open roles and a few applications sitting in the pipeline. Need help?"* The problem gets fixed before the Monday lunch rush.

---

### Compliance Confidence: GDPR and Right-to-Work Audit-Readiness

You've been in the role for 2 years. You came from a larger hotel group where they used Hireology. You joined this company and found hiring managed via individual manager WhatsApp groups, a shared email inbox for CV submissions, and a spreadsheet no one maintained.

You know this is a compliance risk. GDPR consent is not being captured. Right-to-work checks are done manually with photocopied passports stored in manager filing cabinets with no audit trail. If the ICO audits you, or if a candidate submits a data subject access request, you cannot demonstrate compliance. You've raised this with the COO. The response was: *"We've always done it this way. What's the actual risk?"*

The actual risk:
- **GDPR fines:** Up to 4% of global turnover
- **UK right-to-work fines:** £45,000–£60,000 per illegal worker
- **Reputational damage:** Data breach notification requirement if candidate personal data is mishandled

Lapam-ATS removes this risk entirely:

**GDPR compliance infrastructure:**
- Consent is captured at point of application as a **first-class data entity** (consent type, consent date, consent expiry)
- **Automated retention and deletion:** Unsuccessful candidates are auto-deleted 12 months after last activity
- **Data subject access requests:** When you receive a DSAR, you click one button and the system generates a machine-readable JSON export within 24 hours
- **Right-to-erasure:** Deletion requests processed within 72 hours, with audit log (candidate ID anonymised, timestamp, reason)

**UK right-to-work verification:**
- Every UK hire goes through **automated right-to-work workflow** before they can be marked "Hired"
- Candidate receives a mobile link (no login required), submits share code or document via **GBG IDVT integration**
- System returns pass/fail result, creates **immutable audit record** (result, check type, document type, verifying operator ID, candidate ID, timestamp)
- If the check covers a time-limited permission (visa, BRP), the system schedules an alert **30 days before expiry**

You now have **audit-ready records for every hire**, stored centrally, with automated expiry tracking. When your legal team asks you to demonstrate compliance posture, you click one button and hand them an audit report. No more sleepless nights.

---

### Board-Level Reporting: Time-to-Fill, Cost-per-Hire, and Source Attribution

Your CEO asks you in a quarterly board meeting: *"How much does it cost us to hire across the estate? Where are our best hires coming from? Which locations are struggling?"*

With the informal stack, you have no answers. With Lapam-ATS, you open the **analytics view** and show:

- **Time-to-fill by location and role** (e.g., Manchester: 12 days average; Dublin: 19 days average; Cardiff: 8 days average)
- **Application volume by source** (Indeed: 60%; direct link: 25%; referral: 15%)
- **Pipeline conversion rates** (Applied → Screened: 40%; Screened → Interviewed: 70%; Interviewed → Offered: 50%; Offered → Hired: 85%)
- **Cost-per-hire estimate** (monthly subscription cost ÷ locations ÷ hires in period — labelled as estimate, does not include external costs like job board spend)

You can now demonstrate that **hiring is a measurable, managed function** — not an invisible black box. The CEO stops asking questions about hiring performance and starts asking questions about growth strategy. You've moved from firefighting to strategic contribution.

---

### Speed-to-Contact: Candidates Don't Go Dark

Your managers are supposed to respond to applications within 24 hours. Half of them do. The other half let applications sit in email for 3–5 days. By the time they respond, the candidate has taken another job.

Lapam-ATS fixes this with **automated candidate acknowledgement**:
- Every application receives a response **within 2 minutes** via SMS (if mobile number provided) or email
- The message is not generic: *"Thanks for applying to [Role] at [Location]. We'll review your application and be in touch within 24 hours."*
- The candidate stays warm. They don't ghost you.

When a manager doesn't move a candidate through the pipeline for **5 business days**, the system sends you an alert: *"[Location] — [Role] — Candidate has received no update in 5 days. Candidate may go cold."*

You can now **proactively manage manager responsiveness** without micromanaging. Candidates don't slip through the gaps.

---

## Key Differentiator vs What You're Doing Now

| What You Do Now | With Lapam-ATS |
|-----------------|----------------|
| Find out about staffing crises when a manager calls you at 9pm | See which locations have problems before they become crises — Sunday evening dashboard check |
| No idea how many open roles the estate has at any given time | One-screen dashboard: open roles per location, real-time updates |
| GDPR consent not captured; right-to-work checks on paper in filing cabinets | Audit-ready GDPR and RTW records; one-button data subject access; automated expiry alerts |
| No data on time-to-fill, cost-per-hire, or hiring performance by location | Analytics view with time-to-fill, source attribution, conversion rates — per location and per role |
| Candidates go dark because managers forget to respond | Automated acknowledgement within 2 minutes; manager alerts if no update in 5 days |

---

## Proof Point: ROI from Turnover Cost Reduction

You manage hiring for an 18-location group with approximately 1,400 total staff. Hospitality turnover is 70–80% annually. Assume 70%:

- 1,400 staff × 70% turnover = **980 hires per year**
- Cost per departure: >£5,000 (recruiting, onboarding, lost productivity)
- Total turnover-related cost: **£4.9M per year**

If Lapam-ATS reduces your average time-to-fill by **2 weeks per hire** (faster candidate engagement, no applications lost in email, proactive manager alerts), you're reducing the duration each role remains unfilled. Every unfilled role is lost revenue — a server position unfilled for 2 weeks costs the business in service quality, overtime for remaining staff, and table capacity.

Assume a conservative **10% reduction in total turnover cost** from faster hiring and better retention (candidates who are engaged quickly are more committed from day one):

- 10% of £4.9M = **£490K in annual savings**

Lapam-ATS costs you **£10,800 per year** (18 locations × £50/location/month × 12 months). The platform pays for itself **45 times over** in year one.

---

## Next Step

**Join the early access programme:** [lapam-ats.com/early-access](https://lapam-ats.com/early-access)

**Free 14-day trial.** No credit card required. Connect your existing Indeed account, create your first multi-location job posting, see the dashboard populate in real-time as applications arrive.

**Pricing:** £50–£60 per location per month, annual contract. For 18 locations, that's £900–£1,080/month. Within your discretionary budget; no board approval required.

**UK launch:** Q2 2026. Early access participants get priority onboarding and a dedicated customer success manager for your first 90 days.

---

**Questions?**

Email: hello@lapam.com  
Demo: [lapam-ats.com/demo](https://lapam-ats.com/demo)
