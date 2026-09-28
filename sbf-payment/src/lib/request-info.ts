import { headers } from "next/headers";

// İstemci IP'si: X-Forwarded-For'daki ilk adres (yoksa X-Real-IP).
// /api/get-ip ile aynı kural — kullanıcıya gösterilen IP ile kaydedilen IP aynı olur.
export function clientIpFromHeaders(h: Headers): string {
    const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    let ip = forwardedFor || h.get("x-real-ip")?.trim() || "unknown";
    if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") ip = "localhost";
    return ip.slice(0, 64);
}

export async function getRequestInfo(): Promise<{ ip: string; userAgent: string | null }> {
    const h = await headers();
    return {
        ip: clientIpFromHeaders(h),
        userAgent: h.get("user-agent")?.slice(0, 512) ?? null,
    };
}
