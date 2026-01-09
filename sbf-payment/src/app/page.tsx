import { prisma } from "@/lib/prisma";
import { PaymentFormClient } from "./components/PaymentFormClient";

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [facilities, formFields] = await Promise.all([
    prisma.facility.findMany({ where: { isActive: true } }),
    prisma.formField.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  // Eğer tesis yoksa örnek tesis oluştur (Geliştirme aşaması kolaylığı için)
  if (facilities.length === 0) {
    // Burada side-effect yapmak ideal değil ama demo için kullanışlı
    // Kullanıcıya boş liste dönmek yerine bir uyarı da olabilir.
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative bg-gray-50 overflow-hidden">
      {/* Kurumsal Header Bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#cf9d34] z-50" />
      <div className="absolute top-2 left-0 w-full h-64 bg-[#152746] -z-10" />

      <div className="w-full max-w-3xl space-y-8 bg-white p-8 sm:p-12 rounded-lg shadow-xl border border-gray-200 mt-20 sm:mt-0">
        <div className="text-center space-y-4 mb-8">
          {/* Logo Kaldırıldı, Sadece Kurumsal Başlık */}
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#152746]">
              ANKARA ÜNİVERSİTESİ
            </h1>
            <h2 className="text-xl font-medium text-[#152746]/80">
              SPOR BİLİMLERİ FAKÜLTESİ
            </h2>
            <div className="h-1.5 w-24 bg-[#cf9d34] mx-auto rounded-full mt-5 mb-2"></div>
            <p className="text-gray-500 font-medium">
              Tesis Ödeme Bildirim Sistemi
            </p>
          </div>
        </div>

        <PaymentFormClient facilities={facilities} extraFields={formFields} />
      </div>

      <footer className="mt-8 text-sm text-gray-400 text-center">
        &copy; {new Date().getFullYear()} Ankara Üniversitesi Bilgi İşlem Daire Başkanlığı
      </footer>
    </div>
  );
}
