import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function cuid(): string {
  return `seed_${Math.random().toString(36).slice(2, 15)}`;
}

// ── Constants ────────────────────────────────────────────
const CLERK_ORG_ID = 'org_3Befpq6Acx5beHo1NySHVX0t1HF';
const ADMIN_USER_ID = 'user_3BXW2zWRf0aA9LbAyNJXh5x29we';
const LOC_MGR_LONDON = 'user_loc_mgr_london';
const LOC_MGR_MANCHESTER = 'user_loc_mgr_manchester';

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in dependency order)
  console.log('  Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.jobQueue.deleteMany({});
  await prisma.pipelineEvent.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.screeningResponse.deleteMany({});
  await prisma.consentRecord.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.interviewSlot.deleteMany({});
  await prisma.rtwRequest.deleteMany({});
  await prisma.rightToWorkCheck.deleteMany({});
  await prisma.talentPoolEntry.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.screeningQuestion.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.locationAssignment.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.tenant.deleteMany({});

  // ── 1. Tenant ────────────────────────────────────────
  console.log('  Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'org_3Befpq6Acx5beHo1NySHVX0t1HF',
      clerkOrgId: CLERK_ORG_ID,
      name: 'Monarch Hospitality Group',
      slug: 'monarch-hospitality',
      plan: 'ACTIVE',
    },
  });
  const T = tenant.id;

  // ── 2. Locations ─────────────────────────────────────
  console.log('  Creating locations...');
  const locLondon = await prisma.location.create({
    data: { id: 'loc_london', tenantId: T, name: 'The Crown Hotel, London', country: 'GB', timezone: 'Europe/London' },
  });
  const locManchester = await prisma.location.create({
    data: { id: 'loc_manchester', tenantId: T, name: 'The Royal Oak, Manchester', country: 'GB', timezone: 'Europe/London' },
  });
  const locBrighton = await prisma.location.create({
    data: { id: 'loc_brighton', tenantId: T, name: 'Harbour View Restaurant, Brighton', country: 'GB', timezone: 'Europe/London' },
  });
  const locEdinburgh = await prisma.location.create({
    data: { id: 'loc_edinburgh', tenantId: T, name: 'Lakeshore Spa & Resort, Edinburgh', country: 'GB', timezone: 'Europe/London' },
  });

  // ── 3. Location Assignments ──────────────────────────
  console.log('  Creating location assignments...');
  await prisma.locationAssignment.createMany({
    data: [
      { locationId: locLondon.id, clerkUserId: ADMIN_USER_ID },
      { locationId: locManchester.id, clerkUserId: ADMIN_USER_ID },
      { locationId: locBrighton.id, clerkUserId: ADMIN_USER_ID },
      { locationId: locEdinburgh.id, clerkUserId: ADMIN_USER_ID },
      { locationId: locLondon.id, clerkUserId: LOC_MGR_LONDON },
      { locationId: locManchester.id, clerkUserId: LOC_MGR_MANCHESTER },
    ],
  });

  // ── 4. Jobs ──────────────────────────────────────────
  console.log('  Creating jobs...');
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        id: 'job_head_chef', tenantId: T, locationId: locLondon.id, title: 'Head Chef',
        description: 'Lead our kitchen team at The Crown Hotel. You will oversee menu development, food quality standards, stock management, and a brigade of 8 chefs. Minimum 5 years experience in a similar role required. Must hold Level 3 Food Hygiene certificate.',
        locationType: 'HOTEL', employmentType: 'FULL_TIME', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(75),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_restaurant_mgr', tenantId: T, locationId: locBrighton.id, title: 'Restaurant Manager',
        description: 'Manage day-to-day operations of Harbour View Restaurant. Responsibilities include staff scheduling, guest experience, P&L management, and supplier relationships. Previous restaurant management experience essential.',
        locationType: 'RESTAURANT', employmentType: 'FULL_TIME', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(60),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_front_desk', tenantId: T, locationId: locEdinburgh.id, title: 'Front Desk Agent',
        description: 'Welcome guests and manage check-in/check-out at Lakeshore Spa & Resort. Handle reservations, guest queries, and coordinate with housekeeping. Excellent communication skills required. Shift work including weekends.',
        locationType: 'HOTEL', employmentType: 'FULL_TIME', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(45),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_bartender', tenantId: T, locationId: locManchester.id, title: 'Bartender',
        description: 'Join our award-winning bar team at The Royal Oak. Must have cocktail knowledge, Personal Licence preferred but not essential. Weekend and evening availability required.',
        locationType: 'BAR', employmentType: 'PART_TIME', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(40),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_sous_chef', tenantId: T, locationId: locLondon.id, title: 'Sous Chef',
        description: 'Support the Head Chef in all kitchen operations at The Crown Hotel. Lead the team during Head Chef absence. Minimum 3 years experience in a professional kitchen. Level 2 Food Hygiene required.',
        locationType: 'HOTEL', employmentType: 'FULL_TIME', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(35),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_housekeeper', tenantId: T, locationId: locEdinburgh.id, title: 'Housekeeping Supervisor',
        description: 'Oversee the housekeeping team at Lakeshore Spa & Resort. Ensure rooms meet 4-star standards, manage linen inventory, train new team members. Previous supervisory experience preferred.',
        locationType: 'HOTEL', employmentType: 'FULL_TIME', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(30),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_events', tenantId: T, locationId: locBrighton.id, title: 'Events Coordinator',
        description: 'Plan and deliver weddings, corporate events, and private dining experiences at Harbour View. Manage client relationships from enquiry through to event day. Strong organisational skills essential.',
        locationType: 'RESTAURANT', employmentType: 'FULL_TIME', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(20),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_night_auditor', tenantId: T, locationId: locEdinburgh.id, title: 'Night Auditor',
        description: 'Manage overnight front desk operations and complete daily revenue reconciliation at Lakeshore Spa & Resort. Must be comfortable working alone overnight. Previous hotel night audit experience preferred.',
        locationType: 'HOTEL', employmentType: 'FULL_TIME', status: 'CLOSED',
        closedAt: daysAgo(5), createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(65),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_server', tenantId: T, locationId: locManchester.id, title: 'Server / Waiting Staff',
        description: 'Deliver outstanding table service at The Royal Oak. Food and drinks orders, allergen awareness, and upselling. No experience necessary — full training provided. Flexible hours available.',
        locationType: 'BAR', employmentType: 'ZERO_HOURS', status: 'PUBLISHED',
        createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(15),
      },
    }),
    prisma.job.create({
      data: {
        id: 'job_pastry', tenantId: T, locationId: locLondon.id, title: 'Pastry Chef',
        description: 'Create desserts and pastries for The Crown Hotel restaurant and afternoon tea service. Must have formal patisserie training or equivalent experience. Creative flair and attention to detail essential.',
        locationType: 'HOTEL', employmentType: 'FULL_TIME', status: 'CLOSED',
        closedAt: daysAgo(10), createdByUserId: ADMIN_USER_ID, createdAt: daysAgo(80),
      },
    }),
  ]);

  // ── 5. Screening Questions ───────────────────────────
  console.log('  Creating screening questions...');
  // Head Chef
  const sq1 = await prisma.screeningQuestion.create({
    data: { jobId: 'job_head_chef', question: 'Do you hold a Level 3 Food Hygiene certificate?', type: 'YES_NO', isKnockout: true, order: 1 },
  });
  const sq2 = await prisma.screeningQuestion.create({
    data: { jobId: 'job_head_chef', question: 'How many years of head chef or senior kitchen leadership experience do you have?', type: 'FREE_TEXT', isKnockout: false, order: 2 },
  });
  // Bartender
  const sq3 = await prisma.screeningQuestion.create({
    data: { jobId: 'job_bartender', question: 'Do you hold a Personal Licence for the sale of alcohol?', type: 'YES_NO', isKnockout: false, order: 1 },
  });
  const sq4 = await prisma.screeningQuestion.create({
    data: { jobId: 'job_bartender', question: 'Are you available to work Friday and Saturday evenings?', type: 'YES_NO', isKnockout: true, order: 2 },
  });
  // Front Desk
  const sq5 = await prisma.screeningQuestion.create({
    data: { jobId: 'job_front_desk', question: 'Which hotel PMS systems have you used?', type: 'SINGLE_CHOICE', options: ['Opera', 'Mews', 'Cloudbeds', 'None'], isKnockout: false, order: 1 },
  });

  // ── 6. Candidates & Applications ─────────────────────
  console.log('  Creating candidates and applications...');

  interface CandidateSpec {
    id: string; first: string; last: string; mobile: string; email: string;
    jobId: string; stage: string; source: string; daysBack: number;
    channel?: string; availability?: string;
  }

  const candidates: CandidateSpec[] = [
    // APPLIED (12)
    { id: 'c01', first: 'Priya', last: 'Sharma', mobile: '+447700100001', email: 'priya.sharma@gmail.com', jobId: 'job_head_chef', stage: 'APPLIED', source: 'INDEED', daysBack: 3 },
    { id: 'c02', first: 'James', last: 'O\'Brien', mobile: '+447700100002', email: 'james.obrien@outlook.com', jobId: 'job_restaurant_mgr', stage: 'APPLIED', source: 'DIRECT', daysBack: 5 },
    { id: 'c03', first: 'Ewa', last: 'Kowalska', mobile: '+447700100003', email: 'ewa.k@yahoo.com', jobId: 'job_bartender', stage: 'APPLIED', source: 'INDEED', daysBack: 2 },
    { id: 'c04', first: 'Mohammed', last: 'Al-Rashid', mobile: '+447700100004', email: 'm.alrashid@gmail.com', jobId: 'job_front_desk', stage: 'APPLIED', source: 'DIRECT', daysBack: 1 },
    { id: 'c05', first: 'Sophie', last: 'Williams', mobile: '+447700100005', email: 'sophie.w@gmail.com', jobId: 'job_sous_chef', stage: 'APPLIED', source: 'REFERRAL', daysBack: 4 },
    { id: 'c06', first: 'Tomasz', last: 'Nowak', mobile: '+447700100006', email: 'tomasz.nowak@outlook.com', jobId: 'job_server', stage: 'APPLIED', source: 'INDEED', daysBack: 6 },
    { id: 'c07', first: 'Amara', last: 'Okafor', mobile: '+447700100007', email: 'amara.o@gmail.com', jobId: 'job_housekeeper', stage: 'APPLIED', source: 'DIRECT', daysBack: 3 },
    { id: 'c08', first: 'Liam', last: 'Murphy', mobile: '+447700100008', email: 'liam.murphy@yahoo.com', jobId: 'job_events', stage: 'APPLIED', source: 'GOOGLE_JOBS', daysBack: 2 },
    { id: 'c09', first: 'Fatima', last: 'Hassan', mobile: '+447700100009', email: 'fatima.h@gmail.com', jobId: 'job_head_chef', stage: 'APPLIED', source: 'DIRECT', daysBack: 7 },
    { id: 'c10', first: 'David', last: 'Chen', mobile: '+447700100010', email: 'david.chen@outlook.com', jobId: 'job_bartender', stage: 'APPLIED', source: 'REFERRAL', daysBack: 1 },
    { id: 'c11', first: 'Chloe', last: 'Taylor', mobile: '+447700100011', email: 'chloe.t@gmail.com', jobId: 'job_front_desk', stage: 'APPLIED', source: 'INDEED', daysBack: 4 },
    { id: 'c12', first: 'Andrei', last: 'Popescu', mobile: '+447700100012', email: 'andrei.p@yahoo.com', jobId: 'job_server', stage: 'APPLIED', source: 'GOOGLE_JOBS', daysBack: 8 },

    // SCREENING (8)
    { id: 'c13', first: 'Rebecca', last: 'Jones', mobile: '+447700100013', email: 'rebecca.j@gmail.com', jobId: 'job_head_chef', stage: 'SCREENING', source: 'INDEED', daysBack: 20 },
    { id: 'c14', first: 'Raj', last: 'Patel', mobile: '+447700100014', email: 'raj.patel@outlook.com', jobId: 'job_restaurant_mgr', stage: 'SCREENING', source: 'DIRECT', daysBack: 18 },
    { id: 'c15', first: 'Karolina', last: 'Mazur', mobile: '+447700100015', email: 'karolina.m@gmail.com', jobId: 'job_sous_chef', stage: 'SCREENING', source: 'REFERRAL', daysBack: 15 },
    { id: 'c16', first: 'Oliver', last: 'Brown', mobile: '+447700100016', email: 'oliver.b@yahoo.com', jobId: 'job_bartender', stage: 'SCREENING', source: 'INDEED', daysBack: 14 },
    { id: 'c17', first: 'Aisha', last: 'Khan', mobile: '+447700100017', email: 'aisha.khan@gmail.com', jobId: 'job_front_desk', stage: 'SCREENING', source: 'DIRECT', daysBack: 22 },
    { id: 'c18', first: 'George', last: 'Papadopoulos', mobile: '+447700100018', email: 'george.p@outlook.com', jobId: 'job_housekeeper', stage: 'SCREENING', source: 'GOOGLE_JOBS', daysBack: 12 },
    { id: 'c19', first: 'Megan', last: 'Davies', mobile: '+447700100019', email: 'megan.d@gmail.com', jobId: 'job_events', stage: 'SCREENING', source: 'INDEED', daysBack: 16 },
    { id: 'c20', first: 'Arjun', last: 'Singh', mobile: '+447700100020', email: 'arjun.s@yahoo.com', jobId: 'job_server', stage: 'SCREENING', source: 'DIRECT', daysBack: 25 },

    // INTERVIEW (5)
    { id: 'c21', first: 'Emma', last: 'Wilson', mobile: '+447700100021', email: 'emma.wilson@gmail.com', jobId: 'job_head_chef', stage: 'INTERVIEW', source: 'INDEED', daysBack: 35 },
    { id: 'c22', first: 'Daniel', last: 'Garcia', mobile: '+447700100022', email: 'dan.garcia@outlook.com', jobId: 'job_restaurant_mgr', stage: 'INTERVIEW', source: 'REFERRAL', daysBack: 30 },
    { id: 'c23', first: 'Zara', last: 'Begum', mobile: '+447700100023', email: 'zara.begum@gmail.com', jobId: 'job_front_desk', stage: 'INTERVIEW', source: 'DIRECT', daysBack: 28 },
    { id: 'c24', first: 'Marcus', last: 'Thompson', mobile: '+447700100024', email: 'marcus.t@yahoo.com', jobId: 'job_sous_chef', stage: 'INTERVIEW', source: 'INDEED', daysBack: 32 },
    { id: 'c25', first: 'Ioana', last: 'Dumitrescu', mobile: '+447700100025', email: 'ioana.d@gmail.com', jobId: 'job_bartender', stage: 'INTERVIEW', source: 'DIRECT', daysBack: 26 },

    // OFFER (3)
    { id: 'c26', first: 'Charlotte', last: 'Evans', mobile: '+447700100026', email: 'charlotte.e@gmail.com', jobId: 'job_events', stage: 'OFFER', source: 'REFERRAL', daysBack: 42 },
    { id: 'c27', first: 'Hassan', last: 'Ahmed', mobile: '+447700100027', email: 'hassan.a@outlook.com', jobId: 'job_housekeeper', stage: 'OFFER', source: 'INDEED', daysBack: 40 },
    { id: 'c28', first: 'Natalia', last: 'Ivanova', mobile: '+447700100028', email: 'natalia.i@gmail.com', jobId: 'job_front_desk', stage: 'OFFER', source: 'DIRECT', daysBack: 38 },

    // HIRED (2)
    { id: 'c29', first: 'William', last: 'Scott', mobile: '+447700100029', email: 'will.scott@gmail.com', jobId: 'job_night_auditor', stage: 'HIRED', source: 'INDEED', daysBack: 55 },
    { id: 'c30', first: 'Mei', last: 'Lin', mobile: '+447700100030', email: 'mei.lin@outlook.com', jobId: 'job_pastry', stage: 'HIRED', source: 'REFERRAL', daysBack: 60 },

    // REJECTED (1)
    { id: 'c31', first: 'Jake', last: 'Roberts', mobile: '+447700100031', email: 'jake.r@yahoo.com', jobId: 'job_head_chef', stage: 'REJECTED', source: 'DIRECT', daysBack: 50 },
  ];

  for (const c of candidates) {
    const candidateId = `cand_${c.id}`;
    const applicationId = `app_${c.id}`;

    await prisma.candidate.create({
      data: {
        id: candidateId, tenantId: T, firstName: c.first, lastName: c.last,
        mobileNumber: c.mobile, email: c.email, preferredChannel: 'SMS',
        createdAt: daysAgo(c.daysBack),
      },
    });

    await prisma.application.create({
      data: {
        id: applicationId, tenantId: T, jobId: c.jobId, candidateId,
        stage: c.stage as any, source: c.source as any, availabilityType: ["IMMEDIATE", "TWO_WEEKS", "ONE_MONTH"][Math.floor(Math.random() * 3)] as any,
        createdAt: daysAgo(c.daysBack),
      },
    });

    // Consent record for every application
    const isExpired = ['c09', 'c12', 'c31'].includes(c.id);
    const isExpiringSoon = ['c06', 'c07', 'c08', 'c10', 'c11'].includes(c.id);
    await prisma.consentRecord.create({
      data: {
        tenantId: T, candidateId, consentType: 'APPLICATION', applicationId,
        consentDate: daysAgo(c.daysBack),
        consentExpiry: isExpired ? daysAgo(10) : isExpiringSoon ? daysFromNow(15) : daysFromNow(335),
        sourceIp: '82.132.45.67',
      },
    });

    // Pipeline event: APPLICATION_RECEIVED for all
    await prisma.pipelineEvent.create({
      data: {
        tenantId: T, applicationId, eventType: 'APPLICATION_RECEIVED',
        toStage: 'APPLIED', createdAt: daysAgo(c.daysBack),
      },
    });

    // Stage change events for candidates past APPLIED
    const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
    const targetIdx = stages.indexOf(c.stage);
    if (targetIdx > 0 && c.stage !== 'REJECTED') {
      for (let i = 1; i <= targetIdx; i++) {
        await prisma.pipelineEvent.create({
          data: {
            tenantId: T, applicationId, eventType: 'STAGE_CHANGED',
            actorUserId: ADMIN_USER_ID, fromStage: stages[i - 1] as any,
            toStage: stages[i] as any, createdAt: daysAgo(c.daysBack - i * 2),
          },
        });
      }
    }
    if (c.stage === 'REJECTED') {
      await prisma.pipelineEvent.create({
        data: {
          tenantId: T, applicationId, eventType: 'STAGE_CHANGED',
          actorUserId: ADMIN_USER_ID, fromStage: 'SCREENING', toStage: 'REJECTED',
          note: 'Does not meet minimum experience requirements',
          createdAt: daysAgo(c.daysBack - 5),
        },
      });
    }
  }

  // ── 7. Screening Responses ───────────────────────────
  console.log('  Creating screening responses...');
  // Head Chef applicants
  for (const cid of ['c01', 'c09', 'c13', 'c21', 'c31']) {
    await prisma.screeningResponse.create({
      data: { applicationId: `app_${cid}`, questionId: sq1.id, response: cid === 'c31' ? 'No' : 'Yes' },
    });
    await prisma.screeningResponse.create({
      data: { applicationId: `app_${cid}`, questionId: sq2.id, response: cid === 'c31' ? '1 year' : '6 years' },
    });
  }
  // Bartender applicants
  for (const cid of ['c03', 'c10', 'c16', 'c25']) {
    await prisma.screeningResponse.create({
      data: { applicationId: `app_${cid}`, questionId: sq3.id, response: cid === 'c03' ? 'No' : 'Yes' },
    });
    await prisma.screeningResponse.create({
      data: { applicationId: `app_${cid}`, questionId: sq4.id, response: 'Yes' },
    });
  }
  // Front Desk applicants
  for (const cid of ['c04', 'c11', 'c17', 'c23', 'c28']) {
    await prisma.screeningResponse.create({
      data: { applicationId: `app_${cid}`, questionId: sq5.id, response: cid === 'c04' ? 'None' : 'Opera' },
    });
  }

  // ── 8. Messages ──────────────────────────────────────
  console.log('  Creating messages...');
  const messageData = [
    { appId: 'app_c13', channel: 'EMAIL', body: 'Thank you for your application for Head Chef. We would like to invite you for a screening call.', status: 'DELIVERED', daysBack: 18, ai: false },
    { appId: 'app_c14', channel: 'SMS', body: 'Hi Raj, thanks for applying to Monarch Hospitality. We\'d like to arrange a brief phone screen. Are you available this week?', status: 'DELIVERED', daysBack: 16, ai: false },
    { appId: 'app_c21', channel: 'EMAIL', body: 'Dear Emma, we were impressed with your screening call and would like to invite you for an in-person interview at The Crown Hotel.', status: 'DELIVERED', daysBack: 30, ai: true },
    { appId: 'app_c22', channel: 'EMAIL', body: 'Hi Daniel, great news — we\'d like to invite you to interview for the Restaurant Manager position at Harbour View.', status: 'DELIVERED', daysBack: 25, ai: true },
    { appId: 'app_c23', channel: 'SMS', body: 'Hi Zara, we\'d like to invite you for an interview at Lakeshore Spa. Please check your email for available time slots.', status: 'SENT', daysBack: 24, ai: false },
    { appId: 'app_c26', channel: 'EMAIL', body: 'Dear Charlotte, we are delighted to extend an offer for the Events Coordinator position at Harbour View Restaurant.', status: 'DELIVERED', daysBack: 38, ai: false },
    { appId: 'app_c29', channel: 'EMAIL', body: 'Dear William, congratulations! We are pleased to confirm your appointment as Night Auditor at Lakeshore Spa & Resort.', status: 'DELIVERED', daysBack: 48, ai: false },
    { appId: 'app_c31', channel: 'EMAIL', body: 'Dear Jake, thank you for your interest in the Head Chef position. After careful consideration, we have decided to progress other candidates.', status: 'DELIVERED', daysBack: 45, ai: true },
    { appId: 'app_c15', channel: 'SMS', body: 'Hi Karolina, just a reminder about your phone screening tomorrow at 2pm.', status: 'SENT', daysBack: 13, ai: false },
    { appId: 'app_c27', channel: 'EMAIL', body: 'Dear Hassan, following your successful interviews, we would like to offer you the Housekeeping Supervisor role.', status: 'DELIVERED', daysBack: 35, ai: false },
  ];
  for (const m of messageData) {
    await prisma.message.create({
      data: {
        tenantId: T, applicationId: m.appId, direction: 'OUTBOUND',
        channel: m.channel as any, body: m.body, status: m.status as any,
        aiAssisted: m.ai, sentAt: daysAgo(m.daysBack), createdAt: daysAgo(m.daysBack),
      },
    });
  }

  // ── 9. Interview Slots ───────────────────────────────
  console.log('  Creating interview slots...');
  await prisma.interviewSlot.create({
    data: { applicationId: 'app_c21', tenantId: T, proposedAt: daysAgo(28), confirmedAt: daysAgo(27), status: 'CONFIRMED', reminderSentAt: daysAgo(26) },
  });
  await prisma.interviewSlot.create({
    data: { applicationId: 'app_c22', tenantId: T, proposedAt: daysAgo(24), confirmedAt: daysAgo(23), status: 'CONFIRMED' },
  });
  await prisma.interviewSlot.create({
    data: { applicationId: 'app_c23', tenantId: T, proposedAt: daysAgo(22), status: 'PROPOSED' },
  });
  await prisma.interviewSlot.create({
    data: { applicationId: 'app_c24', tenantId: T, proposedAt: daysAgo(26), confirmedAt: daysAgo(25), status: 'CONFIRMED', reminderSentAt: daysAgo(24) },
  });
  await prisma.interviewSlot.create({
    data: { applicationId: 'app_c25', tenantId: T, proposedAt: daysAgo(20), status: 'DECLINED' },
  });

  // ── 10. RTW Requests & Checks ────────────────────────
  console.log('  Creating RTW data...');
  await prisma.rtwRequest.create({
    data: { applicationId: 'app_c29', tenantId: T },
  });
  await prisma.rightToWorkCheck.create({
    data: {
      tenantId: T, applicationId: 'app_c29', checkType: 'IDVT', result: 'PASS',
      documentType: 'UK_PASSPORT', verifyingUserId: ADMIN_USER_ID, completedAt: daysAgo(50),
    },
  });
  await prisma.rtwRequest.create({
    data: { applicationId: 'app_c30', tenantId: T },
  });
  await prisma.rightToWorkCheck.create({
    data: {
      tenantId: T, applicationId: 'app_c30', checkType: 'SHARE_CODE', result: 'PASS',
      documentType: 'BRP', verifyingUserId: ADMIN_USER_ID, completedAt: daysAgo(55),
    },
  });
  await prisma.rtwRequest.create({
    data: { applicationId: 'app_c26', tenantId: T },
  });

  // ── 11. Offers ───────────────────────────────────────
  console.log('  Creating offers...');
  await prisma.offer.create({
    data: { applicationId: 'app_c26', tenantId: T, status: 'SENT', sentAt: daysAgo(38) },
  });
  await prisma.offer.create({
    data: { applicationId: 'app_c27', tenantId: T, status: 'ACCEPTED', sentAt: daysAgo(35), respondedAt: daysAgo(33) },
  });
  await prisma.offer.create({
    data: { applicationId: 'app_c28', tenantId: T, status: 'DECLINED', sentAt: daysAgo(32), respondedAt: daysAgo(30) },
  });
  await prisma.offer.create({
    data: { applicationId: 'app_c29', tenantId: T, status: 'ACCEPTED', sentAt: daysAgo(50), respondedAt: daysAgo(48) },
  });
  await prisma.offer.create({
    data: { applicationId: 'app_c30', tenantId: T, status: 'ACCEPTED', sentAt: daysAgo(56), respondedAt: daysAgo(54) },
  });

  // ── 12. Talent Pool ──────────────────────────────────
  console.log('  Creating talent pool entries...');
  const tpEntries = [
    { candidateId: 'cand_c29', role: 'Night Auditor', locId: locEdinburgh.id, tag: 'REHIRE_ELIGIBLE' as const, notes: 'Excellent performance. Left for personal reasons. Would rehire immediately.' },
    { candidateId: 'cand_c30', role: 'Pastry Chef', locId: locLondon.id, tag: 'REHIRE_ELIGIBLE' as const, notes: 'Talented pastry chef. Relocated to Edinburgh. Open to return.' },
    { candidateId: 'cand_c31', role: 'Head Chef', locId: locLondon.id, tag: 'DO_NOT_REENGAGE' as const, notes: 'Did not meet experience requirements. Misrepresented qualifications.' },
    { candidateId: 'cand_c22', role: 'Restaurant Manager', locId: locBrighton.id, tag: 'CONDITIONAL_REHIRE' as const, notes: 'Strong candidate, withdrew to accept another offer. Revisit in 6 months.' },
    { candidateId: 'cand_c25', role: 'Bartender', locId: locManchester.id, tag: 'REHIRE_ELIGIBLE' as const, notes: 'Good interview but timing didn\'t work. Interested in future openings.' },
    { candidateId: 'cand_c28', role: 'Front Desk Agent', locId: locEdinburgh.id, tag: 'CONDITIONAL_REHIRE' as const, notes: 'Declined offer due to salary. May reconsider if package improves.' },
  ];
  for (const tp of tpEntries) {
    const entry = await prisma.talentPoolEntry.create({
      data: {
        tenantId: T, candidateId: tp.candidateId, originalRole: tp.role,
        locationId: tp.locId, tag: tp.tag, notes: tp.notes,
      },
    });
    // Talent pool consent
    if (tp.tag !== 'DO_NOT_REENGAGE') {
      await prisma.consentRecord.create({
        data: {
          tenantId: T, candidateId: tp.candidateId, consentType: 'TALENT_POOL',
          talentPoolEntryId: entry.id, consentDate: daysAgo(30),
          consentExpiry: daysFromNow(335),
        },
      });
    }
  }

  // ── 13. Data Requests (GDPR) ─────────────────────────
  console.log('  Creating GDPR data requests...');
  // Note: DataRequest model may not exist in schema — skip if not present.
  // The GDPR features use direct API endpoints rather than a DataRequest model.

  // ── 14. Audit Logs ───────────────────────────────────
  console.log('  Creating audit logs...');
  const auditEntries = [
    { eventType: 'AI_JD_GENERATION' as const, daysBack: 75, candidateRef: null, applicationRef: null, metadata: { jobId: 'job_head_chef', model: 'claude-haiku' } },
    { eventType: 'AI_INTERVIEW_QUESTIONS' as const, daysBack: 30, candidateRef: 'cand_c21', applicationRef: 'app_c21', metadata: { questionCount: 6, jobTitle: 'Head Chef' } },
    { eventType: 'AI_COMMS_DRAFT' as const, daysBack: 28, candidateRef: 'cand_c21', applicationRef: 'app_c21', metadata: { channel: 'EMAIL', purpose: 'interview_invite' } },
    { eventType: 'RTW_CHECK_OVERRIDDEN' as const, daysBack: 50, candidateRef: 'cand_c29', applicationRef: 'app_c29', metadata: { reason: 'Document verified manually', checkType: 'IDVT' } },
    { eventType: 'OFFER_ACCEPTED' as const, daysBack: 48, candidateRef: 'cand_c29', applicationRef: 'app_c29', metadata: { role: 'Night Auditor', location: 'Edinburgh' } },
    { eventType: 'CANDIDATE_HIRED' as const, daysBack: 47, candidateRef: 'cand_c29', applicationRef: 'app_c29', metadata: { role: 'Night Auditor' } },
    { eventType: 'OFFER_ACCEPTED' as const, daysBack: 54, candidateRef: 'cand_c30', applicationRef: 'app_c30', metadata: { role: 'Pastry Chef', location: 'London' } },
    { eventType: 'CANDIDATE_HIRED' as const, daysBack: 53, candidateRef: 'cand_c30', applicationRef: 'app_c30', metadata: { role: 'Pastry Chef' } },
    { eventType: 'OFFER_DECLINED' as const, daysBack: 30, candidateRef: 'cand_c28', applicationRef: 'app_c28', metadata: { role: 'Front Desk Agent', reason: 'Salary' } },
    { eventType: 'CANDIDATE_REJECTED' as const, daysBack: 45, candidateRef: 'cand_c31', applicationRef: 'app_c31', metadata: { role: 'Head Chef', reason: 'Experience gap' } },
    { eventType: 'AI_COMMS_DRAFT' as const, daysBack: 45, candidateRef: 'cand_c31', applicationRef: 'app_c31', metadata: { channel: 'EMAIL', purpose: 'rejection' } },
    { eventType: 'AI_INTERVIEW_QUESTIONS' as const, daysBack: 22, candidateRef: 'cand_c22', applicationRef: 'app_c22', metadata: { questionCount: 7, jobTitle: 'Restaurant Manager' } },
  ];
  for (const a of auditEntries) {
    await prisma.auditLog.create({
      data: {
        tenantId: T, eventType: a.eventType, actorUserId: ADMIN_USER_ID,
        candidateRef: a.candidateRef, applicationRef: a.applicationRef,
        metadata: a.metadata, createdAt: daysAgo(a.daysBack),
      },
    });
  }

  // ── 15. Job Queue ────────────────────────────────────
  console.log('  Creating job queue entries...');
  await prisma.jobQueue.create({
    data: {
      tenantId: T, jobType: 'GDPR_PURGE_CANDIDATE', status: 'DONE', attempts: 1,
      payload: { candidateIds: ['cand_expired_example'], reason: 'consent_expired' },
      createdAt: daysAgo(7),
    },
  });
  await prisma.jobQueue.create({
    data: {
      tenantId: T, jobType: 'TALENT_POOL_RECONSENT_REMIND', status: 'DONE', attempts: 1,
      payload: { entryCount: 3, channel: 'EMAIL' },
      createdAt: daysAgo(3),
    },
  });
  await prisma.jobQueue.create({
    data: {
      tenantId: T, jobType: 'APPLICATION_ACK_SEND', status: 'DONE', attempts: 1,
      payload: { applicationId: 'app_c01', channel: 'EMAIL' },
      createdAt: daysAgo(3),
    },
  });

  console.log('✅ Seed complete!');
  console.log('   - 1 tenant');
  console.log('   - 4 locations');
  console.log('   - 10 jobs (8 published, 2 closed)');
  console.log('   - 31 candidates with applications');
  console.log('   - Consent records, pipeline events, messages');
  console.log('   - Interview slots, RTW checks, offers');
  console.log('   - Talent pool entries, audit logs, job queue');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
