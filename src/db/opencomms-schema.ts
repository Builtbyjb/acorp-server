import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { organizations } from "./schemas";

export const opencommsContacts = sqliteTable("opencomms_contacts", {
    id: text("id").primaryKey(),
    organizationId: int("organization_id")
        .references(() => organizations.id)
        .notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    channel: text("channel", { enum: ["sms", "whatsapp"] })
        .notNull()
        .default("sms"),
    tags: text("tags", { mode: "json" })
        .$type<string[]>()
        .notNull()
        .default(sql`'[]'`),
    subscribed: int("subscribed", { mode: "boolean" }).notNull().default(true),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => sql`(unixepoch())`),
});

export const opencommsConversations = sqliteTable("opencomms_conversations", {
    id: text("id").primaryKey(),
    organizationId: int("organization_id")
        .references(() => organizations.id)
        .notNull(),
    contactId: text("contact_id")
        .references(() => opencommsContacts.id)
        .notNull(),
    channel: text("channel", { enum: ["sms", "whatsapp"] })
        .notNull()
        .default("sms"),
    lastMessageAt: int("last_message_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    unreadCount: int("unread_count").notNull().default(0),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => sql`(unixepoch())`),
});

export const opencommsMessages = sqliteTable("opencomms_messages", {
    id: text("id").primaryKey(),
    organizationId: int("organization_id")
        .references(() => organizations.id)
        .notNull(),
    conversationId: text("conversation_id")
        .references(() => opencommsConversations.id)
        .notNull(),
    contactId: text("contact_id")
        .references(() => opencommsContacts.id)
        .notNull(),
    direction: text("direction", { enum: ["incoming", "outgoing"] })
        .notNull(),
    channel: text("channel", { enum: ["sms", "whatsapp"] })
        .notNull()
        .default("sms"),
    body: text("body").notNull(),
    status: text("status", {
        enum: ["pending", "submitted", "delivered", "failed", "received"],
    })
        .notNull()
        .default("pending"),
    externalId: text("external_id"),
    sentAt: int("sent_at", { mode: "timestamp" }),
    deliveredAt: int("delivered_at", { mode: "timestamp" }),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => sql`(unixepoch())`),
});

export const opencommsCampaigns = sqliteTable("opencomms_campaigns", {
    id: text("id").primaryKey(),
    organizationId: int("organization_id")
        .references(() => organizations.id)
        .notNull(),
    name: text("name").notNull(),
    channel: text("channel", { enum: ["sms", "whatsapp"] })
        .notNull()
        .default("sms"),
    body: text("body").notNull(),
    status: text("status", { enum: ["draft", "scheduled", "sent"] })
        .notNull()
        .default("draft"),
    recipients: int("recipients").notNull().default(0),
    delivered: int("delivered").notNull().default(0),
    failed: int("failed").notNull().default(0),
    scheduledAt: int("scheduled_at", { mode: "timestamp" }),
    sentAt: int("sent_at", { mode: "timestamp" }),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => sql`(unixepoch())`),
});

export const opencommsChannelSettings = sqliteTable("opencomms_channel_settings", {
    id: text("id").primaryKey(),
    organizationId: int("organization_id")
        .references(() => organizations.id)
        .notNull(),
    channel: text("channel", { enum: ["sms", "whatsapp"] })
        .notNull(),
    enabled: int("enabled", { mode: "boolean" }).notNull().default(false),
    config: text("config", { mode: "json" })
        .$type<Record<string, string | number | boolean | null>>()
        .notNull()
        .default(sql`'{}'`),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => sql`(unixepoch())`),
});
