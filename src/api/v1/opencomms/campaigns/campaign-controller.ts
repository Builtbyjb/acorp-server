import { Hono } from "hono";
import { Bindings, TokenPayload } from "@/lib/types";
import { authMiddleware } from "@/middleware/authentication";
import { drizzle } from "drizzle-orm/d1";
import { listCampaignsByOrganization, createCampaignRecord, softDeleteCampaign } from "./campaign-service";

const campaignRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/campaigns");
campaignRouteV1.use("*", authMiddleware());

campaignRouteV1.get("/", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;

    const campaigns = await listCampaignsByOrganization(db, jwtPayload.currentOrgId);
    return c.json({ campaigns }, 200);
});

campaignRouteV1.post("/", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;
    const data = await c.req.json();

    console.log("[OpenComms] create campaign payload:", {
        orgId: jwtPayload.currentOrgId,
        ...data,
    });

    const campaign = await createCampaignRecord(db, data, jwtPayload.currentOrgId);
    return c.json({ message: "Campaign created", campaign }, 201);
});

campaignRouteV1.delete("/:id", async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    await softDeleteCampaign(db, id);
    return c.json({ message: "Campaign deleted" }, 200);
});

export default campaignRouteV1;
