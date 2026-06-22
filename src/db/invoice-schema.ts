import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { InvoiceItem } from "@shared/lib/types";
import { organizations } from "./schemas";

export const clients = sqliteTable("clients", {
    id: text("id").primaryKey(),
    organizationId: int("organization_id").references(() => organizations.id),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    country: text("country"),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => sql`(unixepoch())`),
});

export const invoices = sqliteTable("invoices", {
    id: text("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull(),
    clientId: text("client_id")
        .references(() => clients.id)
        .notNull(),
    issueDate: int("issue_date", { mode: "timestamp" }).notNull(),
    dueDate: int("due_date", { mode: "timestamp" }).notNull(),
    status: text("status").notNull(),
    signature: text("signature"),
    taxRate: int("tax_rate", { mode: "number" }).notNull().default(0),
    discount: int("discount", { mode: "number" }).notNull().default(0),
    items: text("items", { mode: "json" })
        .$type<InvoiceItem[]>()
        .notNull()
        .default(sql`'[]'`),
    notes: text("notes"),
    currency: text("currency").notNull(),
    notified: int("notified", { mode: "boolean" }).notNull().default(false),
    deleted: int("deleted", { mode: "boolean" }).notNull().default(false),
    createdAt: int("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(unixepoch())`)
        .$onUpdate(() => sql`(unixepoch())`),
});
