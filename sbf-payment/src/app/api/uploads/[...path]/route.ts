import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join, extname } from "path";

// MIME type eşleştirmesi
const MIME_TYPES: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path: pathSegments } = await params;
    const filename = pathSegments.join("/");

    // Güvenlik: path traversal engelle
    if (filename.includes("..") || filename.includes("~")) {
        return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
    }

    const filePath = join(process.cwd(), "uploads", filename);

    try {
        // Dosya var mı kontrol et
        await stat(filePath);

        // Dosyayı oku
        const fileBuffer = await readFile(filePath);
        const ext = extname(filename).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch {
        return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }
}
