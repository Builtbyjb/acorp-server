import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
import { opencommsContacts } from "@/db/opencomms-schema";

export async function listContactsByOrganization(db: DrizzleD1Database, orgId: number) {
    return db
        .select()
        .from(opencommsContacts)
        .where(and(eq(opencommsContacts.organizationId, orgId), eq(opencommsContacts.deleted, false)))
        .orderBy(desc(opencommsContacts.createdAt));
}

export async function createContactRecord(
    db: DrizzleD1Database,
    data: { name: string; phone: string; channel?: "sms" | "whatsapp"; tags?: string[] },
    orgId: number,
) {
    return db
        .insert(opencommsContacts)
        .values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            name: data.name,
            phone: data.phone,
            channel: data.channel ?? "sms",
            tags: data.tags ?? [],
        })
        .returning()
        .get();
}

export async function updateContactRecord(
    db: DrizzleD1Database,
    id: string,
    data: { name?: string; phone?: string; channel?: "sms" | "whatsapp"; tags?: string[]; subscribed?: boolean },
) {
    await db
        .update(opencommsContacts)
        .set({
            ...(data.name !== undefined && { name: data.name }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.channel !== undefined && { channel: data.channel }),
            ...(data.tags !== undefined && { tags: data.tags }),
            ...(data.subscribed !== undefined && { subscribed: data.subscribed }),
        })
        .where(eq(opencommsContacts.id, id));
}

export async function softDeleteContact(db: DrizzleD1Database, id: string) {
    await db.update(opencommsContacts).set({ deleted: true }).where(eq(opencommsContacts.id, id));
}
