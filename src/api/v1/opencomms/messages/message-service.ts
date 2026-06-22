import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
import { opencommsConversations, opencommsMessages } from "@/db/opencomms-schema";

export async function listConversationsByOrganization(db: DrizzleD1Database, orgId: number) {
    return db
        .select()
        .from(opencommsConversations)
        .where(and(eq(opencommsConversations.organizationId, orgId), eq(opencommsConversations.deleted, false)))
        .orderBy(desc(opencommsConversations.lastMessageAt));
}

export async function listMessagesByConversation(db: DrizzleD1Database, conversationId: string) {
    return db
        .select()
        .from(opencommsMessages)
        .where(and(eq(opencommsMessages.conversationId, conversationId), eq(opencommsMessages.deleted, false)))
        .orderBy(opencommsMessages.createdAt);
}

export async function createOutgoingMessage(
    db: DrizzleD1Database,
    data: { conversationId: string; contactId: string; body: string; channel?: "sms" | "whatsapp" },
    orgId: number,
) {
    const message = await db
        .insert(opencommsMessages)
        .values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            conversationId: data.conversationId,
            contactId: data.contactId,
            direction: "outgoing",
            channel: data.channel ?? "sms",
            body: data.body,
            status: "submitted",
        })
        .returning()
        .get();

    await db
        .update(opencommsConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(opencommsConversations.id, data.conversationId));

    return message;
}
