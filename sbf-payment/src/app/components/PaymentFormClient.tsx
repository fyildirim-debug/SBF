"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { submitPayment } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PDFConsentModal } from "./PDFConsentModal";
import { MathCaptcha } from "./MathCaptcha";

interface Facility {
    id: string;
    name: string;
    sbfStudentPrice: number;
    externalStudentPrice: number;
    academicStaffPrice: number;
    adminStaffPrice: number;
}

interface FormField {
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    options: string | null;
}

interface PaymentFormClientProps {
    facilities: Facility[];
    extraFields: FormField[];
    consentDocuments: { name: string; title: string; path: string }[];
}

// Form veri tipi
interface PaymentFormData {
    tcNo: string;
    fullName: string;
    email: string;
    address: string;
    userType: "sbf_ogrenci" | "kurum_ogrenci" | "akademik_personel" | "idari_personel";
    identityNo: string; // Öğrenci No veya Sicil No
    facilityId: string;
    receipt: FileList;
    [key: string]: string | FileList; // Dinamik alanlar için
}

// Consent veri tipi
interface ConsentData {
    documentName: string;
    consentAt: string;
    ipAddress: string;
    userAgent: string;
}


export function PaymentFormClient({ facilities, extraFields, consentDocuments }: PaymentFormClientProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success?: boolean; error?: string } | null>(null);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<PaymentFormData | null>(null);
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaAnswer, setCaptchaAnswer] = useState("");
    const [captchaKey, setCaptchaKey] = useState(0);
    // Onaylar bir kez alınır; gönderim hata verirse (ör. captcha) tekrar sorulmaz
    const [collectedConsents, setCollectedConsents] = useState<ConsentData[] | null>(null);
    const captchaValid = captchaToken !== "" && captchaAnswer.trim() !== "";
    const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<PaymentFormData>();

    const selectedFacilityId = watch("facilityId");
    const selectedFacility = facilities.find(f => f.id === selectedFacilityId);
    const userType = watch("userType") || "sbf_ogrenci";

    // Kullanıcı tipine göre fiyat hesapla
    function getPrice(facility: Facility, type: string): number {
        switch (type) {
            case "sbf_ogrenci": return facility.sbfStudentPrice;
            case "kurum_ogrenci": return facility.externalStudentPrice;
            case "akademik_personel": return facility.academicStaffPrice;
            case "idari_personel": return facility.adminStaffPrice;
            default: return facility.sbfStudentPrice;
        }
    }

    // Sunucu her gönderimde güvenlik sorusunu geçersiz kılar; hata sonrası yeni soru getir
    function resetCaptcha() {
        setCaptchaToken("");
        setCaptchaAnswer("");
        setCaptchaKey((k) => k + 1);
    }

    // Form submit edildiğinde önce CAPTCHA kontrolü yap, sonra PDF onay modal'ını aç
    function onFormSubmit(data: PaymentFormData) {
        if (!captchaValid) {
            setSubmitResult({ error: "Lütfen güvenlik sorusunu cevaplayınız." });
            return;
        }
        setSubmitResult(null);
        setPendingFormData(data);

        // DB'de onay dökümanı yoksa ya da onaylar zaten alındıysa modal'ı atla, direkt gönder
        if (consentDocuments.length === 0 || collectedConsents) {
            handleConsentComplete(collectedConsents ?? [], data);
            return;
        }
        setShowConsentModal(true);
    }

    // PDF onayları tamamlandığında formu gönder
    async function handleConsentComplete(consents: ConsentData[], overrideData?: PaymentFormData) {
        setShowConsentModal(false);
        setCollectedConsents(consents);

        const formDataSource = overrideData || pendingFormData;
        if (!formDataSource) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        const formData = new FormData();
        // Sabit alanlar
        formData.append("tcNo", formDataSource.tcNo);
        formData.append("fullName", formDataSource.fullName);
        formData.append("email", formDataSource.email);
        formData.append("address", formDataSource.address);
        formData.append("userType", formDataSource.userType);
        formData.append("studentNo", formDataSource.identityNo);
        formData.append("facilityId", formDataSource.facilityId);
        if (formDataSource.receipt[0]) {
            formData.append("receipt", formDataSource.receipt[0]);
        }

        // CAPTCHA doğrulama verilerini ekle
        formData.append("captchaToken", captchaToken);
        formData.append("captchaAnswer", captchaAnswer);

        // Consent verilerini JSON olarak ekle
        formData.append("consents", JSON.stringify(consents));

        // Dinamik alanları da ekle
        if (extraFields) {
            extraFields.forEach(field => {
                const fieldValue = formDataSource[field.name];
                if (fieldValue && typeof fieldValue === 'string') {
                    formData.append(field.name, fieldValue);
                }
            });
        }

        try {
            const result = await submitPayment(formData);
            if (result.error) {
                setSubmitResult({ error: result.error });
                resetCaptcha();
            } else {
                setSubmitResult({ success: true });
                reset();
                setPendingFormData(null);
                setCollectedConsents(null);
                resetCaptcha();
            }
        } catch (error: unknown) {
            console.error("Form gönderim hatası:", error);
            // Server Action bulunamadı = eski/yeni deployment uyumsuzluğu
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (errorMsg.includes("Server Action") || errorMsg.includes("Failed to find")) {
                setSubmitResult({ error: "Sayfa güncel değil. Lütfen sayfayı yenileyiniz (Ctrl+F5)." });
            } else {
                setSubmitResult({ error: "Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyiniz." });
            }
            resetCaptcha();
        } finally {
            setIsSubmitting(false);
        }
    }

    // Modal kapatıldığında
    function handleConsentClose() {
        setShowConsentModal(false);
        setPendingFormData(null);
    }

    if (submitResult?.success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-green-50 rounded-2xl border border-green-100"
            >
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-700 mb-2">Başvuru Alındı!</h3>
                <p className="text-green-600 mb-6">
                    Ödeme bildiriminiz başarıyla sisteme kaydedildi.
                </p>
                <Button
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => setSubmitResult(null)}
                >
                    Yeni Başvuru Yap
                </Button>
            </motion.div>
        );
    }

    return (
        <>
            {/* PDF Onay Modal'ı — kapanınca kaldırılır, böylece her açılışta ilk dökümandan başlar */}
            {showConsentModal && (
                <PDFConsentModal
                    isOpen
                    onComplete={handleConsentComplete}
                    onClose={handleConsentClose}
                    documents={consentDocuments}
                />
            )}

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="tcNo" className="text-gray-700 font-medium">T.C. Kimlik Numarası</Label>
                        <Input
                            id="tcNo"
                            placeholder="11 haneli T.C. No"
                            maxLength={11}
                            className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                            {...register("tcNo", { required: true, minLength: 11, maxLength: 11 })}
                        />
                        {errors.tcNo && <span className="text-sm text-red-500">T.C. Kimlik No zorunludur (11 hane)</span>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-700 font-medium">Kişi Tipi</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="sbf_ogrenci"
                                    defaultChecked
                                    className="w-4 h-4 text-[#152746] border-gray-300 focus:ring-[#152746]"
                                    {...register("userType", { required: true })}
                                />
                                <span className="text-gray-700 text-sm">SBF Öğrenci</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="kurum_ogrenci"
                                    className="w-4 h-4 text-[#152746] border-gray-300 focus:ring-[#152746]"
                                    {...register("userType", { required: true })}
                                />
                                <span className="text-gray-700 text-sm">Kurum İçi Öğrenci</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="akademik_personel"
                                    className="w-4 h-4 text-[#152746] border-gray-300 focus:ring-[#152746]"
                                    {...register("userType", { required: true })}
                                />
                                <span className="text-gray-700 text-sm">Akademik Personel</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="idari_personel"
                                    className="w-4 h-4 text-[#152746] border-gray-300 focus:ring-[#152746]"
                                    {...register("userType", { required: true })}
                                />
                                <span className="text-gray-700 text-sm">İdari Personel</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="identityNo" className="text-gray-700 font-medium">
                        {userType === "akademik_personel" || userType === "idari_personel" ? "Sicil Numarası" : "Öğrenci Numarası"}
                    </Label>
                    <Input
                        id="identityNo"
                        placeholder={userType === "akademik_personel" || userType === "idari_personel" ? "Örn: 95-25633" : "Öğrenci Numaranız"}
                        className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                        {...register("identityNo", { required: true })}
                    />
                    {errors.identityNo && (
                        <span className="text-sm text-red-500">
                            {userType === "akademik_personel" || userType === "idari_personel" ? "Sicil No zorunludur" : "Öğrenci No zorunludur"}
                        </span>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 font-medium">Adı Soyadı</Label>
                    <Input
                        id="fullName"
                        placeholder="Adınız ve Soyadınız"
                        className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                        {...register("fullName", { required: true })}
                    />
                    {errors.fullName && <span className="text-sm text-red-500">Ad Soyad zorunludur</span>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">E-posta Adresi</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="ornek@ankara.edu.tr"
                        className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                        {...register("email", {
                            required: true,
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Geçerli bir e-posta giriniz" }
                        })}
                    />
                    {errors.email && <span className="text-sm text-red-500">{errors.email.message || "E-posta zorunludur"}</span>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address" className="text-gray-700 font-medium">Adres</Label>
                    <textarea
                        id="address"
                        rows={3}
                        placeholder="Açık adresinizi giriniz"
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#152746] focus:ring-1 focus:ring-[#152746] resize-none"
                        {...register("address", { required: true })}
                    />
                    {errors.address && <span className="text-sm text-red-500">Adres zorunludur</span>}
                </div>

                {/* Dinamik Alanlar */}
                {extraFields && extraFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.name} className="text-gray-700 font-medium">{field.label}</Label>
                        {field.type === 'text' && (
                            <Input
                                id={field.name}
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            />
                        )}
                        {field.type === 'number' && (
                            <Input
                                id={field.name}
                                type="number"
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            />
                        )}
                        {field.type === 'date' && (
                            <Input
                                id={field.name}
                                type="date"
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            />
                        )}
                        {field.type === 'select' && field.options && (
                            <Select
                                id={field.name}
                                className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                                {...register(field.name, { required: field.required })}
                            >
                                <option value="">Seçiniz</option>
                                {(JSON.parse(field.options) as string[]).map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </Select>
                        )}
                    </div>
                ))}

                <div className="space-y-2">
                    <Label htmlFor="facilityId" className="text-gray-700 font-medium">Kullanılacak Tesis</Label>
                    <Select
                        id="facilityId"
                        className="bg-white border-gray-300 focus:border-[#152746] focus:ring-[#152746] h-11"
                        {...register("facilityId", { required: true })}
                    >
                        <option value="">Seçiniz...</option>
                        {facilities.map((f) => (
                            <option key={f.id} value={f.id}>
                                {f.name} - {getPrice(f, userType)} TL
                            </option>
                        ))}
                    </Select>
                    {errors.facilityId && <span className="text-sm text-red-500">Lütfen bir tesis seçiniz</span>}
                </div>

                <AnimatePresence>
                    {selectedFacility && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#152746]/5 rounded-lg p-4 border border-[#152746]/10"
                        >
                            <div className="flex justify-between items-center text-[#152746] font-medium">
                                <span>Ödenecek Tutar:</span>
                                <span className="text-xl font-bold">{getPrice(selectedFacility, userType)} TL</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2">
                    <Label htmlFor="receipt" className="text-gray-700 font-medium">Dekont Yükle (PDF veya Fotoğraf)</Label>
                    <div className={`border-2 border-dashed rounded-lg p-8 transition-colors text-center cursor-pointer relative
                        ${watch("receipt")?.[0]
                            ? "border-green-400 bg-green-50"
                            : "border-gray-300 bg-white hover:bg-gray-50 hover:border-[#152746]/50"
                        }`}>
                        <input
                            type="file"
                            id="receipt"
                            accept="image/*,.pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            {...register("receipt", { required: true })}
                        />
                        {watch("receipt")?.[0] ? (
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                                </div>
                                <span className="text-sm font-semibold text-green-700 break-all max-w-xs">
                                    {watch("receipt")[0].name}
                                </span>
                                <span className="text-xs text-green-600">
                                    {(watch("receipt")[0].size / 1024).toFixed(1)} KB · Değiştirmek için tıklayın
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 pointer-events-none">
                                <Upload className="w-10 h-10 text-[#152746]/50" />
                                <span className="text-sm font-medium">Dosya seçmek için tıklayın veya sürükleyin</span>
                                <span className="text-xs text-gray-400">PDF, JPG, PNG desteklenir</span>
                            </div>
                        )}
                    </div>
                    {errors.receipt && <span className="text-sm text-red-500">Dekont yüklemek zorunludur</span>}

                </div>

                {/* Matematik CAPTCHA */}
                <MathCaptcha
                    key={captchaKey}
                    onChange={(token, answer) => {
                        setCaptchaToken(token);
                        setCaptchaAnswer(answer);
                    }}
                />

                {submitResult?.error && (
                    <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm flex items-center gap-2 border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        {submitResult.error}
                    </div>
                )}

                <Button
                    type="submit"
                    className={`w-full text-lg h-12 transition-all font-semibold shadow-md
                        ${captchaValid && !isSubmitting
                            ? "bg-[#152746] hover:bg-[#152746]/90 text-white hover:shadow-lg cursor-pointer"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        }`}
                    disabled={isSubmitting || !captchaValid}
                >
                    {isSubmitting ? "Gönderiliyor..." : captchaValid ? "Ödeme Bildirimini Gönder" : "🔒 Güvenlik doğrulamasını tamamlayın"}
                </Button>
            </form>
        </>
    );
}
