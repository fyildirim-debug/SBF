import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join, extname } from "path";

const MIME_TYPES: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join("/");

    if (filename.includes("..") || filename.includes("~")) {
        return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
    }

    // Önce public/documents'ta ara, yoksa documents/ klasöründe ara
    const paths = [
        join(process.cwd(), "public", "documents", filename),
        join(process.cwd(), "documents", filename),
    ];

    for (const filePath of paths) {
        try {
            await stat(filePath);
            const fileBuffer = await readFile(filePath);
            const ext = extname(filename).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";

            return new NextResponse(fileBuffer, {
                headers: {
                    "Content-Type": contentType,
                    "Content-Disposition": `inline; filename="${filename}"`,
                    "Cache-Control": "public, max-age=86400",
                },
            });
        } catch {
            continue;
        }
    }

    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
}
