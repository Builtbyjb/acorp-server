import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser, createTestClient, createTestInvoice } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse } from "../setup/test-client";
import app from "@/index";
import { drizzle } from "drizzle-orm/d1";
import { organizations } from "@/db/schemas";

// Mock ScheduledEvent for Node.js test environment
class MockScheduledEvent {
    cron: string;
    scheduledTime: number;
    constructor(cron: string, scheduledTime: number) {
        this.cron = cron;
        this.scheduledTime = scheduledTime;
    }
}
(globalThis as any).ScheduledEvent = MockScheduledEvent;

describe("Crons E2E", () => {
    let env: ReturnType<typeof createMockEnv>;
    let restoreFetch: () => void;

    beforeEach(async () => {
        env = createMockEnv();
        restoreFetch = setupMockFetch();
        await migrateTestDb(env.DB);
        await clearTestDb(env.DB);
        // restoreFetch called in afterEach
    });

    afterEach(() => {
        restoreFetch();
    });

    describe("GET /api/v1/invoice/helper/cron/notify", () => {
        it("triggers invoice notification cron", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "GET", "/api/v1/invoice/helper/cron/notify", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Invoice notify cron job started");
        });
    });

    describe("scheduled handler", () => {
        it("handles invoice notify cron schedule", async () => {
            const { org } = await createTestUser(env.DB, env.JWT_SECRET, {
                paystackCustomerId: 12345,
                paystackSubscriptionStatus: "active",
            });
            const { client } = await createTestClient(env.DB, org.id);
            const pastDue = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            await createTestInvoice(env.DB, client.id, org.id, {
                status: "sent",
                dueDate: pastDue,
                notified: false,
            });

            const scheduledEvent = new MockScheduledEvent("* * * * *", Date.now());
            const ctx = {
                waitUntil: async (promise: Promise<any>) => {
                    await promise;
                },
                passThroughOnException: () => {},
                exports: {} as any,
                props: {} as any,
            };

            await app.scheduled(scheduledEvent, env, ctx);
            // The cron runs without error
        });

        it("handles payout cron schedule", async () => {
            const db = drizzle(env.DB);
            await db.insert(organizations).values({
                id: 1,
                name: "Referrer",
                type: "business",
                referralEnabled: true,
                referralCode: "referrer1",
                paymentProvider: "paystack",
                currency: "NGN",
                referralPayoutMethod: JSON.stringify({
                    bankName: "Test Bank",
                    accountHolderName: "Test User",
                    accountNumber: "1234567890",
                    bankCode: "011",
                }),
            });
            await db.insert(organizations).values({
                id: 2,
                name: "Referred",
                type: "business",
                referredBy: 1,
                paystackSubscriptionStatus: "active",
                paymentProvider: "paystack",
                currency: "NGN",
            });

            const scheduledEvent = new MockScheduledEvent("0 0 1 * *", Date.now());
            const ctx = {
                waitUntil: async (promise: Promise<any>) => {
                    await promise;
                },
                passThroughOnException: () => {},
                exports: {} as any,
                props: {} as any,
            };

            await app.scheduled(scheduledEvent, env, ctx);
            // The cron runs without error
        });
    });
});
