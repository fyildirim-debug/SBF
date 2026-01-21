'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import { join } from "path";

// Consent veri tipi
interface ConsentData {
    documentName: string;
    consentAt: string;
    ipAddress: string;
    userAgent: string;
}

export async function submitPayment(formData: FormData) {
    const tcNo = formData.get("tcNo") as string;
    const fullName = formData.get("fullName") as string;
    const studentNo = formData.get("studentNo") as string;
    const facilityId = formData.get("facilityId") as string;
    const receiptFile = formData.get("receipt") as File;
    const consentsJson = formData.get("consents") as string;

    // Temel validasyon
    if (!tcNo || !fullName || !studentNo || !facilityId || !receiptFile) {
        return { error: "Lütfen tüm alanları doldurunuz." };
    }

    if (tcNo.length !== 11) {
        return { error: "Geçersiz T.C. Kimlik No." };
    }

    // PDF onay kontrolü
    let consents: ConsentData[] = [];
    try {
        if (consentsJson) {
            consents = JSON.parse(consentsJson);
        }
        if (consents.length < 2) {
            return { error: "Lütfen tüm dökümanları onaylayınız." };
        }
    } catch {
        return { error: "Onay bilgileri geçersiz." };
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
        const uploadDir = join(process.cwd(), "public/uploads");
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);
        receiptPath = `/uploads/${filename}`;
    } catch (error) {
        console.error("Dosya yükleme hatası:", error);
        return { error: "Dosya yüklenirken bir sorun oluştu." };
    }

    // Sabit alanlar dışındaki verileri extraData olarak topla
    const fixedKeys = ["tcNo", "fullName", "studentNo", "facilityId", "receipt", "consents"];
    const extraDataObj: Record<string, string> = {};

    formData.forEach((value, key) => {
        if (!fixedKeys.includes(key)) {
            extraDataObj[key] = value as string;
        }
    });

    const extraData = JSON.stringify(extraDataObj);

    try {
        // Başvuru ve onay kayıtlarını tek transaction'da oluştur
        await prisma.submission.create({
            data: {
                tcNo,
                fullName,
                studentNo,
                facilityId,
                receiptPath,
                extraData,
                status: "pending",
                // Dijital imza kayıtlarını oluştur
                consents: {
                    create: consents.map((consent) => ({
                        documentName: consent.documentName,
                        ipAddress: consent.ipAddress,
                        userAgent: consent.userAgent || null,
                        consentAt: new Date(consent.consentAt),
                    })),
                },
            },
        });
    } catch (error) {
        console.error("Veritabanı hatası:", error);
        return { error: "Başvuru kaydedilirken veritabanı hatası oluştu." };
    }

    revalidatePath("/admin/submissions");
    return { success: true };
}

