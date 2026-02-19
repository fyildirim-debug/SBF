#!/bin/bash
# ============================================
# SBF Payment - Veritabani Sifirlama Scripti
# SSH uzerinde calistirilir
#
# Kullanim:
#   bash reset-db.sh          -> Sifirla (admin loginde olusturulur)
#   bash reset-db.sh --seed   -> Sifirla + admin seed yukle
# ============================================

set -e

# Scriptin bulundugu dizini otomatik algila
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[HATA]${NC} $1"; exit 1; }

SEED=false
[ "$1" == "--seed" ] && SEED=true

echo ""
echo "=========================================="
echo "  SBF Payment - Veritabani Sifirlama"
echo "=========================================="

echo ""

if [ ! -f "$APP_DIR/package.json" ]; then
    err "Proje dizini gecersiz: $APP_DIR (package.json bulunamadi)"
fi

cd "$APP_DIR"

# 1) PM2 durdur
echo "--- PM2 durduruluyor ---"
pm2 stop all 2>/dev/null || warn "PM2 zaten durmus olabilir."

# 2) Tum DB dosyalarini sil
echo ""
echo "--- Veritabani dosyalari siliniyor ---"
find "$APP_DIR" -name "*.db" -o -name "*.db-journal" -o -name "*.db-wal" -o -name "*.db-shm" 2>/dev/null | while read f; do
    rm -f "$f"
    log "Silindi: $f"
done

# 3) Next.js cache temizle
echo ""
echo "--- Next.js cache temizleniyor ---"
rm -rf "$APP_DIR/.next/cache"
log "Cache temizlendi."

# 4) Semayi sifirdan uygula
echo ""
echo "--- Veritabani yeniden olusturuluyor ---"
npx prisma db push --force-reset --accept-data-loss
log "Sema uygulandi."

npx prisma generate
log "Prisma Client guncellendi."

# 5) Seed (opsiyonel)
if [ "$SEED" = true ]; then
    echo ""
    echo "--- Admin kullanici olusturuluyor ---"
    node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function seed() {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            email: 'admin@ankara.edu.tr',
            name: 'SBF Yonetici',
            password: hash,
            role: 'admin'
        }
    });
    console.log('[OK] Admin: admin@ankara.edu.tr / admin123');
}
seed().then(() => prisma.\$disconnect()).catch(e => { console.error(e); process.exit(1); });
"
    log "Admin olusturuldu."
fi

# 6) Production build yeniden al
echo ""
echo "--- Production build aliniyor ---"
npm run build
log "Build tamamlandi."

# 7) PM2 baslat
echo ""
echo "--- PM2 baslatiliyor ---"
pm2 restart all
sleep 3
pm2 status
log "PM2 baslatildi."

# Sonuc
echo ""
echo "=========================================="
echo "  Veritabani basariyla sifirlandi!"
echo "=========================================="
if [ "$SEED" = true ]; then
    echo "  Giris: admin@ankara.edu.tr / admin123"
else
    echo "  /admin/login adresinden ilk admini olusturun."
fi
echo "=========================================="
echo ""
