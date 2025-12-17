
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating all videos to be owned by user "admin"...');

    // First verify admin exists
    const admin = await prisma.user.findUnique({
        where: { id: 'admin' }
    });

    if (!admin) {
        console.error('Error: User "admin" does not exist in the database.');
        process.exit(1);
    }

    if (admin.username !== 'saochan3333') {
        console.warn(`Warning: User "admin" has username "${admin.username}", expected "saochan3333". Proceeding anyway.`);
    }

    const result = await prisma.video.updateMany({
        data: {
            uploaderId: 'admin'
        }
    });

    console.log(`Successfully updated ${result.count} videos.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
