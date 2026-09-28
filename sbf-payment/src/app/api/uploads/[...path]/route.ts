import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { isAdmin } from "@/lib/require-admin";
import { serveFile } from "@/lib/serve-file";

// Dekontlar kişisel veri içerir: yalnız giriş yapmış yönetici görebilir.
// Eski dekontlar public/uploads altında kalmış olabilir; /uploads/* istekleri de next.config'teki
// rewrite ile buraya düşer, böylece statik olarak herkese açık servis edilmez.
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { path: pathSegments } = await params;
    return serveFile(
        [join(process.cwd(), "uploads"), join(process.cwd(), "public", "uploads")],
        pathSegments,
        "private, no-store",
    );
}
