import { NextResponse } from "next/server";
import { createCaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";

// Yeni matematik sorusu + imzalı token (cevap istemciye gönderilmez)
export async function GET() {
    return NextResponse.json(createCaptcha(), {
        headers: { "Cache-Control": "no-store" },
    });
}
