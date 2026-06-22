import { drizzle } from "drizzle-orm/d1";
import { users, organizations, members, roles } from "@/db/schemas";
import { sign } from "hono/jwt";
import type { D1Database } from "@cloudflare/workers-types";

export async function seedRoles(db: D1Database) {
    const drizzleDb = drizzle(db);
    const existing = await drizzleDb.select().from(roles).get();
    if (!existing) {
        await drizzleDb.insert(roles).values({
            id: 1,
            name: "owner",
            permissions: JSON.stringify(["*"]),
        });
    }
}

export async function createTestUser(
    db: D1Database,
    jwtSecret: string,
    overrides: {
        email?: string;
        firstname?: string;
        lastname?: string;
        username?: string;
        country?: string;
        paymentProvider?: "paystack" | "stripe";
        paystackCustomerId?: number;
        stripeCustomerId?: string;
        paystackSubscriptionStatus?: string;
        stripeSubscriptionStatus?: string;
        currency?: string;
    } = {},
) {
    const drizzleDb = drizzle(db);
    await seedRoles(db);

    const country = overrides.country || "nigeria";
    const provider = overrides.paymentProvider || "paystack";
    const currency = overrides.currency || (provider === "paystack" ? "NGN" : "USD");

    const org = await drizzleDb
        .insert(organizations)
        .values({
            name: overrides.username ? `${overrides.username} Org` : "Test Org",
            type: "business",
            address: "123 Test St",
            city: "Lagos",
            country,
            website: "https://test.com",
            paymentProvider: provider,
            currency,
            paystackCustomerId: overrides.paystackCustomerId || null,
            stripeCustomerId: overrides.stripeCustomerId || null,
            paystackSubscriptionStatus: overrides.paystackSubscriptionStatus || "none",
            stripeSubscriptionStatus: overrides.stripeSubscriptionStatus || "none",
        })
        .returning()
        .get();

    const user = await drizzleDb
        .insert(users)
        .values({
            email: overrides.email || "test@example.com",
            firstname: overrides.firstname || "Test",
            lastname: overrides.lastname || "User",
            username: overrides.username || "testuser",
            currentOrgId: org.id,
        })
        .returning()
        .get();

    await drizzleDb
        .insert(members)
        .values({
            userId: user.id,
            organizationId: org.id,
            roleId: 1,
        })
        .returning()
        .get();

    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        currentOrgId: org.id,
        organizationName: org.name,
        paymentProvider: org.paymentProvider || undefined,
        paystackCustomerId: org.paystackCustomerId || undefined,
        paystackCustomerCode: org.paystackCustomerCode || undefined,
        stripeCustomerId: org.stripeCustomerId || undefined,
        exp: Math.floor(Date.now() / 1000) + 7776000,
    };

    const refreshToken = await sign(payload, jwtSecret);
    const accessToken = await sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) + 1800 },
        jwtSecret,
    );

    return { user, org, refreshToken, accessToken };
}

export async function createTestClient(
    db: D1Database,
    orgId: number,
    overrides: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        country?: string;
    } = {},
) {
    const drizzleDb = drizzle(db);
    const client = await drizzleDb
        .insert(clients)
        .values({
            id: crypto.randomUUID(),
            organizationId: orgId,
            name: overrides.name || "Test Client",
            email: overrides.email || "client@example.com",
            phone: overrides.phone || "+1234567890",
            address: overrides.address || "456 Client St",
            city: overrides.city || "Lagos",
            country: overrides.country || "Nigeria",
        })
        .returning()
        .get();

    return { client };
}

import { clients, invoices } from "@/db/invoice-schema";

export async function createTestInvoice(
    db: D1Database,
    clientId: string,
    orgId: number,
    overrides: {
        status?: string;
        issueDate?: Date;
        dueDate?: Date;
        items?: Array<{ description: string; quantity: number; unitPrice: number }>;
        currency?: string;
        taxRate?: number;
        discount?: number;
        notes?: string;
    } = {},
) {
    const drizzleDb = drizzle(db);
    const invoice = await drizzleDb
        .insert(invoices)
        .values({
            id: crypto.randomUUID(),
            invoiceNumber: `INV-${new Date().getFullYear()}-1`,
            clientId,
            issueDate: overrides.issueDate || new Date(),
            dueDate: overrides.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: overrides.status || "sent",
            items: overrides.items || [{ description: "Service", quantity: 1, unitPrice: 100 }],
            currency: overrides.currency || "NGN",
            taxRate: overrides.taxRate ?? 0,
            discount: overrides.discount ?? 0,
            notes: overrides.notes || "Test invoice",
        })
        .returning()
        .get();

    return { invoice };
}
