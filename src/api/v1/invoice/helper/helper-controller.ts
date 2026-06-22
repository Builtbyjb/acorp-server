import { Hono } from "hono";
import type { Bindings } from "@/lib/types";
import { invoiceNotify } from "@/lib/crons";

const helperRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/helper");

helperRouteV1.get("/cron/notify", async (c) => {
    invoiceNotify(c.env);

    return c.json({ message: "Invoice notify cron job started" });
});

export default helperRouteV1;
