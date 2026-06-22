import { Hono } from "hono";
import { Bindings } from "@/lib/types";
import contactRoutes from "./contacts/contact-controller";
import messageRoutes from "./messages/message-controller";
import campaignRoutes from "./campaigns/campaign-controller";
import channelRoutes from "./channels/channel-controller";
import webhookRoutes from "./webhooks/webhook-controller";

const opencommsRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/opencomms");

opencommsRouteV1.route("/", contactRoutes);
opencommsRouteV1.route("/", messageRoutes);
opencommsRouteV1.route("/", campaignRoutes);
opencommsRouteV1.route("/", channelRoutes);
opencommsRouteV1.route("/", webhookRoutes);

export default opencommsRouteV1;
