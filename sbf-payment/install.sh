#!/usr/bin/env bash
# =====================================================================
#  SBF Tesis Ödeme Bildirim Sistemi — tek komutla kurulum / güncelleme
#
#  Zip /var/www/SBF içine açıldıktan sonra:
#      sudo bash /var/www/SBF/install.sh
#
#  Yaptıkları:
#    - Node.js 20.9+ yoksa kurar (dnf/yum/apt)
#    - Bağımlılıkları kurar, veritabanını oluşturur/günceller, uygulamayı derler
#    - Boş kurulumda ilk yöneticiyi oluşturur (şifre ekrana ve /root altına yazılır)
#    - Yeni veritabanı boşsa eski kurulumu (PM2 klasörü, /opt/sbf-payment, bu klasördeki yedekler)
#      bulup en çok başvuru içeren veritabanını ve dekontları kopyalar
#    - "sbf-payment" systemd servisini kurar: sunucu her açıldığında otomatik başlar,
#      çökerse yeniden başlar
#
#  Tekrar çalıştırmak güvenlidir: veritabanı (data/), dekontlar (uploads/), .env korunur.
#
#  İsteğe bağlı ayarlar:
#      sudo PORT=3000 bash install.sh                  # 80 dışında bir port
#      sudo ADMIN_EMAIL=ad@ankara.edu.tr bash install.sh
#      sudo OLD_DIR=/eski/kurulum bash install.sh      # verisi taşınacak eski klasör
#      sudo OLD_DB=/eski/kurulum/prisma/dev.db bash install.sh   # doğrudan eski veritabanı dosyası
# =====================================================================
set -Eeuo pipefail

SERVICE_NAME="sbf-payment"
APP_USER="sbf"
PORT="${PORT:-80}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@ankara.edu.tr}"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$APP_DIR/.env"
UNIT_FILE="/etc/systemd/system/$SERVICE_NAME.service"
LOG_FILE="$APP_DIR/kurulum.log"
ADMIN_INFO_FILE="/root/sbf-ilk-yonetici.txt"
export PATH="$PATH:/usr/local/bin:/usr/local/sbin"
export NEXT_TELEMETRY_DISABLED=1

if [[ -t 1 ]]; then G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; B=$'\e[1m'; N=$'\e[0m'; else G=; Y=; R=; B=; N=; fi

# --- root yetkisi ---
if [[ $EUID -ne 0 ]]; then
    echo "Root yetkisi gerekiyor, sudo ile yeniden çalıştırılıyor..."
    exec sudo -E bash "$0" "$@"
fi

: > "$LOG_FILE"
chmod 600 "$LOG_FILE"

step() { echo; echo "${B}==> $*${N}"; echo "==> $*" >> "$LOG_FILE"; }
info() { echo "   $*"; echo "   $*" >> "$LOG_FILE"; }
warn() { echo "   ${Y}! $*${N}"; echo "   ! $*" >> "$LOG_FILE"; }

# Komutu çalıştırır; çıktısı yalnız kurulum.log'a yazılır, hata olursa son satırlar gösterilir
run() {
    local desc="$1"; shift
    printf '   %s ... ' "$desc"
    echo "### $desc :: $*" >> "$LOG_FILE"
    local rc=0
    "$@" >> "$LOG_FILE" 2>&1 || rc=$?
    if [[ $rc -eq 0 ]]; then
        echo "${G}tamam${N}"
    else
        echo "${R}HATA${N}"
        tail -n 25 "$LOG_FILE" | sed 's/^/      /'
        return "$rc"
    fi
}

# --- hata olursa eski servisi geri getir ---
OLD_SYSTEMD_STOPPED=0
OLD_PM2_STOPPED=0
UNIT_WRITTEN=0
UNIT_BACKUP=""

rollback() {
    set +e
    if [[ $UNIT_WRITTEN -eq 1 ]]; then
        if [[ -n $UNIT_BACKUP ]]; then
            cp -f "$UNIT_BACKUP" "$UNIT_FILE"
        else
            systemctl disable --now "$SERVICE_NAME" >/dev/null 2>&1
            rm -f "$UNIT_FILE"
        fi
        systemctl daemon-reload >/dev/null 2>&1
    fi
    if [[ $OLD_SYSTEMD_STOPPED -eq 1 && -f $UNIT_FILE ]]; then
        systemctl start "$SERVICE_NAME" >/dev/null 2>&1 && warn "Önceki servis yeniden başlatıldı."
    fi
    if [[ $OLD_PM2_STOPPED -eq 1 ]]; then
        pm2 start "$SERVICE_NAME" >/dev/null 2>&1 && warn "Önceki PM2 süreci yeniden başlatıldı."
    fi
}

fail() {
    echo
    echo "${R}${B}KURULUM BAŞARISIZ:${N} ${R}$*${N}"
    echo "Ayrıntılar: $LOG_FILE"
    echo "KURULUM BAŞARISIZ: $*" >> "$LOG_FILE"
    rollback
    exit 1
}

trap 'fail "Beklenmeyen hata (satır $LINENO)."' ERR

# DATABASE_URL (file:...) değerini mutlak dosya yoluna çevirir; göreli yollar prisma/ klasörüne göredir
db_path_from_url() {
    local url="$1" base="$2" p
    p="${url#file:}"
    p="${p%%\?*}"
    if [[ $p != /* ]]; then p="$base/prisma/${p#./}"; fi
    echo "$p"
}

env_value() { # env_value <dosya> <anahtar>
    [[ -f $1 ]] || return 0
    sed -n "s/^[[:space:]]*$2[[:space:]]*=[[:space:]]*//p" "$1" | tail -n 1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"
}

node_ok() {
    command -v node >/dev/null 2>&1 &&
        node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)' 2>/dev/null
}

port_holder() { ss -ltnp "sport = :$PORT" 2>/dev/null | sed -n '2p'; }

# =====================================================================
echo "${B}SBF Tesis Ödeme Bildirim Sistemi — Kurulum${N}"
echo "Klasör: $APP_DIR   Port: $PORT   Servis: $SERVICE_NAME"

step "1/8 Ön kontroller"
[[ -f $APP_DIR/package.json && -f $APP_DIR/prisma/schema.prisma ]] ||
    fail "install.sh zip'ten çıkan uygulama klasöründe olmalı (package.json bulunamadı)."
command -v systemctl >/dev/null 2>&1 || fail "systemd bulunamadı; otomatik başlatma servisi kurulamaz."
[[ $PORT =~ ^[0-9]+$ ]] || fail "PORT sayı olmalı: $PORT"
if [[ -r /etc/os-release ]]; then info "Sistem: $(. /etc/os-release; echo "${PRETTY_NAME:-$ID}")"; fi
MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)
if [[ $MEM_MB -gt 0 && $MEM_MB -lt 1500 ]]; then warn "Bellek ${MEM_MB} MB; derleme yavaş olabilir (en az 2 GB önerilir)."; fi

step "2/8 Gerekli paketler"
PKG=""
if command -v dnf >/dev/null 2>&1; then PKG=dnf; elif command -v yum >/dev/null 2>&1; then PKG=yum; elif command -v apt-get >/dev/null 2>&1; then PKG=apt; fi
install_pkgs() {
    case $PKG in
        dnf|yum) $PKG -y install "$@" ;;
        apt) DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install "$@" ;;
        *) return 1 ;;
    esac
}
MISSING=()
command -v curl >/dev/null 2>&1 || MISSING+=(curl)
command -v openssl >/dev/null 2>&1 || MISSING+=(openssl)
command -v ss >/dev/null 2>&1 || MISSING+=(iproute)
if [[ ${#MISSING[@]} -gt 0 ]]; then
    [[ $PKG == apt ]] && MISSING=("${MISSING[@]/iproute/iproute2}")
    run "Eksik araçlar kuruluyor (${MISSING[*]})" install_pkgs "${MISSING[@]}"
fi

install_node() {
    case $PKG in
        dnf|yum)
            $PKG -y module reset nodejs || true
            for stream in 22 20; do
                if $PKG -y module enable "nodejs:$stream"; then
                    $PKG -y install nodejs npm || true
                    $PKG -y distro-sync nodejs npm || true
                    node_ok && return 0
                    $PKG -y module reset nodejs || true
                fi
            done
            curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && $PKG -y install nodejs
            ;;
        apt)
            curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get -y install nodejs
            ;;
        *) return 1 ;;
    esac
    node_ok
}
if node_ok; then
    info "Node.js $(node -v) mevcut."
else
    [[ -n $(command -v node || true) ]] && warn "Node.js $(node -v) eski; 20.9+ gerekiyor."
    run "Node.js 22 kuruluyor" install_node || fail "Node.js 20.9+ kurulamadı. Elle kurup betiği tekrar çalıştırın."
    info "Node.js $(node -v) kuruldu."
fi
command -v npm >/dev/null 2>&1 || fail "npm bulunamadı."
NODE_BIN="$(command -v node)"

step "3/8 Çalışan eski sürüm durduruluyor"
OLD_UNIT_DIR=""
PM2_CWD=""
if [[ -f $UNIT_FILE ]]; then
    UNIT_BACKUP="$(mktemp)"
    cp -f "$UNIT_FILE" "$UNIT_BACKUP"
    OLD_UNIT_DIR="$(sed -n 's/^WorkingDirectory=//p' "$UNIT_FILE")"
    OLD_UNIT_DIR="${OLD_UNIT_DIR%%$'\n'*}"
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        run "$SERVICE_NAME servisi durduruluyor" systemctl stop "$SERVICE_NAME"
        OLD_SYSTEMD_STOPPED=1
    fi
fi
if command -v pm2 >/dev/null 2>&1 && pm2 describe "$SERVICE_NAME" >/dev/null 2>&1; then
    # Eski uygulamanın çalıştığı klasör: veritabanı taşımada ilk bakılacak yer
    PM2_CWD="$(pm2 jlist 2>/dev/null | node -e '
        let s = "";
        process.stdin.on("data", (d) => (s += d)).on("end", () => {
            try {
                const list = JSON.parse(s.slice(s.indexOf("[{")));
                const p = list.find((x) => x.name === process.argv[1]);
                if (p && p.pm2_env && p.pm2_env.pm_cwd) console.log(p.pm2_env.pm_cwd);
            } catch {}
        });' "$SERVICE_NAME" 2>/dev/null || true)"
    [[ -n $PM2_CWD ]] && info "Eski PM2 uygulama klasörü: $PM2_CWD"
    run "Eski PM2 süreci ($SERVICE_NAME) durduruluyor" pm2 stop "$SERVICE_NAME"
    OLD_PM2_STOPPED=1
fi
[[ $OLD_SYSTEMD_STOPPED -eq 0 && $OLD_PM2_STOPPED -eq 0 ]] && info "Çalışan eski sürüm yok."

HOLDER="$(port_holder || true)"
if [[ -n $HOLDER ]]; then
    fail "$PORT portu başka bir program tarafından kullanılıyor:
   $HOLDER
   O programı durdurun ya da farklı port seçin:  sudo PORT=3000 bash $APP_DIR/install.sh"
fi
info "$PORT portu boş."

step "4/8 Ayarlar ve veri klasörü"
mkdir -p "$APP_DIR/data" "$APP_DIR/uploads"
if [[ ! -f $ENV_FILE ]]; then
    {
        echo "DATABASE_URL=\"file:$APP_DIR/data/sbf.db\""
        echo "AUTH_SECRET=\"$(openssl rand -base64 48 | tr -d '\r\n')\""
    } > "$ENV_FILE"
    info ".env oluşturuldu (rastgele AUTH_SECRET üretildi)."
else
    info "Mevcut .env korunuyor."
    if [[ -z $(env_value "$ENV_FILE" DATABASE_URL) ]]; then
        echo "DATABASE_URL=\"file:$APP_DIR/data/sbf.db\"" >> "$ENV_FILE"
        info ".env'e DATABASE_URL eklendi."
    fi
    if [[ -z $(env_value "$ENV_FILE" AUTH_SECRET) && -z $(env_value "$ENV_FILE" NEXTAUTH_SECRET) ]]; then
        echo "AUTH_SECRET=\"$(openssl rand -base64 48 | tr -d '\r\n')\"" >> "$ENV_FILE"
        info ".env'e rastgele AUTH_SECRET eklendi."
    fi
fi
chmod 600 "$ENV_FILE"

DATABASE_URL="$(env_value "$ENV_FILE" DATABASE_URL)"
export DATABASE_URL
DB_PATH="$(db_path_from_url "$DATABASE_URL" "$APP_DIR")"
mkdir -p "$(dirname "$DB_PATH")"
info "Veritabanı: $DB_PATH"

# Uygulama klasörünün içinde başka bir uygulama (ör. eski sürüm yedeği) varsa bilgi ver; derlemeye dahil edilmez
for d in "$APP_DIR"/*/; do
    if [[ -f ${d}package.json ]]; then
        warn "Klasör içinde başka bir uygulama var: ${d%/} (derlemeye dahil edilmez; veritabanı taşıma için taranır)"
    fi
done

step "5/8 Bağımlılıklar ve derleme (birkaç dakika sürebilir)"
cd "$APP_DIR"
# npm, root ile çalışırken script'leri klasör sahibinin kimliğiyle çalıştırır; derleme boyunca sahip root olsun
chown -R root:root "$APP_DIR"
run "npm paketleri kuruluyor" npm ci --include=dev --no-audit --no-fund
run "Prisma istemcisi oluşturuluyor" npx --no-install prisma generate

# --- Eski kurulumdan veri taşıma ---
# Yeni veritabanı yoksa ya da boşsa (yönetici ve başvuru yok), eski kurulumların veritabanları taranır;
# en çok başvuru içeren seçilip kopyalanır. Eski dosyalar yerinde kalır.
# Elle kaynak vermek için: OLD_DB=/yol/dev.db ya da OLD_DIR=/eski/klasor

db_counts() { # <db dosyası> -> "<yönetici sayısı> <başvuru sayısı>" (SBF veritabanı değilse -1)
    SBF_DB_FILE="$1" node - 2>/dev/null <<'NODEEOF' || echo "-1 -1"
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: "file:" + process.env.SBF_DB_FILE } } });
const count = async (t) => {
    try {
        const r = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM "${t}"`);
        return Number(r[0].c);
    } catch {
        return -1;
    }
};
(async () => console.log(`${await count("User")} ${await count("Submission")}`))()
    .finally(() => prisma.$disconnect());
NODEEOF
}

candidate_dbs() { # olası eski veritabanı dosyaları (her satırda bir yol)
    if [[ -n ${OLD_DB:-} ]]; then echo "$OLD_DB"; return 0; fi
    local dirs=() d u
    if [[ -n ${OLD_DIR:-} ]]; then
        dirs=("$OLD_DIR")
    else
        dirs=("$PM2_CWD" "$OLD_UNIT_DIR" /opt/sbf-payment /var/www/sbf-payment "$APP_DIR")
        for d in "$APP_DIR"/*/; do
            if [[ -f ${d}prisma/schema.prisma ]]; then dirs+=("${d%/}"); fi
        done
    fi
    for d in "${dirs[@]}"; do
        if [[ -z $d || ! -d $d ]]; then continue; fi
        u="$(env_value "$d/.env" DATABASE_URL)"
        if [[ -n $u ]]; then db_path_from_url "$u" "$d"; fi
        find "$d" -maxdepth 3 -name '*.db' -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/yedek/*' 2>/dev/null || true
    done
    return 0
}

app_dir_of_db() { # veritabanı dosyasının ait olduğu uygulama klasörü (package.json içeren üst klasör)
    local d
    d="$(dirname "$1")"
    for _ in 1 2 3; do
        if [[ -f $d/package.json ]]; then echo "$d"; return 0; fi
        d="$(dirname "$d")"
    done
    return 0
}

CUR_USERS=-1; CUR_SUBS=-1
if [[ -f $DB_PATH ]]; then read -r CUR_USERS CUR_SUBS <<<"$(db_counts "$DB_PATH")"; fi

if [[ ! -f $DB_PATH ]] || (( CUR_USERS <= 0 && CUR_SUBS <= 0 )) || [[ -n ${OLD_DB:-}${OLD_DIR:-} ]]; then
    BEST_DB=""; BEST_SUBS=-1; BEST_MTIME=0
    declare -A SEEN=()
    while IFS= read -r f; do
        if [[ -z $f || ! -f $f || -n ${SEEN[$f]:-} || $f == "$DB_PATH" || $f == "$APP_DIR/data/"* ]]; then continue; fi
        SEEN[$f]=1
        read -r u s <<<"$(db_counts "$f")"
        if [[ -z ${s:-} || ${u:--1} -lt 0 || $s -lt 0 ]]; then continue; fi
        m="$(stat -c %Y "$f" 2>/dev/null || echo 0)"
        info "Eski veritabanı adayı: $f  ($u yönetici, $s başvuru)"
        if (( s > BEST_SUBS || (s == BEST_SUBS && m > BEST_MTIME) )); then
            BEST_DB="$f"; BEST_SUBS=$s; BEST_MTIME=$m
        fi
    done < <(candidate_dbs)

    if [[ -n $BEST_DB ]]; then
        if [[ -f $DB_PATH ]]; then
            mkdir -p "$(dirname "$DB_PATH")/yedek"
            cp -p "$DB_PATH" "$(dirname "$DB_PATH")/yedek/sbf-tasima-oncesi-$(date +%Y%m%d-%H%M%S).db"
        fi
        rm -f "$DB_PATH-journal"
        if command -v sqlite3 >/dev/null 2>&1; then
            run "Eski veritabanı taşınıyor ($BEST_DB)" sqlite3 "$BEST_DB" ".backup '$DB_PATH'"
        else
            run "Eski veritabanı taşınıyor ($BEST_DB)" cp -f "$BEST_DB" "$DB_PATH"
        fi
        SRC_APP="$(app_dir_of_db "$BEST_DB")"
        if [[ -n $SRC_APP && $SRC_APP != "$APP_DIR" ]]; then
            for d in uploads public/uploads public/documents; do
                if [[ -d $SRC_APP/$d ]]; then
                    mkdir -p "$APP_DIR/$d"
                    cp -rpn "$SRC_APP/$d/." "$APP_DIR/$d/" 2>/dev/null || true
                    info "$SRC_APP/$d dosyaları kopyalandı (mevcutların üzerine yazılmadı)."
                fi
            done
        fi
    else
        info "Taşınacak eski veritabanı bulunamadı; boş veritabanıyla devam ediliyor."
    fi
else
    info "Mevcut veritabanında $CUR_USERS yönetici, $CUR_SUBS başvuru var; eski veri taşınmadı."
fi

if [[ -f $DB_PATH ]]; then
    BACKUP_DIR="$(dirname "$DB_PATH")/yedek"
    mkdir -p "$BACKUP_DIR"
    DB_BACKUP="$BACKUP_DIR/sbf-$(date +%Y%m%d-%H%M%S).db"
    cp -p "$DB_PATH" "$DB_BACKUP"
    info "Veritabanı yedeği: $DB_BACKUP"
    # Son 10 yedek tutulur
    ls -1t "$BACKUP_DIR"/sbf-*.db 2>/dev/null | tail -n +11 | xargs -r rm -f

    # Eski sürümdeki 2 fiyat sütunu (studentPrice, staffPrice) yeni 4 fiyat sütununa taşınır
    run "Eski fiyat alanları kontrol ediliyor" node - <<'NODEEOF'
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
    const cols = (await prisma.$queryRawUnsafe('PRAGMA table_info("Facility")')).map((c) => c.name);
    if (cols.includes("studentPrice") && !cols.includes("sbfStudentPrice")) {
        for (const c of ["sbfStudentPrice", "externalStudentPrice", "academicStaffPrice", "adminStaffPrice"]) {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Facility" ADD COLUMN "${c}" REAL NOT NULL DEFAULT 0`);
        }
        await prisma.$executeRawUnsafe(`UPDATE "Facility" SET
            "sbfStudentPrice" = COALESCE("studentPrice", 0), "externalStudentPrice" = COALESCE("studentPrice", 0),
            "academicStaffPrice" = COALESCE("staffPrice", 0), "adminStaffPrice" = COALESCE("staffPrice", 0)`);
        console.log("Eski öğrenci/personel fiyatları yeni fiyat alanlarına kopyalandı.");
    } else {
        console.log("Taşınacak eski fiyat alanı yok.");
    }
})()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
NODEEOF
fi

# Şema uygulanır. Veri kaybı uyarısı yalnız yukarıda taşınan eski fiyat sütunları içinse kabul edilir;
# başka bir uyarıda durulur (zorlamak için ACCEPT_DATA_LOSS=1).
schema_push() {
    local out rc=0 warnings unsafe
    out="$(npx --no-install prisma db push --skip-generate 2>&1)" || rc=$?
    echo "$out"
    [[ $rc -eq 0 ]] && return 0
    grep -q -- "--accept-data-loss" <<<"$out" || return "$rc"
    warnings="$(grep -E 'You are about to|Added the required|will be dropped|unique constraint' <<<"$out" || true)"
    unsafe="$(grep -vE 'drop the column `(studentPrice|staffPrice)` on the `Facility` table' <<<"$warnings" || true)"
    if [[ -n $warnings && -z $unsafe ]] || [[ ${ACCEPT_DATA_LOSS:-0} == 1 ]]; then
        echo "Veri kaybı uyarısı kabul ediliyor (eski fiyat sütunları taşındı / ACCEPT_DATA_LOSS=1)."
        npx --no-install prisma db push --skip-generate --accept-data-loss
        return $?
    fi
    return "$rc"
}
run "Veritabanı şeması uygulanıyor" schema_push ||
    fail "Veritabanı şeması veri kaybı olmadan uygulanamadı (ayrıntı kurulum.log). Yedek: ${DB_BACKUP:-yok}.
   Uyarıları inceleyip kabul ediyorsanız:  sudo ACCEPT_DATA_LOSS=1 bash $APP_DIR/install.sh"
run "Uygulama derleniyor" npm run build

step "6/8 Yönetici hesabı"
ADMIN_PASSWORD="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | cut -c1-14)"
ADMIN_RESULT="$(ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node - <<'NODEEOF' 2>>"$LOG_FILE"
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
(async () => {
    const count = await prisma.user.count();
    if (count > 0) { console.log("mevcut:" + count); return; }
    await prisma.user.create({
        data: {
            email: process.env.ADMIN_EMAIL,
            name: "SBF Yönetici",
            password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
            role: "admin",
        },
    });
    console.log("olusturuldu");
})()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
NODEEOF
)"
if [[ $ADMIN_RESULT == olusturuldu ]]; then
    ADMIN_CREATED=1
    umask 077
    printf 'SBF Tesis Ödeme — ilk yönetici (%s)\nE-posta: %s\nŞifre  : %s\nİlk girişten sonra şifreyi Kullanıcı Yönetimi sayfasından değiştirin ve bu dosyayı silin.\n' \
        "$(date '+%Y-%m-%d %H:%M')" "$ADMIN_EMAIL" "$ADMIN_PASSWORD" > "$ADMIN_INFO_FILE"
    umask 022
    info "İlk yönetici oluşturuldu: $ADMIN_EMAIL"
else
    ADMIN_CREATED=0
    info "Mevcut yöneticiler korunuyor (${ADMIN_RESULT#mevcut:} hesap)."
fi

step "7/8 Otomatik başlatma servisi"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
    run "'$APP_USER' sistem kullanıcısı oluşturuluyor" useradd --system --home-dir "$APP_DIR" --no-create-home \
        --shell "$(command -v nologin || echo /sbin/nologin)" "$APP_USER"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod 600 "$ENV_FILE"
chmod 750 "$APP_DIR/data" "$APP_DIR/uploads"

cat > "$UNIT_FILE" <<UNITEOF
[Unit]
Description=SBF Tesis Ödeme Bildirim Sistemi
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=NEXT_TELEMETRY_DISABLED=1
EnvironmentFile=-$ENV_FILE
ExecStart=$NODE_BIN $APP_DIR/node_modules/next/dist/bin/next start -p $PORT
Restart=always
RestartSec=5
# 80 gibi 1024 altı portları root olmadan dinleyebilsin
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNITEOF
UNIT_WRITTEN=1
run "systemd yeniden yükleniyor" systemctl daemon-reload
run "Açılışta otomatik başlama etkinleştiriliyor" systemctl enable "$SERVICE_NAME"
run "Servis başlatılıyor" systemctl restart "$SERVICE_NAME"

if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
    if ! firewall-cmd --quiet --query-port="$PORT/tcp"; then
        run "Güvenlik duvarında $PORT/tcp açılıyor" firewall-cmd --permanent --add-port="$PORT/tcp"
        run "Güvenlik duvarı yenileniyor" firewall-cmd --reload
    fi
fi

step "8/8 Çalışma kontrolü"
printf '   Uygulama yanıtı bekleniyor '
UP=0
for _ in $(seq 1 45); do
    if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/get-ip" 2>/dev/null; then UP=1; break; fi
    printf '.'
    sleep 2
done
echo
if [[ $UP -ne 1 ]]; then
    journalctl -u "$SERVICE_NAME" -n 40 --no-pager >> "$LOG_FILE" 2>&1 || true
    journalctl -u "$SERVICE_NAME" -n 20 --no-pager 2>/dev/null | sed 's/^/      /' || true
    fail "Servis başladı ama $PORT portunda yanıt vermiyor."
fi
info "${G}Uygulama çalışıyor.${N}"

# Başarılı: eski PM2 sürecini kalıcı olarak kaldır (sunucu açılışında tekrar başlamasın)
if [[ $OLD_PM2_STOPPED -eq 1 ]]; then
    pm2 delete "$SERVICE_NAME" >> "$LOG_FILE" 2>&1 || true
    pm2 save >> "$LOG_FILE" 2>&1 || true
    info "Eski PM2 süreci kaldırıldı."
fi
[[ -n $UNIT_BACKUP ]] && rm -f "$UNIT_BACKUP"
trap - ERR

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
[[ -n $IP ]] || IP="sunucu-ip"
URL="http://$IP"; [[ $PORT != 80 ]] && URL="$URL:$PORT"

echo
echo "${G}${B}KURULUM TAMAMLANDI${N}"
echo "   Başvuru formu : $URL/"
echo "   Yönetim paneli: $URL/admin/login"
if [[ $ADMIN_CREATED -eq 1 ]]; then
    echo "   İlk yönetici  : ${B}$ADMIN_EMAIL${N}  /  şifre: ${B}$ADMIN_PASSWORD${N}"
    echo "                   (bilgiler $ADMIN_INFO_FILE dosyasında; girişten sonra şifreyi değiştirip dosyayı silin)"
fi
echo
echo "   Servis sunucu her açıldığında otomatik başlar. Faydalı komutlar:"
echo "     systemctl status $SERVICE_NAME       # durum"
echo "     systemctl restart $SERVICE_NAME      # yeniden başlat"
echo "     journalctl -u $SERVICE_NAME -f       # canlı log"
echo "   Güncelleme: yeni zip'i $APP_DIR içine açıp  sudo bash $APP_DIR/install.sh  (veriler korunur)"
