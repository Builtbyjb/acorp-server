import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser, createTestClient, createTestInvoice } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse } from "../setup/test-client";

describe("User E2E", () => {
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

    describe("GET /api/v1/invoice/user/dashboard", () => {
        it("returns dashboard stats", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            await createTestInvoice(env.DB, client.id, org.id, { status: "paid" });
            await createTestInvoice(env.DB, client.id, org.id, { status: "sent" });

            const res = await makeRequest(env, "GET", "/api/v1/invoice/user/dashboard", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Success");
            expect(body.data.topStats).toBeDefined();
            expect(body.data.topStats.totalClients).toBe(1);
            expect(body.data.invoiceData).toBeDefined();
            expect(body.data.monthlyRevenues).toBeDefined();
        });

        it("returns 404 when no clients exist", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "GET", "/api/v1/invoice/user/dashboard", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(404);
            expect(body.message).toBe("No clients found");
        });
    });

    describe("GET /api/v1/invoice/user/settings", () => {
        it("returns user and business settings", async () => {
            const { user, org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "GET", "/api/v1/invoice/user/settings", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Profile setting");
            expect(body.data.user.username).toBe(user.username);
            expect(body.data.business.name).toBe(org.name);
        });
    });

    describe("PUT /api/v1/invoice/user/settings/profile", () => {
        it("updates user profile", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const formData = new FormData();
            formData.append("username", "updateduser");

            const res = await makeRequest(env, "PUT", "/api/v1/invoice/user/settings/profile", {
                body: formData,
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("User profile updated");
        });
    });

    describe("PUT /api/v1/invoice/user/settings/business", () => {
        it("updates business profile", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const formData = new FormData();
            formData.append("name", "Updated Business");
            formData.append("email", "business@example.com");
            formData.append("address", "456 New St");
            formData.append("city", "Abuja");
            formData.append("country", "Nigeria");
            formData.append("website", "https://updated.com");

            const res = await makeRequest(env, "PUT", "/api/v1/invoice/user/settings/business", {
                body: formData,
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Business Profile updated");
        });
    });

    describe("POST /api/v1/invoice/user/settings/feedback", () => {
        it("submits feedback", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/invoice/user/settings/feedback", {
                body: {
                    subject: "Test Feedback",
                    description: "This is a test feedback message",
                },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Feedback submitted");
        });
    });
});
