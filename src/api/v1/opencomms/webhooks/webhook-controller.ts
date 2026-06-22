import { Hono } from "hono";
import { Bindings } from "@/lib/types";

const webhookRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/webhooks");

webhookRouteV1.post("/sms", async (c) => {
    const data = await c.req.json();
    console.log("[OpenComms] eSMS webhook:", data);
    return c.json({ received: true }, 200);
});

webhookRouteV1.post("/whatsapp", async (c) => {
    const data = await c.req.json();
    console.log("[OpenComms] WhatsApp webhook:", data);
    return c.json({ received: true }, 200);
});

export default webhookRouteV1;
