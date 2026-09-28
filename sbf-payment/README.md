# Ankara Üniversitesi Spor Bilimleri Fakültesi
## Tesis Ödeme Bildirim Sistemi

Öğrenci ve personelin tesis ödeme dekontlarını dijital olarak ilettiği, yöneticilerin başvuruları onaylayıp reddedebildiği bir web uygulamasıdır.

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Dil | TypeScript |
| Veritabanı | SQLite (Prisma ORM) |
| Kimlik Doğrulama | NextAuth v5 |
| UI | TailwindCSS v4 + Framer Motion |
| Form | React Hook Form |
| Port | 80 |

---

## 📁 Proje Yapısı

```
sbf-payment/
├── prisma/
│   ├── schema.prisma       # Veritabanı şeması
│   ├── seed.ts             # Başlangıç verileri (admin kullanıcısı, örnek tesis)
│   └── dev.db              # SQLite veritabanı dosyası
├── public/
│   ├── uploads/            # Yüklenen dekontlar
│   └── documents/          # Onaylanacak PDF dökümanları
└── src/
    ├── app/
    │   ├── page.tsx                    # Ana başvuru formu
    │   ├── actions.ts                  # Form server action
    │   ├── components/
    │   │   ├── PaymentFormClient.tsx   # Başvuru formu bileşeni
    │   │   └── PDFConsentModal.tsx     # PDF onay modal
    │   └── admin/
    │       ├── login/                  # Admin giriş sayfası
    │       └── (protected)/
    │           ├── page.tsx            # Dashboard
    │           ├── submissions/        # Başvuru yönetimi
    │           ├── facilities/         # Tesis yönetimi
    │           ├── forms/              # Form alanı yönetimi
    │           └── settings/           # Site ayarları
    ├── components/ui/                  # Ortak UI bileşenleri
    └── lib/
        ├── auth.ts                     # NextAuth konfigürasyonu
        ├── prisma.ts                   # Prisma client
        ├── types.ts                    # TypeScript tipleri
        └── utils.ts                    # Yardımcı fonksiyonlar
```

---

## ⚙️ Kurulum (Geliştirme)

### Gereksinimler
- Node.js 20+
- npm

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env dosyasını oluştur
cp .env.example .env
# .env içindeki değerleri düzenle

# 3. Veritabanını oluştur
npx prisma db push

# 4. Başlangıç verilerini yükle (admin kullanıcısı + örnek tesis)
npx ts-node prisma/seed.ts

# 5. Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:80` adresinde çalışır.

### Varsayılan Admin Bilgileri
```
E-posta : admin@ankara.edu.tr
Şifre   : admin123
```
> ⚠️ Production'a geçmeden önce şifreyi mutlaka değiştirin.

---

## 🚀 Production Kurumu (Red Hat Linux)

### 1. Node.js Kurulumu

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

### 2. Proje Kurulumu

```bash
cd /var/www/sbf-payment
npm install
npm run build
```

### 3. Ortam Değişkenleri

```bash
# .env dosyasını oluştur
cat > .env << EOF
DATABASE_URL="file:./prisma/prod.db"
AUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://sizin-domain-adiniz.com"
EOF
```

### 4. Veritabanı Kurulumu

```bash
npx prisma db push
npx ts-node prisma/seed.ts
```

### 5. PM2 ile Çalıştırma

```bash
# PM2 kur
sudo npm install -g pm2

# Uygulamayı başlat
pm2 start npm --name "sbf-payment" -- start

# Sunucu yeniden başladığında otomatik başlat
pm2 startup
pm2 save
```

---

## 🔄 Güncelleme

```bash
# Yeni kodu çek
git pull

# Bağımlılıkları güncelle
npm install

# Şema değişikliklerini uygula (veri silinmez)
npx prisma migrate deploy

# Uygulamayı yeniden başlat
pm2 restart sbf-payment
```

---

## 🗄️ Veritabanı Yönetimi

### Test Ortamı — Tüm Veriyi Sıfırla

```bash
# Veritabanını tamamen sıfırla (tüm veriler silinir)
npx prisma db push --force-reset

# Başlangıç verilerini yeniden yükle
npx ts-node prisma/seed.ts
```

### Production — Sadece Başvuruları Temizle

```bash
# Yalnızca başvuruları sil, admin/tesis bilgileri korunur
sqlite3 prisma/prod.db "DELETE FROM DocumentConsent; DELETE FROM Submission;"
```

### Production — Şema Güncelleme (Veri Korunur)

```bash
npx prisma migrate deploy
```

---

## 📋 Başvuru Akışı

1. Kullanıcı formu doldurur (TC, Ad Soyad, E-posta, Adres, Tesis seçimi, Dekont)
2. PDF dökümanları (Üyelik Başvurusu + Kullanım Kuralları) onaylanır
3. Başvuru veritabanına kaydedilir, dekont `uploads/` klasörüne yüklenir (yalnız yönetici görebilir)
4. Admin panelinde başvuru **Bekliyor → Onaylandı / Reddedildi** olarak işlenir

---

## 🔐 Güvenlik Notları

- `.env` dosyasını asla git'e commit etmeyin
- `AUTH_SECRET` en az 32 karakter olmalıdır; tanımlı değilse uygulama `.auth-secret` dosyasına rastgele bir secret üretir
- Dekontlar `uploads/` klasöründe tutulur ve yalnız giriş yapmış yöneticiye `/api/uploads/...` üzerinden servis edilir
- Admin şifresini ilk girişte değiştirin

---

## 📞 İletişim

**Ankara Üniversitesi Bilgi İşlem Daire Başkanlığı**
