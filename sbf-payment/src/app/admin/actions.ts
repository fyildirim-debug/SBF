'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Facility Actions ---

export async function addFacility(formData: FormData) {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;

    if (!name || isNaN(price)) {
        return { error: "Geçersiz veriler." };
    }

    try {
        await prisma.facility.create({
            data: {
                name,
                price,
                description,
            },
        });
        revalidatePath("/admin/facilities");
        revalidatePath("/"); // Ana sayfadaki dropdown da güncellensin
        return { success: true };
    } catch {
        return { error: "Tesis eklenirken hata oluştu." };
    }
}

export async function deleteFacility(id: string) {
    try {
        // Bağlı başvuru kontrolü
        const submissionCount = await prisma.submission.count({
            where: { facilityId: id }
        });

        if (submissionCount > 0) {
            return {
                error: `Bu tesise ait ${submissionCount} adet başvuru bulunmaktadır. Önce başvuruları silmeniz veya başka tesise taşımanız gerekmektedir.`
            };
        }

        await prisma.facility.delete({ where: { id } });
        revalidatePath("/admin/facilities");
        revalidatePath("/");
        return { success: true };
    } catch {
        return { error: "Silinirken hata oluştu." };
    }
}

// --- Submission Actions ---

export async function updateSubmissionStatus(id: string, status: string) {
    try {
        await prisma.submission.update({
            where: { id },
            data: { status },
        });
        revalidatePath("/admin/submissions");
        revalidatePath("/admin");
        return { success: true };
    } catch {
        return { error: "Güncellenirken hata oluştu." };
    }
}

// --- Settings Actions ---

const SETTING_KEYS = {
    APPLICATION_RULES: "application_rules",
    USAGE_TERMS: "usage_terms",
};

export async function updateSettings(formData: FormData) {
    const applicationRules = formData.get("applicationRules") as string;
    const usageTerms = formData.get("usageTerms") as string;

    try {
        // Başvuru kurallarını güncelle veya oluştur
        await prisma.siteSettings.upsert({
            where: { key: SETTING_KEYS.APPLICATION_RULES },
            update: { value: applicationRules },
            create: {
                key: SETTING_KEYS.APPLICATION_RULES,
                value: applicationRules,
                description: "Başvuru kuralları metni",
            },
        });

        // Kullanım şartlarını güncelle veya oluştur
        await prisma.siteSettings.upsert({
            where: { key: SETTING_KEYS.USAGE_TERMS },
            update: { value: usageTerms },
            create: {
                key: SETTING_KEYS.USAGE_TERMS,
                value: usageTerms,
                description: "Kullanım şartları metni",
            },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch {
        return { error: "Ayarlar kaydedilirken hata oluştu." };
    }
}
