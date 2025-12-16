import { NextRequest, NextResponse } from 'next/server';
import { getVideos, saveVideos } from '@/lib/data';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    // Note: params availability depends on folder structure.
    // Note: params availability depends on folder structure.
    // /api/videos/[id]/view/route.ts -> params.id should be available.

    const videos = await getVideos();
    const videoIndex = videos.findIndex(v => v.id === id);

    if (videoIndex === -1) {
        return NextResponse.json({ message: 'Video not found' }, { status: 404 });
    }

    videos[videoIndex].viewCount = (videos[videoIndex].viewCount || 0) + 1;
    await saveVideos(videos);

    return NextResponse.json({ success: true, viewCount: videos[videoIndex].viewCount });
}
