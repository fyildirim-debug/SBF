'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, unlink } from "fs/promises";
import { basename, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { isAdmin, requireAdmin, UNAUTHORIZED_ERROR } from "@/lib/require-admin";

// Admin: tüm dökümanları getir
export async function getAllConsentDocuments() {
    await requireAdmin();
    return prisma.consentDocument.findMany({
        orderBy: { order: "asc" },
    });
}

// Yeni döküman ekle (PDF yükle)
export async function uploadConsentDocument(formData: FormData) {
    if (!(await isAdmin())) return { error: UNAUTHORIZED_ERROR };

    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const order = parseInt(formData.get("order") as string || "0", 10);
    const file = formData.get("file") as File;

    if (!name || !title || !file || file.size === 0) {
        return { error: "Ad, başlık ve PDF dosyası zorunludur." };
    }

    if (file.type !== "application/pdf") {
        return { error: "Sadece PDF dosyası yüklenebilir." };
    }

    try {
        const bytes = Buffer.from(await file.arrayBuffer());
        if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
            return { error: "Dosya geçerli bir PDF değil." };
        }

        // Dosyayı kaydet
        const docsDir = join(process.cwd(), "public/documents");
        if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

        const safeName = file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
        const uniqueName = `${Date.now()}_${safeName}`;
        const filePath = join(docsDir, uniqueName);

        await writeFile(filePath, bytes);

        // DB'ye kaydet — build sonrası eklenen dosyalar public/ altından servis edilmediği için API route üzerinden sunulur
        await prisma.consentDocument.create({
            data: {
                name,
                title,
                filePath: `/api/documents/${uniqueName}`,
                order,
                isActive: true,
            },
        });

        revalidatePath("/admin/documents");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("PDF yükleme hatası:", error);
        return { error: "Dosya yüklenirken hata oluştu." };
    }
}

// Dökümanı güncelle (sadece meta — ad, başlık, sıra)
export async function updateConsentDocument(id: string, formData: FormData) {
    if (!(await isAdmin())) return { error: UNAUTHORIZED_ERROR };

    const name = formData.get("name") as string;
    const title = formData.get("title") as string;
    const order = parseInt(formData.get("order") as string || "0", 10);
    const isActive = formData.get("isActive") === "true";

    if (!name || !title) {
        return { error: "Ad ve başlık zorunludur." };
    }

    try {
        await prisma.consentDocument.update({
            where: { id },
            data: { name, title, order, isActive },
        });
        revalidatePath("/admin/documents");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Güncelleme hatası:", error);
        return { error: "Güncelleme sırasında hata oluştu." };
    }
}

// Dökümanı sil
export async function deleteConsentDocument(id: string) {
    if (!(await isAdmin())) return { error: UNAUTHORIZED_ERROR };

    try {
        const doc = await prisma.consentDocument.findUnique({ where: { id } });
        if (!doc) return { error: "Döküman bulunamadı." };

        // Başka bir kayıt aynı dosyayı kullanmıyorsa diskten sil
        const sharedCount = await prisma.consentDocument.count({
            where: { filePath: doc.filePath, id: { not: id } },
        });
        if (sharedCount === 0) {
            const filePath = join(process.cwd(), "public", "documents", basename(doc.filePath));
            try {
                await unlink(filePath);
            } catch {
                // Dosya yoksa sessizce geç
            }
        }

        await prisma.consentDocument.delete({ where: { id } });
        revalidatePath("/admin/documents");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Silme hatası:", error);
        return { error: "Silme sırasında hata oluştu." };
    }
}
