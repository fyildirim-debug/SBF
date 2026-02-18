import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@ankara.edu.tr';
    const password = await bcrypt.hash('admin123', 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'SBF Yönetici',
            password,
            role: 'admin',
        },
    });

    console.log({ user });

    // Örnek Tesis
    const facility = await prisma.facility.create({
        data: {
            name: 'Kapalı Yüzme Havuzu',
            studentPrice: 150.0,
            staffPrice: 200.0,
            description: 'Tam olimpik yüzme havuzu kullanımı',
        },
    });

    console.log({ facility });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
