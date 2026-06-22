import { Hono } from "hono";
import { Bindings, TokenPayload } from "@/lib/types";
import { authMiddleware } from "@/middleware/authentication";
import { drizzle } from "drizzle-orm/d1";
import {
    listConversationsByOrganization,
    listMessagesByConversation,
    createOutgoingMessage,
} from "./message-service";

const messageRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/messages");
messageRouteV1.use("*", authMiddleware());

messageRouteV1.get("/conversations", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;

    const conversations = await listConversationsByOrganization(db, jwtPayload.currentOrgId);
    return c.json({ conversations }, 200);
});

messageRouteV1.get("/conversations/:id", async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    const messages = await listMessagesByConversation(db, id);
    return c.json({ messages }, 200);
});

messageRouteV1.post("/", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;
    const data = await c.req.json();

    // Demo: log to console instead of hitting real providers.
    console.log("[OpenComms] send message payload:", {
        orgId: jwtPayload.currentOrgId,
        ...data,
    });

    const message = await createOutgoingMessage(db, data, jwtPayload.currentOrgId);
    return c.json({ message: "Message queued", data: message }, 201);
});

export default messageRouteV1;
