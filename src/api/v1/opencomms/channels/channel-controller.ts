import { Hono } from "hono";
import { Bindings, TokenPayload } from "@/lib/types";
import { authMiddleware } from "@/middleware/authentication";
import { drizzle } from "drizzle-orm/d1";
import { getChannelSettingsByOrganization, upsertChannelSetting } from "./channel-service";

const channelRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/channels");
channelRouteV1.use("*", authMiddleware());

channelRouteV1.get("/", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;

    const channels = await getChannelSettingsByOrganization(db, jwtPayload.currentOrgId);
    return c.json({ channels }, 200);
});

channelRouteV1.put("/", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;
    const data = await c.req.json();

    await upsertChannelSetting(db, data, jwtPayload.currentOrgId);
    return c.json({ message: "Channel settings saved" }, 200);
});

export default channelRouteV1;
