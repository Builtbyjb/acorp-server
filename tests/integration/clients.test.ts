import { describe, it, expect, beforeEach } from "vitest";
import { createMockEnv } from "../setup/test-env";
import { migrateTestDb, clearTestDb } from "../setup/test-db";
import { createTestUser, createTestClient } from "../setup/test-factories";
import { setupMockFetch } from "../setup/fetch-mocks";
import { makeRequest, parseResponse } from "../setup/test-client";

describe("Clients E2E", () => {
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

    describe("GET /api/v1/invoice/clients", () => {
        it("returns 401 without auth", async () => {
            const res = await makeRequest(env, "GET", "/api/v1/invoice/clients");
            const { status } = await parseResponse(res);
            expect(status).toBe(401);
        });

        it("returns paginated clients for authenticated user", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "GET", "/api/v1/invoice/clients?page=1&size=10", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Clients fetched");
            expect(body.clients).toBeDefined();
            expect(body.meta).toBeDefined();
        });
    });

    describe("POST /api/v1/invoice/clients/create", () => {
        it("creates a new client", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/invoice/clients/create", {
                body: {
                    name: "New Client",
                    email: "client@example.com",
                    phone: "+1234567890",
                    address: "123 Main St",
                    city: "Lagos",
                    country: "Nigeria",
                },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Client created");
            expect(body.client).toBeDefined();
            expect(body.client.name).toBe("New Client");
        });

        it("returns 400 for invalid client data", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "POST", "/api/v1/invoice/clients/create", {
                body: { name: "" },
                cookies: { refresh_token: refreshToken },
            });
            const { status } = await parseResponse(res);
            expect(status).toBe(400);
        });
    });

    describe("GET /api/v1/invoice/clients/:id", () => {
        it("returns client details with invoices", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const res = await makeRequest(env, "GET", `/api/v1/invoice/clients/${client.id}`, {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.clientInfo).toBeDefined();
            expect(body.clientInfo.id).toBe(client.id);
        });

        it("returns 404 for non-existent client", async () => {
            const { refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const res = await makeRequest(env, "GET", "/api/v1/invoice/clients/nonexistent", {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(404);
            expect(body).toContain("Client not found");
        });
    });

    describe("PUT /api/v1/invoice/clients/edit/:id", () => {
        it("updates client details", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const res = await makeRequest(env, "PUT", `/api/v1/invoice/clients/edit/${client.id}`, {
                body: {
                    name: "Updated Client",
                    email: "updated@example.com",
                    phone: "+1234567890",
                    address: "123 Main St",
                    city: "Lagos",
                    country: "Nigeria",
                },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Client data edited");
        });
    });

    describe("DELETE /api/v1/invoice/clients/delete/:id", () => {
        it("soft deletes a client", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            const { client } = await createTestClient(env.DB, org.id);
            const res = await makeRequest(env, "DELETE", `/api/v1/invoice/clients/delete/${client.id}`, {
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.message).toBe("Client Deleted");
        });
    });

    describe("POST /api/v1/invoice/clients/search", () => {
        it("searches clients by name", async () => {
            const { org, refreshToken } = await createTestUser(env.DB, env.JWT_SECRET);
            await createTestClient(env.DB, org.id, { name: "Alpha Corp" });
            await createTestClient(env.DB, org.id, { name: "Beta Inc" });

            const res = await makeRequest(env, "POST", "/api/v1/invoice/clients/search", {
                body: { query: "Alpha" },
                cookies: { refresh_token: refreshToken },
            });
            const { status, body } = await parseResponse(res);
            expect(status).toBe(200);
            expect(body.data).toBeDefined();
            expect(body.data.length).toBe(1);
            expect(body.data[0].name).toBe("Alpha Corp");
        });
    });
});
