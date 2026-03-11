"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Check, X, Clock, FileSpreadsheet, Printer, Search } from "lucide-react";
import { SubmissionDetails } from "./SubmissionDetails";
import { updateSubmissionStatus } from "../../actions";

function statusAction(id: string, status: string): () => Promise<void> {
    return async () => { await updateSubmissionStatus(id, status); };
}
import type { SerializedSubmission } from "@/lib/types";

const USER_TYPE_LABELS: Record<string, string> = {
    sbf_ogrenci: "SBF Öğrenci",
    kurum_ogrenci: "Kurum İçi Öğrenci",
    akademik_personel: "Akademik Personel",
    idari_personel: "İdari Personel",
    ogrenci: "Öğrenci",
    personel: "Personel",
};

function getPrice(sub: SerializedSubmission): number {
    const ut = sub.userType;
    const f = sub.facility;
    if (ut === "sbf_ogrenci") return f.sbfStudentPrice;
    if (ut === "kurum_ogrenci") return f.externalStudentPrice;
    if (ut === "akademik_personel") return f.academicStaffPrice;
    if (ut === "idari_personel") return f.adminStaffPrice;
    return f.sbfStudentPrice;
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
        pending: {
            cls: "bg-orange-100 text-orange-700 border-orange-200",
            icon: <Clock className="w-3 h-3 mr-1" />,
            label: "Bekliyor",
        },
        approved: {
            cls: "bg-green-100 text-green-700 border-green-200",
            icon: <Check className="w-3 h-3 mr-1" />,
            label: "Onaylandı",
        },
        rejected: {
            cls: "bg-red-100 text-red-700 border-red-200",
            icon: <X className="w-3 h-3 mr-1" />,
            label: "Reddedildi",
        },
    };
    const c = config[status] || config.pending;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${c.cls}`}>
            {c.icon}
            {c.label}
        </span>
    );
}

type TabKey = "all" | "pending" | "approved" | "rejected";

const TAB_CONFIG: { key: TabKey; label: string; badgeCls: string }[] = [
    { key: "all", label: "Tümü", badgeCls: "bg-[#152746] text-white" },
    { key: "pending", label: "Bekliyor", badgeCls: "bg-orange-500 text-white" },
    { key: "approved", label: "Onaylandı", badgeCls: "bg-green-600 text-white" },
    { key: "rejected", label: "Reddedildi", badgeCls: "bg-red-600 text-white" },
];

export function SubmissionsClient({ submissions }: { submissions: SerializedSubmission[] }) {
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [search, setSearch] = useState("");

    const counts = useMemo(
        () => ({
            all: submissions.length,
            pending: submissions.filter((s) => s.status === "pending").length,
            approved: submissions.filter((s) => s.status === "approved").length,
            rejected: submissions.filter((s) => s.status === "rejected").length,
        }),
        [submissions]
    );

    const filtered = useMemo(() => {
        let list = activeTab === "all" ? submissions : submissions.filter((s) => s.status === activeTab);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (s) =>
                    s.fullName.toLowerCase().includes(q) ||
                    s.tcNo.includes(q) ||
                    s.studentNo.includes(q) ||
                    s.email.toLowerCase().includes(q)
            );
        }
        return list;
    }, [submissions, activeTab, search]);

    const totalAmount = useMemo(
        () => filtered.reduce((acc, s) => acc + getPrice(s), 0),
        [filtered]
    );

    function exportCSV() {
        const headers = ["Tarih", "Ad Soyad", "TC No", "Öğr. No", "E-posta", "Kişi Tipi", "Tesis", "Tutar (TL)", "Durum"];
        const rows = filtered.map((s) => [
            new Date(s.createdAt).toLocaleDateString("tr-TR"),
            s.fullName,
            s.tcNo,
            s.studentNo,
            s.email,
            USER_TYPE_LABELS[s.userType] || s.userType,
            s.facility.name,
            getPrice(s).toFixed(2),
            s.status === "pending" ? "Bekliyor" : s.status === "approved" ? "Onaylandı" : "Reddedildi",
        ]);

        const bom = "\uFEFF";
        const csv =
            bom +
            [headers, ...rows]
                .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
                .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `odeme-bildirimleri-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function printPage() {
        window.print();
    }

    const rowBg = (status: string) => {
        if (status === "approved") return "bg-green-50/50";
        if (status === "rejected") return "bg-red-50/50";
        return "";
    };

    const tabLabel =
        activeTab === "all"
            ? "Tüm Başvurular"
            : activeTab === "pending"
            ? "Bekleyen Başvurular"
            : activeTab === "approved"
            ? "Onaylanan Başvurular"
            : "Reddedilen Başvurular";

    return (
        <div className="space-y-6">
            {/* Print-only header */}
            <div className="hidden print:block mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#cf9d34] flex items-center justify-center text-[#152746] font-bold text-xs">AÜ</div>
                    <div>
                        <h1 className="text-lg font-bold text-[#152746]">Ankara Üniversitesi — Spor Bilimleri Fakültesi</h1>
                        <p className="text-xs text-gray-500">Tesis Ödeme Bildirim Sistemi</p>
                    </div>
                </div>
                <div className="border-t border-b border-gray-200 py-2 flex justify-between text-sm text-gray-600">
                    <span><strong>{tabLabel}</strong> — {filtered.length} kayıt</span>
                    <span>Rapor Tarihi: {new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                </div>
            </div>

            {/* Screen header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ödeme Bildirimleri</h2>
                    <p className="text-muted-foreground mt-1">
                        Öğrencilerden gelen ödeme bildirimlerini inceleyin ve onaylayın.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        Excel İndir
                    </Button>
                    <Button variant="outline" size="sm" onClick={printPage} className="gap-2">
                        <Printer className="w-4 h-4 text-blue-600" />
                        PDF / Yazdır
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl w-fit print:hidden">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                            activeTab === tab.key
                                ? "bg-white shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {tab.label}
                        <span
                            className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold ${
                                activeTab === tab.key ? tab.badgeCls : "bg-muted text-muted-foreground"
                            }`}
                        >
                            {counts[tab.key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80 print:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Ad, TC, öğr. no veya e-posta..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#152746]/20"
                />
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="bg-[#152746] text-white text-xs uppercase">
                                    <th className="px-4 py-3 font-semibold">Tarih</th>
                                    <th className="px-4 py-3 font-semibold">Ad Soyad / E-posta</th>
                                    <th className="px-4 py-3 font-semibold">TC / Öğr. No</th>
                                    <th className="px-4 py-3 font-semibold">Tesis</th>
                                    <th className="px-4 py-3 font-semibold">Kişi Tipi</th>
                                    <th className="px-4 py-3 font-semibold text-right">Tutar</th>
                                    <th className="px-4 py-3 font-semibold text-center">Durum</th>
                                    <th className="px-4 py-3 font-semibold print:hidden">Dekont</th>
                                    <th className="px-4 py-3 font-semibold text-right print:hidden">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                                            {search ? "Arama kriterine uygun başvuru bulunamadı." : "Gösterilecek başvuru bulunmuyor."}
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((sub) => (
                                        <tr
                                            key={sub.id}
                                            className={`hover:brightness-95 transition-all ${rowBg(sub.status)}`}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="text-xs font-medium text-foreground">
                                                    {new Date(sub.createdAt).toLocaleDateString("tr-TR")}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(sub.createdAt).toLocaleTimeString("tr-TR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-sm">{sub.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{sub.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-mono">{sub.tcNo}</div>
                                                <div className="text-xs text-muted-foreground">{sub.studentNo}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium">{sub.facility.name}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {USER_TYPE_LABELS[sub.userType] || sub.userType}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-bold text-sm text-[#152746]">
                                                    {getPrice(sub).toFixed(2)} ₺
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={sub.status} />
                                            </td>
                                            <td className="px-4 py-3 print:hidden">
                                                <a
                                                    href={sub.receiptPath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-xs gap-1"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    Görüntüle
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-right print:hidden">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <SubmissionDetails submission={sub} />
                                                    {sub.status === "pending" && (
                                                        <>
                                                            <form action={statusAction(sub.id, "approved")}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 w-7 p-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                                    title="Onayla"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </form>
                                                            <form action={statusAction(sub.id, "rejected")}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                    title="Reddet"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </form>
                                                        </>
                                                    )}
                                                    {sub.status !== "pending" && (
                                                        <form action={statusAction(sub.id, "pending")}>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                                            >
                                                                Geri Al
                                                            </Button>
                                                        </form>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer summary */}
                    {filtered.length > 0 && (
                        <div className="px-4 py-3 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
                            <span>
                                <strong>{filtered.length}</strong> kayıt gösteriliyor
                                {activeTab !== "all" && (
                                    <> &mdash; <span className="text-foreground font-medium">{tabLabel}</span></>
                                )}
                            </span>
                            <span>
                                Toplam Tutar:{" "}
                                <strong className="text-[#152746] text-sm">{totalAmount.toFixed(2)} ₺</strong>
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Print styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print\\:hidden { display: none !important; }
                    [data-submissions-print], [data-submissions-print] * { visibility: visible; }
                }
            `}</style>
        </div>
    );
}
