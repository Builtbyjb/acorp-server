import { Hono } from "hono";
import { Bindings, TokenPayload } from "@/lib/types";
import { authMiddleware } from "@/middleware/authentication";
import { drizzle } from "drizzle-orm/d1";
import {
    listContactsByOrganization,
    createContactRecord,
    updateContactRecord,
    softDeleteContact,
} from "./contact-service";

const contactRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/contacts");
contactRouteV1.use("*", authMiddleware());

contactRouteV1.get("/", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;

    const contacts = await listContactsByOrganization(db, jwtPayload.currentOrgId);
    return c.json({ contacts }, 200);
});

contactRouteV1.post("/", async (c) => {
    const db = drizzle(c.env.DB);
    const jwtPayload = c.get("jwtPayload") as TokenPayload;
    const data = await c.req.json();

    const contact = await createContactRecord(db, data, jwtPayload.currentOrgId);
    return c.json({ message: "Contact created", contact }, 201);
});

contactRouteV1.put("/:id", async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");
    const data = await c.req.json();

    await updateContactRecord(db, id, data);
    return c.json({ message: "Contact updated" }, 200);
});

contactRouteV1.delete("/:id", async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");

    await softDeleteContact(db, id);
    return c.json({ message: "Contact deleted" }, 200);
});

export default contactRouteV1;
