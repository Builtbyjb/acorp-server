import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse } from "../setup/test-client";
import { drizzle } from "drizzle-orm/d1";
import { organizations } from "@/db/schemas";
import { eq } from "drizzle-orm";

describe("Referral E2E", () => {
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

    describe("GET /api/v1/invoice/referral/details", () => {
        it("returns referral details", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET, {
                referralCode: "testref",
            });
            const db = drizzle(env.DB);
            await db
                .update(organizations)
                .set({ referralEnabled: true })
                .where(eq(organizations.id, 1));

            const res = await makeRequest(env, "GET", "/api/v1/invoice/referral/details", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Referral details fetched successfully");
            expect(body.data.referralLink).toBeDefined();
            expect(body.data.totalReferrals).toBe(0);
        });
    });

    describe("POST /api/v1/invoice/referral/toggle", () => {
        it("enables referral and generates code", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/invoice/referral/toggle", {
                body: { referralEnabled: true },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Referral toggle updated successfully");
        });

        it("disables referral program", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/invoice/referral/toggle", {
                body: { referralEnabled: false },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Referral toggle updated successfully");
        });
    });

    describe("POST /api/v1/invoice/referral/payout-method", () => {
        it("saves payout method", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/invoice/referral/payout-method", {
                body: {
                    bankName: "Test Bank",
                    accountHolderName: "Test User",
                    accountNumber: "1234567890",
                    routingNumber: "123456789",
                },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Payout method updated successfully");
        });
    });
});
