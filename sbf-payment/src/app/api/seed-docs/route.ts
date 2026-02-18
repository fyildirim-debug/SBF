import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const docs = await prisma.consentDocument.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json({ count: docs.length, docs });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
