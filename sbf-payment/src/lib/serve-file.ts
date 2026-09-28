import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { extname, resolve, sep } from "path";

const MIME_TYPES: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
};

// Türkçe karakterli adlar HTTP başlığına doğrudan yazılamaz (ş, ğ, ı > 255).
// ASCII yedek ad + RFC 5987 filename* ile her tarayıcıda doğru ad görünür.
export function contentDisposition(filename: string): string {
    const asciiFallback = filename.normalize("NFKD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "_") || "dosya";
    return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

// Verilen klasörlerde dosyayı arar; klasör dışına çıkan yolları reddeder
export async function serveFile(
    baseDirs: string[],
    pathSegments: string[],
    cacheControl: string,
): Promise<NextResponse> {
    const filename = pathSegments.join("/");
    if (!filename || pathSegments.some((s) => s === ".." || s.includes("\\") || s.includes("\0"))) {
        return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
    }

    for (const baseDir of baseDirs) {
        const root = resolve(baseDir);
        const filePath = resolve(root, filename);
        if (!filePath.startsWith(root + sep)) {
            return NextResponse.json({ error: "Geçersiz dosya yolu" }, { status: 400 });
        }

        try {
            const fileBuffer = await readFile(filePath);
            const ext = extname(filename).toLowerCase();
            const displayName = pathSegments[pathSegments.length - 1];

            return new NextResponse(new Uint8Array(fileBuffer), {
                headers: {
                    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
                    "Content-Disposition": contentDisposition(displayName),
                    "Cache-Control": cacheControl,
                    "X-Content-Type-Options": "nosniff",
                },
            });
        } catch {
            continue;
        }
    }

    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
}
