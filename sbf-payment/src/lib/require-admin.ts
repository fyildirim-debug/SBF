import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const UNAUTHORIZED_ERROR = "Bu işlem için yönetici girişi gereklidir. Lütfen tekrar giriş yapınız.";

// Server action'lar herkese açık POST uçlarıdır; layout'taki yönlendirme onları korumaz.
// Her yönetici işlemi bu kontrolle başlamalıdır.
export async function isAdmin(): Promise<boolean> {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return false;

    // Silinmiş yöneticinin oturumu geçerli sayılmaz
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    return Boolean(user);
}

// Veri döndüren yönetici fonksiyonları için: oturum yoksa hata fırlatır
export async function requireAdmin(): Promise<void> {
    if (!(await isAdmin())) {
        throw new Error(UNAUTHORIZED_ERROR);
    }
}
