export interface CustomerData {
    id: string | number;
    customerCode: string;
    email: string;
}

export interface PlanData {
    id: string | number;
    planCode: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
    interval: string;
}

export interface SubscriptionData {
    id: string | number;
    planName: string;
    status: string;
    amount: { currency: string; value: number };
    subscriptionCode: string;
    emailToken?: string;
    nextBillingCycle: string | null;
}

export interface InitializeSubscriptionResult {
    authorizationUrl?: string;
    checkoutUrl?: string;
    reference?: string;
    sessionId?: string;
}

export interface WebhookEvent {
    type: string;
    data: Record<string, any>;
    rawBody: string;
}

export interface PaymentGateway {
    createCustomer(email: string, firstName: string, lastName: string): Promise<CustomerData>;
    fetchPlans(): Promise<PlanData[]>;
    initializeSubscription(
        email: string,
        planCode: string,
        successUrl?: string,
        cancelUrl?: string,
    ): Promise<InitializeSubscriptionResult>;
    verifyTransaction(reference: string): Promise<any>;
    fetchSubscriptions(customerId: string | number): Promise<any>;
    hasActiveSubscription(customerId: string | number): Promise<boolean>;
    disableSubscription(code: string, token?: string): Promise<Response>;
    getSubscriptionUpdateLink(code: string): Promise<Response>;
    verifyWebhookSignature(body: string, signature: string): Promise<boolean>;
    processWebhook(body: string): Promise<WebhookEvent>;
    createTransfer?(recipientCode: string, amount: number, currency: string, reason: string): Promise<any>;
    createPayout?(amount: number, currency: string, destination: string): Promise<any>;
}
