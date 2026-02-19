/**
 * Veritabanı Sıfırlama Scripti
 * 
 * Kullanım:
 *   node reset-database.js          -> Sıfırla + admin oluştur
 *   node reset-database.js --no-seed -> Sadece sıfırla (admin login'de oluşturulur)
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const noSeed = process.argv.includes("--no-seed");

const dbPaths = [
  path.join(__dirname, "prisma", "dev.db"),
  path.join(__dirname, "dev.db"),
];

function log(msg) {
  console.log(`[RESET] ${msg}`);
}

function run(cmd) {
  log(`Çalıştırılıyor: ${cmd}`);
  execSync(cmd, { cwd: __dirname, stdio: "inherit" });
}

async function main() {
  console.log("==========================================");
  console.log("  Veritabanı Sıfırlama Başlatılıyor...");
  console.log("==========================================\n");

  // 1) DB dosyalarını sil
  log("Veritabanı dosyaları siliniyor...");
  for (const dbPath of dbPaths) {
    for (const ext of ["", "-journal", "-wal", "-shm"]) {
      const target = dbPath + ext;
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
        log(`Silindi: ${target}`);
      }
    }
  }

  // 2) Şemayı sıfırdan uygula
  log("Şema yeniden oluşturuluyor...");
  run("npx prisma db push --force-reset --accept-data-loss");

  // 3) Prisma Client güncelle
  log("Prisma Client yeniden oluşturuluyor...");
  run("npx prisma generate");

  // 4) Next.js cache temizle (sunucu tarafı cache)
  const nextCacheDir = path.join(__dirname, ".next", "cache");
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    log("Next.js cache temizlendi.");
  }

  // 4) Admin seed
  if (!noSeed) {
    log("Admin kullanıcı oluşturuluyor...");
    await seedAdmin();
  } else {
    log("Seed atlandı. /admin/login adresinden ilk admin'i oluşturabilirsiniz.");
  }

  console.log("\n==========================================");
  console.log("  Veritabanı başarıyla sıfırlandı!");
  console.log("==========================================");
}

async function seedAdmin() {
  delete require.cache[require.resolve("@prisma/client")];
  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcryptjs");
  const prisma = new PrismaClient();

  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.create({
      data: {
        email: "admin@ankara.edu.tr",
        name: "SBF Yönetici",
        password: hashedPassword,
        role: "admin",
      },
    });
    log(`Admin oluşturuldu: ${user.email} (şifre: admin123)`);
    await prisma.$disconnect();
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

main().catch((error) => {
  console.error("\n[HATA]", error.message);
  process.exit(1);
});
