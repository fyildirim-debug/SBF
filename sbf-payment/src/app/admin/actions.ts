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
    } catch (error) {
        return { error: "Tesis eklenirken hata oluştu." };
    }
}

export async function deleteFacility(id: string) {
    try {
        await prisma.facility.delete({ where: { id } });
        revalidatePath("/admin/facilities");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
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
    } catch (error) {
        return { error: "Güncellenirken hata oluştu." };
    }
}
