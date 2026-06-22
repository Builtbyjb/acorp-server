import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse } from "../setup/test-client";

describe("Webhooks E2E", () => {
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

    describe("POST /api/v1/invoice/payments/webhook", () => {
        it("returns 401 for invalid Paystack signature", async () => {
            const res = await makeRequest(env, "POST", "/api/v1/invoice/payments/webhook", {
                headers: { "x-paystack-signature": "invalid" },
                body: "{}",
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(401);
            expect(body.message).toContain("Invalid Paystack signature");
        });

        it("returns 401 for invalid Stripe signature", async () => {
            const res = await makeRequest(env, "POST", "/api/v1/invoice/payments/webhook", {
                headers: { "stripe-signature": "invalid" },
                body: "{}",
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(401);
            expect(body.message).toContain("Invalid Stripe signature");
        });

        it("returns 400 for missing signature", async () => {
            const res = await makeRequest(env, "POST", "/api/v1/invoice/payments/webhook", {
                body: "{}",
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(400);
            expect(body.message).toBe("No valid signature found");
        });
    });

    describe("GET /api/v1/invoice/payments/callback", () => {
        it("redirects for Paystack callback with reference", async () => {
            await createTestUser(env.DB, env.JWT_SECRET, {
                paystackCustomerId: 12345,
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/callback?reference=ref_test");
            expect(res.status).toBe(302);
            const location = res.headers.get("location");
            expect(location).toContain("/settings/billing");
        });

        it("redirects for Stripe callback with session_id", async () => {
            await createTestUser(env.DB, env.JWT_SECRET, {
                stripeCustomerId: "cus_test",
            });
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/callback?session_id=cs_test");
            expect(res.status).toBe(302);
            const location = res.headers.get("location");
            expect(location).toContain("/settings/billing");
        });

        it("returns 400 for missing reference and session_id", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/invoice/payments/callback");
            const { status, body } = await parseResponse(res);
            expect(status).toBe(400);
            expect(body.error).toBe("No reference or session_id found");
        });
    });
});
