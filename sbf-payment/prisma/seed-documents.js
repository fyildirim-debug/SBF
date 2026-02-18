// Prisma olmadan doğrudan SQLite'a insert — ConsentDocument seed
const { randomBytes } = require('crypto');
const fs = require('fs');
const path = require('path');

// SQLite veritabanı yolu
const dbPath = path.join(__dirname, 'dev.db');

// sqlite3 modülü yerine node:child_process ile sqlite3 CLI kullan
// Alternatif: doğrudan SQL sorgusu çalıştır
const { execSync } = require('child_process');

function cuid() {
    return 'c' + randomBytes(12).toString('hex');
}

const now = new Date().toISOString();
const docs = [
    {
        id: cuid(),
        name: "FITNESS SALONU ÜYELİK BAŞVURUSU",
        title: "Fitness Salonu Üyelik Başvurusu",
        filePath: "/documents/FITNESS SALONU ÜYELİK BAŞVURUSU.pdf",
        order: 0,
    },
    {
        id: cuid(),
        name: "FITNESS SALONU KULLANIM KURALLARI",
        title: "Fitness Salonu Kullanım Kuralları",
        filePath: "/documents/FITNESS SALONU KULLANIM KURALLARI.pdf",
        order: 1,
    },
];

// SQL oluştur
const sqls = docs.map(d =>
    `INSERT INTO ConsentDocument (id, name, title, filePath, "order", isActive, createdAt, updatedAt) VALUES ('${d.id}', '${d.name}', '${d.title}', '${d.filePath}', ${d.order}, 1, '${now}', '${now}');`
).join('\n');

console.log('Çalıştırılacak SQL:');
console.log(sqls);

// Dosyaya yaz
const sqlFile = path.join(__dirname, 'seed-docs.sql');
fs.writeFileSync(sqlFile, sqls);
console.log(`\nSQL dosyası oluşturuldu: ${sqlFile}`);
console.log('\nAşağıdaki komutu çalıştırın:');
console.log(`sqlite3 "${dbPath}" < "${sqlFile}"`);
