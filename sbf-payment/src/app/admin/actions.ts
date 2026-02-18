'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// --- Tesis İşlemleri ---

export async function addFacility(formData: FormData) {
    const name = formData.get("name") as string;
    const studentPrice = parseFloat(formData.get("studentPrice") as string);
    const staffPrice = parseFloat(formData.get("staffPrice") as string);
    const description = formData.get("description") as string;

    if (!name || isNaN(studentPrice) || isNaN(staffPrice)) {
        return { error: "Geçersiz veriler." };
    }

    try {
        await prisma.facility.create({
            data: { name, studentPrice, staffPrice, description },
        });
        revalidatePath("/admin/facilities");
        revalidatePath("/");
        return { success: true };
    } catch {
        return { error: "Tesis eklenirken hata oluştu." };
    }
}

export async function updateFacility(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const studentPrice = parseFloat(formData.get("studentPrice") as string);
    const staffPrice = parseFloat(formData.get("staffPrice") as string);
    const description = formData.get("description") as string;
    const isActive = formData.get("isActive") === "true";

    if (!name || isNaN(studentPrice) || isNaN(staffPrice)) {
        return { error: "Geçersiz veriler." };
    }

    try {
        await prisma.facility.update({
            where: { id },
            data: { name, studentPrice, staffPrice, description, isActive },
        });
        revalidatePath("/admin/facilities");
        revalidatePath("/");
        return { success: true };
    } catch {
        return { error: "Güncelleme sırasında hata oluştu." };
    }
}

export async function deleteFacility(id: string) {
    try {
        const submissionCount = await prisma.submission.count({
            where: { facilityId: id }
        });

        if (submissionCount > 0) {
            return {
                error: `Bu tesise ait ${submissionCount} adet başvuru bulunmaktadır. Önce başvuruları silmeniz gerekmektedir.`
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

// --- Başvuru İşlemleri ---

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

// --- Site Ayarları ---

const SETTING_KEYS = {
    APPLICATION_RULES: "application_rules",
    USAGE_TERMS: "usage_terms",
};

export async function updateSettings(formData: FormData) {
    const applicationRules = formData.get("applicationRules") as string;
    const usageTerms = formData.get("usageTerms") as string;

    try {
        await prisma.siteSettings.upsert({
            where: { key: SETTING_KEYS.APPLICATION_RULES },
            update: { value: applicationRules },
            create: { key: SETTING_KEYS.APPLICATION_RULES, value: applicationRules, description: "Başvuru kuralları metni" },
        });

        await prisma.siteSettings.upsert({
            where: { key: SETTING_KEYS.USAGE_TERMS },
            update: { value: usageTerms },
            create: { key: SETTING_KEYS.USAGE_TERMS, value: usageTerms, description: "Kullanım şartları metni" },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch {
        return { error: "Ayarlar kaydedilirken hata oluştu." };
    }
}

// --- Admin Kullanıcı Yönetimi ---

export async function getAdmins() {
    return prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
}

export async function addAdmin(formData: FormData) {
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!email || !name || !password) {
        return { error: "Tüm alanlar zorunludur." };
    }
    if (password.length < 6) {
        return { error: "Şifre en az 6 karakter olmalıdır." };
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return { error: "Bu e-posta adresi zaten kullanımda." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { email, name, password: hashedPassword, role: "admin" },
        });

        revalidatePath("/admin/users");
        return { success: true };
    } catch {
        return { error: "Admin eklenirken hata oluştu." };
    }
}

export async function changeAdminPassword(id: string, formData: FormData) {
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 6) {
        return { error: "Şifre en az 6 karakter olmalıdır." };
    }
    if (newPassword !== confirmPassword) {
        return { error: "Şifreler eşleşmiyor." };
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        return { success: true };
    } catch {
        return { error: "Şifre değiştirilirken hata oluştu." };
    }
}

export async function deleteAdmin(id: string) {
    try {
        const adminCount = await prisma.user.count();
        if (adminCount <= 1) {
            return { error: "Son admin kullanıcı silinemez." };
        }

        await prisma.user.delete({ where: { id } });
        revalidatePath("/admin/users");
        return { success: true };
    } catch {
        return { error: "Silme sırasında hata oluştu." };
    }
}
