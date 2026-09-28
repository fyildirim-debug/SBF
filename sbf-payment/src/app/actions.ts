'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { verifyCaptcha } from "@/lib/captcha";
import { getRequestInfo } from "@/lib/request-info";

const USER_TYPES = ["sbf_ogrenci", "kurum_ogrenci", "akademik_personel", "idari_personel"];
const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

// Dosya türü istemcinin verdiği uzantıdan değil, içeriğin ilk baytlarından belirlenir
function detectReceiptExtension(bytes: Buffer): string | null {
    if (bytes.subarray(0, 5).toString("latin1") === "%PDF-") return ".pdf";
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg";
    if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
    if (bytes.subarray(0, 4).toString("latin1") === "GIF8") return ".gif";
    if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return ".webp";
    if (bytes.subarray(4, 8).toString("latin1") === "ftyp") {
        const brand = bytes.subarray(8, 12).toString("latin1");
        if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) return ".heic";
    }
    return null;
}

// Türkçe karakterleri sadeleştirip dosya adında yalnız güvenli karakter bırakır
function safeBaseName(originalName: string): string {
    const withoutExt = originalName.replace(/\.[^.]*$/, "");
    const base = withoutExt
        .toLocaleLowerCase("tr-TR")
        .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
        .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
        .normalize("NFKD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
    return base || "dekont";
}

function field(formData: FormData, key: string, maxLength: number): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function submitPayment(formData: FormData) {
    // CAPTCHA doğrulaması (server-side, imzalı ve tek kullanımlık)
    const captcha = verifyCaptcha(
        formData.get("captchaToken") as string | null,
        formData.get("captchaAnswer") as string | null,
    );
    if (!captcha.ok) {
        return { error: captcha.error };
    }

    const tcNo = field(formData, "tcNo", 11);
    const fullName = field(formData, "fullName", 200);
    const email = field(formData, "email", 254);
    const address = field(formData, "address", 1000);
    const studentNo = field(formData, "studentNo", 50);
    const userType = field(formData, "userType", 50) || "sbf_ogrenci";
    const facilityId = field(formData, "facilityId", 50);
    const receiptFile = formData.get("receipt");
    const consentsJson = formData.get("consents");

    // Temel validasyon
    if (!tcNo || !fullName || !email || !address || !studentNo || !facilityId || !(receiptFile instanceof File) || receiptFile.size === 0) {
        return { error: "Lütfen tüm alanları doldurunuz." };
    }

    if (!/^\d{11}$/.test(tcNo)) {
        return { error: "Geçersiz T.C. Kimlik No." };
    }

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: "Geçerli bir e-posta adresi giriniz." };
    }

    if (!USER_TYPES.includes(userType)) {
        return { error: "Geçersiz kişi tipi." };
    }

    const facility = await prisma.facility.findFirst({ where: { id: facilityId, isActive: true }, select: { id: true } });
    if (!facility) {
        return { error: "Seçilen tesis bulunamadı. Lütfen sayfayı yenileyiniz." };
    }

    // PDF onay kontrolü — kullanıcı tüm aktif dökümanları onaylamış olmalı
    const activeDocs = await prisma.consentDocument.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { name: true },
    });
    let consentedNames: string[] = [];
    try {
        const parsed = typeof consentsJson === "string" && consentsJson ? JSON.parse(consentsJson) : [];
        if (Array.isArray(parsed)) {
            consentedNames = parsed
                .map((c) => (c && typeof c === "object" ? (c as { documentName?: unknown }).documentName : null))
                .filter((n): n is string => typeof n === "string");
        }
    } catch {
        return { error: "Onay bilgileri geçersiz." };
    }
    if (activeDocs.some((doc) => !consentedNames.includes(doc.name))) {
        return { error: "Lütfen tüm dökümanları onaylayınız. Döküman listesi güncellendiyse sayfayı yenileyiniz." };
    }

    // Dinamik alanlar: yalnız aktif form alanları kabul edilir
    const formFields = await prisma.formField.findMany({ where: { isActive: true } });
    const extraDataObj: Record<string, string> = {};
    for (const f of formFields) {
        const value = field(formData, f.name, 1000);
        if (f.required && !value) {
            return { error: `Lütfen "${f.label}" alanını doldurunuz.` };
        }
        if (value) extraDataObj[f.name] = value;
    }

    // Dosya kaydetme
    let receiptPath = "";
    try {
        if (receiptFile.size > MAX_RECEIPT_BYTES) {
            return { error: "Dekont dosyası en fazla 10 MB olabilir." };
        }

        const buffer = Buffer.from(await receiptFile.arrayBuffer());
        const ext = detectReceiptExtension(buffer);
        if (!ext) {
            return { error: "Dekont PDF veya fotoğraf (JPG, PNG, WEBP, HEIC) olmalıdır." };
        }

        const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBaseName(receiptFile.name)}${ext}`;

        // uploads klasörüne kaydet (public dışında, yetkili API route ile servis edilir)
        const uploadDir = join(process.cwd(), "uploads");
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);
        receiptPath = `/api/uploads/${filename}`;
    } catch (error) {
        console.error("Dosya yükleme hatası:", error);
        return { error: "Dosya yüklenirken bir sorun oluştu." };
    }

    // Dijital imza kaydı: IP, tarayıcı ve zaman sunucuda belirlenir (istemciden gelen değere güvenilmez)
    const { ip, userAgent } = await getRequestInfo();
    const consentAt = new Date();

    try {
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
                extraData: JSON.stringify(extraDataObj),
                status: "pending",
                consents: {
                    create: activeDocs.map((doc) => ({
                        documentName: doc.name,
                        ipAddress: ip,
                        userAgent,
                        consentAt,
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
