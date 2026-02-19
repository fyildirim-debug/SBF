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
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const studentNo = formData.get("studentNo") as string;
    const userType = (formData.get("userType") as string) || "ogrenci";
    const facilityId = formData.get("facilityId") as string;
    const receiptFile = formData.get("receipt") as File;
    const consentsJson = formData.get("consents") as string;
    const captchaToken = formData.get("captchaToken") as string;
    const captchaAnswer = formData.get("captchaAnswer") as string;

    // CAPTCHA doğrulaması (server-side)
    if (!captchaToken || !captchaAnswer) {
        return { error: "Güvenlik doğrulaması eksik." };
    }
    try {
        const decoded = Buffer.from(captchaToken, "base64").toString("utf-8");
        const [expectedAnswer, tokenTimestamp] = decoded.split(":");
        const currentTimestamp = Math.floor(Date.now() / 60000);
        const tokenAge = currentTimestamp - parseInt(tokenTimestamp, 10);

        // Token 5 dakikadan eski ise reddet (bot tekrar deneme koruması)
        if (tokenAge > 5) {
            return { error: "Güvenlik sorusu süresi doldu. Lütfen sayfayı yenileyiniz." };
        }

        if (parseInt(captchaAnswer, 10) !== parseInt(expectedAnswer, 10)) {
            return { error: "Güvenlik doğrulaması hatalı. Lütfen matematik sorusunu tekrar çözünüz." };
        }
    } catch {
        return { error: "Güvenlik doğrulaması geçersiz." };
    }

    // Temel validasyon
    if (!tcNo || !fullName || !email || !address || !studentNo || !facilityId || !receiptFile) {
        return { error: "Lütfen tüm alanları doldurunuz." };
    }

    if (tcNo.length !== 11) {
        return { error: "Geçersiz T.C. Kimlik No." };
    }

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: "Geçerli bir e-posta adresi giriniz." };
    }


    // PDF onay kontrolü
    let consents: ConsentData[] = [];
    try {
        if (consentsJson) {
            consents = JSON.parse(consentsJson);
        }
        // Aktif döküman sayısını kontrol et — ona göre consent zorunluluğu belirle
        const activeDocCount = await prisma.consentDocument.count({ where: { isActive: true } });
        if (activeDocCount > 0 && consents.length < activeDocCount) {
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

        // uploads klasörüne kaydet (public dışında, API route ile servis edilir)
        const uploadDir = join(process.cwd(), "uploads");
        const filepath = join(uploadDir, filename);

        // Klasör yoksa oluştur
        const { mkdir } = await import("fs/promises");
        await mkdir(uploadDir, { recursive: true });

        await writeFile(filepath, buffer);
        receiptPath = `/api/uploads/${filename}`;
    } catch (error) {
        console.error("Dosya yükleme hatası:", error);
        return { error: "Dosya yüklenirken bir sorun oluştu." };
    }

    // Sabit alanlar dışındaki verileri extraData olarak topla
    const fixedKeys = ["tcNo", "fullName", "email", "address", "studentNo", "facilityId", "receipt", "consents", "captchaToken", "captchaAnswer", "userType"];
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
                email,
                address,
                studentNo,
                userType,
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

