// Sunucu açılışında bir kez çalışır
export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;

    const { syncConsentDocuments, CONSENT_DOCUMENTS_VERSION } = await import("@/lib/consent-documents");
    try {
        if (await syncConsentDocuments()) {
            console.log(`[onay-dokumanlari] ${CONSENT_DOCUMENTS_VERSION} sürümü uygulandı; eski dökümanlar pasife alındı.`);
        }
    } catch (error) {
        console.error("[onay-dokumanlari] Senkronizasyon hatası:", error);
    }
}
