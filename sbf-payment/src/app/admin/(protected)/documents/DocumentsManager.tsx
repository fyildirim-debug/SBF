'use client';

import { useState, useTransition } from "react";
import { uploadConsentDocument, updateConsentDocument, deleteConsentDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Trash2, Upload, Pencil, Check, X, ToggleLeft, ToggleRight } from "lucide-react";

interface ConsentDoc {
    id: string;
    name: string;
    title: string;
    filePath: string;
    order: number;
    isActive: boolean;
}

export function DocumentsManager({ initialDocs }: { initialDocs: ConsentDoc[] }) {
    const [docs, setDocs] = useState<ConsentDoc[]>(initialDocs);
    const [isPending, startTransition] = useTransition();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<ConsentDoc>>({});
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Yükleme formu submit
    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setUploadError(null);
        setUploadSuccess(false);
        const formData = new FormData(e.currentTarget);
        const result = await uploadConsentDocument(formData);
        if (result.error) {
            setUploadError(result.error);
        } else {
            setUploadSuccess(true);
            (e.target as HTMLFormElement).reset();
            // Sayfayı yenile
            window.location.reload();
        }
    }

    // Düzenleme kaydet
    function handleEditSave(id: string) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("name", editData.name || "");
            formData.append("title", editData.title || "");
            formData.append("order", String(editData.order ?? 0));
            formData.append("isActive", String(editData.isActive ?? true));
            const result = await updateConsentDocument(id, formData);
            if (!result.error) {
                setDocs(prev => prev.map(d => d.id === id ? { ...d, ...editData } as ConsentDoc : d));
                setEditingId(null);
            }
        });
    }

    // Sil
    function handleDelete(id: string, name: string) {
        if (!confirm(`"${name}" dökümanını silmek istediğinize emin misiniz?`)) return;
        startTransition(async () => {
            const result = await deleteConsentDocument(id);
            if (!result.error) {
                setDocs(prev => prev.filter(d => d.id !== id));
            }
        });
    }

    // Aktif/Pasif toggle
    function handleToggle(doc: ConsentDoc) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("name", doc.name);
            formData.append("title", doc.title);
            formData.append("order", String(doc.order));
            formData.append("isActive", String(!doc.isActive));
            const result = await updateConsentDocument(doc.id, formData);
            if (!result.error) {
                setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, isActive: !d.isActive } : d));
            }
        });
    }

    return (
        <div className="space-y-8">
            {/* Mevcut Dökümanlar */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#152746]" />
                    <h2 className="font-semibold text-[#152746]">Mevcut Onay Dökümanları</h2>
                    <span className="ml-auto text-xs text-gray-400">{docs.length} döküman</span>
                </div>

                {docs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        Henüz döküman eklenmemiş. Aşağıdan yeni PDF yükleyin.
                    </div>
                ) : (
                    <div className="divide-y">
                        {docs.map((doc) => (
                            <div key={doc.id} className="px-6 py-4">
                                {editingId === doc.id ? (
                                    // Düzenleme modu
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <Label className="text-xs text-gray-500">Döküman Adı</Label>
                                                <Input
                                                    value={editData.name || ""}
                                                    onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                                                    className="h-8 text-sm mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-500">Başlık</Label>
                                                <Input
                                                    value={editData.title || ""}
                                                    onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                                                    className="h-8 text-sm mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-24">
                                            <Label className="text-xs text-gray-500">Sıra</Label>
                                            <Input
                                                type="number"
                                                value={editData.order ?? 0}
                                                onChange={e => setEditData(p => ({ ...p, order: parseInt(e.target.value) }))}
                                                className="h-8 text-sm mt-1"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={() => handleEditSave(doc.id)} disabled={isPending}
                                                className="bg-green-600 hover:bg-green-700 text-white h-8 gap-1">
                                                <Check className="w-3 h-3" /> Kaydet
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8 gap-1">
                                                <X className="w-3 h-3" /> İptal
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    // Görüntüleme modu
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-[#152746]/10 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-[#152746]">{doc.order + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 text-sm truncate">{doc.title}</div>
                                            <div className="text-xs text-gray-400 truncate">{doc.name} · {doc.filePath}</div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Aktif/Pasif toggle */}
                                            <button
                                                onClick={() => handleToggle(doc)}
                                                disabled={isPending}
                                                title={doc.isActive ? "Pasife al" : "Aktife al"}
                                                className="text-gray-400 hover:text-[#152746] transition-colors"
                                            >
                                                {doc.isActive
                                                    ? <ToggleRight className="w-6 h-6 text-green-500" />
                                                    : <ToggleLeft className="w-6 h-6 text-gray-400" />
                                                }
                                            </button>
                                            {/* PDF görüntüle */}
                                            <a href={doc.filePath} target="_blank"
                                                className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors" title="PDF'i görüntüle">
                                                <FileText className="w-4 h-4" />
                                            </a>
                                            {/* Düzenle */}
                                            <button
                                                onClick={() => { setEditingId(doc.id); setEditData(doc); }}
                                                className="p-1.5 rounded text-gray-400 hover:text-[#152746] hover:bg-gray-100 transition-colors"
                                                title="Düzenle"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {/* Sil */}
                                            <button
                                                onClick={() => handleDelete(doc.id, doc.name)}
                                                disabled={isPending}
                                                className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Yeni PDF Yükle */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#152746]" />
                    <h2 className="font-semibold text-[#152746]">Yeni PDF Döküman Yükle</h2>
                </div>
                <form onSubmit={handleUpload} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="name">Döküman Adı <span className="text-red-500">*</span></Label>
                            <Input id="name" name="name" placeholder="FITNESS SALONU ÜYELİK BAŞVURUSU" required />
                            <p className="text-xs text-gray-400">Onay kaydında görünecek teknik ad</p>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="title">Başlık <span className="text-red-500">*</span></Label>
                            <Input id="title" name="title" placeholder="Fitness Salonu Üyelik Başvurusu" required />
                            <p className="text-xs text-gray-400">Kullanıcıya gösterilecek başlık</p>
                        </div>
                    </div>
                    <div className="w-32 space-y-1">
                        <Label htmlFor="order">Sıra</Label>
                        <Input id="order" name="order" type="number" defaultValue="0" min="0" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="file">PDF Dosyası <span className="text-red-500">*</span></Label>
                        <Input id="file" name="file" type="file" accept="application/pdf" required className="cursor-pointer" />
                    </div>

                    {uploadError && (
                        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-100">
                            {uploadError}
                        </div>
                    )}
                    {uploadSuccess && (
                        <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm border border-green-100">
                            ✓ Döküman başarıyla yüklendi.
                        </div>
                    )}

                    <Button type="submit" disabled={isPending}
                        className="bg-[#152746] hover:bg-[#152746]/90 text-white gap-2">
                        <Upload className="w-4 h-4" />
                        {isPending ? "Yükleniyor..." : "PDF Yükle"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
