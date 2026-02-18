---
description: Red Hat (RHEL) sunucuya Next.js uygulamasını kurma ve çalıştırma
---

# SBF Payment — Red Hat Sunucu Kurulum Rehberi

## 1. Gerekli Paketleri Kur

```bash
# Node.js 20 LTS kur (dnf ile)
sudo dnf module enable nodejs:20 -y
sudo dnf install nodejs npm -y

# Versiyon kontrolü
node -v   # v20.x olmalı
npm -v
```

> Eğer `dnf module` yoksa, NodeSource kullan:
> ```bash
> curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
> sudo dnf install nodejs -y
> ```

---

## 2. Proje Dosyalarını Sunucuya Aktar

Projeyi sunucuya kopyala (yerel bilgisayardan):

```bash
# Yerel bilgisayarında çalıştır (PowerShell veya CMD):
scp -r C:\Users\posta\Desktop\SBF\sbf-payment kullanici@sunucu-ip:/opt/sbf-payment
```

Veya sunucuda git ile çek:

```bash
# Sunucuda çalıştır:
cd /opt
git clone <repo-url> sbf-payment
```

---

## 3. Bağımlılıkları Kur ve Build Al

```bash
cd /opt/sbf-payment

# Bağımlılıkları kur
npm install

# Prisma client oluştur
npx prisma generate

# Veritabanını oluştur/güncelle
npx prisma db push

# Production build al
npm run build
```

---

## 4. Ortam Değişkenlerini Ayarla

```bash
# .env dosyasını oluştur
cat > /opt/sbf-payment/.env << 'EOF'
DATABASE_URL="file:./dev.db"
AUTH_SECRET="FySBFsystem32"
EOF

# Secret oluşturmak için:
openssl rand -base64 32
```

---

## 5. Upload Klasörlerini Oluştur

```bash
mkdir -p /opt/sbf-payment/public/uploads
mkdir -p /opt/sbf-payment/public/documents
chmod 755 /opt/sbf-payment/public/uploads
chmod 755 /opt/sbf-payment/public/documents
```

---

## 6. İlk Admin Kullanıcısını Oluştur

Eğer DB boşsa, admin kullanıcı oluştur:

```bash
cd /opt/sbf-payment
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@sbf.edu.tr' },
        update: {},
        create: { email: 'admin@sbf.edu.tr', name: 'Admin', password: hash }
    });
    console.log('Admin oluşturuldu: admin@sbf.edu.tr / admin123');
}
seed().then(() => prisma.\$disconnect());
"
```

---

## 7. Systemd Servisi Oluştur (Otomatik Başlat)

```bash
sudo cat > /etc/systemd/system/sbf-payment.service << 'EOF'
[Unit]
Description=SBF Payment Next.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/sbf-payment
ExecStart=/usr/bin/node /opt/sbf-payment/node_modules/next/dist/bin/next start -p 80
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Servisi aktifleştir ve başlat
sudo systemctl daemon-reload
sudo systemctl enable sbf-payment
sudo systemctl start sbf-payment

# Durumu kontrol et
sudo systemctl status sbf-payment
```

---

## 8. Firewall Ayarları

```bash
# 80 portunu aç
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload

# Kontrol
sudo firewall-cmd --list-ports
```

---

## 9. SELinux Ayarları (Gerekirse)

```bash
# SELinux node.js'in 80 portunu dinlemesine izin ver
sudo setsebool -P httpd_can_network_connect 1

# Eğer dosya yazma sorunu olursa:
sudo chcon -R -t httpd_sys_rw_content_t /opt/sbf-payment/public/uploads
sudo chcon -R -t httpd_sys_rw_content_t /opt/sbf-payment/public/documents
sudo chcon -R -t httpd_sys_rw_content_t /opt/sbf-payment/prisma
```

---

## 10. Test Et

```bash
# Sunucuda test
curl http://localhost

# Tarayıcıdan
http://sunucu-ip-adresi
http://sunucu-ip-adresi/admin/login
```

---

## Faydalı Komutlar

```bash
# Logları izle
sudo journalctl -u sbf-payment -f

# Servisi yeniden başlat
sudo systemctl restart sbf-payment

# Servisi durdur
sudo systemctl stop sbf-payment

# Güncelleme sonrası
cd /opt/sbf-payment
npm install
npx prisma generate
npx prisma db push
npm run build
sudo systemctl restart sbf-payment
```