// Seeds the database with the same demo data the in-memory store uses.
// Run with: npm run db:seed  (after db:push)
import { PrismaClient } from "@prisma/client";
import {
  seedAnalyses,
  seedEvents,
  seedOpportunities,
  seedResults,
  seedSubscriptions,
  seedUsers,
} from "../src/lib/seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding VaultBets AI database…");

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        password: u.password,
        role: u.role,
        createdAt: new Date(u.createdAt),
      },
    });
  }

  for (const s of seedSubscriptions) {
    await prisma.subscription.upsert({
      where: { userId: s.userId },
      update: {},
      create: {
        id: s.id,
        userId: s.userId,
        plan: s.plan,
        status: s.status,
        currentPeriodEnd: new Date(s.currentPeriodEnd),
      },
    });
  }

  for (const e of seedEvents) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        sport: e.sport,
        competition: e.competition,
        homeName: e.homeName,
        awayName: e.awayName,
        startsAt: new Date(e.startsAt),
        venue: e.venue,
        marketConfidence: e.marketConfidence,
        status: e.status,
      },
    });
  }

  for (const a of seedAnalyses) {
    await prisma.analysis.upsert({
      where: { eventId: a.eventId },
      update: {},
      create: {
        id: a.id,
        eventId: a.eventId,
        premium: a.premium,
        published: a.published,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
        summary: a.summary,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sections: a.sections as any,
        generatedBy: a.generatedBy ?? "template",
      },
    });
  }

  for (const o of seedOpportunities) {
    await prisma.opportunity.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id,
        eventId: o.eventId,
        market: o.market,
        bookmakerOdds: o.bookmakerOdds,
        fairOdds: o.fairOdds,
        edgePct: o.edgePct,
        confidence: o.confidence,
        reasoning: o.reasoning,
      },
    });
  }

  for (const r of seedResults) {
    await prisma.result.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        date: new Date(r.date),
        sport: r.sport,
        event: r.event,
        opportunity: r.opportunity,
        marketOdds: r.marketOdds,
        fairOdds: r.fairOdds,
        status: r.status,
        roi: r.roi,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
