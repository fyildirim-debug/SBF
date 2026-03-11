"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, CheckCircle2 } from "lucide-react";

const CHANGELOG_VERSION = "v1.1.0";
const STORAGE_KEY = `sbf_changelog_seen_${CHANGELOG_VERSION}`;

const changelog = {
    version: CHANGELOG_VERSION,
    date: "11 Mart 2026",
    title: "Yenilikler & İyileştirmeler",
    items: [
        {
            icon: "📋",
            title: "Sekmeli Filtreleme",
            desc: "Ödeme bildirimleri artık Tümü / Bekliyor / Onaylandı / Reddedildi sekmelerine ayrıldı. Her sekme kayıt sayısını gösterir.",
        },
        {
            icon: "🔍",
            title: "Anlık Arama",
            desc: "Ad, TC Kimlik No, Öğrenci No veya e-posta ile başvurular arasında anında filtreleme yapılabilir.",
        },
        {
            icon: "📊",
            title: "Excel Dışa Aktarma",
            desc: "Mevcut sekme ve arama filtresine göre başvuruları CSV formatında indirin. Excel ve LibreOffice Calc ile açılır.",
        },
        {
            icon: "🖨️",
            title: "PDF / Yazdır",
            desc: "Tablo yazdırılabilir biçimde hazırlandı. Tarayıcının yazdır diyaloğu üzerinden PDF olarak kaydedebilirsiniz.",
        },
        {
            icon: "🎨",
            title: "Renk Kodlaması",
            desc: "Onaylanan başvurular yeşil, reddedilenler kırmızı arka plan ile kolayca ayırt edilebilir.",
        },
        {
            icon: "💰",
            title: "Tutar Özeti",
            desc: "Tablo altında filtrelenmiş başvuruların toplam tutarı görüntülenir.",
        },
    ],
};

export function ChangelogModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            const seen = localStorage.getItem(STORAGE_KEY);
            if (!seen) setOpen(true);
        } catch {
            // localStorage erişilemiyorsa gösterme
        }
    }, []);

    function close() {
        try {
            localStorage.setItem(STORAGE_KEY, "1");
        } catch {
            // ignore
        }
        setOpen(false);
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={close}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#152746] to-[#1e3a6e] px-6 py-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles className="w-4 h-4 text-[#cf9d34]" />
                                <span className="text-xs font-bold text-[#cf9d34] uppercase tracking-widest">
                                    Güncelleme Notu
                                </span>
                            </div>
                            <h2 className="text-xl font-bold leading-tight">{changelog.title}</h2>
                            <p className="text-sm text-white/50 mt-1">
                                {changelog.version} &mdash; {changelog.date}
                            </p>
                        </div>
                        <button
                            onClick={close}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 mt-0.5"
                            aria-label="Kapat"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    <ul className="space-y-4">
                        {changelog.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="text-xl leading-5 shrink-0 mt-0.5">{item.icon}</span>
                                <div>
                                    <p className="font-semibold text-sm text-[#152746]">{item.title}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-2 border-t border-gray-100">
                    <button
                        onClick={close}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#152746] hover:bg-[#1a3259] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Anladım, Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
}
