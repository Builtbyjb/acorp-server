import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { opencommsChannelSettings } from "@/db/opencomms-schema";

export async function getChannelSettingsByOrganization(db: DrizzleD1Database, orgId: number) {
    return db
        .select()
        .from(opencommsChannelSettings)
        .where(and(eq(opencommsChannelSettings.organizationId, orgId), eq(opencommsChannelSettings.deleted, false)));
}

export async function upsertChannelSetting(
    db: DrizzleD1Database,
    data: { channel: "sms" | "whatsapp"; enabled: boolean; config: Record<string, string | number | boolean | null> },
    orgId: number,
) {
    const existing = await db
        .select()
        .from(opencommsChannelSettings)
        .where(
            and(
                eq(opencommsChannelSettings.organizationId, orgId),
                eq(opencommsChannelSettings.channel, data.channel),
                eq(opencommsChannelSettings.deleted, false),
            ),
        )
        .get();

    if (existing) {
        await db
            .update(opencommsChannelSettings)
            .set({ enabled: data.enabled, config: data.config })
            .where(eq(opencommsChannelSettings.id, existing.id));
    } else {
        await db.insert(opencommsChannelSettings).values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            channel: data.channel,
            enabled: data.enabled,
            config: data.config,
        });
    }
}
