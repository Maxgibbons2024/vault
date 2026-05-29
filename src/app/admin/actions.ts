"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import {
  createEvent,
  deleteAnalysis,
  deleteEvent,
  getAnalysisForEvent,
  setAnalysisPublished,
  setPlanForUser,
  upsertAnalysis,
} from "@/lib/store";
import type { PlanId, Sport } from "@/lib/types";

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/subscribers");
  revalidatePath("/dashboard");
}

export async function createEventAction(formData: FormData) {
  await assertAdmin();
  const sport = String(formData.get("sport")) as Sport;
  const competition = String(formData.get("competition") || "").trim();
  const homeName = String(formData.get("homeName") || "").trim();
  const awayName = String(formData.get("awayName") || "").trim();
  const startsAtRaw = String(formData.get("startsAt") || "");
  const venue = String(formData.get("venue") || "").trim();
  const marketConfidence = Number(formData.get("marketConfidence") || 60);

  if (!competition || !homeName || !awayName || !startsAtRaw) return;

  const event = await createEvent({
    sport,
    competition,
    homeName,
    awayName,
    startsAt: new Date(startsAtRaw).toISOString(),
    venue: venue || undefined,
    marketConfidence: Math.max(0, Math.min(100, marketConfidence)),
    status: "scheduled",
  });

  // Seed a draft (unpublished) analysis shell so admins can publish it.
  await upsertAnalysis({
    id: `an_${event.id}`,
    eventId: event.id,
    premium: true,
    published: false,
    summary: `Draft analysis for ${homeName} vs ${awayName}. Edit and publish to make it available to subscribers.`,
    sections: [
      { heading: "Overview", body: "Add your overview here." },
      { heading: "Key Statistics", body: "Add key statistics here." },
      { heading: "Conclusion", body: "Add your conclusion here." },
    ],
  });

  refresh();
}

export async function deleteEventAction(formData: FormData) {
  await assertAdmin();
  const eventId = String(formData.get("eventId") || "");
  if (eventId) await deleteEvent(eventId);
  refresh();
}

export async function togglePublishAction(formData: FormData) {
  await assertAdmin();
  const eventId = String(formData.get("eventId") || "");
  const analysis = await getAnalysisForEvent(eventId);
  if (analysis) await setAnalysisPublished(analysis.id, !analysis.published);
  refresh();
}

export async function deleteAnalysisAction(formData: FormData) {
  await assertAdmin();
  const analysisId = String(formData.get("analysisId") || "");
  if (analysisId) await deleteAnalysis(analysisId);
  refresh();
}

export async function updateAnalysisAction(formData: FormData) {
  await assertAdmin();
  const eventId = String(formData.get("eventId") || "");
  const analysis = await getAnalysisForEvent(eventId);
  if (!analysis) return;
  const summary = String(formData.get("summary") || analysis.summary);
  const premium = formData.get("premium") === "on";
  await upsertAnalysis({ ...analysis, summary, premium });
  revalidatePath(`/admin/events/${eventId}`);
  refresh();
}

export async function setPlanAction(formData: FormData) {
  await assertAdmin();
  const userId = String(formData.get("userId") || "");
  const plan = String(formData.get("plan") || "free") as PlanId;
  if (userId) await setPlanForUser(userId, plan);
  refresh();
}
