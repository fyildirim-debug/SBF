// Ortak tip tanımları

// Tesis bilgileri
export interface Facility {
    id: string;
    name: string;
    description: string | null;
    price: number;
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

// Başvuru bilgisi
export interface Submission {
    id: string;
    tcNo: string;
    fullName: string;
    studentNo: string;
    facilityId: string;
    facility: Facility;
    receiptPath: string;
    extraData: string | null;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Serileştirilmiş başvuru (client'a gönderilen)
export interface SerializedSubmission {
    id: string;
    tcNo: string;
    fullName: string;
    studentNo: string;
    facilityId: string;
    facility: Facility;
    receiptPath: string;
    extraData: string | null;
    status: string;
    notes: string | null;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}

// Authentication state
export interface AuthState {
    success?: boolean;
    error?: string;
}
