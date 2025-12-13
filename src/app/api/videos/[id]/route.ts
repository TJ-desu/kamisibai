
import { NextRequest, NextResponse } from 'next/server';
import { getVideos, saveVideos } from '@/lib/data';
import { cookies } from 'next/headers';

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

    const videos = getVideos();
    const newVideos = videos.filter(v => v.id !== id);

    if (videos.length === newVideos.length) {
        return NextResponse.json({ message: 'Video not found' }, { status: 404 });
    }

    saveVideos(newVideos);
    return NextResponse.json({ success: true });
}
