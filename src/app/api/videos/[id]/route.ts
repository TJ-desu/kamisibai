
import { NextRequest, NextResponse } from 'next/server';
import { getVideos, saveVideos } from '@/lib/data';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    // Requirement: "Strong Admin privileges to delete existing videos".
    // Implicitly, Editors shouldn't delete. Checks role.
    if (authData.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });

    const videos = await getVideos();
    const newVideos = videos.filter(v => v.id !== id);

    if (videos.length === newVideos.length) {
        return NextResponse.json({ message: 'Video not found' }, { status: 404 });
    }

    await saveVideos(newVideos);
    return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const token = (await cookies()).get('auth_token');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const authData = JSON.parse(token.value);
    const { id } = params;

    if (!id) return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });

    try {
        const body = await request.json();
        const { title, description, tags } = body;

        const videos = await getVideos();
        const videoIndex = videos.findIndex(v => v.id === id);

        if (videoIndex === -1) {
            return NextResponse.json({ message: 'Video not found' }, { status: 404 });
        }

        const video = videos[videoIndex];

        // Check permission: Admin or Owner
        if (authData.role !== 'admin' && video.uploaderId !== authData.id) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // Update fields
        videos[videoIndex] = {
            ...video,
            title: title || video.title,
            description: description !== undefined ? description : video.description,
            tags: tags !== undefined ? tags : video.tags,
            updatedAt: new Date().toISOString()
        };

        await saveVideos(videos);

        return NextResponse.json({ success: true, video: videos[videoIndex] });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ message: 'Failed to update video' }, { status: 500 });
    }
}
