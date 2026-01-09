'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import { join } from "path";
import { redirect } from "next/navigation";

export async function submitPayment(formData: FormData) {
    const tcNo = formData.get("tcNo") as string;
    const fullName = formData.get("fullName") as string;
    const studentNo = formData.get("studentNo") as string;
    const facilityId = formData.get("facilityId") as string;
    const receiptFile = formData.get("receipt") as File;

    // Temel validasyon
    if (!tcNo || !fullName || !studentNo || !facilityId || !receiptFile) {
        return { error: "Lütfen tüm alanları doldurunuz." };
    }

    if (tcNo.length !== 11) {
        return { error: "Geçersiz T.C. Kimlik No." };
    }

    // Dosya kaydetme
    let receiptPath = "";
    try {
        const bytes = await receiptFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Benzersiz dosya adı oluştur
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const originalName = receiptFile.name.replace(/\s+/g, '-').toLowerCase();
        const filename = `${uniqueSuffix}-${originalName}`;

        // public/uploads klasörüne kaydet
        // Not: Production ortamında object storage (S3 vb.) önerilir, bu basit implementation'dır.
        const uploadDir = join(process.cwd(), "public/uploads");
        const filepath = join(uploadDir, filename);

        // Klasör yoksa oluşturmak gerekebilir ama kurulumda oluşturduk varsayalım veya bir helper ile yapalım
        // fs/promises'de mkdir recursive option'ı var ama burada basitce writeFile kullanıyoruz,
        // klasörün var olduğundan emin olunmalı.

        await writeFile(filepath, buffer);
        receiptPath = `/uploads/${filename}`;
    } catch (error) {
        console.error("Dosya yükleme hatası:", error);
        return { error: "Dosya yüklenirken bir sorun oluştu." };
    }

    // Sabit alanlar dışındaki verileri extraData olarak topla
    const fixedKeys = ["tcNo", "fullName", "studentNo", "facilityId", "receipt"];
    const extraDataObj: Record<string, string> = {};

    formData.forEach((value, key) => {
        if (!fixedKeys.includes(key)) {
            extraDataObj[key] = value as string;
        }
    });

    const extraData = JSON.stringify(extraDataObj);

    try {
        await prisma.submission.create({
            data: {
                tcNo,
                fullName,
                studentNo,
                facilityId,
                receiptPath,
                extraData,
                status: "pending",
            },
        });
    } catch (error) {
        console.error("Veritabanı hatası:", error);
        return { error: "Başvuru kaydedilirken veritabanı hatası oluştu." };
    }

    revalidatePath("/admin/submissions");
    return { success: true };
}
