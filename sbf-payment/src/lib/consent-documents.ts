import { prisma } from "@/lib/prisma";

// Başvuru formunda onaylatılan güncel dökümanlar (dosyalar public/documents altında).
// Liste değişince CONSENT_DOCUMENTS_VERSION artırılır; sunucu açılışında bir kez uygulanır:
// bu dökümanlar eklenir/aktifleşir, diğer tüm dökümanlar pasife alınır (silinmez, eski onay kayıtları korunur).
export const CONSENT_DOCUMENTS_VERSION = "2026-09-28";

export const CURRENT_CONSENT_DOCUMENTS = [
    {
        name: "FITNES SALONU ÜYELİK BAŞVURUSU (Eylül 2026)",
        title: "Fitnes Salonu Üyelik Başvurusu",
        filePath: "/documents/2026-09_fitnes-salonu-uyelik-basvurusu.pdf",
        order: 0,
    },
    {
        name: "FITNES SALONU KULLANIM KURALLARI (Eylül 2026)",
        title: "Fitnes Salonu Kullanım Kuralları",
        filePath: "/documents/2026-09_fitnes-salonu-kullanim-kurallari.pdf",
        order: 1,
    },
];

const VERSION_KEY = "consent_documents_version";

// Sürüm daha önce uygulandıysa hiçbir şey yapmaz; yöneticinin panelden yaptığı değişiklikleri ezmez
export async function syncConsentDocuments(): Promise<boolean> {
    const applied = await prisma.siteSettings.findUnique({ where: { key: VERSION_KEY } });
    if (applied?.value === CONSENT_DOCUMENTS_VERSION) return false;

    await prisma.$transaction(async (tx) => {
        const keepIds: string[] = [];

        for (const doc of CURRENT_CONSENT_DOCUMENTS) {
            const existing = await tx.consentDocument.findFirst({ where: { filePath: doc.filePath } });
            const saved = existing
                ? await tx.consentDocument.update({
                    where: { id: existing.id },
                    data: { name: doc.name, title: doc.title, order: doc.order, isActive: true },
                })
                : await tx.consentDocument.create({ data: { ...doc, isActive: true } });
            keepIds.push(saved.id);
        }

        await tx.consentDocument.updateMany({
            where: { id: { notIn: keepIds } },
            data: { isActive: false },
        });

        await tx.siteSettings.upsert({
            where: { key: VERSION_KEY },
            update: { value: CONSENT_DOCUMENTS_VERSION },
            create: { key: VERSION_KEY, value: CONSENT_DOCUMENTS_VERSION, description: "Uygulanan onay dökümanı sürümü" },
        });
    });

    return true;
}
