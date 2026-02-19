// Ortak tip tanımları

// Kullanıcı tipleri
export type UserType = "sbf_ogrenci" | "kurum_ogrenci" | "akademik_personel" | "idari_personel";

export const USER_TYPE_LABELS: Record<UserType, string> = {
    sbf_ogrenci: "Spor Bilimleri Fakültesi Öğrenci",
    kurum_ogrenci: "Kurum İçi Öğrenci",
    akademik_personel: "Kurum İçi Akademik Personel",
    idari_personel: "Kurum İçi İdari Personel",
};

// Tesis bilgileri
export interface Facility {
    id: string;
    name: string;
    description: string | null;
    sbfStudentPrice: number;
    externalStudentPrice: number;
    academicStaffPrice: number;
    adminStaffPrice: number;
    isActive: boolean;
    createdAt: Date;
}

// Form alanı tanımı
export interface FormField {
    id: string;
    name: string;
    label: string;
    type: string; // text, number, file, select, date
    required: boolean;
    options: string | null; // JSON for select options
    order: number;
    isActive: boolean;
    isSystem: boolean;
    createdAt: Date;
}

// Dijital imza / Döküman onayı
export interface DocumentConsent {
    id: string;
    documentName: string;
    ipAddress: string;
    userAgent: string | null;
    consentAt: Date | string;
}

// Başvuru bilgisi
export interface Submission {
    id: string;
    tcNo: string;
    fullName: string;
    email: string;
    address: string;
    studentNo: string;
    userType: string;
    facilityId: string;
    facility: Facility;
    receiptPath: string;
    extraData: string | null;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    consents?: DocumentConsent[];
    createdAt: Date;
    updatedAt: Date;
}

// Serileştirilmiş başvuru (client'a gönderilen)
export interface SerializedSubmission {
    id: string;
    tcNo: string;
    fullName: string;
    email: string;
    address: string;
    studentNo: string;
    userType: string;
    facilityId: string;
    facility: Facility;
    receiptPath: string;
    extraData: string | null;
    status: string;
    notes: string | null;
    consents?: DocumentConsent[];
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}

// Authentication state
export interface AuthState {
    success?: boolean;
    error?: string;
}

