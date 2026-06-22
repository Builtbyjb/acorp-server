import { z } from "zod";

export const PaystackPlanResponseSchema = z.array(
    z.object({
        plan_code: z.string(),
        name: z.string(),
        description: z.string(),
        amount: z.number(),
        interval: z.string(),
        currency: z.string(),
        id: z.number(),
    }),
);

export const PaystackSubscriptionSchema = z.object({
    subscriptionCode: z.string(),
    emailToken: z.string(),
});

export const PaystackSubscribeSchema = z.object({
    planCode: z.string(),
});

const LogSchema = z.object({
    start_time: z.number(),
    time_spent: z.number(),
    attempts: z.number(),
    errors: z.number(),
    success: z.boolean(),
    mobile: z.boolean(),
    input: z.array(z.unknown()),
    history: z.array(z.unknown()),
});

const AuthorizationSchema = z.object({
    authorization_code: z.string(),
    bin: z.string(),
    last4: z.string(),
    exp_month: z.string(),
    exp_year: z.string(),
    channel: z.string(),
    card_type: z.string(),
    bank: z.string(),
    country_code: z.string(),
    brand: z.string(),
    reusable: z.boolean(),
    signature: z.string(),
    account_name: z.string().nullable(),
    receiver_bank_account_number: z.string().nullable(),
    receiver_bank: z.string().nullable(),
});

const CustomerSchema = z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    customer_code: z.string(),
    phone: z.string(),
    metadata: z.record(z.unknown()).nullable(),
    risk_action: z.string(),
    international_format_phone: z.string().nullable(),
});

const PlanObjectSchema = z.object({
    id: z.number(),
    name: z.string(),
    plan_code: z.string(),
    description: z.string(),
    amount: z.number(),
    interval: z.enum(["daily", "weekly", "monthly", "annually"]),
    send_invoices: z.boolean(),
    send_sms: z.boolean(),
    currency: z.string(),
});

const MetadataSchema = z.object({
    referrer: z.string().url(),
});

const TransactionDataSchema = z.object({
    id: z.number(),
    domain: z.string(),
    status: z.string(),
    reference: z.string(),
    receipt_number: z.string().nullable(),
    amount: z.number(),
    message: z.string().nullable(),
    gateway_response: z.string(),
    response_code: z.string(),
    paid_at: z.string().datetime(),
    created_at: z.string().datetime(),
    channel: z.string(),
    currency: z.string(),
    ip_address: z.string(),
    metadata: MetadataSchema,
    log: LogSchema,
    fees: z.number(),
    fees_split: z.unknown().nullable(),
    authorization: AuthorizationSchema,
    customer: CustomerSchema,
    planCode: z.string(),
    split: z.record(z.unknown()),
    order_id: z.string().nullable(),
    paidAt: z.string().datetime(),
    createdAt: z.string().datetime(),
    requested_amount: z.number(),
    pos_transaction_data: z.unknown().nullable(),
    source: z.unknown().nullable(),
    fees_breakdown: z.unknown().nullable(),
    connect: z.unknown().nullable(),
    transaction_date: z.string().datetime(),
    plan: PlanObjectSchema,
    subaccount: z.record(z.unknown()),
});

export const CallbackResponseSchema = z.object({
    status: z.boolean(),
    message: z.string(),
    data: TransactionDataSchema,
});

export type CallbackResponse = z.infer<typeof CallbackResponseSchema>;
export type TransactionData = z.infer<typeof TransactionDataSchema>;
export type Authorization = z.infer<typeof AuthorizationSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type PlanObject = z.infer<typeof PlanObjectSchema>;
export type TransactionLog = z.infer<typeof LogSchema>;
