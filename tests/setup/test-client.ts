import app from "@/index";
import type { Bindings } from "@/lib/types";

export async function makeRequest(
    env: Bindings,
    method: string,
    path: string,
    options: {
        body?: any;
        cookies?: Record<string, string>;
        headers?: Record<string, string>;
    } = {},
) {
    const url = new URL(path, "http://localhost");
    const headers = new Headers(options.headers || {});

    if (options.cookies) {
        const cookieStr = Object.entries(options.cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");
        headers.set("Cookie", cookieStr);
    }

    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const req = new Request(url, {
        method,
        headers,
        body: options.body
            ? options.body instanceof FormData
                ? options.body
                : JSON.stringify(options.body)
            : undefined,
    });

    const res = await app.fetch(req, env, {
        waitUntil: async () => {},
        passThroughOnException: () => {},
        exports: {} as any,
        props: {} as any,
    });

    return res;
}

export async function makeAuthRequest(
    env: Bindings,
    accessToken: string,
    method: string,
    path: string,
    options: {
        body?: any;
        cookies?: Record<string, string>;
        headers?: Record<string, string>;
    } = {},
) {
    return makeRequest(env, method, path, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    });
}

export async function parseResponse<T = any>(res: Response): Promise<{ status: number; body: T }> {
    const status = res.status;
    let body: any;
    try {
        body = await res.json();
    } catch {
        body = await res.text();
    }
    return { status, body };
}

export function getCookies(res: Response): Record<string, string> {
    const setCookie = res.headers.get("set-cookie");
    if (!setCookie) return {};

    const cookies: Record<string, string> = {};
    const pairs = setCookie.split(",").map((c) => c.trim().split(";")[0]);
    for (const pair of pairs) {
        const [name, value] = pair.split("=");
        if (name && value) cookies[name.trim()] = value.trim();
    }
    return cookies;
}
