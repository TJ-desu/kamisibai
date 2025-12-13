
import { NextResponse } from 'next/server';
import { getVideos, saveVideos } from '@/lib/data';
import { Video } from '@/types';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function GET() {
    const videos = getVideos();
    return NextResponse.json(videos);
}

export async function POST(request: Request) {
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
        const summary = formData.get('summary') as string || '';
        const file = formData.get('file') as File;

        if (!title || !file) {
            return NextResponse.json(
                { message: 'Title and File are required' },
                { status: 400 }
            );
        }

        // Save file
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;

        let url = '';
        let thumbnailUrl = `https://placehold.co/600x400/b1a08a/ffffff?text=${encodeURIComponent(title)}`; // Default

        // Try S3 first for video
        try {
            const { uploadFileToS3 } = await import('@/lib/s3');
            url = await uploadFileToS3(buffer, filename, file.type);

            // Upload thumbnail if exists
            const thumbnailFile = formData.get('thumbnail') as File | null;
            if (thumbnailFile) {
                const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
                const thumbFilename = `thumbnails/${Date.now()}_thumb.jpg`;
                const thumbUrl = await uploadFileToS3(thumbBuffer, thumbFilename, 'image/jpeg');
                thumbnailUrl = thumbUrl;
            }

        } catch (s3Error: any) {
            console.warn('S3 Upload failed, falling back to local or erroring:', s3Error.message);
            throw s3Error;
        }

        const newVideo: Video = {
            id: Date.now().toString(),
            title,
            description,
            tags: tagsString.split(',').map(tag => tag.trim()).filter(Boolean),
            url: url,
            thumbnail: thumbnailUrl,
            viewCount: 0,
            uploaderId: user.id,
            summary: summary.slice(0, 140)
        };

        const videos = getVideos();
        videos.push(newVideo);
        saveVideos(videos);

        return NextResponse.json(newVideo, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
