import { NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { cookies } from 'next/headers';

// Force dynamic for DB interaction
// Force dynamic for DB interaction
export const dynamic = 'force-dynamic';

// Removed runtime = 'edge' to support standard Prisma Client in Node environment

export async function GET() {
    try {
        const videos = await prisma.video.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Convert to app type if needed, or rely on consistency
        const mappedVideos = videos.map(v => ({
            ...v,
            tags: v.tags,
            uploaderId: v.uploaderId || undefined
        }));
        return NextResponse.json(mappedVideos);
    } catch (e) {
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log(`[API] Video Upload Request - Version: ${new Date().toISOString()}`);
    const token = (await cookies()).get('auth_token');
    if (!token) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = JSON.parse(token.value);

    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tagsString = formData.get('tags') as string;
        const file = formData.get('file') as File;

        if (!title || !file) {
            return NextResponse.json(
                { message: 'Title and File are required' },
                { status: 400 }
            );
        }

        // Save file
        const buffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop()?.substring(0, 10).replace(/[^a-z0-9]/gi, '') || 'bin';
        const randomId = crypto.randomUUID();
        const filename = `videos/${randomId}.${ext}`;

        let url = '';
        let thumbnailUrl = `https://placehold.co/600x400/b1a08a/ffffff?text=${encodeURIComponent(title)}`;

        try {
            const { uploadFileToS3 } = await import('@/lib/s3');
            url = await uploadFileToS3(buffer, filename, file.type);

            const thumbnailFile = formData.get('thumbnail') as File | null;
            if (thumbnailFile) {
                const thumbBuffer = await thumbnailFile.arrayBuffer();
                const thumbFilename = `thumbnails/${Date.now()}_thumb.jpg`;
                const thumbUrl = await uploadFileToS3(thumbBuffer, thumbFilename, 'image/jpeg');
                thumbnailUrl = thumbUrl;
            }

        } catch (s3Error: any) {
            console.warn('S3 Upload failed:', s3Error.message);
            throw s3Error;
        }

        // Create Video in DB via Prisma
        const newVideo = await prisma.video.create({
            data: {
                title,
                description,
                tags: tagsString.split(',').map(tag => tag.trim()).filter(Boolean),
                url,
                thumbnail: thumbnailUrl,
                viewCount: 0,
                uploaderId: user.id
            }
        });

        // Map back to expected interface if necessary (Prisma return matches mostly)
        const responseVideo = {
            ...newVideo,
            uploaderId: newVideo.uploaderId || undefined
        };

        return NextResponse.json(responseVideo, { status: 201 });
    } catch (error: any) {
        console.error('Upload Process Error:', error);
        return NextResponse.json(
            {
                message: 'Internal Server Error',
                details: error.message || 'Unknown error',
                s3Error: error.toString()
            },
            { status: 500 }
        );
    }
}
