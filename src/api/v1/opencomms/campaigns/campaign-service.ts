import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
import { opencommsCampaigns } from "@/db/opencomms-schema";

export async function listCampaignsByOrganization(db: DrizzleD1Database, orgId: number) {
    return db
        .select()
        .from(opencommsCampaigns)
        .where(and(eq(opencommsCampaigns.organizationId, orgId), eq(opencommsCampaigns.deleted, false)))
        .orderBy(desc(opencommsCampaigns.createdAt));
}

export async function createCampaignRecord(
    db: DrizzleD1Database,
    data: { name: string; body: string; channel?: "sms" | "whatsapp"; recipients?: number; scheduledAt?: string },
    orgId: number,
) {
    return db
        .insert(opencommsCampaigns)
        .values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            name: data.name,
            body: data.body,
            channel: data.channel ?? "sms",
            recipients: data.recipients ?? 0,
            status: data.scheduledAt ? "scheduled" : "draft",
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        })
        .returning()
        .get();
}

export async function softDeleteCampaign(db: DrizzleD1Database, id: string) {
    await db.update(opencommsCampaigns).set({ deleted: true }).where(eq(opencommsCampaigns.id, id));
}
