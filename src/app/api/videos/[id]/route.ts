
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { cookies } from 'next/headers';

// Force dynamic
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    if (authData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });

    try {
        await prisma.video.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: 'Video not found or delete failed' }, { status: 404 });
    }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    const { id } = params;

    if (!id) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });

    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string;
        const thumbnailFile = formData.get('thumbnail') as File | null;

        // Find existing video to check permission
        const video = await prisma.video.findUnique({ where: { id } });
        if (!video) {
            return NextResponse.json({ message: 'Video not found' }, { status: 404 });
        }

        // Check permission: Admin or Owner
        if (authData.role !== 'admin' && video.uploaderId !== authData.id) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        let thumbnailUrl = undefined;
        if (thumbnailFile) {
            const buffer = await thumbnailFile.arrayBuffer();
            const { uploadFileToS3 } = await import('@/lib/s3');
            const fileName = `thumbnails/${crypto.randomUUID()}.jpg`;
            thumbnailUrl = await uploadFileToS3(buffer, fileName, 'image/jpeg');
        }

        // Update
        const updatedVideo = await prisma.video.update({
            where: { id },
            data: {
                title: title || undefined,
                description: description !== undefined ? description : undefined, // allow empty string if sent
                tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags,
                thumbnail: thumbnailUrl
            }
        });

        const mappedVideo = {
            ...updatedVideo,
            uploaderId: updatedVideo.uploaderId || undefined
        };

        return NextResponse.json({ success: true, video: mappedVideo });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ message: 'Failed to update video' }, { status: 500 });
    }
}
