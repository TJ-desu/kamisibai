
import { Video, User } from '@/types';
import { PrismaClient } from '@prisma/client';

// Use a global variable to store the PrismaClient instance
// to prevent multiple instances during development (hot reloading)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getVideos(): Promise<Video[]> {
    try {
        const videos = await prisma.video.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        // Convert Prisma Video to App Video type (ensure fields match)
        return videos.map(v => ({
            ...v,
            tags: v.tags, // Prisma String[], Types String[] - compatible
            uploaderId: v.uploaderId || undefined
        })) as Video[];
    } catch (e) {
        console.error('Prisma Error (getVideos):', e);
        return [];
    }
}

export async function saveVideos(videos: Video[]) {
    // This function was originally used to overwrite the entire JSON.
    // With Prisma, we shouldn't be overwriting everything blindly.
    // But the current controller might call this with a modified array?
    // Let's inspect usages.
    // API uses: videos[index] = ...; saveVideos(videos);
    // This is inefficient for DB. We should change the API to update single records.

    // However, to keep API refactor minimal for "Code Only" migration:
    // If we receive a full array, it's hard to know what changed.
    // BUT, the API (PUT /api/videos/[id]) actually fetches, updates object in array, and saves array.
    // We should refactor the KEYS of the API to use specific DB calls (update).

    // Since checking usage is outside this atomic step's scope (or is it?), 
    // I will implement this function to Log a warning and do nothing,
    // because I will refactor the API routes to use Prisma DIRECTLY instead of getVideos/saveVideos.
    console.warn('saveVideos is deprecated in favor of direct Prisma calls.');
}

export async function getUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany();
        return users as User[]; // Cast role string to union type if needed
    } catch (e) {
        console.error('Prisma Error (getUsers):', e);
        return [];
    }
}

export async function saveUsers(users: User[]) {
    console.warn('saveUsers is deprecated. Use Prisma direct calls.');
}
