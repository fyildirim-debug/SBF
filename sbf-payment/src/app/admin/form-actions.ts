'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addFormField(formData: FormData) {
    const label = formData.get("label") as string;
    const type = formData.get("type") as string; // text, number, date, select
    const options = formData.get("options") as string; // virgülle ayrılmış

    if (!label || !type) {
        return { error: "Label ve tip zorunludur." };
    }

    // Slug benzeri name oluştur
    const name = label.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '_');

    // Son sıradakini bul ve +1 ekle
    const lastField = await prisma.formField.findFirst({
        orderBy: { order: 'desc' },
    });
    const order = (lastField?.order || 0) + 1;

    try {
        await prisma.formField.create({
            data: {
                name,
                label,
                type,
                required: false, // Varsayılan olarak zorunlu değil yapalım şimdilik
                options: options ? JSON.stringify(options.split(',').map(s => s.trim())) : null,
                order,
                isSystem: false,
            },
        });
        revalidatePath("/admin/forms");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: "Alan eklenirken hata oluştu." };
    }
}

export async function deleteFormField(id: string) {
    try {
        await prisma.formField.delete({ where: { id } });
        revalidatePath("/admin/forms");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: "Silinirken hata oluştu." };
    }
}

export async function toggleFormFieldActive(id: string, currentState: boolean) {
    try {
        await prisma.formField.update({
            where: { id },
            data: { isActive: !currentState },
        });
        revalidatePath("/admin/forms");
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: "Güncellenirken hata oluştu." };
    }
}
