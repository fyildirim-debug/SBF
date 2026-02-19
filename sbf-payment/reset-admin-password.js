/**
 * Admin Şifre Sıfırlama Scripti
 * 
 * Kullanım:
 *   node reset-admin-password.js                    -> Varsayılan şifre: admin123
 *   node reset-admin-password.js yeniSifre123       -> Belirtilen şifre ile sıfırlar
 *   node reset-admin-password.js yeniSifre admin@example.com  -> Belirli bir admin'in şifresini sıfırlar
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetPassword() {
  const newPassword = process.argv[2] || "admin123";
  const targetEmail = process.argv[3] || null;

  try {
    // Hedef admin'i bul
    let user;
    if (targetEmail) {
      user = await prisma.user.findUnique({ where: { email: targetEmail } });
      if (!user) {
        console.error(`[HATA] "${targetEmail}" e-posta adresine sahip kullanıcı bulunamadı.`);
        process.exit(1);
      }
    } else {
      // İlk admin kullanıcıyı al
      user = await prisma.user.findFirst({ where: { role: "admin" } });
      if (!user) {
        console.error("[HATA] Sistemde hiç admin kullanıcı bulunamadı.");
        process.exit(1);
      }
    }

    // Şifreyi hashle ve güncelle
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log("========================================");
    console.log("  Admin şifresi başarıyla sıfırlandı!");
    console.log("========================================");
    console.log(`  Kullanıcı : ${user.name} (${user.email})`);
    console.log(`  Yeni Şifre: ${newPassword}`);
    console.log("========================================");
  } catch (error) {
    console.error("[HATA] Şifre sıfırlanırken bir sorun oluştu:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
