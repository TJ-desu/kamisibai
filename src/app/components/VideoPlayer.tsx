'use client';

import { useEffect } from 'react';
import { Video } from '@/types';

export default function VideoPlayer({ video }: { video: Video }) {
    useEffect(() => {
        // Increment view count
        fetch(`/api/videos/${video.id}/view`, { method: 'POST' }).catch(console.error);
    }, [video.id]);

    return (
        <video
            controls
            autoPlay
            playsInline
            src={video.url}
            poster={video.thumbnail}
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '80vh' }}
        >
            お使いのブラウザは動画タグに対応していません。
        </video>
    );
}
