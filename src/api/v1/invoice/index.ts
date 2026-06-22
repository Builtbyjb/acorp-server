import { Hono } from "hono";
import { Bindings } from "@/lib/types";
import userRoutes from "./user/user-controller";
import clientRoutes from "./client/client-controller";
import { invoiceListRouteV1 } from "./invoice/invoice-controller";
import paymentRoutes from "./payment/payment-controller";
import referralRoutes from "./referral/referral-controller";
import blobRoutes from "./blob/blob-controller";
import helperRoutes from "./helper/helper-controller";

const invoiceRouteV1 = new Hono<{ Bindings: Bindings }>().basePath("/invoice");

invoiceRouteV1.route("/", userRoutes);
invoiceRouteV1.route("/", clientRoutes);
invoiceRouteV1.route("/", paymentRoutes);
invoiceRouteV1.route("/", referralRoutes);
invoiceRouteV1.route("/", blobRoutes);
invoiceRouteV1.route("/", helperRoutes);
invoiceRouteV1.route("/", invoiceListRouteV1);

export default invoiceRouteV1;
