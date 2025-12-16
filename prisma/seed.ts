import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    const usersPath = path.join(process.cwd(), 'src/data/users.json')
    const videosPath = path.join(process.cwd(), 'src/data/videos.json')

    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
    const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'))

    console.log('Seeding Users...')
    for (const user of users) {
        await prisma.user.upsert({
            where: { username: user.username },
            update: {},
            create: {
                id: user.id || undefined,
                username: user.username,
                password: user.password,
                role: user.role
            }
        })
    }

    console.log('Seeding Videos...')
    for (const video of videos) {
        // Check if uploader exists
        const uploader = video.uploaderId ? await prisma.user.findUnique({ where: { id: video.uploaderId } }) : null;

        await prisma.video.upsert({
            where: { id: video.id },
            update: {},
            create: {
                id: video.id,
                title: video.title,
                description: video.description,
                tags: video.tags,
                url: video.url,
                thumbnail: video.thumbnail,
                viewCount: video.viewCount || 0,
                uploaderId: uploader ? video.uploaderId : undefined // Only link if uploader exists, else null
            }
        })
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
