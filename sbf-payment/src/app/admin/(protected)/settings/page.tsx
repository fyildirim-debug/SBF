import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

// Varsayılan ayar değerleri
const DEFAULT_SETTINGS = {
    applicationRules: "1. Fitness salonu üyelik başvurusu yapabilmek için Ankara Üniversitesi mensubu olmanız gerekmektedir.\n2. Başvuru sırasında kimlik bilgilerinizi doğru girmeniz zorunludur.\n3. Dekont yüklemeden başvuru tamamlanamaz.",
    usageTerms: "1. Tesis kullanım saatlerine uyulmalıdır.\n2. Spor kıyafeti giymek zorunludur.\n3. Ekipmanlar kullanımdan sonra yerine bırakılmalıdır.\n4. Tesis içinde sigara içmek yasaktır.",
};

// Ayar anahtarları
const SETTING_KEYS = {
    APPLICATION_RULES: "application_rules",
    USAGE_TERMS: "usage_terms",
};

export default async function SettingsPage() {
    // Mevcut ayarları veritabanından çek
    const settings = await prisma.siteSettings.findMany();

    // Ayarları objeye dönüştür
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
        settingsMap[s.key] = s.value;
    });

    // Varsayılan değerlerle birleştir
    const currentSettings = {
        applicationRules: settingsMap[SETTING_KEYS.APPLICATION_RULES] || DEFAULT_SETTINGS.applicationRules,
        usageTerms: settingsMap[SETTING_KEYS.USAGE_TERMS] || DEFAULT_SETTINGS.usageTerms,
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#152746]">Ayarlar</h2>
                <p className="text-gray-500">Başvuru kuralları ve kullanım şartlarını buradan düzenleyebilirsiniz.</p>
            </div>

            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Başvuru Kuralları ve Kullanım Şartları</CardTitle>
                        <CardDescription>
                            Kullanıcılara gösterilecek kuralları ve şartları düzenleyin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SettingsForm initialSettings={currentSettings} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
