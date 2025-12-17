'use client';

import React, { useEffect } from 'react';
import { Video } from '@/types';
import { useNavigation } from '@/context/NavigationContext';

export default function VideoMetadata({ serverVideo }: { serverVideo: Video }) {
    const { preloadedVideo, setPreloadedVideo } = useNavigation();

    // Determine which video data to use
    // If preloadedVideo matches the ID of the serverVideo, use it (it's the same video)
    // Otherwise use serverVideo (fallback or direct access)
    const video = (preloadedVideo && preloadedVideo.id === serverVideo.id)
        ? preloadedVideo
        : serverVideo;

    // Clear preloaded video on unmount or change to clean up
    useEffect(() => {
        return () => setPreloadedVideo(null);
    }, [setPreloadedVideo]);

    return (
        <div style={{ padding: '0 10px' }}>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '10px' }}>{video.title}</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {video.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '0.9rem', color: 'var(--primary-color)', backgroundColor: 'var(--bg-soft)', padding: '4px 12px', borderRadius: '20px' }}>
                            #{tag}
                        </span>
                    ))}
                </div>
                <span style={{ fontSize: '0.9rem' }}>{video.viewCount || 0} 回視聴</span>
            </div>

            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text-dark)' }}>
                {video.description}
            </div>
        </div>
    );
}
