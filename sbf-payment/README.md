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

## 🚀 Production Kurulumu (tek komut)

Kurulum paketi (`SBF-kurulum.zip`) sunucuda `/var/www/SBF` içine açılır ve tek betikle kurulur:

```bash
sudo mkdir -p /var/www/SBF
sudo unzip -o SBF-kurulum.zip -d /var/www/SBF
sudo bash /var/www/SBF/install.sh
```

`install.sh` şunları yapar:

- Node.js 20.9+ yoksa kurar (dnf / yum / apt)
- `.env` dosyasını rastgele `AUTH_SECRET` ile oluşturur; veritabanı `data/sbf.db`, dekontlar `uploads/` altında tutulur
- `/opt/sbf-payment` gibi eski bir kurulum varsa veritabanını ve dekontları kopyalar (eski dosyalar yerinde kalır)
- Bağımlılıkları kurar, şemayı uygular, uygulamayı derler
- Boş kurulumda ilk yöneticiyi oluşturur; şifre ekrana ve `/root/sbf-ilk-yonetici.txt` dosyasına yazılır
- `sbf-payment` systemd servisini kurar: sunucu her açıldığında otomatik başlar, çökerse yeniden başlar
- firewalld açıksa portu açar, uygulamanın yanıt verdiğini kontrol eder; hata olursa eski servisi geri başlatır

Seçenekler: `sudo PORT=3000 bash install.sh`, `sudo ADMIN_EMAIL=ad@ankara.edu.tr bash install.sh`, `sudo OLD_DIR=/eski/klasor bash install.sh`.
Ayrıntılı çıktı: `/var/www/SBF/kurulum.log`.

```bash
systemctl status sbf-payment      # durum
systemctl restart sbf-payment     # yeniden başlat
journalctl -u sbf-payment -f      # canlı log
```

---

## 🔄 Güncelleme

Yeni zip'i aynı klasöre açıp betiği tekrar çalıştırın; `data/`, `uploads/` ve `.env` korunur:

```bash
sudo unzip -o SBF-kurulum.zip -d /var/www/SBF
sudo bash /var/www/SBF/install.sh
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
sqlite3 /var/www/SBF/data/sbf.db "DELETE FROM DocumentConsent; DELETE FROM Submission;"
```

### Production — Şema Güncelleme (Veri Korunur)

`install.sh` her çalıştığında `prisma db push` ile şemayı veri silmeden günceller.

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
