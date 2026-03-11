# SBF Payment - Tesis Ödeme Bildirim Sistemi
**Tarih:** 2026-03-11

## Özet
Ankara Üniversitesi Spor Bilimleri Fakültesi için geliştirilmiş tesis ödeme dekont yönetim sistemi. Öğrenci/personel dekont yükler, yöneticiler admin panelinden başvuruları onaylar veya reddeder.

## Yapı
- Kök: `sbf-payment/`, `prisma/`, `.vscode/`
- Klasörler: `src/app/`, `src/app/admin/(protected)/`, `src/app/api/`, `src/components/ui/`, `src/lib/`, `prisma/`

## Teknoloji
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Veritabanı:** SQLite + Prisma ORM
- **Auth:** NextAuth v5
- **UI:** TailwindCSS v4 + Framer Motion + Lucide React
- **Form:** React Hook Form + Zod

## Özellikler
- Kullanıcı başvuru formu (TC, Ad, Email, Adres, Tesis seçimi, Dekont yükleme)
- PDF döküman onay modal (Üyelik + Kullanım Kuralları)
- Admin paneli: başvuru yönetimi, tesis yönetimi, form alanı yönetimi, kullanıcı yönetimi, site ayarları
- Matematik captcha, IP takibi, NextAuth ile korumalı admin rotaları

## İstatistik
Dosya: ~45, Teknoloji: Next.js 16 / TypeScript / SQLite / Prisma / NextAuth v5
