import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { isAccountLive } from "../src/lib/enums";

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { name: "Új lead", color: "#6366f1" },
  { name: "Megkeresve", color: "#3b82f6" },
  { name: "Minősített", color: "#0ea5e9" },
  { name: "Ajánlat elküldve", color: "#f59e0b" },
  { name: "Megnyert", color: "#22c55e" },
  { name: "Elveszett", color: "#ef4444" },
];

async function createPipeline(accountId: string, name = "Új ügyfelek") {
  return prisma.pipeline.create({
    data: {
      accountId,
      name,
      isDefault: true,
      stages: { create: DEFAULT_STAGES.map((s, i) => ({ name: s.name, color: s.color, order: i })) },
    },
    include: { stages: true },
  });
}

const LEAD_FIRST_NAMES = ["Anna", "Bence", "Csilla", "Dávid", "Emese", "Ferenc", "Gabriella", "Hunor", "Ildikó", "János"];
const LEAD_LAST_NAMES = ["Szabó", "Kovács", "Tóth", "Nagy", "Horváth", "Varga", "Kiss", "Molnár", "Farkas", "Balogh"];
const SOURCES = ["facebook_lead_ads", "landing_page", "google_ads", "referral", "organic"];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

async function main() {
  console.log("Seeding The Code CRM demo data...");

  const org = await prisma.organization.create({ data: { name: "The Code Zrt." } });

  const pw = await hashPassword("thecode123");
  const clientPw = await hashPassword("ugyfel123");

  const [, csm1, csm2, closer, setter, dev2, developer, dev3, dev4, salesRep] = await Promise.all([
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Nagy Admin", email: "admin@thecode.hu", passwordHash: pw, jobRole: "Admin", systemRole: "ADMIN", avatarColor: "#6366f1" } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Kovács Dóra", email: "csm@thecode.hu", passwordHash: pw, jobRole: "CSM", avatarColor: "#0ea5e9", googleCalendarConnected: true } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Papp Réka", email: "csm2@thecode.hu", passwordHash: pw, jobRole: "CSM", avatarColor: "#14b8a6" } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Kérészy Levente", email: "closer@thecode.hu", passwordHash: pw, jobRole: "Closer", avatarColor: "#f59e0b", googleCalendarConnected: true } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Szűcs Bence", email: "setter@thecode.hu", passwordHash: pw, jobRole: "Setter", avatarColor: "#8b5cf6" } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Fekete Anna", email: "dev2@thecode.hu", passwordHash: pw, jobRole: "Fejlesztő", avatarColor: "#ec4899" } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Dávid Mirella", email: "fejleszto@thecode.hu", passwordHash: pw, jobRole: "Fejlesztő", avatarColor: "#f43f5e" } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Simon Zoltán", email: "dev3@thecode.hu", passwordHash: pw, jobRole: "Fejlesztő", avatarColor: "#22c55e" } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Tóth Marcell", email: "dev4@thecode.hu", passwordHash: pw, jobRole: "Fejlesztő", avatarColor: "#3b82f6", googleCalendarConnected: true } }),
    prisma.teamMember.create({ data: { organizationId: org.id, name: "Vincze Petra", email: "sales@thecode.hu", passwordHash: pw, jobRole: "Értékesítő", avatarColor: "#eab308" } }),
  ]);

  const staffPool = [csm1, csm2, closer, setter, dev2, developer, dev3, dev4, salesRep];

  // ---------------------------------------------------------------------
  // Internal sales "account" - The Code's own prospect -> paying customer
  // pipeline, shown under the Sales admin tab.
  // ---------------------------------------------------------------------
  const salesAccount = await prisma.account.create({
    data: {
      organizationId: org.id,
      name: "The Code - Belső Sales",
      status: "ACTIVE",
      isInternalSales: true,
      lifecycleStage: "ADS_LIVE",
    },
  });
  const salesPipeline = await createPipeline(salesAccount.id, "Belső sales CRM");
  for (let i = 0; i < 14; i++) {
    const stage = pick(salesPipeline.stages, i);
    await prisma.opportunity.create({
      data: {
        stageId: stage.id,
        accountId: salesAccount.id,
        firstName: pick(LEAD_FIRST_NAMES, i),
        lastName: pick(LEAD_LAST_NAMES, i + 3),
        email: `prospekt${i}@example.com`,
        phone: `+36301234${(500 + i).toString().slice(-3)}`,
        company: `Prospekt ${i + 1} Kft.`,
        opportunityName: `The Code csomag ajánlat #${i + 1}`,
        status: stage.name === "Megnyert" ? "WON" : stage.name === "Elveszett" ? "LOST" : "OPEN",
        value: 150000 + i * 25000,
        source: pick(SOURCES, i),
      },
    });
  }

  // ---------------------------------------------------------------------
  // Client accounts across every lifecycle stage
  // ---------------------------------------------------------------------
  type AccountSpec = {
    name: string;
    website: string;
    industry: string;
    stage: string;
    daysInStage: number;
    monthlyFee: number;
    setupFee: number;
    contractSigned: boolean;
    lastPaymentDaysAgo: number | null;
    isTestAccount?: boolean;
    status?: string;
  };

  const specs: AccountSpec[] = [
    { name: "Zöld Kert Kft.", website: "zoldkert.hu", industry: "Kertészet", stage: "RETAINED", daysInStage: 62, monthlyFee: 180000, setupFee: 150000, contractSigned: true, lastPaymentDaysAgo: 3 },
    { name: "Aurora Bútor Kft.", website: "aurorabutor.hu", industry: "Lakberendezés", stage: "ADS_LIVE", daysInStage: 9, monthlyFee: 220000, setupFee: 180000, contractSigned: true, lastPaymentDaysAgo: 12 },
    { name: "Napfény Fogászat", website: "napfenyfogaszat.hu", industry: "Egészségügy", stage: "CSM_CONTACT", daysInStage: 2, monthlyFee: 160000, setupFee: 120000, contractSigned: false, lastPaymentDaysAgo: null },
    { name: "Kristály Ékszer", website: "kristalyekszer.hu", industry: "Kereskedelem", stage: "MEETING", daysInStage: 5, monthlyFee: 140000, setupFee: 100000, contractSigned: false, lastPaymentDaysAgo: null },
    { name: "Prémium Autó Bérlés", website: "premiumautoberles.hu", industry: "Autókölcsönzés", stage: "ONBOARDING_FORM", daysInStage: 4, monthlyFee: 200000, setupFee: 150000, contractSigned: true, lastPaymentDaysAgo: 6 },
    { name: "Balaton Apartman", website: "balatonapartman.hu", industry: "Turizmus", stage: "WAITING_IMAGES", daysInStage: 47, monthlyFee: 170000, setupFee: 130000, contractSigned: true, lastPaymentDaysAgo: 51 },
    { name: "FitLife Edzőterem", website: "fitlife.hu", industry: "Sport & fitnesz", stage: "LANDING_IN_PROGRESS", daysInStage: 3, monthlyFee: 150000, setupFee: 110000, contractSigned: true, lastPaymentDaysAgo: 3 },
    { name: "Style Studio Szépségszalon", website: "stylestudio.hu", industry: "Szépségipar", stage: "LANDING_REVIEW", daysInStage: 2, monthlyFee: 145000, setupFee: 100000, contractSigned: true, lastPaymentDaysAgo: 4 },
    { name: "TechFix Szerviz", website: "techfix.hu", industry: "Szolgáltatóipar", stage: "IN_REVISION", daysInStage: 6, monthlyFee: 155000, setupFee: 110000, contractSigned: true, lastPaymentDaysAgo: 8 },
    { name: "GreenBuild Építőipar", website: "greenbuild.hu", industry: "Építőipar", stage: "ADMIN_APPROVAL", daysInStage: 1, monthlyFee: 210000, setupFee: 160000, contractSigned: true, lastPaymentDaysAgo: 5 },
    { name: "Sunrise Utazási Iroda", website: "sunrise-utazas.hu", industry: "Turizmus", stage: "READY_TO_LAUNCH", daysInStage: 1, monthlyFee: 190000, setupFee: 140000, contractSigned: true, lastPaymentDaysAgo: 2 },
    { name: "Old Habits Kávézó", website: "oldhabits.hu", industry: "HoReCa", stage: "LOST", daysInStage: 90, monthlyFee: 130000, setupFee: 90000, contractSigned: false, lastPaymentDaysAgo: 120, status: "ARCHIVED" },
    { name: "Demo Teszt Fiók", website: "example.com", industry: "Teszt", stage: "ADS_LIVE", daysInStage: 15, monthlyFee: 0, setupFee: 0, contractSigned: false, lastPaymentDaysAgo: null, isTestAccount: true },
  ];

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);

  const createdAccounts: { id: string; name: string }[] = [];

  let accountIndex = 0;
  for (const spec of specs) {
    const account = await prisma.account.create({
      data: {
        organizationId: org.id,
        name: spec.name,
        website: spec.website,
        industry: spec.industry,
        status: spec.status ?? "ACTIVE",
        lifecycleStage: spec.stage,
        lifecycleEnteredAt: daysAgo(spec.daysInStage),
        monthlyFee: spec.monthlyFee,
        setupFee: spec.setupFee,
        startDate: daysAgo(spec.daysInStage + 10),
        contractSignedAt: spec.contractSigned ? daysAgo(spec.daysInStage + 8) : null,
        lastPaymentAt: spec.lastPaymentDaysAgo != null ? daysAgo(spec.lastPaymentDaysAgo) : null,
        source: pick(SOURCES, accountIndex),
        isTestAccount: !!spec.isTestAccount,
      },
    });

    // Contacts
    const primaryContact = await prisma.contact.create({
      data: {
        accountId: account.id,
        fullName: `${pick(LEAD_LAST_NAMES, accountIndex)} ${pick(LEAD_FIRST_NAMES, accountIndex)}`,
        email: account.name === "Zöld Kert Kft." ? "kapcsolat@zoldkert.hu" : `kapcsolat@${account.website}`,
        phone: `+3630${(1000000 + accountIndex).toString().slice(-7)}`,
        position: "Ügyvezető",
        isPrimary: true,
        canLoginPortal: true,
        passwordHash: clientPw,
      },
    });
    await prisma.contact.create({
      data: {
        accountId: account.id,
        fullName: `${pick(LEAD_LAST_NAMES, accountIndex + 4)} ${pick(LEAD_FIRST_NAMES, accountIndex + 4)}`,
        email: `marketing@${account.website}`,
        phone: `+3620${(2000000 + accountIndex).toString().slice(-7)}`,
        position: "Marketing vezető",
        isPrimary: false,
        canLoginPortal: false,
      },
    });

    // Team assignments
    const csm = pick([csm1, csm2], accountIndex);
    await prisma.teamAssignment.create({ data: { accountId: account.id, teamMemberId: csm.id, role: "CSM" } });
    await prisma.teamAssignment.create({ data: { accountId: account.id, teamMemberId: closer.id, role: "Closer" } });
    await prisma.teamAssignment.create({ data: { accountId: account.id, teamMemberId: developer.id, role: "Fejlesztő" } });

    // Pipeline + custom fields + opportunities
    const pipeline = await createPipeline(account.id);
    const fieldDefs = await Promise.all([
      prisma.customFieldDefinition.create({ data: { pipelineId: pipeline.id, name: "Költségvetés (Ft/hó)", type: "NUMBER", section: "Ajánlat részletei", order: 0 } }),
      prisma.customFieldDefinition.create({ data: { pipelineId: pipeline.id, name: "Iparág specifikus igény", type: "LONG_TEXT", section: "Ajánlat részletei", order: 1 } }),
      prisma.customFieldDefinition.create({ data: { pipelineId: pipeline.id, name: "Preferált kapcsolat módja", type: "SELECT", section: "Kapcsolat", options: JSON.stringify(["Telefon", "Email", "WhatsApp"]), order: 2 } }),
      prisma.customFieldDefinition.create({ data: { pipelineId: pipeline.id, name: "Hírlevélre feliratkozott", type: "CHECKBOX", section: "Kapcsolat", order: 3 } }),
    ]);

    for (let i = 0; i < 6; i++) {
      const stage = pick(pipeline.stages, i + accountIndex);
      const opp = await prisma.opportunity.create({
        data: {
          stageId: stage.id,
          accountId: account.id,
          firstName: pick(LEAD_FIRST_NAMES, i + accountIndex),
          lastName: pick(LEAD_LAST_NAMES, i + accountIndex + 2),
          email: `lead${i}@example.com`,
          phone: `+3670${(3000000 + i + accountIndex).toString().slice(-7)}`,
          company: `${pick(LEAD_LAST_NAMES, i)} Bt.`,
          opportunityName: `Érdeklődés – ${account.name}`,
          status: stage.name === "Megnyert" ? "WON" : stage.name === "Elveszett" ? "LOST" : "OPEN",
          value: 20000 + i * 15000,
          source: pick(SOURCES, i + accountIndex),
          customFields: JSON.stringify({
            [fieldDefs[0].id]: 100000 + i * 20000,
            [fieldDefs[2].id]: pick(["Telefon", "Email", "WhatsApp"], i),
            [fieldDefs[3].id]: i % 2 === 0,
          }),
        },
      });
      await prisma.note.create({ data: { opportunityId: opp.id, authorId: csm.id, body: "Első kapcsolatfelvétel megtörtént, érdeklődik a csomagajánlatunk iránt." } });
      await prisma.activityLogEntry.create({ data: { accountId: account.id, opportunityId: opp.id, actorId: csm.id, type: "CREATED", message: `${opp.firstName} ${opp.lastName ?? ""} létrehozva a "${stage.name}" szakaszban` } });
      if (i === 0) {
        await prisma.taskReminder.create({ data: { opportunityId: opp.id, title: "Visszahívás egyeztetése", dueAt: daysAgo(-2), assigneeId: csm.id } });
      }
    }

    // Webhook for lead intake
    await prisma.webhook.create({
      data: {
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        accountId: account.id,
        name: "Facebook Lead Ads",
      },
    });

    // Tasks (some auto-generated per spec's business-rule examples)
    await prisma.task.create({
      data: {
        organizationId: org.id,
        accountId: account.id,
        title: `Új ügyfeled van: ${account.name}`,
        description: "Vedd fel a kapcsolatot és indítsd el az onboardingot.",
        category: "Egyéb",
        priority: "MEDIUM",
        dueAt: daysAgo(-1),
        assigneeId: csm.id,
        statusColumn: "ASSIGNED",
        autoGenerated: true,
      },
    });
    if (spec.stage === "WAITING_IMAGES" || spec.stage === "ONBOARDING_FORM") {
      await prisma.task.create({
        data: {
          organizationId: org.id,
          accountId: account.id,
          title: `Onboarding elakadt – már ${spec.daysInStage} napja nem kész`,
          description: "SLA eszkaláció: nézd meg mi tartja fel az ügyfelet.",
          category: "Felhívni",
          priority: spec.daysInStage > 20 ? "URGENT" : "HIGH",
          dueAt: daysAgo(0),
          assigneeId: csm.id,
          statusColumn: spec.daysInStage > 5 ? "DAY_THREE" : "DAY_ONE",
          autoGenerated: true,
        },
      });
    }
    if (spec.lastPaymentDaysAgo != null && spec.lastPaymentDaysAgo > 30) {
      await prisma.task.create({
        data: {
          organizationId: org.id,
          accountId: account.id,
          title: "SÜRGŐS: sikertelen fizetés, hívd fel",
          description: `${spec.lastPaymentDaysAgo} napja nem érkezett befizetés.`,
          category: "Sikertelen fizetés",
          priority: "URGENT",
          dueAt: daysAgo(0),
          assigneeId: csm.id,
          statusColumn: "DAY_TWO",
          autoGenerated: true,
        },
      });
    }
    await prisma.task.create({
      data: {
        organizationId: org.id,
        accountId: account.id,
        title: "Hirdetés szövegírása",
        description: "Írj 3 variánst az új kampányhoz.",
        category: "Hirdetésszöveg",
        priority: "MEDIUM",
        dueAt: daysAgo(-3),
        assigneeId: dev2.id,
        statusColumn: "WAITING",
      },
    });

    // Approval items
    await prisma.approvalItem.create({ data: { accountId: account.id, type: "CREATIVE", title: "Nyári akció – hirdetéskép v1", status: "PENDING_INTERNAL", createdById: dev2.id, fileUrl: "/mock-assets/creative-placeholder.svg" } });
    await prisma.approvalItem.create({ data: { accountId: account.id, type: "AD_COPY", title: "Facebook hirdetésszöveg – v2", status: "PENDING_CLIENT", createdById: dev2.id } });
    if (accountIndex % 3 === 0) {
      await prisma.approvalItem.create({ data: { accountId: account.id, type: "LANDING", title: "Landing oldal – onboarding review", status: "APPROVED", createdById: dev3.id, decidedAt: daysAgo(2) } });
    }

    // Payments + contracts
    await prisma.payment.create({ data: { accountId: account.id, amount: spec.setupFee, type: "ONE_TIME", status: spec.contractSigned ? "PAID" : "SENT", dueDate: daysAgo(spec.daysInStage + 5), paymentLink: `https://pay.thecode.hu/${account.id.slice(0, 8)}-setup` } });
    if (isAccountLive(spec.stage)) {
      await prisma.payment.create({ data: { accountId: account.id, amount: spec.monthlyFee, type: "MONTHLY", status: spec.lastPaymentDaysAgo != null && spec.lastPaymentDaysAgo < 35 ? "PAID" : "EXPIRED", dueDate: daysAgo(spec.lastPaymentDaysAgo ?? 0), paymentLink: `https://pay.thecode.hu/${account.id.slice(0, 8)}-monthly` } });
    }
    await prisma.contract.create({
      data: {
        accountId: account.id,
        status: spec.contractSigned ? "SIGNED" : "SENT",
        amount: spec.setupFee + spec.monthlyFee,
        templateName: "Alap szolgáltatási szerződés",
        signedAt: spec.contractSigned ? daysAgo(spec.daysInStage + 8) : null,
      },
    });

    // Reports
    if (isAccountLive(spec.stage)) {
      for (let w = 0; w < 4; w++) {
        await prisma.report.create({
          data: {
            accountId: account.id,
            period: "WEEK",
            generatedAt: daysAgo(w * 7),
            isAutomatic: true,
            metrics: JSON.stringify({
              spend: 40000 + w * 5000,
              impressions: 80000 + w * 6000,
              clicks: 2200 + w * 120,
              leads: 38 + w * 3,
              roas: (2.1 + w * 0.1).toFixed(2),
            }),
          },
        });
      }
      for (let d = 0; d < 30; d++) {
        await prisma.adMetricSnapshot.create({
          data: {
            accountId: account.id,
            date: daysAgo(d),
            spend: 8000 + Math.round(Math.sin(d) * 1500) + d * 30,
            impressions: 12000 + Math.round(Math.cos(d) * 2000) + d * 50,
            clicks: 300 + Math.round(Math.sin(d / 2) * 40),
            leads: 6 + (d % 4),
          },
        });
      }
    }

    // Conversation + messages
    const conversation = await prisma.conversation.create({ data: { accountId: account.id } });
    await prisma.message.create({ data: { conversationId: conversation.id, senderType: "STAFF", staffId: csm.id, body: `Szép napot ${primaryContact.fullName}! Elindítottuk az onboardingot, hamarosan jelezzük a következő lépést.` } });
    await prisma.message.create({ data: { conversationId: conversation.id, senderType: "CLIENT", clientContactId: primaryContact.id, body: "Szuper, köszönjük! Mikorra várható az első anyag?" } });

    // Files
    await prisma.fileAsset.create({ data: { accountId: account.id, folder: "IMAGES", fileName: "logo.png", fileUrl: "/mock-assets/logo-placeholder.svg", fileType: "image" } });
    await prisma.fileAsset.create({ data: { accountId: account.id, folder: "VIDEOS", fileName: "termek-bemutato.mp4", fileUrl: "/mock-assets/video-placeholder.svg", fileType: "video" } });

    // Credentials
    await prisma.credential.create({ data: { accountId: account.id, label: "Weboldal admin belépés", value: `https://${account.website}/wp-admin · admin / (bizalmas)`, isConfidential: true } });

    createdAccounts.push({ id: account.id, name: account.name });
    accountIndex++;
  }

  // ---------------------------------------------------------------------
  // Projects (Weboldalak / Webshopok / Applikációk / Automatizációk /
  // Egyedi rendszerek) - spread across categories, statuses and accounts.
  // ---------------------------------------------------------------------
  const PROJECT_CATEGORY_KEYS = ["WEBOLDAL", "WEBSHOP", "APPLIKACIO", "AUTOMATIZACIO", "EGYEDI_RENDSZER"];
  const PROJECT_STATUS_KEYS = ["IGENYFELMERES", "TERVEZES", "FEJLESZTES", "TESZTELES", "UGYFEL_JOVAHAGYAS", "ELESITVE", "KARBANTARTAS"];
  const PROJECT_TITLES: Record<string, string[]> = {
    WEBOLDAL: ["Vállalati bemutatkozó oldal", "Landing oldal újratervezés", "Blog + SEO fejlesztés", "Többnyelvű céges weboldal"],
    WEBSHOP: ["WooCommerce webshop indítás", "Shopify migráció", "Egyedi checkout folyamat", "Termékkatalógus bővítés"],
    APPLIKACIO: ["Ügyfél mobil app (iOS/Android)", "Belső admin dashboard", "Foglalási rendszer app", "Ügyfélportál bővítés"],
    AUTOMATIZACIO: ["CRM–számlázó integráció", "Email automatizáció beállítása", "Készletkezelés automatizálása", "Riport-generálás ütemezése"],
    EGYEDI_RENDSZER: ["Egyedi ERP modul", "Beléptető rendszer fejlesztés", "Partnerintegrációs API", "Egyedi jelentéskészítő rendszer"],
  };

  let projectCounter = 0;
  for (const categoryKey of PROJECT_CATEGORY_KEYS) {
    const titles = PROJECT_TITLES[categoryKey];
    for (let i = 0; i < titles.length; i++) {
      const targetAccount = pick(createdAccounts, projectCounter + i);
      const status = pick(PROJECT_STATUS_KEYS, projectCounter);
      const assignee = pick([developer, dev2, dev3, dev4], projectCounter);
      await prisma.project.create({
        data: {
          accountId: targetAccount.id,
          category: categoryKey,
          title: titles[i],
          status,
          budget: 300000 + projectCounter * 45000,
          deadline: status === "ELESITVE" || status === "KARBANTARTAS" ? daysAgo(10 + projectCounter) : daysAgo(-(7 + projectCounter * 3)),
          assigneeId: assignee.id,
        },
      });
      projectCounter++;
    }
  }

  console.log(`Seed kész: ${specs.length + 1} account, ${staffPool.length + 1} csapattag, ${projectCounter} projekt.`);
  console.log("Belső belépés: admin@thecode.hu / thecode123");
  console.log("Ügyfélportál belépés: kapcsolat@zoldkert.hu / ugyfel123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
