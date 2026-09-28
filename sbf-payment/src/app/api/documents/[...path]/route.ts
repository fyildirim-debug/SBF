import { NextRequest } from "next/server";
import { join } from "path";
import { serveFile } from "@/lib/serve-file";

// Onay dökümanları herkese açıktır; build sonrası yüklenen PDF'ler de buradan servis edilir
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await params;
    return serveFile(
        [join(process.cwd(), "public", "documents"), join(process.cwd(), "documents")],
        pathSegments,
        "public, max-age=86400",
    );
}
